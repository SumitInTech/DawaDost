import React from 'react';
import { Database, CheckCircle2, Clock, AlertTriangle, ShieldX } from 'lucide-react';

function formatTimestamp(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const diffMins = Math.round((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    return `${diffHours}h ago`;
  } catch {
    return '';
  }
}

export default function SourceStatus({ sources = [] }) {
  if (!sources || sources.length === 0) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ok':
        return (
          <span className="source-tag source-tag-ok">
            <CheckCircle2 size={12} aria-hidden="true" />
            <span>Live data retrieved</span>
          </span>
        );
      case 'cached':
        return (
          <span className="source-tag source-tag-cached">
            <Clock size={12} aria-hidden="true" />
            <span>Cached data</span>
          </span>
        );
      case 'failed':
        return (
          <span className="source-tag source-tag-failed">
            <AlertTriangle size={12} aria-hidden="true" />
            <span>Temporarily unavailable</span>
          </span>
        );
      case 'blocked':
        return (
          <span className="source-tag source-tag-blocked">
            <ShieldX size={12} aria-hidden="true" />
            <span>Source blocked</span>
          </span>
        );
      default:
        return (
          <span className="source-tag source-tag-cached">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="source-status-strip" aria-label="Pharmacy data source status">
      <div className="source-status-header">
        <Database size={15} className="source-icon" aria-hidden="true" />
        <span className="source-status-title">Pharmacy Sources Monitored:</span>
      </div>

      <div className="source-status-items">
        {sources.map((src) => {
          const time = formatTimestamp(src.fetched_at);
          return (
            <div key={src.name} className="source-pill-card">
              <span className="source-pill-name">{src.name}</span>
              {getStatusBadge(src.status)}
              {time && <span className="source-pill-time">{time}</span>}
              {src.results_count !== undefined && src.status !== 'failed' && (
                <span className="source-pill-count">({src.results_count})</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
