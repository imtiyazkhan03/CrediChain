import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';

async function startServer() {
  // Connect to persistent MongoDB database
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🎓 CertiChain Backend API Server is running`);
    console.log(`🔗 Local Address:  http://127.0.0.1:${env.PORT}`);
    console.log(`🛡️  Environment:   ${env.NODE_ENV}`);
    console.log(`📁 Storage Vault: ${env.STORAGE_DIR}`);
    console.log(`=======================================================`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Gracefully closing HTTP server...');
    server.close(() => {
      console.log('HTTP server closed.');
    });
  });
}

startServer().catch((err) => {
  console.error('Fatal backend startup failure:', err);
  process.exit(1);
});
