import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fraudRoutes from './routes/fraud.js';
import transactionRoutes from './routes/transactions.js';
import advisorRoutes from './routes/advisor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Mobile Money Fraud Detection API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/fraud', fraudRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/advisor', advisorRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
