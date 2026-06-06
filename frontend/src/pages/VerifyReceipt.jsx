import { useState } from 'react';
import { apiPost } from '../api/client';
import { ScanIcon, AlertIcon, CheckIcon } from '../components/Icons';
import './VerifyReceipt.css';

const SAMPLE_FAKE = `CONFIRMED! You received KSH 5,000 from 2547XX. Click here to verify: http://bit.ly/fake-mpesa`;

const SAMPLE_GENUINE = `ABC123XYZ Confirmed. Ksh1,500.00 received from JOHN DOE 254712345678 on 6/6/26 at 10:30 AM. New M-PESA balance is Ksh12,500.00.`;

function verdictMeta(verdict) {
  if (verdict === 'HIGH_RISK') {
    return { className: 'result-high', label: 'High risk', icon: AlertIcon, message: 'Do not release goods. This receipt shows signs of fraud.' };
  }
  if (verdict === 'SUSPICIOUS') {
    return { className: 'result-warn', label: 'Suspicious', icon: AlertIcon, message: 'Proceed with caution. Confirm payment in your official app.' };
  }
  return { className: 'result-ok', label: 'Likely genuine', icon: CheckIcon, message: 'No major red flags found. Still confirm in your mobile money app.' };
}

function RiskGauge({ score, verdict }) {
  const meta = verdictMeta(verdict);
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
  const [messageText, setMessageText] = useState('');
  const [provider, setProvider] = useState('M-Pesa');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiPost('/api/fraud/verify', {
        messageText,
        provider,
        amount: amount ? Number(amount) : undefined,
      });
      setResult(data);
    } catch {
      setError('Verification failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  const meta = result ? verdictMeta(result.verdict) : null;
  const ResultIcon = meta?.icon;

  return (
    <div className="verify">
      <header className="page-header">
        <h1 className="page-title">Verify receipt</h1>
        <p className="page-subtitle">
          Paste the SMS or payment confirmation. We analyze format, amounts, and suspicious patterns.
        </p>
      </header>

      <div className="grid-2 verify-grid">
        <form className="card verify-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="provider">Mobile money provider</label>
              <select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option>M-Pesa</option>
                <option>MTN MoMo</option>
                <option>Airtel Money</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="amount">Expected amount</label>
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
            <label htmlFor="message">Payment message</label>
            <textarea
              id="message"
              required
              placeholder="Paste the full SMS or receipt text here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>

          <div className="sample-row">
            <span className="muted">Try a sample:</span>
            <button type="button" className="btn btn-ghost" onClick={() => setMessageText(SAMPLE_GENUINE)}>
              Genuine
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setMessageText(SAMPLE_FAKE)}>
              Fake
            </button>
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
              <p className="muted">Submit a payment message to see the fraud risk score and detailed flags.</p>
            </div>
          )}

          {loading && (
            <div className="result-loading">
              <div className="spinner" />
              <p>Analyzing receipt...</p>
            </div>
          )}

          {result && meta && (
            <div className={`result-content ${meta.className}`}>
              <RiskGauge score={result.riskScore} verdict={result.verdict} />

              <div className="verdict-banner">
                {ResultIcon && <ResultIcon size={20} />}
                <div>
                  <strong>{meta.label}</strong>
                  <p>{meta.message}</p>
                </div>
              </div>

              {result.parsed && (
                <div className="parsed-grid">
                  <div className="parsed-item">
                    <span>Transaction ID</span>
                    <strong>{result.parsed.transactionId || 'Not found'}</strong>
                  </div>
                  <div className="parsed-item">
                    <span>Amount detected</span>
                    <strong>{result.parsed.amount != null ? result.parsed.amount.toLocaleString() : 'Not found'}</strong>
                  </div>
                  <div className="parsed-item">
                    <span>Provider</span>
                    <strong>{result.parsed.provider || 'Unknown'}</strong>
                  </div>
                </div>
              )}

              {result.flags?.length > 0 && (
                <div className="flags-section">
                  <h3>Issues detected</h3>
                  <ul>
                    {result.flags.map((flag) => (
                      <li key={flag}>{flag}</li>
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
