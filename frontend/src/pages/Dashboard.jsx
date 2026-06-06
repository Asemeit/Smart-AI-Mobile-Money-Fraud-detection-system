import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../api/client';
import { CheckIcon, AlertIcon, WalletIcon, ScanIcon } from '../components/Icons';
import './Dashboard.css';

function statusBadge(status) {
  if (status === 'verified') return 'badge badge-success';
  if (status === 'flagged') return 'badge badge-danger';
  return 'badge badge-warning';
}

function formatAmount(amount, provider) {
  const currency = provider?.includes('M-Pesa') ? 'KES' : 'UGX';
  return `${currency} ${amount.toLocaleString()}`;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/transactions')
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => setError('Unable to load transactions. Make sure the backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  const flagged = transactions.filter((t) => t.status === 'flagged').length;
  const verified = transactions.filter((t) => t.status === 'verified').length;
  const total = transactions.length;

  return (
    <div className="dashboard">
      <section className="hero">
        <div className="hero-content">
          <p className="hero-tag">Mobile Money Protection</p>
          <h1>Verify every payment before you release goods</h1>
          <p className="hero-desc">
            Scan SMS receipts from M-Pesa, MTN MoMo, and Airtel Money. Catch fake confirmations and suspicious patterns instantly.
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
              Payment verified
            </div>
            <p className="preview-amount">KES 1,500</p>
            <p className="preview-meta">M-Pesa · Risk score 8%</p>
          </div>
        </div>
      </section>

      <section className="stats-row">
        <div className="stat-card">
          <div className="stat-icon verified">
            <CheckIcon />
          </div>
          <div>
            <span className="stat-label">Verified</span>
            <strong className="stat-value">{verified}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon flagged">
            <AlertIcon />
          </div>
          <div>
            <span className="stat-label">Flagged</span>
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
            <h2>Recent transactions</h2>
            <p className="muted">Latest payment verifications</p>
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

        {!loading && !error && transactions.length === 0 && (
          <div className="empty-state">
            <WalletIcon size={40} />
            <p>No transactions yet</p>
            <Link to="/verify" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Verify your first receipt
            </Link>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Provider</th>
                  <th>Amount</th>
                  <th>Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="txn-id">{txn.id}</td>
                    <td>{txn.provider}</td>
                    <td className="txn-amount">{formatAmount(txn.amount, txn.provider)}</td>
                    <td>
                      <div className="risk-bar-wrap">
                        <div className="risk-bar">
                          <div
                            className="risk-fill"
                            style={{
                              width: `${txn.riskScore}%`,
                              background: txn.riskScore >= 60 ? 'var(--danger)' : txn.riskScore >= 30 ? 'var(--warning)' : 'var(--success)',
                            }}
                          />
                        </div>
                        <span>{txn.riskScore}%</span>
                      </div>
                    </td>
                    <td><span className={statusBadge(txn.status)}>{txn.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
