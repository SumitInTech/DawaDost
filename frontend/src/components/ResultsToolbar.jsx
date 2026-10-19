import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import SortDropdown from './SortDropdown.jsx';

export default function ResultsToolbar({
  resultsCount = 0,
  totalCount = 0,
  onToggleFilters,
  isFilterOpen = false,
  activeFilterCount = 0,
  selectedSort,
  onSortChange,
  hasDistanceData = false
}) {
  return (
    <div className="results-toolbar card" aria-label="Results filter and sorting toolbar">
      {/* LEFT: Results Count & Filter Toggle */}
      <div className="toolbar-left">
        <div className="toolbar-count-badge">
          <span className="count-number">{resultsCount}</span>
          <span className="count-label">
            {resultsCount === 1 ? 'comparable listing' : 'comparable listings'}
          </span>
          {resultsCount !== totalCount && (
            <span className="count-total-hint"> (filtered from {totalCount})</span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleFilters}
          className={`btn btn-sm ${isFilterOpen ? 'btn-teal-light' : 'btn-secondary'} btn-filter-toggle`}
          aria-expanded={isFilterOpen}
          aria-label={isFilterOpen ? 'Hide filter options' : 'Show filter options'}
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-badge-counter">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* RIGHT: Sort Dropdown */}
      <div className="toolbar-right">
        <SortDropdown
          selectedSort={selectedSort}
          onSortChange={onSortChange}
          hasDistanceData={hasDistanceData}
        />
      </div>
    </div>
  );
}
