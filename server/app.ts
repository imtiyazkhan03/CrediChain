import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';

export const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (
        env.CORS_ORIGINS.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Payload parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'CertiChain Academic Registry Backend',
    version: '1.0.0',
    environment: env.NODE_ENV,
    storageDirectoryConfigured: Boolean(env.STORAGE_DIR),
    timestamp: new Date().toISOString(),
  });
});

// Mount modular sub-routers
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verifyRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint Not Found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Centralized Error Handling
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const errorObj = err as Error;
  console.error('[ServerError]', errorObj);

  const status = (err as { status?: number }).status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : 'Request Error',
    message: errorObj.message || 'An unexpected error occurred.',
    ...(env.NODE_ENV === 'development' && { stack: errorObj.stack }),
  });
});
