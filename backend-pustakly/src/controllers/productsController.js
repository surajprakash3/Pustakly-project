
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ObjectId = mongoose.Types.ObjectId;

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
  try {
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
      totalSales: Number(req.body.totalSales || 0),
      seller: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const product = await Product.create(payload);
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const listProducts = async (req, res) => {
  try {
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

    const [items, total, categoryCounts, priceRange] = await Promise.all([
      Product.find(query)
        .sort(sortStage)
        .skip(skip)
        .limit(pageSize)
        .populate('seller', 'name email'),
      Product.countDocuments(query),
      Product.aggregate([
        { $match: query },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }
      ]),
      Product.aggregate([
        { $match: query },
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
      ])
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const min = Number(priceRange?.[0]?.min || 0);
    const max = Number(priceRange?.[0]?.max || 0);
    const catCounts = (categoryCounts || []).filter((entry) => entry._id).map((entry) => ({ category: entry._id, count: entry.count }));

    if (String(withMeta).toLowerCase() === 'true') {
      return res.json({
        items,
        meta: {
          page: pageNumber,
          limit: pageSize,
          total,
          totalPages,
          categoryCounts: catCounts,
          priceRange: { min, max }
        }
      });
    }

    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const listTrendingProducts = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit || 8), 24));
    const products = await Product.find({
      $or: [
        { status: 'Active' },
        { status: { $exists: false } },
        { status: null }
      ],
      $or: [
        { approvalStatus: 'Approved' },
        { approvalStatus: { $exists: false } },
        { approvalStatus: null }
      ]
    })
      .sort({ totalSales: -1, rating: -1, createdAt: -1 })
      .limit(limit)
      .populate('seller', 'name email');
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const existing = await Product.findById(productId);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const ownerId = String(existing.seller || existing.userId || '');
    const canModify = req.user.role === 'admin' || ownerId === req.user.id;
    if (!canModify) {
      return res.status(403).json({ message: 'Not allowed to update this product' });
    }
    await Product.findByIdAndUpdate(productId, { ...req.body, updatedAt: new Date() });
    const product = await Product.findById(productId);
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateApproval = async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { approvalStatus, updatedAt: new Date() });
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const existing = await Product.findById(productId);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const ownerId = String(existing.seller || existing.userId || '');
    const canModify = req.user.role === 'admin' || ownerId === req.user.id;
    if (!canModify) {
      return res.status(403).json({ message: 'Not allowed to delete this product' });
    }
    const result = await Product.deleteOne({ _id: productId });
    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const myUploads = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
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
