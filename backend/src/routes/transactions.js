import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import { sampleTransactions } from '../data/seedTransactions.js';
import { dbConnected } from '../config/db.js';

const router = Router();

const memoryStore = sampleTransactions.map((t) => ({
  ...t,
  createdAt: new Date().toISOString(),
}));

function toResponse(doc) {
  return {
    id: doc.txnId,
    provider: doc.provider,
    amount: doc.amount,
    sender: doc.sender,
    status: doc.status,
    riskScore: doc.riskScore,
    createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt,
  };
}

export async function seedTransactionsIfEmpty() {
  if (!dbConnected) return;
  const count = await Transaction.countDocuments();
  if (count === 0) {
    await Transaction.insertMany(sampleTransactions);
    console.log('Seeded sample transactions into MongoDB');
  }
}

router.get('/', async (_req, res) => {
  try {
    if (!dbConnected) {
      return res.json({
        transactions: memoryStore.map(toResponse),
        total: memoryStore.length,
        source: 'memory',
      });
    }

    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json({
      transactions: transactions.map(toResponse),
      total: transactions.length,
      source: 'mongodb',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transactions', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!dbConnected) {
      const txn = memoryStore.find((t) => t.txnId === req.params.id);
      if (!txn) return res.status(404).json({ error: 'Transaction not found' });
      return res.json(toResponse(txn));
    }

    const txn = await Transaction.findOne({ txnId: req.params.id });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json(toResponse(txn));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transaction', details: err.message });
  }
});

export default router;
