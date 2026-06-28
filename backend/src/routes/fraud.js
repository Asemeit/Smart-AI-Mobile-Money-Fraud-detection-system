import { Router } from 'express';
import mongoose from 'mongoose';
import FraudCheck from '../models/FraudCheck.js';
import { scoreReceipt } from '../services/fraudScorer.js';
import { appendJson, readJson } from '../store/fileStore.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { dbConnected } from '../config/db.js';

const router = Router();
const CHECKS_FILE = 'fraud-checks.json';

function formatCheck(doc) {
  return {
    id: doc.checkId || doc.id,
    messageText: doc.messageText,
    provider: doc.parsed?.provider || doc.provider,
    documentType: doc.parsed?.documentType || doc.documentType,
    amount: doc.parsed?.amount ?? doc.amount ?? null,
    riskScore: doc.riskScore ?? 0,
    verdict: doc.verdict,
    flags: doc.flags || [],
    source: doc.source,
    createdAt: doc.createdAt,
  };
}

async function getUserChecks(userId) {
  const byId = new Map();

  const fileChecks = await readJson(CHECKS_FILE, []);
  for (const check of fileChecks) {
    if (check.userId === userId) {
      byId.set(check.id, formatCheck(check));
    }
  }

  if (dbConnected) {
    const mongoFilter = mongoose.isValidObjectId(userId)
      ? { $or: [{ userRef: userId }, { userId }] }
      : { userRef: userId };

    const mongoChecks = await FraudCheck.find(mongoFilter).sort({ createdAt: -1 }).limit(50);
    for (const check of mongoChecks) {
      byId.set(check.checkId, formatCheck(check));
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

router.post('/verify', optionalAuth, async (req, res) => {
  const { messageText, provider, amount, documentType } = req.body;

  if (!messageText || typeof messageText !== 'string') {
    return res.status(400).json({ error: 'messageText is required' });
  }

  let result;
  const aiUrl = process.env.AI_SERVICE_URL;

  if (aiUrl) {
    try {
      const response = await fetch(`${aiUrl}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText, provider, amount, documentType }),
      });
      if (response.ok) {
        const aiResult = await response.json();
        result = { source: 'ai-service', ...aiResult };
      }
    } catch {
      // Fall back to local rule-based scorer
    }
  }

  if (!result) {
    result = { source: 'rule-engine', ...scoreReceipt({ messageText, provider, amount, documentType }) };
  }

  const checkId = `CHK${Date.now()}`;
  const userRef = req.user?.id || null;
  const mongoUserId = userRef && mongoose.isValidObjectId(userRef) ? userRef : null;

  const record = {
    checkId,
    userRef,
    messageText,
    provider: result.parsed?.provider || provider || null,
    documentType: result.parsed?.documentType || documentType || null,
    amount: result.parsed?.amount ?? amount ?? null,
    riskScore: result.riskScore,
    verdict: result.verdict,
    flags: result.flags || [],
    source: result.source,
    parsed: result.parsed,
  };

  try {
    if (dbConnected) {
      await FraudCheck.create({
        ...record,
        userId: mongoUserId,
      });
    } else {
      await appendJson(CHECKS_FILE, {
        id: checkId,
        userId: userRef,
        ...record,
        createdAt: new Date().toISOString(),
      });
    }
  } catch {
    // Verification still returns even if persistence fails
  }

  res.json({ id: checkId, ...result });
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const checks = await getUserChecks(req.user.id);

    res.json({
      checks,
      total: checks.length,
      source: dbConnected ? 'mongodb' : 'file-fallback',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load history', details: err.message });
  }
});

export default router;
