import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CheckIcon, AlertIcon, WalletIcon, ScanIcon } from '../components/Icons';
import TrustBanner from '../components/TrustBanner';
import './Dashboard.css';

function verdictToStatus(verdict) {
  if (verdict === 'HIGH_RISK') return 'flagged';
  if (verdict === 'SUSPICIOUS') return 'pending';
  if (verdict === 'LIKELY_GENUINE') return 'verified';
  return 'pending';
}

function statusBadge(status) {
  if (status === 'verified') return 'badge badge-success';
  if (status === 'flagged') return 'badge badge-danger';
  return 'badge badge-warning';
}

function formatAmount(amount, provider) {
  if (amount == null) return '—';
  const p = (provider || '').toLowerCase();
  const currency = p.includes('ugx') || p.includes('uganda') ? 'UGX' : 'KES';
  return `${currency} ${Number(amount).toLocaleString()}`;
}

function formatProvider(check) {
  const name = check.provider || 'Unknown';
  if (check.documentType === 'bank') return `${name} · Bank`;
  if (check.documentType === 'mobile_money') return name;
  return name;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/fraud/history')
      .then((data) => setChecks(data.checks || []))
      .catch(() => setError('Unable to load verifications. Make sure the backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  const verified = checks.filter((c) => c.verdict === 'LIKELY_GENUINE').length;
  const flagged = checks.filter((c) => c.verdict === 'HIGH_RISK').length;
  const total = checks.length;
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="dashboard">
      <section className="welcome-strip card">
        <div className="welcome-text">
          <h2>{greeting()}, {firstName} 👋</h2>
          <p>
            {total > 0
              ? `You have ${total} verification${total === 1 ? '' : 's'} saved. Keep checking every payment before you release goods.`
              : 'Welcome to MoMo Shield. Verify your first payment receipt to get started.'}
          </p>
        </div>
        <Link to="/verify" className="btn btn-primary welcome-cta">
          <ScanIcon size={18} />
          Verify now
        </Link>
      </section>

      <TrustBanner />

      <section className="hero">
        <div className="hero-content">
          <p className="hero-tag">Mobile Money Protection</p>
          <h1>Verify every payment before you release goods</h1>
          <p className="hero-desc">
            Scan SMS receipts from M-Pesa, MTN MoMo, Airtel Money, and bank statements. Catch fake confirmations instantly.
          </p>
          <div className="hero-actions">
            <Link to="/verify" className="btn btn-primary">
              <ScanIcon size={18} />
              Verify a receipt
            </Link>
            <Link to="/advisor" className="btn btn-secondary">Financial advisor</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-preview">
            <div className="preview-header">
              <span className="preview-dot green" />
              {total > 0 ? 'Latest check' : 'Payment verified'}
            </div>
            <p className="preview-amount">
              {total > 0 && checks[0].amount != null
                ? formatAmount(checks[0].amount, checks[0].provider)
                : 'KES 1,500'}
            </p>
            <p className="preview-meta">
              {total > 0
                ? `${formatProvider(checks[0])} · Risk ${checks[0].riskScore}%`
                : 'M-Pesa · Risk score 8%'}
            </p>
          </div>
        </div>
      </section>

      <section className="stats-row">
        <div className="stat-card">
          <div className="stat-icon verified">
            <CheckIcon />
          </div>
          <div>
            <span className="stat-label">Likely genuine</span>
            <strong className="stat-value">{verified}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon flagged">
            <AlertIcon />
          </div>
          <div>
            <span className="stat-label">High risk</span>
            <strong className="stat-value flagged">{flagged}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <WalletIcon />
          </div>
          <div>
            <span className="stat-label">Total checked</span>
            <strong className="stat-value">{total}</strong>
          </div>
        </div>
      </section>

      <section className="card transactions-card">
        <div className="section-header">
          <div>
            <h2>Recent verifications</h2>
            <p className="muted">Your latest fraud checks — updates after every analysis</p>
          </div>
          <Link to="/verify" className="btn btn-ghost">+ New verification</Link>
        </div>

        {loading && (
          <div className="loading-rows">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        {!loading && !error && checks.length === 0 && (
          <div className="empty-state">
            <WalletIcon size={40} />
            <p>No verifications yet</p>
            <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              Run a check on Verify — results appear here automatically.
            </p>
            <Link to="/verify" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Verify your first receipt
            </Link>
          </div>
        )}

        {!loading && !error && checks.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Check ID</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Risk</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check) => {
                  const status = verdictToStatus(check.verdict);
                  return (
                    <tr key={check.id}>
                      <td className="txn-id">{check.id}</td>
                      <td>{formatProvider(check)}</td>
                      <td className="txn-amount">{formatAmount(check.amount, check.provider)}</td>
                      <td>
                        <div className="risk-bar-wrap">
                          <div className="risk-bar">
                            <div
                              className="risk-fill"
                              style={{
                                width: `${check.riskScore}%`,
                                background: check.riskScore >= 60 ? 'var(--danger)' : check.riskScore >= 30 ? 'var(--warning)' : 'var(--success)',
                              }}
                            />
                          </div>
                        <span>{check.riskScore}%</span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--primary-dark)' }}>
                        {check.confidenceScore ?? '—'}%
                      </strong>
                    </td>
                    <td><span className={statusBadge(status)}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
