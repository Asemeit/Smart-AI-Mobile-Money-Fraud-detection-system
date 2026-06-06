import { Router } from 'express';

const router = Router();

const TIPS = {
  saving: 'Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Start small — even 500 UGX daily adds up.',
  budget: 'Track every mobile money payment for one week. Most traders find 2–3 recurring leaks they can fix.',
  fraud: 'Always confirm payment in your official M-Pesa or MoMo app — never trust SMS alone. Check sender number and transaction ID.',
  default: 'I can help with saving tips, budgeting, and spotting risky transactions. What would you like to know?',
};

function pickResponse(message) {
  const text = (message || '').toLowerCase();
  if (text.includes('save') || text.includes('saving')) return TIPS.saving;
  if (text.includes('budget') || text.includes('spend')) return TIPS.budget;
  if (text.includes('fraud') || text.includes('scam') || text.includes('fake')) return TIPS.fraud;
  return TIPS.default;
}

router.post('/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  // TODO: Integrate LLM or richer NLP model
  res.json({
    reply: pickResponse(message),
    category: 'financial-advice',
    disclaimer: 'General guidance only — not professional financial advice.',
  });
});

export default router;
