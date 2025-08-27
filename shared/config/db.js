import mongoose from 'mongoose';
import 'dotenv/config';

let isConnected = false;

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