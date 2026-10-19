import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function SafetyBanner({ variant = 'amber', className = '' }) {
  const isTeal = variant === 'teal';

  return (
    <aside 
      className={`safety-banner safety-banner-${isTeal ? 'teal' : 'amber'} ${className}`}
      role="region"
      aria-label="Medical safety disclaimer"
    >
      <div className="safety-banner-icon-col">
        {isTeal ? (
          <ShieldAlert size={20} className="safety-icon" aria-hidden="true" />
        ) : (
          <AlertTriangle size={20} className="safety-icon" aria-hidden="true" />
        )}
      </div>
      <div className="safety-banner-content">
        <strong className="safety-banner-title">Important Medical & Pharmacological Safety Notice:</strong>
        <p className="safety-banner-text">
          Dawa Dost provides independent price comparisons, not medical advice. Confirm the medicine, active salt,
          strength, dosage form, and suitability with your pharmacist or doctor before considering an alternative. Never
          alter your prescribed medication or dosage without qualified medical guidance.
        </p>
      </div>
    </aside>
  );
}
