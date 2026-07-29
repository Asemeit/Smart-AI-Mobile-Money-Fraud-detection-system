import { Router } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import FraudCheck from '../models/FraudCheck.js';
import { dbConnected } from '../config/db.js';
import { readJson } from '../store/fileStore.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/stats', requireAuth, async (_req, res) => {
  try {
    if (!dbConnected) {
      const users = await readJson('users.json', []);
      const checks = await readJson('fraud-checks.json', []);

      return res.json({
        mode: 'file-fallback',
        connected: false,
        database: 'local-json',
        collections: {
          users: users.length,
          transactions: 0,
          fraudChecks: checks.length,
        },
        message: 'MongoDB offline — using JSON files in backend/data/',
      });
    }

    const [users, transactions, fraudChecks] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      FraudCheck.countDocuments(),
    ]);

    const flagged = await Transaction.countDocuments({ status: 'flagged' });
    const verified = await Transaction.countDocuments({ status: 'verified' });
    const highRisk = await FraudCheck.countDocuments({ verdict: 'HIGH_RISK' });

    res.json({
      mode: 'mongodb',
      connected: true,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      collections: {
        users,
        transactions,
        fraudChecks,
      },
      insights: {
        flaggedTransactions: flagged,
        verifiedTransactions: verified,
        highRiskChecks: highRisk,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load database stats', details: err.message });
  }
});

export default router;
