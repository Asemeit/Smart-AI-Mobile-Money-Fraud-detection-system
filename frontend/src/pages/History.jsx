import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../api/client';
import { ScanIcon, AlertIcon } from '../components/Icons';
import './History.css';

function verdictBadge(verdict) {
  if (verdict === 'HIGH_RISK') return 'badge badge-danger';
  if (verdict === 'SUSPICIOUS') return 'badge badge-warning';
  return 'badge badge-success';
}

export default function History() {
  const [checks, setChecks] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/fraud/history')
      .then((data) => {
        setChecks(data.checks || []);
        setSource(data.source || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="history">
      <header className="page-header">
        <h1 className="page-title">Verification history</h1>
        <p className="page-subtitle">
          Your past fraud checks {source && `(stored in ${source === 'mongodb' ? 'MongoDB Atlas' : 'local files'})`}
        </p>
      </header>

      <section className="card">
        {loading && <p className="muted">Loading history...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && checks.length === 0 && (
          <div className="empty-state">
            <ScanIcon size={40} />
            <p>No verifications yet</p>
            <Link to="/verify" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Verify a receipt
            </Link>
          </div>
        )}

        {!loading && !error && checks.length > 0 && (
          <div className="history-list">
            {checks.map((check) => (
              <article key={check.id} className="history-item">
                <div className="history-item-top">
                  <span className={verdictBadge(check.verdict)}>{check.verdict?.replace('_', ' ') || 'Unknown'}</span>
                  <span className="muted">{new Date(check.createdAt).toLocaleString()}</span>
                </div>
                <p className="history-message">{check.messageText.slice(0, 120)}{check.messageText.length > 120 ? '…' : ''}</p>
                <div className="history-meta">
                  <span>Risk: {check.riskScore}%</span>
                  {check.provider && <span>{check.provider}</span>}
                  {check.amount != null && <span>Amount: {check.amount}</span>}
                </div>
                {check.flags?.length > 0 && (
                  <ul className="history-flags">
                    {check.flags.map((flag) => (
                      <li key={flag}><AlertIcon size={14} /> {flag}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
