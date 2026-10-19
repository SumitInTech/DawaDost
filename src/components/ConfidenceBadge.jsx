import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

export default function ConfidenceBadge({ confidence }) {
  const norm = (confidence || 'high').toLowerCase();

  if (norm === 'high') {
    return (
      <span className="badge badge-conf-high" title="Confirmed match: identical active salt, strength, and dosage form">
        <ShieldCheck size={13} aria-hidden="true" />
        <span>High Confidence</span>
      </span>
    );
  }

  if (norm === 'review') {
    return (
      <span className="badge badge-conf-review" title="Minor variation in dosage form or salt ratio. Confirm with pharmacist.">
        <AlertCircle size={13} aria-hidden="true" />
        <span>Review Details</span>
      </span>
    );
  }

  return (
    <span className="badge badge-conf-low" title="Potential formulation divergence. Consult doctor before considering.">
      <AlertTriangle size={13} aria-hidden="true" />
      <span>Low Confidence</span>
    </span>
  );
}
