import React from 'react';
import { SearchX, ArrowRight } from 'lucide-react';

export default function EmptyState({
  onFocusSearch,
  query = '',
  isFilterEmpty = false,
  onResetFilters
}) {
  return (
    <div className="empty-state-card card" role="status">
      <div className="empty-state-icon-wrap">
        <SearchX size={36} className="empty-state-icon" aria-hidden="true" />
      </div>

      <h3 className="empty-state-heading">
        {isFilterEmpty ? 'No listings match the selected filters' : 'No comparable listings found'}
      </h3>

      <p className="empty-state-desc">
        {isFilterEmpty
          ? 'Try adjusting or clearing your active filters (such as stock, price range, or pharmacy sources) to view available results.'
          : query
          ? `We couldn't locate validated pharmaceutical bioequivalents for "${query}" across supported pharmacies. Try another medicine search or review the spelling.`
          : 'Try another medicine search or review the available product details.'}
      </p>

      <div className="empty-state-actions">
        {isFilterEmpty && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="btn btn-outline"
          >
            Clear Active Filters
          </button>
        )}

        <button
          type="button"
          onClick={onFocusSearch}
          className="btn btn-primary"
        >
          <span>Search another medicine</span>
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="empty-state-tips">
        <span className="tips-title">Search suggestions:</span>
        <ul>
          <li>Try popular branded medications such as <em>Augmentin 625 Duo</em>, <em>Dolo 650</em>, or <em>Pan 40</em>.</li>
          <li>Search by the active chemical salt (e.g. <em>Amoxicillin</em>, <em>Paracetamol</em>, <em>Pantoprazole</em>).</li>
          <li>Ensure dosage strength (e.g. 500mg, 650mg) is included in the query.</li>
        </ul>
      </div>
    </div>
  );
}
