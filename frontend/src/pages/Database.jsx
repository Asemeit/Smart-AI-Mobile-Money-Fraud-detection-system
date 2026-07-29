import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';
import { WalletIcon, CheckIcon, AlertIcon } from '../components/Icons';
import './Database.css';

export default function Database() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/database/stats')
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="database-page">
      <header className="page-header">
        <h1 className="page-title">Database management</h1>
        <p className="page-subtitle">
          MongoDB Atlas collections and storage overview for MoMo Shield
        </p>
      </header>

      {loading && <p className="muted">Loading database stats...</p>}
      {error && <p className="error-text">{error}</p>}

      {stats && (
        <>
          <section className={`db-status card ${stats.connected ? 'online' : 'offline'}`}>
            <div className="db-status-dot" />
            <div>
              <strong>{stats.connected ? 'MongoDB Atlas connected' : 'File fallback mode'}</strong>
              <p className="muted">
                {stats.connected
                  ? `Database: ${stats.database} · Host: ${stats.host}`
                  : stats.message}
              </p>
            </div>
          </section>

          <section className="stats-row db-stats">
            <div className="stat-card">
              <div className="stat-icon total"><WalletIcon /></div>
              <div>
                <span className="stat-label">Users</span>
                <strong className="stat-value">{stats.collections.users}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon verified"><CheckIcon /></div>
              <div>
                <span className="stat-label">Transactions</span>
                <strong className="stat-value">{stats.collections.transactions}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon flagged"><AlertIcon /></div>
              <div>
                <span className="stat-label">Fraud checks</span>
                <strong className="stat-value">{stats.collections.fraudChecks}</strong>
              </div>
            </div>
          </section>

          {stats.insights && (
            <section className="card db-insights">
              <h2>Insights</h2>
              <div className="insight-grid">
                <div className="insight-item">
                  <span>Verified transactions</span>
                  <strong>{stats.insights.verifiedTransactions}</strong>
                </div>
                <div className="insight-item">
                  <span>Flagged transactions</span>
                  <strong>{stats.insights.flaggedTransactions}</strong>
                </div>
                <div className="insight-item">
                  <span>High-risk checks</span>
                  <strong>{stats.insights.highRiskChecks}</strong>
                </div>
              </div>
            </section>
          )}

          <section className="card db-collections">
            <h2>Collections</h2>
            <table>
              <thead>
                <tr>
                  <th>Collection</th>
                  <th>Documents</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>users</code></td>
                  <td>{stats.collections.users}</td>
                  <td>Registered accounts (JWT auth)</td>
                </tr>
                <tr>
                  <td><code>transactions</code></td>
                  <td>{stats.collections.transactions}</td>
                  <td>Payment verification records</td>
                </tr>
                <tr>
                  <td><code>fraudchecks</code></td>
                  <td>{stats.collections.fraudChecks}</td>
                  <td>SMS/receipt fraud analysis history</td>
                </tr>
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
