const { MongoClient } = require('mongodb');

let client;
let database;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  if (client && database) {
    return { client, db: database };
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(process.env.MONGO_DB_NAME || 'apnabook');

  await database.collection('products').createIndexes([
    { key: { category: 1 } },
    { key: { price: 1 } },
    { key: { rating: -1 } },
    { key: { totalSales: -1 } },
    { key: { createdAt: -1 } },
    { key: { seller: 1, createdAt: -1 } },
    { key: { title: 'text', creator: 'text' } }
  ]);

  console.log('MongoDB connected');
  return { client, db: database };
};

const getDb = () => {
  if (!database) {
    throw new Error('Database not initialized');
  }
  return database;
};

module.exports = { connectDB, getDb };
