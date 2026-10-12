import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

// Load .env file
dotenv.config();

export interface ServerConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  STORAGE_DIR: string;
  CORS_ORIGINS: string[];
  RPC_URL: string;
  CONTRACT_ADDRESS: string;
  MONGODB_URI?: string;
}

function validateEnv(): ServerConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const port = parseInt(process.env.PORT || '5000', 10);
  
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`[EnvError] Invalid PORT: ${process.env.PORT}`);
  }

  // Ensure JWT Secret is present
  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    jwtSecret = 'certichain_college_mini_project_secure_jwt_secret_key_2026';
    console.warn('[EnvWarning] Using default JWT_SECRET. Configure JWT_SECRET in project settings for production.');
  }

  // On Vercel / serverless environments, file writing is restricted to /tmp
  const defaultStorageDir = process.env.VERCEL
    ? path.join(os.tmpdir(), 'certichain', 'certificates')
    : path.resolve(process.cwd(), 'server', 'storage', 'certificates');

  const storageDir = process.env.STORAGE_DIR 
    ? path.resolve(process.env.STORAGE_DIR) 
    : defaultStorageDir;

  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const contractAddress = process.env.VITE_CERTICHAIN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

  return {
    PORT: port,
    NODE_ENV: nodeEnv,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    STORAGE_DIR: storageDir,
    CORS_ORIGINS: corsOrigins,
    RPC_URL: rpcUrl,
    CONTRACT_ADDRESS: contractAddress,
    MONGODB_URI: process.env.MONGODB_URI,
  };
}

export const env = validateEnv();
