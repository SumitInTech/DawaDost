import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function ErrorState({ onRetry, errorMessage }) {
  return (
    <div className="error-state-card card" role="alert">
      <div className="error-icon-col">
        <AlertTriangle size={24} className="error-state-icon" aria-hidden="true" />
      </div>

      <div className="error-body">
        <h3 className="error-heading">We couldn't complete this search</h3>
        <p className="error-desc">
          Please try again. Some pharmacy sources may be temporarily unavailable or network connectivity may be limited.
        </p>

        {errorMessage && (
          <p className="error-detail-muted">
            Status note: {errorMessage}
          </p>
        )}

        <div className="error-actions">
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-primary btn-sm"
          >
            <RotateCw size={14} aria-hidden="true" />
            <span>Retry Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
