import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldIcon, ScanIcon, CheckIcon, AlertIcon } from './Icons';
import './OnboardingTutorial.css';

const STORAGE_KEY = 'momo_tutorial_complete';

const STEPS = [
  {
    icon: ShieldIcon,
    title: 'Welcome to MoMo Shield',
    body: 'MoMo Shield helps you verify mobile money SMS and bank alerts before you release goods to a buyer. Your account is protected with secure login.',
    points: ['JWT-secured authentication', 'Verification history saved to your account', 'Works with M-Pesa, MTN MoMo, Airtel & banks'],
  },
  {
    icon: ScanIcon,
    title: 'What to do first',
    body: 'Start by verifying a payment message. This is the most important step before handing over any product.',
    points: [
      '1. Go to Verify Receipt in the sidebar',
      '2. Choose Mobile money or Bank statement',
      '3. Paste the full SMS or alert text',
      '4. Click Analyze receipt',
    ],
    cta: { to: '/verify', label: 'Go to Verify Receipt' },
  },
  {
    icon: AlertIcon,
    title: 'Understanding your scores',
    body: 'Each analysis gives you two scores — they work together to help you decide.',
    points: [
      'Risk score (0–100%) — how dangerous the message looks. Lower is safer.',
      'Confidence score (0–100%) — how sure the system is based on data it could read (amount, ref, provider).',
      'Red = high risk · Orange = suspicious · Green = likely genuine',
    ],
  },
  {
    icon: CheckIcon,
    title: 'Why we flag fraud',
    body: 'MoMo Shield explains every flag so you understand the decision — not just the score.',
    points: [
      'Suspicious links, fake "CONFIRMED!" formats, and PIN requests are common scams',
      'Amount and provider mismatches are checked automatically',
      'Always confirm payment in your official M-Pesa or bank app before releasing goods',
    ],
  },
];

export function isTutorialComplete(userId) {
  return localStorage.getItem(`${STORAGE_KEY}_${userId}`) === 'true';
}

export function resetTutorial(userId) {
  localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
}

export default function OnboardingTutorial({ userId, onComplete }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(() => !isTutorialComplete(userId));

  if (!visible || !userId) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  function finish() {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, 'true');
    setVisible(false);
    onComplete?.();
  }

  function handleNext() {
    if (isLast) finish();
    else setStep((s) => s + 1);
  }

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="tutorial-modal card">
        <div className="tutorial-progress">
          {STEPS.map((_, i) => (
            <span key={i} className={`tutorial-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} />
          ))}
        </div>

        <div className="tutorial-icon-wrap">
          <Icon size={28} />
        </div>

        <h2 id="tutorial-title">{current.title}</h2>
        <p className="tutorial-body">{current.body}</p>

        <ul className="tutorial-points">
          {current.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        {current.cta && (
          <Link to={current.cta.to} className="tutorial-link" onClick={finish}>
            {current.cta.label} →
          </Link>
        )}

        <div className="tutorial-actions">
          <button type="button" className="btn btn-ghost" onClick={finish}>
            Skip tutorial
          </button>
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>

        <p className="tutorial-step-label">Step {step + 1} of {STEPS.length}</p>
      </div>
    </div>
  );
}
