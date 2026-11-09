import mongoose from 'mongoose';

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ruralcare';

  try {
    // 2 second timeout so app doesn't hang if local mongodb is not running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB connected successfully to ${uri}`);
    return true;
  } catch (error) {
    console.warn(`[Database] MongoDB connection not available (${(error as Error).message}). Falling back to High-Performance In-Memory Data Store.`);
    return false;
  }
}
