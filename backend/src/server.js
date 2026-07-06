import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, dbConnected } from './config/db.js';
import fraudRoutes from './routes/fraud.js';
import transactionRoutes from './routes/transactions.js';
import advisorRoutes from './routes/advisor.js';
import authRoutes from './routes/auth.js';
import databaseRoutes from './routes/database.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set — using dev default. Set it in backend/.env for production.');
  process.env.JWT_SECRET = 'dev-secret-change-me';
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Mobile Money Fraud Detection API',
    version: '0.3.0',
    database: dbConnected ? 'mongodb' : 'file-fallback',
    auth: 'jwt',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/database', databaseRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

let server;

function shutdown(signal) {
  console.log(`\n${signal} — closing server...`);
  if (!server) {
    process.exit(0);
    return;
  }

  server.close(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  if (process.env.MONGODB_URI) {
    await connectDB();
  }

  return new Promise((resolve, reject) => {
    server = app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
      console.log(`Auth: POST /api/auth/register, POST /api/auth/login`);
      if (!dbConnected) {
        console.log('Storage: JSON files in backend/data/ (MongoDB optional)');
      }
      resolve();
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${PORT} is still in use.`);
        console.error('Run: npm run stop');
        console.error('Then: npm run dev\n');
      }
      reject(err);
    });
  });
}

start().catch((err) => {
  if (err.code !== 'EADDRINUSE') {
    console.error('Server failed to start:', err.message);
  }
  process.exit(1);
});
