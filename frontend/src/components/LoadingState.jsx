import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Comparing pharmacy listings & calculating unit prices...' }) {
  return (
    <div className="loading-state-wrapper" role="status" aria-live="polite">
      <div className="loading-state-header">
        <Loader2 size={24} className="spin-icon text-teal" aria-hidden="true" />
        <p className="loading-message">{message}</p>
      </div>

      {/* Grid Skeleton Cards */}
      <div className="skeleton-grid">
        {[1, 2, 3].map((n) => (
          <div key={n} className="skeleton-card card">
            <div className="skeleton-line skeleton-header"></div>
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-subtitle"></div>
            <div className="skeleton-line skeleton-price-box"></div>
            <div className="skeleton-line skeleton-button"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
