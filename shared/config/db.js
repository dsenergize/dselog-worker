import mongoose from 'mongoose';
import 'dotenv/config';

let isConnected = false;

/**
 * Get the main database connection (myDatabase)
 */
export const getDb = async () => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return mongoose.connection;
  }

  try {
    console.log('=> using new database connection');
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected successfully.');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit if DB connection fails
  }
};

/**
 * Get connection to myDatabase
 */
export const getMainDb = async () => {
  const connection = await getDb();
  return connection.db;
};

/**
 * Get connection to testDatabase
 */
export const getTestDb = async () => {
  const connection = await getDb();
  const mongooseConnection = mongoose.connection;
  
  // Get the client to access other databases
  const client = mongooseConnection.getClient();
  return client.db('testDatabase');
};