const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

dotenv.config();

const run = async () => {
  const [, , adminEmailArg, adminPasswordArg] = process.argv;
  const adminEmail = String(adminEmailArg || '').trim().toLowerCase();
  const adminPassword = String(adminPasswordArg || '').trim();

  if (!adminEmail || !adminPassword) {
    console.error('Usage: npm run create-admin -- <adminEmail> <adminPassword>');
    process.exit(1);
  }

  if (adminPassword.length < 6) {
    console.error('Password must be at least 6 characters');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB_NAME || 'apnabook');
    const now = new Date();
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await db.collection('users').updateOne(
      { email: adminEmail },
      {
        $set: {
          fullName: 'Admin User',
          name: 'Admin',
          email: adminEmail,
          password: passwordHash,
          role: 'admin',
          status: 'Active',
          isVerified: true,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );

    console.log(`Admin user created/updated successfully: ${adminEmail}`);
  } catch (error) {
    console.error('Failed to create/update admin user:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
};

run();
