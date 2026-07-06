import { useState } from 'react';
import { apiPost } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ScanIcon, AlertIcon, CheckIcon } from '../components/Icons';
import FraudExplanation from '../components/FraudExplanation';
import { verdictMeta } from '../utils/verdictMeta';
import './VerifyReceipt.css';
import '../components/OnboardingTutorial.css';

const SAMPLE_FAKE = `CONFIRMED! You received KSH 5,000 from 2547XX. Click here to verify: http://bit.ly/fake-mpesa`;

const SAMPLE_GENUINE = `ABC123XYZ Confirmed. Ksh1,500.00 received from JOHN DOE 254712345678 on 6/6/26 at 10:30 AM. New M-PESA balance is Ksh12,500.00.`;

const SAMPLE_BANK_GENUINE = `ABSA Bank Kenya
Account Statement — Account: XX6585
Statement Period: 01/05/2026 - 31/05/2026
Credit: KES 190.00 — Transfer from PRECIOUS ASEMEIT ODEKE
Reference: UDRAX2DAR3
Closing Balance: KES 12,450.00`;

const SAMPLE_BANK_FAKE = `URGENT! Your Absa account has been suspended due to suspicious activity.
Click here to verify immediately: http://bit.ly/fake-absa
Enter your PIN now to restore access.`;

const MOBILE_PROVIDERS = ['Auto-detect', 'M-Pesa', 'MTN MoMo', 'Airtel Money'];
const BANKS = ['Auto-detect', 'Absa Bank', 'KCB Bank', 'Equity Bank', 'Co-operative Bank', 'Stanbic Bank', 'NCBA Bank', 'DTB Bank'];

function RiskGauge({ score, verdict }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const stroke = score >= 60 ? 'var(--danger)' : score >= 30 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="risk-gauge">
      <svg viewBox="0 0 120 120" className="gauge-svg">
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="gauge-progress"
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-score">{score}%</span>
        <span className="gauge-label">Risk score</span>
      </div>
    </div>
  );
}

export default function VerifyReceipt() {
  const { showToast } = useToast();
  const [documentType, setDocumentType] = useState('auto');
  const [messageText, setMessageText] = useState('');
  const [provider, setProvider] = useState('Auto-detect');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isBank = documentType === 'bank';
  const providerOptions = isBank ? BANKS : MOBILE_PROVIDERS;

  function handleDocumentTypeChange(type) {
    setDocumentType(type);
    setProvider('Auto-detect');
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiPost('/api/fraud/verify', {
        messageText,
        documentType,
        provider: provider === 'Auto-detect' ? undefined : provider,
        amount: amount ? Number(amount) : undefined,
      });
      setResult(data);

      const meta = verdictMeta(data.verdict);
      showToast(meta.toastMessage, meta.toastType, meta.toastTitle);
    } catch {
      setError('Verification failed. Make sure the backend is running.');
      showToast('Could not analyze the receipt. Is the backend running?', 'danger', 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  const meta = result ? verdictMeta(result.verdict) : null;
  const ResultIcon = meta?.icon === 'alert' ? AlertIcon : CheckIcon;

  return (
    <div className="verify">
      <header className="page-header">
        <h1 className="page-title">Verify receipt</h1>
        <p className="page-subtitle">
          Paste a mobile money SMS (M-Pesa, MTN MoMo, Airtel Money) or a bank statement (Absa, KCB, Equity, and more).
        </p>
      </header>

      {result && meta && (
        <div className={`risk-alert ${meta.alertClass}`} role="alert">
          <div className="risk-alert-icon">
            <ResultIcon size={28} />
          </div>
          <div className="risk-alert-content">
            <strong>{meta.action}</strong>
            <p>{meta.message}</p>
            <span className="risk-alert-score">
              Risk: {result.riskScore}% · Confidence: {result.confidenceScore ?? '—'}%
            </span>
          </div>
        </div>
      )}

      <div className="grid-2 verify-grid">
        <form className="card verify-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Document type</label>
            <div className="doc-type-toggle">
              <button
                type="button"
                className={`doc-type-btn${documentType === 'auto' ? ' active' : ''}`}
                onClick={() => handleDocumentTypeChange('auto')}
              >
                Auto-detect
              </button>
              <button
                type="button"
                className={`doc-type-btn${documentType === 'mobile_money' ? ' active' : ''}`}
                onClick={() => handleDocumentTypeChange('mobile_money')}
              >
                Mobile money
              </button>
              <button
                type="button"
                className={`doc-type-btn${documentType === 'bank' ? ' active' : ''}`}
                onClick={() => handleDocumentTypeChange('bank')}
              >
                Bank statement
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="provider">{isBank ? 'Bank' : 'Mobile money provider'}</label>
              <select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                {providerOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="amount">Expected amount (optional)</label>
              <input
                id="amount"
                type="number"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="message">{isBank ? 'Bank statement text' : 'Payment SMS'}</label>
            <textarea
              id="message"
              required
              placeholder={
                isBank
                  ? 'Paste your bank statement or transaction alert text here...'
                  : 'Paste the full mobile money SMS here...'
              }
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>

          <div className="sample-row">
            <span className="muted">Try a sample:</span>
            {isBank ? (
              <>
                <button type="button" className="btn btn-ghost" onClick={() => setMessageText(SAMPLE_BANK_GENUINE)}>
                  Genuine
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setMessageText(SAMPLE_BANK_FAKE)}>
                  Fake
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-ghost" onClick={() => setMessageText(SAMPLE_GENUINE)}>
                  Genuine
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setMessageText(SAMPLE_FAKE)}>
                  Fake
                </button>
              </>
            )}
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
            <ScanIcon size={18} />
            {loading ? 'Analyzing...' : 'Analyze receipt'}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>

        <aside className="card result-panel">
          {!result && !loading && (
            <div className="result-empty">
              <div className="result-empty-icon">
                <ScanIcon size={32} />
              </div>
              <h2>Waiting for analysis</h2>
              <p className="muted">Submit a mobile money SMS or bank statement to see the fraud risk score.</p>
            </div>
          )}

          {loading && (
            <div className="result-loading">
              <div className="spinner" />
              <p>Analyzing...</p>
            </div>
          )}

          {result && meta && (
            <div className={`result-content ${meta.className}`}>
              <div className="score-dual">
                <div className="score-dual-item risk">
                  <span>Risk score</span>
                  <strong>{result.riskScore}%</strong>
                </div>
                <div className="score-dual-item confidence">
                  <span>Confidence score</span>
                  <strong>{result.confidenceScore ?? 0}%</strong>
                </div>
              </div>

              <RiskGauge score={result.riskScore} verdict={result.verdict} />

              <div className="verdict-banner">
                <ResultIcon size={20} />
                <div>
                  <strong>{meta.label}</strong>
                  <p>{meta.message}</p>
                </div>
              </div>

              {result.parsed && (
                <div className="parsed-grid">
                  <div className="parsed-item">
                    <span>Document type</span>
                    <strong>
                      {result.parsed.documentType === 'bank'
                        ? 'Bank statement'
                        : result.parsed.documentType === 'mobile_money'
                          ? 'Mobile money'
                          : 'Unknown'}
                    </strong>
                  </div>
                  <div className="parsed-item">
                    <span>{result.parsed.documentType === 'bank' ? 'Bank' : 'Provider'}</span>
                    <strong>{result.parsed.provider || 'Unknown'}</strong>
                  </div>
                  <div className="parsed-item">
                    <span>Amount detected</span>
                    <strong>{result.parsed.amount != null ? result.parsed.amount.toLocaleString() : 'Not found'}</strong>
                  </div>
                  <div className="parsed-item">
                    <span>{result.parsed.documentType === 'bank' ? 'Reference / Account' : 'Transaction ID'}</span>
                    <strong>{result.parsed.transactionId || result.parsed.account || 'Not found'}</strong>
                  </div>
                </div>
              )}

              {result.note && (
                <p className="result-note muted">{result.note}</p>
              )}

              <FraudExplanation result={result} />

              {result.flags?.length > 0 && (
                <div className="flags-section">
                  <h3>{result.flags.some((f) => f.startsWith('✓')) ? 'Analysis details' : 'Issues detected'}</h3>
                  <ul>
                    {result.flags.map((flag) => (
                      <li key={flag} className={flag.startsWith('✓') ? 'flag-ok' : ''}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
