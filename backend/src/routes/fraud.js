import { Router } from 'express';
import { scoreReceipt } from '../services/fraudScorer.js';

const router = Router();

router.post('/verify', async (req, res) => {
  const { messageText, provider, amount } = req.body;

  if (!messageText || typeof messageText !== 'string') {
    return res.status(400).json({ error: 'messageText is required' });
  }

  // TODO: Optionally forward to Python AI service when available
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
        return res.json({ source: 'ai-service', ...aiResult });
      }
    } catch {
      // Fall back to local rule-based scorer
    }
  }

  const result = scoreReceipt({ messageText, provider, amount });
  res.json({ source: 'rule-engine', ...result });
});

export default router;
