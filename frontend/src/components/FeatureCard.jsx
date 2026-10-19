import React from 'react';

export default function FeatureCard({ icon: Icon, title, description, stepNumber }) {
  return (
    <div className="feature-card card">
      <div className="feature-card-header">
        <div className="feature-icon-bubble">
          {Icon && <Icon size={22} className="feature-icon" aria-hidden="true" />}
        </div>
        {stepNumber && <span className="feature-step-tag">Step {stepNumber}</span>}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
}
