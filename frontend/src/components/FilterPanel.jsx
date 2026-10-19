import React from 'react';
import { X, RotateCcw, SlidersHorizontal, MapPin, Building2, Shield, CircleDollarSign } from 'lucide-react';

export default function FilterPanel({
  filters,
  availableSources = [],
  hasDistanceData = false,
  onFilterChange,
  onResetFilters,
  resultsCount = 0,
  isOpen = true,
  onClose
}) {
  const handleStockChange = (key) => {
    onFilterChange({
      ...filters,
      stock: {
        ...filters.stock,
        [key]: !filters.stock[key]
      }
    });
  };

  const handleSourceToggle = (sourceName) => {
    const current = filters.sources || [];
    const next = current.includes(sourceName)
      ? current.filter((s) => s !== sourceName)
      : [...current, sourceName];

    onFilterChange({
      ...filters,
      sources: next
    });
  };

  const handleConfidenceChange = (key) => {
    onFilterChange({
      ...filters,
      confidence: {
        ...filters.confidence,
        [key]: !filters.confidence[key]
      }
    });
  };

  const handlePriceChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const handleDistanceChange = (value) => {
    onFilterChange({
      ...filters,
      maxDistance: value
    });
  };

  // Count active filters
  let activeFilterCount = 0;
  if (!filters.stock.inStock || !filters.stock.outOfStock || !filters.stock.stockUnknown) activeFilterCount++;
  if (filters.minPrice !== '' || filters.maxPrice !== '') activeFilterCount++;
  if (filters.sources.length > 0) activeFilterCount += filters.sources.length;
  if (!filters.confidence.high || !filters.confidence.review || !filters.confidence.low) activeFilterCount++;
  if (filters.maxDistance) activeFilterCount++;

  return (
    <aside
      className={`filter-panel-card card ${isOpen ? 'filter-panel-open' : 'filter-panel-closed'}`}
      aria-label="Medicine search filters"
    >
      {/* Panel Header */}
      <div className="filter-panel-header">
        <div className="filter-header-title-row">
          <SlidersHorizontal size={18} className="filter-header-icon" aria-hidden="true" />
          <h3 className="filter-header-title">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="filter-active-pill">{activeFilterCount} active</span>
          )}
        </div>

        <div className="filter-header-actions">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="btn btn-sm btn-outline btn-reset-filters"
              title="Reset all filters to default"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              className="filter-close-btn"
              onClick={onClose}
              aria-label="Close filters drawer"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Results Matching Indicator */}
      <div className="filter-count-strip">
        <span>Matching Listings: </span>
        <strong>{resultsCount}</strong>
      </div>

      <div className="filter-groups-list">
        {/* FILTER 1: Stock Status */}
        <fieldset className="filter-group">
          <legend className="filter-legend">
            <span>Availability / Stock</span>
          </legend>
          <div className="filter-checkbox-list">
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filters.stock.inStock}
                onChange={() => handleStockChange('inStock')}
              />
              <span className="custom-check-text">In stock</span>
            </label>

            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filters.stock.outOfStock}
                onChange={() => handleStockChange('outOfStock')}
              />
              <span className="custom-check-text">Out of stock</span>
            </label>

            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filters.stock.stockUnknown}
                onChange={() => handleStockChange('stockUnknown')}
              />
              <span className="custom-check-text">Stock unknown</span>
            </label>
          </div>
        </fieldset>

        {/* FILTER 2: Price Per Unit */}
        <fieldset className="filter-group">
          <legend className="filter-legend">
            <CircleDollarSign size={14} aria-hidden="true" />
            <span>Unit Price (₹ / unit)</span>
          </legend>
          <div className="filter-price-inputs">
            <div className="filter-price-field">
              <span className="price-prefix">₹</span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Min"
                className="filter-price-input"
                value={filters.minPrice}
                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                aria-label="Minimum price per unit in rupees"
              />
            </div>
            <span className="price-separator">to</span>
            <div className="filter-price-field">
              <span className="price-prefix">₹</span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Max"
                className="filter-price-input"
                value={filters.maxPrice}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                aria-label="Maximum price per unit in rupees"
              />
            </div>
          </div>
        </fieldset>

        {/* FILTER 3: Pharmacy Source */}
        {availableSources.length > 0 && (
          <fieldset className="filter-group">
            <legend className="filter-legend">
              <Building2 size={14} aria-hidden="true" />
              <span>Pharmacy Source</span>
            </legend>
            <div className="filter-checkbox-list">
              {availableSources.map((source) => {
                const isSelected = (filters.sources || []).includes(source);
                return (
                  <label key={source} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSourceToggle(source)}
                    />
                    <span className="custom-check-text">{source}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* FILTER 4: Match Confidence */}
        <fieldset className="filter-group">
          <legend className="filter-legend">
            <Shield size={14} aria-hidden="true" />
            <span>Equivalence Confidence</span>
          </legend>
          <div className="filter-checkbox-list">
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filters.confidence.high}
                onChange={() => handleConfidenceChange('high')}
              />
              <span className="custom-check-text">High confidence</span>
            </label>

            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filters.confidence.review}
                onChange={() => handleConfidenceChange('review')}
              />
              <span className="custom-check-text">Review details</span>
            </label>

            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filters.confidence.low}
                onChange={() => handleConfidenceChange('low')}
              />
              <span className="custom-check-text">Low confidence</span>
            </label>
          </div>
        </fieldset>

        {/* FILTER 5: Distance */}
        <fieldset className="filter-group">
          <legend className="filter-legend">
            <MapPin size={14} aria-hidden="true" />
            <span>Store Distance</span>
          </legend>
          {hasDistanceData ? (
            <div className="filter-distance-body">
              <div className="filter-distance-slider-wrap">
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={filters.maxDistance || 20}
                  onChange={(e) => handleDistanceChange(e.target.value)}
                  className="filter-range-input"
                  id="distance-range"
                />
                <div className="distance-readout">
                  <span>Within {filters.maxDistance || '20'} km</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="filter-disabled-notice">
              Distance filtering requires verified pharmacy geolocation or a delivery pincode with available distance data.
            </p>
          )}
        </fieldset>
      </div>

      {/* Drawer Action on Mobile */}
      {onClose && (
        <div className="filter-drawer-footer">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onClose}
          >
            Apply Filters ({resultsCount})
          </button>
        </div>
      )}
    </aside>
  );
}
