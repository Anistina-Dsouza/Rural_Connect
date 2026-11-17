import mongoose from 'mongoose';
import { store } from './store.js';

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ruralcare';

  try {
    // 3 second timeout so app boots immediately if local mongodb is not running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB connected successfully to ${uri}`);
    
    // Synchronize Mongoose models with the data store
    await store.initMongoSync();

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection dropped. Operating in High-Availability Disk Mode.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Database] MongoDB reconnected. Re-syncing data store...');
      store.initMongoSync();
    });

    return true;
  } catch (error) {
    console.warn(`[Database] MongoDB connection not available (${(error as Error).message}).`);
    console.log(`[Database] Operating in High-Performance Local Persistent Storage Mode (data/db.json).`);
    return false;
  }
}
