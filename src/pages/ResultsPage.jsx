import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Database,
  Info
} from 'lucide-react';
import { useSearch } from '../context/useSearch.js';
import SearchBar from '../components/SearchBar.jsx';
import MedicineSummary from '../components/MedicineSummary.jsx';
import SavingsBanner from '../components/SavingsBanner.jsx';
import ResultsToolbar from '../components/ResultsToolbar.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import ResultsGrid from '../components/ResultsGrid.jsx';
import SourceStatus from '../components/SourceStatus.jsx';
import SafetyBanner from '../components/SafetyBanner.jsx';
import LoadingState from '../components/LoadingState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';

const DEFAULT_FILTERS = {
  stock: {
    inStock: true,
    outOfStock: true,
    stockUnknown: true
  },
  minPrice: '',
  maxPrice: '',
  sources: [],
  confidence: {
    high: true,
    review: true,
    low: true
  },
  maxDistance: ''
};

export default function ResultsPage() {
  const {
    query,
    pincode,
    searchResponse,
    loading,
    error,
    performSearch,
    clearError
  } = useSearch();

  // Local UI states
  const [selectedSort, setSelectedSort] = useState('unit_price_asc');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Check if response contains valid distance data
  const hasDistanceData = useMemo(() => {
    if (!searchResponse || !searchResponse.results) return false;
    return searchResponse.results.some(
      (r) => r.distance_km !== null && r.distance_km !== undefined && !isNaN(r.distance_km)
    );
  }, [searchResponse]);

  // Extract unique pharmacy sources present in current response
  const availableSources = useMemo(() => {
    if (!searchResponse || !searchResponse.results) return [];
    const sourceSet = new Set();
    searchResponse.results.forEach((r) => {
      if (r.source) sourceSet.add(r.source);
    });
    return Array.from(sourceSet);
  }, [searchResponse]);

  // Handle new search from Results page search bar
  const handleResultsSearch = async (newQuery, newPincode) => {
    // Reset filters on brand new medicine search
    setFilters(DEFAULT_FILTERS);
    await performSearch(newQuery, newPincode);
  };

  const handleRetrySearch = () => {
    clearError();
    performSearch(query, pincode);
  };

  const handleFocusSearchInput = () => {
    const inputEl = document.getElementById('results-page-search-input');
    if (inputEl) {
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputEl.focus();
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Processing order:
  // 1. Start with results returned by backend
  // 2. Apply selected filters
  // 3. Apply selected sorting
  // 4. Render grid
  const filteredAndSortedResults = useMemo(() => {
    if (!searchResponse || !Array.isArray(searchResponse.results)) {
      return [];
    }

    // Step 1: Clone array to prevent direct mutation
    let list = [...searchResponse.results];

    // Step 2: Apply Filters
    list = list.filter((item) => {
      // Stock Status Filter
      if (item.in_stock === true && !filters.stock.inStock) return false;
      if (item.in_stock === false && !filters.stock.outOfStock) return false;
      if (
        (item.in_stock === null || item.in_stock === undefined) &&
        !filters.stock.stockUnknown
      ) {
        return false;
      }

      // Unit Price Min Filter
      if (filters.minPrice !== '') {
        const min = Number(filters.minPrice);
        if (item.price_per_unit_inr === null || item.price_per_unit_inr === undefined || item.price_per_unit_inr < min) {
          return false;
        }
      }

      // Unit Price Max Filter
      if (filters.maxPrice !== '') {
        const max = Number(filters.maxPrice);
        if (item.price_per_unit_inr === null || item.price_per_unit_inr === undefined || item.price_per_unit_inr > max) {
          return false;
        }
      }

      // Pharmacy Source Filter
      if (filters.sources.length > 0) {
        if (!filters.sources.includes(item.source)) {
          return false;
        }
      }

      // Match Confidence Filter
      const conf = (item.match_confidence || 'high').toLowerCase();
      if (conf === 'high' && !filters.confidence.high) return false;
      if (conf === 'review' && !filters.confidence.review) return false;
      if (conf === 'low' && !filters.confidence.low) return false;

      // Distance Filter
      if (filters.maxDistance && hasDistanceData) {
        const maxDist = Number(filters.maxDistance);
        if (item.distance_km === null || item.distance_km === undefined || item.distance_km > maxDist) {
          return false;
        }
      }

      return true;
    });

    // Step 3: Apply Sorting
    list.sort((a, b) => {
      // Missing numeric values always sorted to end
      const isMissing = (v) => v === null || v === undefined || isNaN(v);

      if (selectedSort === 'unit_price_asc') {
        if (isMissing(a.price_per_unit_inr)) return 1;
        if (isMissing(b.price_per_unit_inr)) return -1;
        return a.price_per_unit_inr - b.price_per_unit_inr;
      }

      if (selectedSort === 'unit_price_desc') {
        if (isMissing(a.price_per_unit_inr)) return 1;
        if (isMissing(b.price_per_unit_inr)) return -1;
        return b.price_per_unit_inr - a.price_per_unit_inr;
      }

      if (selectedSort === 'pack_price_asc') {
        if (isMissing(a.price_inr)) return 1;
        if (isMissing(b.price_inr)) return -1;
        return a.price_inr - b.price_inr;
      }

      if (selectedSort === 'pack_price_desc') {
        if (isMissing(a.price_inr)) return 1;
        if (isMissing(b.price_inr)) return -1;
        return b.price_inr - a.price_inr;
      }

      if (selectedSort === 'distance_asc' && hasDistanceData) {
        if (isMissing(a.distance_km)) return 1;
        if (isMissing(b.distance_km)) return -1;
        return a.distance_km - b.distance_km;
      }

      return 0;
    });

    return list;
  }, [searchResponse, filters, selectedSort, hasDistanceData]);

  // Active filter count calculation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (!filters.stock.inStock || !filters.stock.outOfStock || !filters.stock.stockUnknown) count++;
    if (filters.minPrice !== '' || filters.maxPrice !== '') count++;
    if (filters.sources.length > 0) count += filters.sources.length;
    if (!filters.confidence.high || !filters.confidence.review || !filters.confidence.low) count++;
    if (filters.maxDistance) count++;
    return count;
  }, [filters]);

  const totalResultsCount = searchResponse?.results?.length || 0;
  const isMock = searchResponse?._dataSource !== 'live';

  return (
    <div className="results-page-container">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <ChevronRight size={14} className="breadcrumb-separator" aria-hidden="true" />
          <span className="breadcrumb-current" aria-current="page">Search Results</span>
        </nav>

        {/* SECTION A: PAGE HEADER */}
        <div className="results-header-block">
          <div className="header-titles">
            <span className="eyebrow">EQUIVALENT MEDICINE COMPARISON</span>
            <h1 className="results-page-heading">Compare medicine prices</h1>
            <p className="results-page-subtitle">
              Explore comparable medicine listings and understand price differences across available pharmacy sources.
            </p>
          </div>

          {/* Backend Connection Indicator Badge */}
          <div className="backend-mode-pill" title={isMock ? 'Mock clinical dataset active' : 'Connected to FastAPI backend'}>
            <Database size={13} aria-hidden="true" />
            <span>{isMock ? 'Demo Mode (Verified Dataset)' : 'Live Backend Connected'}</span>
          </div>
        </div>

        {/* SECTION B: RESULTS PAGE SEARCH BAR */}
        <div className="results-search-bar-wrap card">
          <SearchBar
            initialQuery={query}
            initialPincode={pincode}
            onSearch={handleResultsSearch}
            loading={loading}
            variant="compact"
            buttonText="Search"
            inputId="results-page-search-input"
          />
        </div>

        {/* SECTION K: PERSISTENT SAFETY BANNER */}
        <div className="results-safety-banner-wrap">
          <SafetyBanner variant="amber" />
        </div>

        {/* ERROR STATE: Preserves previous results if any, but shows clear banner */}
        {error && (
          <div className="results-error-wrap">
            <ErrorState onRetry={handleRetrySearch} errorMessage={error} />
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="results-loading-wrap">
            <LoadingState message={`Searching comparable listings for "${query}" across pharmacies...`} />
          </div>
        )}

        {/* MAIN RESULTS CONTENT (Rendered when not loading or while showing previous) */}
        {!loading && searchResponse && (
          <div className="results-main-layout">
            {/* SEARCHED MEDICINE SUMMARY */}
            <div className="results-summary-section">
              <MedicineSummary
                resolved={searchResponse.resolved}
                query={searchResponse.query || query}
                isMock={isMock}
              />
            </div>

            {/* SAVINGS SUMMARY */}
            <div className="results-savings-section">
              <SavingsBanner
                savings={searchResponse.savings}
                referenceListing={searchResponse.reference_listing}
              />
            </div>

            {/* PHARMACY SOURCES STATUS STRIP */}
            <div className="results-sources-status-section">
              <SourceStatus sources={searchResponse.sources} />
            </div>

            {/* RETURNED WARNINGS FROM BACKEND */}
            {searchResponse.warnings && searchResponse.warnings.length > 0 && (
              <div className="backend-warnings-box" role="note">
                <Info size={16} className="text-secondary" aria-hidden="true" />
                <div className="warnings-text-list">
                  {searchResponse.warnings.map((w, idx) => (
                    <span key={idx} className="warning-item">{w}</span>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION D: FILTER AND SORT TOOLBAR */}
            <div className="results-toolbar-section">
              <ResultsToolbar
                resultsCount={filteredAndSortedResults.length}
                totalCount={totalResultsCount}
                onToggleFilters={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                isFilterOpen={isFilterDrawerOpen}
                activeFilterCount={activeFilterCount}
                selectedSort={selectedSort}
                onSortChange={setSelectedSort}
                hasDistanceData={hasDistanceData}
              />
            </div>

            {/* RESULTS BODY: SIDEBAR FILTERS (DESKTOP) + RESULTS GRID */}
            <div className="results-content-split">
              {/* DESKTOP FILTER SIDEBAR */}
              <div className={`results-filter-column ${isFilterDrawerOpen ? 'filter-visible-mobile' : ''}`}>
                <FilterPanel
                  filters={filters}
                  availableSources={availableSources}
                  hasDistanceData={hasDistanceData}
                  onFilterChange={setFilters}
                  onResetFilters={handleResetFilters}
                  resultsCount={filteredAndSortedResults.length}
                  isOpen={true}
                  onClose={() => setIsFilterDrawerOpen(false)}
                />
              </div>

              {/* RESULTS GRID / EMPTY STATES */}
              <div className="results-grid-column">
                {totalResultsCount === 0 ? (
                  <EmptyState
                    onFocusSearch={handleFocusSearchInput}
                    query={query}
                    isFilterEmpty={false}
                  />
                ) : filteredAndSortedResults.length === 0 ? (
                  <EmptyState
                    onFocusSearch={handleFocusSearchInput}
                    query={query}
                    isFilterEmpty={true}
                    onResetFilters={handleResetFilters}
                  />
                ) : (
                  <ResultsGrid
                    results={filteredAndSortedResults}
                    referenceListing={searchResponse.reference_listing}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
