import React, { useState } from 'react';
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';

export default function SearchBar({
  initialQuery = '',
  initialPincode = '',
  onSearch,
  loading = false,
  variant = 'hero',
  buttonText = 'Compare Prices',
  inputId = 'medicine-search-input'
}) {
  const [query, setQuery] = useState(initialQuery);
  const [pincode, setPincode] = useState(initialPincode);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [prevInitialPincode, setPrevInitialPincode] = useState(initialPincode);
  const [validationError, setValidationError] = useState('');

  // Synchronize internal inputs when initial props change
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  if (initialPincode !== prevInitialPincode) {
    setPrevInitialPincode(initialPincode);
    setPincode(initialPincode);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const trimmedQuery = query.trim();
    const trimmedPincode = pincode.trim();

    if (!trimmedQuery) {
      setValidationError('Please enter a branded medicine name (e.g., Augmentin, Dolo 650, Pan 40).');
      const inputEl = document.getElementById(inputId);
      if (inputEl) inputEl.focus();
      return;
    }

    if (!trimmedPincode) {
      setValidationError('Pincode is mandatory. Please enter a 6-digit delivery pincode.');
      const pincodeEl = document.getElementById(`${inputId}-pincode`);
      if (pincodeEl) pincodeEl.focus();
      return;
    }

    if (!/^\d{6}$/.test(trimmedPincode)) {
      setValidationError('Pincode must be exactly 6 digits (e.g., 110001).');
      const pincodeEl = document.getElementById(`${inputId}-pincode`);
      if (pincodeEl) pincodeEl.focus();
      return;
    }

    if (onSearch) {
      onSearch(trimmedQuery, trimmedPincode);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div className={`search-bar-wrapper search-bar-${variant}`}>
      <form onSubmit={handleSubmit} className="search-bar-form" noValidate>
        {/* Field 1: Medicine Name (Widest field) */}
        <div className="search-field search-field-query">
          <label htmlFor={inputId} className="search-label">
            Medicine name <span className="label-required" title="Mandatory field">*</span>
          </label>
          <div className="search-input-inner">
            <Search size={18} className="search-icon-adornment" aria-hidden="true" />
            <input
              id={inputId}
              type="text"
              className="search-input"
              placeholder="Enter a branded medicine name (e.g. Augmentin 625)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (validationError) setValidationError('');
              }}
              disabled={loading}
              autoComplete="off"
              aria-required="true"
              aria-invalid={!!validationError}
            />
          </div>
        </div>

        {/* Field 2: Pincode (Mandatory 6-digit) */}
        <div className="search-field search-field-pincode">
          <label htmlFor={`${inputId}-pincode`} className="search-label">
            Pincode <span className="label-required" title="Mandatory field">*</span>
          </label>
          <div className="search-input-inner">
            <MapPin size={18} className="search-icon-adornment" aria-hidden="true" />
            <input
              id={`${inputId}-pincode`}
              type="text"
              maxLength={6}
              className="search-input"
              placeholder="6-digit pincode"
              value={pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); // Numbers only
                setPincode(val);
                if (validationError) setValidationError('');
              }}
              disabled={loading}
              autoComplete="postal-code"
              required
              aria-required="true"
            />
          </div>
        </div>

        {/* Search / Submit Button */}
        <div className="search-field-button">
          <button
            type="submit"
            className={`btn btn-primary ${isHero ? 'btn-lg' : ''} search-submit-btn`}
            disabled={loading}
            aria-label={loading ? 'Searching medicine prices' : buttonText}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin-icon" aria-hidden="true" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={18} aria-hidden="true" />
                <span>{buttonText}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Validation Error Message */}
      {validationError && (
        <div className="search-validation-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
