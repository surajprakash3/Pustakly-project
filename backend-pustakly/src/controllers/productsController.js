const { ObjectId } = require('mongodb');

const isValidObjectId = (value) => typeof value === 'string' && ObjectId.isValid(value);

const buildProductQuery = ({ approvalStatus, status, category, type, seller, q, minPrice, maxPrice }) => {
  const query = {};
  const andConditions = [];

  if (approvalStatus) {
    if (approvalStatus === 'Approved') {
      andConditions.push({
        $or: [
          { approvalStatus: 'Approved' },
          { approvalStatus: { $exists: false } },
          { approvalStatus: null }
        ]
      });
    } else {
      query.approvalStatus = approvalStatus;
    }
  }

  if (status) {
    if (status === 'Active') {
      andConditions.push({
        $or: [{ status: 'Active' }, { status: { $exists: false } }, { status: null }]
      });
    } else {
      query.status = status;
    }
  }

  if (category) query.category = category;
  if (type) query.type = type;
  if (seller && isValidObjectId(seller)) query.seller = new ObjectId(seller);
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }
  if (q) {
    query.$or = [
      { title: new RegExp(q, 'i') },
      { creator: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') }
    ];
  }

  if (andConditions.length) {
    query.$and = andConditions;
  }

  return query;
};

const getSortStage = (sortBy) => {
  switch (sortBy) {
    case 'newest':
      return { createdAt: -1 };
    case 'price_asc':
      return { price: 1, createdAt: -1 };
    case 'price_desc':
      return { price: -1, createdAt: -1 };
    case 'popular':
      return { totalSales: -1, rating: -1, createdAt: -1 };
    case 'featured':
    default:
      return { totalSales: -1, rating: -1, createdAt: -1 };
  }
};

const createProduct = async (req, res) => {
  const db = req.app.locals.db;
  const userId = new ObjectId(req.user.id);
  const payload = {
    title: req.body.title,
    creator: req.body.creator,
    description: req.body.description,
    category: req.body.category,
    type: req.body.type,
    price: Number(req.body.price || 0),
    status: req.body.status || 'Active',
    approvalStatus: req.body.approvalStatus || 'Approved',
    rating: Number(req.body.rating || 0),
    ratingCount: Number(req.body.ratingCount || 0),
    totalSales: Number(req.body.totalSales || 0),
    fileUrl: req.body.fileUrl || '',
    fileType: req.body.fileType || '',
    previewUrl: req.body.previewUrl || '',
    previewEnabled: req.body.previewEnabled !== false,
    userId,
    seller: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await db.collection('products').insertOne(payload);
  return res.status(201).json({ ...payload, _id: result.insertedId });
};

const listProducts = async (req, res) => {
  const db = req.app.locals.db;
  const {
    approvalStatus,
    status,
    category,
    type,
    seller,
    q,
    minPrice,
    maxPrice,
    rating,
    sort,
    page,
    limit,
    withMeta
  } = req.query;

  const query = buildProductQuery({
    approvalStatus,
    status,
    category,
    type,
    seller,
    q,
    minPrice,
    maxPrice
  });

  if (rating !== undefined && rating !== '') {
    query.rating = { $gte: Number(rating) };
  }

  const pageNumber = Math.max(1, Number(page || 1));
  const pageSize = Math.max(1, Math.min(48, Number(limit || 24)));
  const skip = (pageNumber - 1) * pageSize;
  const sortStage = getSortStage(sort || 'featured');

  const [result] = await db
    .collection('products')
    .aggregate([
      { $match: query },
      {
        $facet: {
          items: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: pageSize },
            {
              $lookup: {
                from: 'users',
                localField: 'seller',
                foreignField: '_id',
                as: 'sellerInfo'
              }
            },
            { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
            {
              $addFields: {
                seller: {
                  id: '$sellerInfo._id',
                  name: '$sellerInfo.name',
                  email: '$sellerInfo.email'
                }
              }
            },
            { $project: { sellerInfo: 0 } }
          ],
          totalCount: [{ $count: 'count' }],
          categoryCounts: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }
          ],
          priceRange: [
            {
              $group: {
                _id: null,
                min: { $min: '$price' },
                max: { $max: '$price' }
              }
            }
          ]
        }
      }
    ])
    .toArray();

  const items = result?.items || [];
  const total = Number(result?.totalCount?.[0]?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const categoryCounts = (result?.categoryCounts || [])
    .filter((entry) => entry._id)
    .map((entry) => ({ category: entry._id, count: entry.count }));
  const min = Number(result?.priceRange?.[0]?.min || 0);
  const max = Number(result?.priceRange?.[0]?.max || 0);

  if (String(withMeta).toLowerCase() === 'true') {
    return res.json({
      items,
      meta: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages,
        categoryCounts,
        priceRange: { min, max }
      }
    });
  }

  return res.json(items);
};

const listTrendingProducts = async (req, res) => {
  const db = req.app.locals.db;
  const limit = Math.max(1, Math.min(Number(req.query.limit || 8), 24));

  const products = await db
    .collection('products')
    .aggregate([
      {
        $match: {
          $and: [
            {
              $or: [{ status: 'Active' }, { status: { $exists: false } }, { status: null }]
            },
            {
              $or: [
                { approvalStatus: 'Approved' },
                { approvalStatus: { $exists: false } },
                { approvalStatus: null }
              ]
            }
          ]
        }
      },
      {
        $addFields: {
          rating: { $ifNull: ['$rating', 0] },
          totalSales: { $ifNull: ['$totalSales', 0] },
          createdAt: { $ifNull: ['$createdAt', new Date(0)] }
        }
      },
      { $sort: { totalSales: -1, rating: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          seller: {
            id: '$sellerInfo._id',
            name: '$sellerInfo.name',
            email: '$sellerInfo.email'
          }
        }
      },
      { $project: { sellerInfo: 0 } }
    ])
    .toArray();

  return res.json(products);
};

const getProduct = async (req, res) => {
  const db = req.app.locals.db;
  const product = await db
    .collection('products')
    .aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          seller: {
            id: '$sellerInfo._id',
            name: '$sellerInfo.name',
            email: '$sellerInfo.email'
          }
        }
      },
      { $project: { sellerInfo: 0 } }
    ])
    .next();

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json(product);
};

const updateProduct = async (req, res) => {
  const db = req.app.locals.db;
  const productId = new ObjectId(req.params.id);
  const existing = await db.collection('products').findOne({ _id: productId });
  if (!existing) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const ownerId = String(existing.seller || existing.userId || '');
  const canModify = req.user.role === 'admin' || ownerId === req.user.id;
  if (!canModify) {
    return res.status(403).json({ message: 'Not allowed to update this product' });
  }

  await db
    .collection('products')
    .updateOne({ _id: productId }, { $set: { ...req.body, updatedAt: new Date() } });
  const product = await db.collection('products').findOne({ _id: productId });
  return res.json(product);
};

const updateApproval = async (req, res) => {
  const db = req.app.locals.db;
  const { approvalStatus } = req.body;
  await db
    .collection('products')
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { approvalStatus, updatedAt: new Date() } });
  const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json(product);
};

const deleteProduct = async (req, res) => {
  const db = req.app.locals.db;
  const productId = new ObjectId(req.params.id);
  const existing = await db.collection('products').findOne({ _id: productId });
  if (!existing) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const ownerId = String(existing.seller || existing.userId || '');
  const canModify = req.user.role === 'admin' || ownerId === req.user.id;
  if (!canModify) {
    return res.status(403).json({ message: 'Not allowed to delete this product' });
  }

  const result = await db.collection('products').deleteOne({ _id: productId });
  if (!result.deletedCount) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json({ message: 'Product deleted' });
};

const myUploads = async (req, res) => {
  const db = req.app.locals.db;
  const products = await db
    .collection('products')
    .find({ seller: new ObjectId(req.user.id) })
    .sort({ createdAt: -1 })
    .toArray();
  return res.json(products);
};

module.exports = {
  createProduct,
  listProducts,
  listTrendingProducts,
  getProduct,
  updateProduct,
  updateApproval,
  deleteProduct,
  myUploads
};
