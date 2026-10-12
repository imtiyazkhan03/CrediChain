import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { isDbConnected } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import validatorRoutes from './routes/validatorRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';

export const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration supporting cookies
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        env.CORS_ORIGINS.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Cookie Parser & Payload Parsers
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure database connection in serverless or container environments
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  if (!isDbConnected()) {
    try {
      const { connectDatabase } = await import('./config/db.js');
      await connectDatabase();
    } catch {
      // Gracefully continue using local resilient store fallback
    }
  }
  next();
});

// Root Welcome Endpoint
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>CertiChain Backend API</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; max-width: 520px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        h1 { margin-top: 0; color: #14b8a6; font-size: 1.5rem; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
        .badge { display: inline-block; background: #064e3b; color: #34d399; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; margin-bottom: 1rem; }
        .btn { display: inline-block; background: #0d9488; color: white; padding: 0.6rem 1.2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.9rem; margin-top: 1rem; transition: background 0.2s; }
        .btn:hover { background: #0f766e; }
        .links { margin-top: 1.5rem; font-size: 0.85rem; border-top: 1px solid #334155; padding-top: 1rem; }
        .links a { color: #38bdf8; text-decoration: none; margin-right: 1rem; }
        .links a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">● BACKEND RUNNING & HEALTHY</span>
        <h1>🎓 CertiChain Backend API</h1>
        <p>The Express 5 backend server is active and connected to MongoDB Atlas.</p>
        <p>To use the full web application, open the frontend portal running on port 5173:</p>
        <a class="btn" href="http://localhost:5173">Open CertiChain Frontend App &rarr;</a>
        <div class="links">
          <strong>API Endpoints:</strong><br><br>
          <a href="/api/health">/api/health</a>
          <a href="http://localhost:5173/admin/login">Admin Login (UI)</a>
          <a href="http://localhost:5173/verify">Public Verify (UI)</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API Index
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'CertiChain Academic Registry Backend API',
    status: 'online',
    version: '1.0.0',
    databaseConnected: isDbConnected(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      certificates: '/api/certificates',
      verify: '/api/verify/:certificateId',
      student: '/api/student',
      validator: '/api/validator',
      admin: '/api/admin',
    },
    frontendApp: 'http://localhost:5173',
  });
});

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'CertiChain Academic Registry Backend',
    version: '1.0.0',
    environment: env.NODE_ENV,
    databaseConnected: isDbConnected(),
    storageDirectoryConfigured: Boolean(env.STORAGE_DIR),
    timestamp: new Date().toISOString(),
  });
});

// Mount Role-Based Portals & API Routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/validator', validatorRoutes);

// Backwards-compatible general endpoints
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

// Centralized Error Handling (never exposes stack traces in production)
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

export default app;
