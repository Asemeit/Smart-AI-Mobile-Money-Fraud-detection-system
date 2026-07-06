import { ShieldIcon } from './Icons';
import './OnboardingTutorial.css';

export default function TrustBanner() {
  return (
    <div className="trust-banner" role="note">
      <div className="trust-banner-icon">
        <ShieldIcon size={22} />
      </div>
      <div>
        <strong>Your security matters</strong>
        <p>
          MoMo Shield uses encrypted login (JWT), stores your verification history securely,
          and never asks for your M-Pesa PIN or bank password. Always confirm payments in your
          official app before releasing goods.
        </p>
      </div>
    </div>
  );
}
