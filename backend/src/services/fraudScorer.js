/**
 * Rule-based fraud scorer — starter implementation.
 * TODO (AI team): Replace with TensorFlow model or call Python AI service.
 */

const SUSPICIOUS_KEYWORDS = ['confirm', 'pending', 'click here', 'verify now', 'bit.ly', 'tinyurl'];
const VALID_PROVIDERS = ['mpesa', 'mtn momo', 'mtn mobile money', 'airtel money'];

function normalize(text) {
  return (text || '').toLowerCase().trim();
}

function extractAmount(text) {
  const match = text.match(/(?:ksh|ugx|rwf|tzs|kes|ugx)\s*([\d,]+(?:\.\d{2})?)/i)
    || text.match(/([\d,]+(?:\.\d{2})?)\s*(?:ksh|ugx|rwf|tzs)/i);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

function extractTransactionId(text) {
  const match = text.match(/(?:txn|transaction|ref|code)[:\s#]*([A-Z0-9]{6,12})/i)
    || text.match(/\b([A-Z0-9]{8,12})\b/);
  return match ? match[1].toUpperCase() : null;
}

export function scoreReceipt({ messageText, provider, amount }) {
  const text = normalize(messageText);
  const flags = [];
  let riskScore = 0;

  const detectedProvider = VALID_PROVIDERS.find((p) => text.includes(p));
  if (provider && detectedProvider && !text.includes(normalize(provider))) {
    flags.push('Provider mismatch between form and message');
    riskScore += 25;
  }

  if (!detectedProvider && !provider) {
    flags.push('No recognized mobile money provider in message');
    riskScore += 20;
  }

  const parsedAmount = extractAmount(messageText);
  if (amount && parsedAmount && Math.abs(parsedAmount - Number(amount)) > 0.01) {
    flags.push(`Amount mismatch: message shows ${parsedAmount}, expected ${amount}`);
    riskScore += 35;
  }

  if (!extractTransactionId(messageText)) {
    flags.push('No transaction ID detected');
    riskScore += 15;
  }

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (text.includes(keyword)) {
      flags.push(`Suspicious phrase detected: "${keyword}"`);
      riskScore += 10;
    }
  }

  if (text.includes('http://') && !text.includes('safaricom') && !text.includes('mtn')) {
    flags.push('Unverified link in message');
    riskScore += 20;
  }

  riskScore = Math.min(100, riskScore);

  let verdict = 'LIKELY_GENUINE';
  if (riskScore >= 60) verdict = 'HIGH_RISK';
  else if (riskScore >= 30) verdict = 'SUSPICIOUS';

  return {
    riskScore,
    verdict,
    flags,
    parsed: {
      amount: parsedAmount,
      transactionId: extractTransactionId(messageText),
      provider: detectedProvider || provider || null,
    },
    note: 'Rule-based analysis — ML model integration pending (see ai-service/)',
  };
}
