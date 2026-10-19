import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function ProcessStep({
  number,
  title,
  description,
  icon: Icon,
  isLast = false
}) {
  return (
    <div className="process-step-item">
      <div className="process-step-card card">
        <div className="step-top-row">
          <div className="step-number-badge">
            <span>{number}</span>
          </div>
          {Icon && (
            <div className="step-icon-wrap">
              <Icon size={20} className="step-icon" aria-hidden="true" />
            </div>
          )}
        </div>
        <h3 className="step-title">{title}</h3>
        <p className="step-desc">{description}</p>
      </div>
      {!isLast && (
        <div className="process-step-connector" aria-hidden="true">
          <ArrowRight size={18} />
        </div>
      )}
    </div>
  );
}
