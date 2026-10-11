import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (isConnected) return true;

  const mongoUri = env.MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/certichain';

  try {
    // Attempt Mongoose connection with 3-second timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[Database] Successfully connected to MongoDB at: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);
    
    // Automatically seed initial data if collections are empty
    try {
      const { seedMongoIfEmpty } = await import('./seedMongo.js');
      await seedMongoIfEmpty();
    } catch (seedErr) {
      console.warn('[Database] Seed check warning:', seedErr);
    }

    return true;
  } catch (err: unknown) {
    console.warn(`[Database] MongoDB not reachable at ${mongoUri}.`);
    console.warn(`[Database] Activating Resilient Local Persistent Store for zero-friction evaluation.`);
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
