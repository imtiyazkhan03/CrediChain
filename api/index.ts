import type { IncomingMessage, ServerResponse } from 'http';
import { app } from '../backend/src/app.js';
import { connectDatabase } from '../backend/src/config/db.js';

let isConnecting = false;
let isConnected = false;

async function ensureDb() {
  if (isConnected) return;
  if (!isConnecting) {
    isConnecting = true;
    try {
      isConnected = await connectDatabase();
    } finally {
      isConnecting = false;
    }
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureDb();
  } catch (err) {
    console.warn('[Vercel Serverless] DB connection attempt:', err);
  }
  return app(req, res);
}
