import { explainFlag, buildFraudSummary } from '../utils/flagExplanations';
import './OnboardingTutorial.css';

export default function FraudExplanation({ result }) {
  if (!result) return null;

  const explanations = (result.flags || []).map((flag) => ({
    flag,
    ...explainFlag(flag),
  }));

  const negatives = explanations.filter((e) => !e.positive);
  const positives = explanations.filter((e) => e.positive);

  return (
    <div className="fraud-explain-panel">
      <h3>Why was this marked this way?</h3>
      <p className="fraud-explain-summary">
        {buildFraudSummary(result.verdict, result.riskScore, result.confidenceScore ?? 0)}
      </p>

      {negatives.length > 0 && (
        <ul className="fraud-explain-list">
          {negatives.map((item) => (
            <li key={item.flag} className="fraud-explain-item negative">
              <strong>{item.title}</strong>
              <p>{item.explain}</p>
            </li>
          ))}
        </ul>
      )}

      {positives.length > 0 && (
        <ul className="fraud-explain-list" style={{ marginTop: negatives.length ? '0.65rem' : 0 }}>
          {positives.map((item) => (
            <li key={item.flag} className="fraud-explain-item positive">
              <strong>{item.title}</strong>
              <p>{item.explain}</p>
            </li>
          ))}
        </ul>
      )}

      {explanations.length === 0 && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          No specific patterns were detected. Try pasting the full message for a detailed analysis.
        </p>
      )}
    </div>
  );
}
