import { Link } from 'react-router-dom';

export default function AuthBackLink() {
  return (
    <Link to="/welcome" className="auth-back-link">
      ← Back to welcome screen
    </Link>
  );
}
