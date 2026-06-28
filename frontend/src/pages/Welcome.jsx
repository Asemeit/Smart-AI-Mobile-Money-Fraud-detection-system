import { Link } from 'react-router-dom';
import { ShieldIcon, ScanIcon, ChatIcon, CheckIcon } from '../components/Icons';
import './Welcome.css';

const features = [
  { icon: ScanIcon, label: 'Verify SMS & banks', desc: 'M-Pesa, MoMo, Absa, KCB & more' },
  { icon: ShieldIcon, label: 'Fraud detection', desc: 'AI-powered risk scoring' },
  { icon: ChatIcon, label: 'Financial advisor', desc: 'Smart money guidance' },
];

const providers = ['M-Pesa', 'MTN MoMo', 'Airtel Money', 'Absa · KCB'];

function RiskScoreCard() {
  const score = 8;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="welcome-float-card">
      <div className="risk-ring-wrap">
        <svg viewBox="0 0 64 64" className="risk-ring-svg">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="var(--success)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
            className="risk-ring-progress"
          />
        </svg>
        <strong>{score}%</strong>
      </div>
      <span className="float-label">Risk score</span>
      <span className="float-sub">
        <CheckIcon size={14} />
        Safe to verify
      </span>
    </div>
  );
}

export default function Welcome() {
  return (
    <div className="welcome-page">
      <div className="welcome-blob welcome-blob-a" aria-hidden />
      <div className="welcome-blob welcome-blob-b" aria-hidden />
      <div className="welcome-pattern" aria-hidden />

      <header className="welcome-header">
        <div className="welcome-logo">
          <div className="brand-mark">
            <ShieldIcon size={22} />
          </div>
          <div>
            <strong>MoMo Shield</strong>
            <span>Fraud Detection</span>
          </div>
        </div>
        <Link to="/login" className="welcome-signin">Sign in</Link>
      </header>

      <main className="welcome-body">
        <section className="welcome-copy">
          <span className="welcome-badge">Built for East African traders</span>

          <h1>
            Verify every payment
            <span className="welcome-highlight"> before you release goods</span>
          </h1>

          <p className="welcome-desc">
            Paste a mobile money SMS or bank alert — MoMo Shield instantly flags fake
            confirmations, suspicious links, and amount mismatches.
          </p>

          <div className="welcome-providers">
            {providers.map((name) => (
              <span key={name} className="provider-chip">{name}</span>
            ))}
          </div>

          <div className="welcome-actions">
            <Link to="/login" className="btn btn-primary welcome-cta">
              Get started
              <span aria-hidden>→</span>
            </Link>
            <Link to="/login" className="welcome-secondary">Already have an account?</Link>
          </div>
        </section>

        <section className="welcome-visual" aria-hidden>
          <div className="phone-mock">
            <div className="phone-notch" />
            <div className="phone-screen">
              <p className="sms-label">Incoming SMS</p>
              <div className="sms-bubble sms-bubble-fake">
                <p>CONFIRMED! KSH 5,000 received. Click to verify...</p>
                <span className="sms-flag">Suspicious link detected</span>
              </div>
              <div className="sms-bubble sms-bubble-safe">
                <p>ABC123 Confirmed. Ksh1,500 received from JOHN DOE</p>
                <span className="sms-ok">✓ Likely genuine</span>
              </div>
            </div>
          </div>

          <RiskScoreCard />
        </section>
      </main>

      <footer className="welcome-features">
        {features.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="welcome-feature">
            <div className="welcome-feature-icon">
              <Icon size={20} />
            </div>
            <div>
              <strong>{label}</strong>
              <span>{desc}</span>
            </div>
          </div>
        ))}
      </footer>
    </div>
  );
}
