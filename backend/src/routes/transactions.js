import { Router } from 'express';

const router = Router();

// Sample data — TODO: Replace with MongoDB queries
const sampleTransactions = [
  {
    id: 'TXN001',
    provider: 'M-Pesa',
    amount: 1500,
    sender: '254712***890',
    status: 'verified',
    riskScore: 8,
    createdAt: '2026-06-05T10:30:00Z',
  },
  {
    id: 'TXN002',
    provider: 'MTN MoMo',
    amount: 50000,
    sender: '256770***123',
    status: 'flagged',
    riskScore: 72,
    createdAt: '2026-06-05T14:15:00Z',
  },
  {
    id: 'TXN003',
    provider: 'M-Pesa',
    amount: 800,
    sender: '254733***456',
    status: 'pending',
    riskScore: 35,
    createdAt: '2026-06-06T09:00:00Z',
  },
];

router.get('/', (_req, res) => {
  res.json({ transactions: sampleTransactions, total: sampleTransactions.length });
});

router.get('/:id', (req, res) => {
  const txn = sampleTransactions.find((t) => t.id === req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  res.json(txn);
});

export default router;
