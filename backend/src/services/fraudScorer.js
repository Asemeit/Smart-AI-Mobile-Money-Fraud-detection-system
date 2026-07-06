/**
 * Rule-based fraud scorer — mobile money SMS + bank statements.
 * TODO (AI team): Replace with TensorFlow model or call Python AI service.
 */

const SUSPICIOUS_KEYWORDS = ['click here', 'verify now', 'bit.ly', 'tinyurl', 'urgent action', 'you have won', 'enter your pin', 'account suspended'];

const MOBILE_PROVIDERS = [
  { id: 'mpesa', label: 'M-Pesa', patterns: ['mpesa', 'm-pesa', 'safaricom'] },
  { id: 'mtn', label: 'MTN MoMo', patterns: ['mtn momo', 'mtn mobile money', 'mtn mobile'] },
  { id: 'airtel', label: 'Airtel Money', patterns: ['airtel money', 'airtel'] },
];

const BANKS = [
  { id: 'absa', label: 'Absa Bank', patterns: ['absa'] },
  { id: 'kcb', label: 'KCB Bank', patterns: ['kcb', 'kenya commercial bank'] },
  { id: 'equity', label: 'Equity Bank', patterns: ['equity bank', 'equity'] },
  { id: 'coop', label: 'Co-operative Bank', patterns: ['co-operative bank', 'coop bank', 'mco-op cash'] },
  { id: 'stanbic', label: 'Stanbic Bank', patterns: ['stanbic'] },
  { id: 'ncba', label: 'NCBA Bank', patterns: ['ncba'] },
  { id: 'dtb', label: 'DTB Bank', patterns: ['diamond trust', 'dtb bank'] },
];

const MOBILE_LABELS = Object.fromEntries(MOBILE_PROVIDERS.map((p) => [p.id, p.label]));
const BANK_LABELS = Object.fromEntries(BANKS.map((b) => [b.id, b.label]));

function normalize(text) {
  return (text || '').toLowerCase().trim();
}

function detectByPatterns(text, list) {
  for (const item of list) {
    if (item.patterns.some((p) => text.includes(p))) return item.id;
  }
  return null;
}

function normalizeMobileChoice(provider) {
  if (!provider || provider === 'Auto-detect') return null;
  const n = normalize(provider);
  if (n.includes('mpesa')) return 'mpesa';
  if (n.includes('mtn')) return 'mtn';
  if (n.includes('airtel')) return 'airtel';
  return null;
}

function normalizeBankChoice(provider) {
  if (!provider || provider === 'Auto-detect') return null;
  const n = normalize(provider);
  return BANKS.find((b) => n.includes(b.id) || b.patterns.some((p) => n.includes(p)))?.id || null;
}

function extractAmount(text) {
  const match = text.match(/(?:ksh|kes|ugx|rwf|tzs)\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/(?:ksh|kes|ugx|rwf|tzs)([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/([\d,]+(?:\.\d{2})?)\s*(?:ksh|kes|ugx|rwf|tzs)/i);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

function extractReference(text) {
  const refMatch = text.match(/(?:mpesa\s+ref|reference|ref(?:erence)?|txn|transaction|code)[:\s#-]*([A-Z0-9]{6,16})/i);
  if (refMatch) return refMatch[1].toUpperCase();

  const idMatch = text.match(/\b([A-Z0-9]{8,12})\b/);
  return idMatch ? idMatch[1].toUpperCase() : null;
}

function extractAccountMask(text) {
  const match = text.match(/(?:account|a\/c|acc)[:\s#]*([Xx*]{2,}\d{2,6}|\d{4,12})/i);
  return match ? match[1].toUpperCase() : null;
}

function hasSuspiciousPhrase(text) {
  const flags = [];
  let score = 0;

  if (/\bconfirmed!\b/i.test(text) || /you received ksh/i.test(text)) {
    flags.push('Suspicious phrase detected: fake confirmation format');
    score += 15;
  }

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (text.includes(keyword)) {
      flags.push(`Suspicious phrase detected: "${keyword}"`);
      score += 10;
    }
  }

  return { flags, score };
}

function computeConfidenceScore(flags, parsed) {
  let confidence = 40;
  if (parsed?.transactionId || parsed?.account) confidence += 20;
  if (parsed?.amount != null) confidence += 15;
  if (parsed?.provider) confidence += 15;

  const positive = flags.filter((f) => f.startsWith('✓')).length;
  const negative = flags.filter((f) => !f.startsWith('✓')).length;

  confidence += positive * 6;
  confidence -= negative * 4;

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

function finalizeScore(riskScore, flags, parsed, documentType, note) {
  riskScore = Math.max(0, Math.min(100, riskScore));

  let verdict = 'LIKELY_GENUINE';
  if (riskScore >= 60) verdict = 'HIGH_RISK';
  else if (riskScore >= 30) verdict = 'SUSPICIOUS';

  const confidenceScore = computeConfidenceScore(flags, parsed);

  return {
    riskScore,
    confidenceScore,
    verdict,
    flags,
    parsed: { ...parsed, documentType },
    note: note || 'Rule-based analysis — ML model integration pending (see ai-service/)',
  };
}

function detectDocumentKind(text) {
  const isBankDoc = /bank statement|account statement|opening balance|closing balance|statement period|credit:|debit:/i.test(text);
  const bankId = detectByPatterns(text, BANKS);
  const mobileId = detectByPatterns(text, MOBILE_PROVIDERS);

  if (/mpesa ref|confirmed.*received|new m-?pesa balance/i.test(text)) return 'mobile_money';
  if (isBankDoc || (bankId && !mobileId)) return 'bank';
  if (mobileId) return 'mobile_money';
  if (bankId) return 'bank';
  return 'unknown';
}

function scoreMobileMoney({ messageText, provider, amount }) {
  const text = normalize(messageText);
  const flags = [];
  let riskScore = 0;

  const detectedProvider = detectByPatterns(text, MOBILE_PROVIDERS);
  const chosenProvider = normalizeMobileChoice(provider);
  const effectiveProvider = detectedProvider || chosenProvider;

  if (chosenProvider && detectedProvider && chosenProvider !== detectedProvider) {
    flags.push(`Provider mismatch: message looks like ${MOBILE_LABELS[detectedProvider]}, but you selected ${provider}`);
    riskScore += 15;
  }

  if (!effectiveProvider) {
    flags.push('No recognized mobile money provider (M-Pesa, MTN MoMo, or Airtel Money) found');
    riskScore += 25;
  }

  const parsedAmount = extractAmount(messageText);
  if (amount && parsedAmount && Math.abs(parsedAmount - Number(amount)) > 0.01) {
    flags.push(`Amount mismatch: message shows ${parsedAmount}, expected ${amount}`);
    riskScore += 35;
  }

  const reference = extractReference(messageText);
  if (!reference) {
    flags.push('No transaction reference detected');
    riskScore += 10;
  }

  const suspicious = hasSuspiciousPhrase(text);
  flags.push(...suspicious.flags);
  riskScore += suspicious.score;

  if (text.includes('http://') && !text.includes('safaricom') && !text.includes('mtn')) {
    flags.push('Unverified link in message');
    riskScore += 20;
  }

  if (/mpesa\s+ref/i.test(text)) flags.push('✓ Standard M-Pesa reference format detected'), (riskScore -= 5);
  if (/received (?:ksh|kes|ugx)/i.test(text) || /received from/i.test(text)) flags.push('✓ Standard payment received format detected'), (riskScore -= 5);
  if (/2547\d{8}/.test(text)) flags.push('✓ Valid Kenya phone number format detected'), (riskScore -= 5);
  if (/new m-?pesa balance/i.test(text)) flags.push('✓ M-Pesa balance line detected'), (riskScore -= 5);

  return finalizeScore(riskScore, flags, {
    amount: parsedAmount,
    transactionId: reference,
    provider: effectiveProvider ? MOBILE_LABELS[effectiveProvider] : null,
  }, 'mobile_money');
}

function scoreBankStatement({ messageText, provider, amount }) {
  const text = normalize(messageText);
  const flags = [];
  let riskScore = 0;

  const detectedBank = detectByPatterns(text, BANKS);
  const chosenBank = normalizeBankChoice(provider);
  const effectiveBank = detectedBank || chosenBank;

  if (chosenBank && detectedBank && chosenBank !== detectedBank) {
    flags.push(`Bank mismatch: message looks like ${BANK_LABELS[detectedBank]}, but you selected ${provider}`);
    riskScore += 15;
  }

  if (!effectiveBank) {
    flags.push('No recognized bank found (Absa, KCB, Equity, Co-op, Stanbic, NCBA, DTB)');
    riskScore += 20;
  }

  const parsedAmount = extractAmount(messageText);
  if (amount && parsedAmount && Math.abs(parsedAmount - Number(amount)) > 0.01) {
    flags.push(`Amount mismatch: statement shows ${parsedAmount}, expected ${amount}`);
    riskScore += 30;
  }

  const reference = extractReference(messageText);
  const account = extractAccountMask(messageText);

  if (!reference && !account) {
    flags.push('No account number or transaction reference detected');
    riskScore += 15;
  }

  const suspicious = hasSuspiciousPhrase(text);
  flags.push(...suspicious.flags);
  riskScore += suspicious.score;

  if (text.includes('http://') || text.includes('https://')) {
    flags.push('Unverified link in bank document');
    riskScore += 25;
  }

  if (/bank statement|account statement/i.test(text)) flags.push('✓ Bank statement format detected'), (riskScore -= 5);
  if (/closing balance|opening balance/i.test(text)) flags.push('✓ Balance information detected'), (riskScore -= 5);
  if (/credit:|debit:|deposit|withdrawal|transfer from/i.test(text)) flags.push('✓ Transaction line items detected'), (riskScore -= 5);
  if (account) flags.push(`✓ Account reference detected (${account})`), (riskScore -= 5);
  if (reference) flags.push('✓ Transaction reference detected'), (riskScore -= 5);
  if (/statement period|\d{2}\/\d{2}\/\d{4}/.test(text)) flags.push('✓ Statement date/period detected'), (riskScore -= 5);

  return finalizeScore(riskScore, flags, {
    amount: parsedAmount,
    transactionId: reference,
    account,
    provider: effectiveBank ? BANK_LABELS[effectiveBank] : null,
  }, 'bank', 'Bank statement analysis — always confirm in your official banking app.');
}

export function scoreReceipt({ messageText, provider, amount, documentType = 'auto' }) {
  const text = normalize(messageText);

  let kind = documentType;
  if (kind === 'auto' || !kind) {
    kind = detectDocumentKind(text);
  }

  if (kind === 'bank') {
    return scoreBankStatement({ messageText, provider, amount });
  }

  if (kind === 'mobile_money') {
    return scoreMobileMoney({ messageText, provider, amount });
  }

  return finalizeScore(40, [
    'Could not identify document type — select Mobile Money or Bank Statement above',
    'Paste the full SMS or bank statement text for better analysis',
  ], {
    amount: extractAmount(messageText),
    transactionId: extractReference(messageText),
    provider: null,
  }, 'unknown', 'Select document type (Mobile Money or Bank Statement) for accurate scoring.');
}
