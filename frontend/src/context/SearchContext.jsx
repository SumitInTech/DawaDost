import React, { useState } from 'react';
import { SearchContext } from './SearchContext.js';
import { searchMedicine } from '../api/client.js';
import { generateMockResponse } from '../data/mockResults.js';

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('Augmentin 625 Duo');
  const [pincode, setPincode] = useState('110001');
  // Initialize synchronously with verified mock dataset for immediate first paint
  const [searchResponse, setSearchResponse] = useState(() =>
    generateMockResponse('Augmentin 625 Duo', '110001')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = async (searchQuery, searchPincode) => {
    if (!searchQuery || !searchQuery.trim()) {
      setError('Please enter a medicine name.');
      return false;
    }

    if (!searchPincode || !searchPincode.trim()) {
      setError('Pincode is mandatory. Please enter a 6-digit delivery pincode.');
      return false;
    }

    if (!/^\d{6}$/.test(searchPincode.trim())) {
      setError('Pincode must be exactly 6 digits (e.g. 110001).');
      return false;
    }

    const trimmedQuery = searchQuery.trim();
    const trimmedPincode = (searchPincode || '').trim();

    setLoading(true);
    setError(null);
    setQuery(trimmedQuery);
    setPincode(trimmedPincode);

    try {
      const response = await searchMedicine({
        query: trimmedQuery,
        pincode: trimmedPincode
      });
      setSearchResponse(response);
      return true;
    } catch (err) {
      setError(err.message || 'We could not complete this search.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        pincode,
        setPincode,
        searchResponse,
        setSearchResponse,
        loading,
        error,
        setError,
        clearError,
        performSearch
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}
