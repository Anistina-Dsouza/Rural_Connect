import mongoose from 'mongoose';
import { store } from './store.js';

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ruralcare';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: process.env.MONGODB_URI ? 10000 : 3000,
    });
    console.log('[Database] MongoDB connected.');
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
    console.error(`[Database] MongoDB connection or initialization failed (${(error as Error).name}).`);
    if (process.env.MONGODB_URI) {
      throw new Error('Configured MongoDB is unavailable; refusing to start without database persistence.');
    }
    console.warn('[Database] Operating in local persistent storage mode (data/db.json).');
    return false;
  }
}
