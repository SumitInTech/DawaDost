import React from 'react';
import { Pill, Activity, Layers, Package, Info } from 'lucide-react';

export default function MedicineSummary({ resolved, query, isMock = false }) {
  if (!resolved) {
    return (
      <div className="medicine-summary-card card">
        <div className="summary-header">
          <div className="summary-badge-row">
            <span className="summary-query-label">Searched Medicine:</span>
            <span className="summary-query-val">{query || 'Unspecified'}</span>
          </div>
          {isMock && (
            <span className="badge-illustrative">
              <Info size={12} aria-hidden="true" />
              <span>Illustrative Example</span>
            </span>
          )}
        </div>
        <p className="summary-not-resolved">
          Waiting for active salt verification from pharmacy registries...
        </p>
      </div>
    );
  }

  const saltsDisplay = Array.isArray(resolved.salts)
    ? resolved.salts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' + ')
    : (resolved.salts || '—');

  return (
    <div className="medicine-summary-card card" aria-label="Searched medicine clinical summary">
      <div className="summary-card-inner">
        {/* Left: Product & Brand Details */}
        <div className="summary-primary-col">
          <div className="summary-badge-row">
            <span className="summary-eyebrow">Searched Target Formulation</span>
            {isMock && (
              <span className="badge-illustrative" title="Synthetic clinical reference dataset">
                <Info size={12} aria-hidden="true" />
                <span>Illustrative Reference</span>
              </span>
            )}
          </div>
          <h2 className="summary-title">{resolved.product_name || query}</h2>
          {resolved.brand && (
            <p className="summary-brand">
              Reference Brand: <strong>{resolved.brand}</strong>
            </p>
          )}
        </div>

        {/* Right: Technical Formulation Metrics */}
        <div className="summary-metrics-grid">
          <div className="summary-metric-item">
            <div className="metric-label">
              <Activity size={14} className="metric-icon" aria-hidden="true" />
              <span>Active Salt</span>
            </div>
            <div className="metric-value font-medium" title={saltsDisplay}>
              {saltsDisplay}
            </div>
          </div>

          <div className="summary-metric-item">
            <div className="metric-label">
              <Pill size={14} className="metric-icon" aria-hidden="true" />
              <span>Strength</span>
            </div>
            <div className="metric-value">{resolved.strength || '—'}</div>
          </div>

          <div className="summary-metric-item">
            <div className="metric-label">
              <Layers size={14} className="metric-icon" aria-hidden="true" />
              <span>Dosage Form</span>
            </div>
            <div className="metric-value">{resolved.form || 'Tablet'}</div>
          </div>

          {resolved.pack_size_units && (
            <div className="summary-metric-item">
              <div className="metric-label">
                <Package size={14} className="metric-icon" aria-hidden="true" />
                <span>Standard Strip</span>
              </div>
              <div className="metric-value">{resolved.pack_size_units} units</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
