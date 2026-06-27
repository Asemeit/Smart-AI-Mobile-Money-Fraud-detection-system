import { Router } from 'express';
import { scoreReceipt } from '../services/fraudScorer.js';
import { appendJson, readJson } from '../store/fileStore.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const CHECKS_FILE = 'fraud-checks.json';

router.post('/verify', async (req, res) => {
  const { messageText, provider, amount } = req.body;

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
        body: JSON.stringify({ messageText, provider, amount }),
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
    result = { source: 'rule-engine', ...scoreReceipt({ messageText, provider, amount }) };
  }

  const record = {
    id: `CHK${Date.now()}`,
    messageText,
    provider: provider || null,
    amount: amount ?? null,
    ...result,
    createdAt: new Date().toISOString(),
  };

  await appendJson(CHECKS_FILE, record);

  res.json({ id: record.id, ...result });
});

router.get('/history', requireAuth, async (_req, res) => {
  const checks = await readJson(CHECKS_FILE, []);
  res.json({ checks: checks.slice(0, 50), total: checks.length });
});

export default router;
