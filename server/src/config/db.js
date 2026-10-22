import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

/**
 * Connect to MongoDB with retry logic
 */
export async function connectDB(customUri = null) {
  const uri = customUri || config.mongoUri;
  if (!uri) {
    if (config.nodeEnv === 'production') {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }
    return null;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const attemptConnect = async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000
      });
      isConnected = true;
      console.log('Database connected successfully.');
      return mongoose.connection;
    } catch (err) {
      console.error(`MongoDB connection attempt failed: ${err.message}. Retrying in 5 seconds...`);
      setTimeout(attemptConnect, 5000).unref();
      // In non-production or test, if called directly, don't silently hang
      if (config.nodeEnv === 'test') {
        throw err;
      }
    }
  };

  return await attemptConnect();
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
