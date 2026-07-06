/**
 * Human-readable explanations for fraud analysis flags.
 * Supports HCI goal: explain WHY a message was marked as fraud.
 */

const EXPLANATIONS = [
  {
    match: /fake confirmation format/i,
    title: 'Fake confirmation format',
    explain: 'Real M-Pesa messages rarely use "CONFIRMED!" in all caps with exclamation marks. Scammers copy this style to rush you.',
  },
  {
    match: /click here|bit\.ly|tinyurl|verify now/i,
    title: 'Suspicious link or phrase',
    explain: 'Official mobile money SMS messages do not ask you to click links to "verify" a payment. This is a common phishing tactic.',
  },
  {
    match: /enter your pin|account suspended/i,
    title: 'Credential or urgency trap',
    explain: 'Banks and mobile money providers never ask for your PIN via SMS. Urgent "account suspended" messages are often scams.',
  },
  {
    match: /provider mismatch|bank mismatch/i,
    title: 'Provider mismatch',
    explain: 'The message content does not match the provider or bank you selected. This may indicate a forged message.',
  },
  {
    match: /amount mismatch/i,
    title: 'Amount mismatch',
    explain: 'The amount in the message differs from what you expected. Always confirm the exact figure before releasing goods.',
  },
  {
    match: /no transaction reference|no account/i,
    title: 'Missing reference',
    explain: 'Genuine payment messages usually include a transaction ID, M-Pesa ref, or account number. Absence increases uncertainty.',
  },
  {
    match: /unverified link/i,
    title: 'Unverified link',
    explain: 'The message contains a web link that is not from an official Safaricom, MTN, or bank domain.',
  },
  {
    match: /no recognized mobile money|no recognized bank/i,
    title: 'Unknown provider',
    explain: 'We could not identify a known mobile money provider or bank in this text. Paste the full official message.',
  },
  {
    match: /Standard M-Pesa reference/i,
    title: 'Valid M-Pesa format',
    explain: 'The message uses the standard "MPESA ref:" format used by genuine Safaricom confirmations.',
    positive: true,
  },
  {
    match: /payment received format/i,
    title: 'Standard received format',
    explain: 'The wording matches how real payment-received SMS messages are written.',
    positive: true,
  },
  {
    match: /phone number format/i,
    title: 'Valid phone number',
    explain: 'A valid Kenya mobile number (2547…) was found, which genuine messages typically include.',
    positive: true,
  },
  {
    match: /balance line|M-Pesa balance/i,
    title: 'Balance line present',
    explain: 'Real M-Pesa SMS often show your new balance after a transaction.',
    positive: true,
  },
  {
    match: /Bank statement format|Balance information|Transaction line items|Account reference|Statement date/i,
    title: 'Genuine bank patterns',
    explain: 'The text matches structural patterns found in real bank statements or alerts.',
    positive: true,
  },
  {
    match: /Transaction reference detected/i,
    title: 'Reference found',
    explain: 'A transaction reference was successfully extracted from the message.',
    positive: true,
  },
];

export function explainFlag(flag) {
  const cleaned = flag.replace(/^✓\s*/, '');
  for (const rule of EXPLANATIONS) {
    if (rule.match.test(cleaned) || rule.match.test(flag)) {
      return { title: rule.title, explain: rule.explain, positive: !!rule.positive };
    }
  }
  return {
    title: cleaned,
    explain: 'This pattern was flagged during automated analysis.',
    positive: flag.startsWith('✓'),
  };
}

export function buildFraudSummary(verdict, riskScore, confidenceScore) {
  if (verdict === 'HIGH_RISK') {
    return `This message is rated ${riskScore}% risk with ${confidenceScore}% analysis confidence. Multiple fraud indicators were found — do not release goods until you confirm payment in your official app.`;
  }
  if (verdict === 'SUSPICIOUS') {
    return `This message is rated ${riskScore}% risk with ${confidenceScore}% analysis confidence. Some warning signs were detected — verify the payment manually before proceeding.`;
  }
  if (verdict === 'UNSUPPORTED') {
    return 'This document type could not be fully analyzed. Use the correct document type for accurate results.';
  }
  return `This message is rated ${riskScore}% risk with ${confidenceScore}% analysis confidence. No major fraud patterns were detected, but always confirm in your M-Pesa, MoMo, or banking app before releasing goods.`;
}
