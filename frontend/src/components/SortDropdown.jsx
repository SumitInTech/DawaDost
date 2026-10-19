import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { SORT_OPTIONS } from '../constants/sortOptions.js';

export default function SortDropdown({
  selectedSort,
  onSortChange,
  hasDistanceData = false
}) {
  return (
    <div className="sort-dropdown-wrapper">
      <label htmlFor="results-sort-select" className="sort-label">
        <ArrowUpDown size={15} className="sort-icon" aria-hidden="true" />
        <span>Sort by:</span>
      </label>

      <div className="sort-select-container">
        <select
          id="results-sort-select"
          className="sort-select"
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => {
            const isDistance = opt.value === 'distance_asc';
            const disabled = isDistance && !hasDistanceData;

            return (
              <option
                key={opt.value}
                value={opt.value}
                disabled={disabled}
              >
                {opt.label} {disabled ? '— (Distance unavailable)' : ''}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
