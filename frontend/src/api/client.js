/**
 * Dawa Dost Centralized API Client
 * Single source of truth for all API calls to the FastAPI backend.
 * Provides request timeout protection, response schema normalization,
 * and reliable fallback handling.
 */

import { generateMockResponse } from '../data/mockResults.js';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Health check endpoint.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Health check returned status ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'down', error: err.message };
  }
}

/**
 * Formats a list of salts or salt string for human-readable clinical display.
 */
function formatSalts(salts) {
  if (!salts) return 'Standard formulation';
  if (Array.isArray(salts)) {
    return salts
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' + ');
  }
  return String(salts);
}

/**
 * Maps a numeric confidence (0.0 to 1.0) or string to 'high' | 'review' | 'low'.
 */
export function normalizeConfidenceCategory(confidence) {
  if (typeof confidence === 'number') {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'review';
    return 'low';
  }
  if (typeof confidence === 'string') {
    const s = confidence.toLowerCase();
    if (s.includes('high')) return 'high';
    if (s.includes('review') || s.includes('med')) return 'review';
    return 'low';
  }
  return 'high';
}

/**
 * Normalizes backend SearchResponse into frontend UI friendly shape.
 */
function normalizeSearchResponse(data, cleanQuery, cleanPincode) {
  const referenceListing = data.reference_listing || null;
  const rawResults = Array.isArray(data.results) ? data.results : [];

  // Find lowest price equivalent
  const equivalentListings = rawResults.filter((r) => !r.is_reference_brand && r.price_per_unit_inr != null);
  const lowestEquiv = equivalentListings.length > 0 ? equivalentListings[0] : null;

  // Enrich listings with savings and normalized values
  const results = rawResults.map((item, index) => {
    let unitSavings = 0;
    if (referenceListing && referenceListing.price_per_unit_inr != null && item.price_per_unit_inr != null) {
      unitSavings = Math.max(0, +(referenceListing.price_per_unit_inr - item.price_per_unit_inr).toFixed(2));
    }

    return {
      id: item.id || `res-${item.source || 'ph'}-${index}`,
      ...item,
      salts: formatSalts(item.salts),
      match_confidence: normalizeConfidenceCategory(item.match_confidence),
      match_confidence_score: typeof item.match_confidence === 'number' ? item.match_confidence : 1.0,
      savings_vs_ref_unit: unitSavings,
      flags: Array.isArray(item.flags) ? item.flags : [],
    };
  });

  // Calculate comprehensive savings metrics
  const rawSavings = data.savings || {};
  const unitSavingsVal = rawSavings.vs_reference_inr_per_unit != null
    ? rawSavings.vs_reference_inr_per_unit
    : (referenceListing && lowestEquiv ? Math.max(0, +(referenceListing.price_per_unit_inr - lowestEquiv.price_per_unit_inr).toFixed(2)) : 0);

  const pctSavingsVal = rawSavings.vs_reference_percent != null
    ? rawSavings.vs_reference_percent
    : (referenceListing && referenceListing.price_per_unit_inr ? +((unitSavingsVal / referenceListing.price_per_unit_inr) * 100).toFixed(1) : 0);

  const refPackPrice = referenceListing ? referenceListing.price_inr : null;
  const refUnitPrice = referenceListing ? referenceListing.price_per_unit_inr : null;
  const lowestPackPrice = lowestEquiv ? lowestEquiv.price_inr : null;
  const lowestUnitPrice = lowestEquiv ? lowestEquiv.price_per_unit_inr : null;
  const packSavings = referenceListing && referenceListing.pack_size_units && unitSavingsVal > 0
    ? +(unitSavingsVal * referenceListing.pack_size_units).toFixed(2)
    : null;

  const savings = {
    vs_reference_inr_per_unit: unitSavingsVal,
    vs_reference_percent: pctSavingsVal,
    reference_brand_price_inr: refPackPrice,
    reference_unit_price_inr: refUnitPrice,
    lowest_pack_price_inr: lowestPackPrice,
    lowest_unit_price_inr: lowestUnitPrice,
    potential_unit_savings_inr: unitSavingsVal,
    percentage_unit_savings: pctSavingsVal,
    potential_pack_savings_inr: packSavings,
    pack_savings_note: referenceListing?.pack_size_units
      ? `Savings calculated for standard ${referenceListing.pack_size_units}-unit strip equivalent`
      : 'Unit-level comparison isolates true medicine price irrespective of varying strip packaging.',
  };

  // Normalize resolved
  const resolved = data.resolved ? {
    ...data.resolved,
    product_name: data.resolved.brand || data.resolved.product_name || cleanQuery,
    salts: formatSalts(data.resolved.salts),
    pack_size_units: referenceListing?.pack_size_units || 10,
  } : null;

  return {
    ...data,
    query: data.query || cleanQuery,
    pincode: data.pincode || cleanPincode,
    resolved,
    reference_listing: referenceListing ? {
      ...referenceListing,
      salts: formatSalts(referenceListing.salts),
      match_confidence: normalizeConfidenceCategory(referenceListing.match_confidence),
    } : null,
    results,
    savings,
    sources: Array.isArray(data.sources) ? data.sources : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    disclaimer: data.disclaimer || 'Prices are indicative. Confirm the medicine, strength and availability with your pharmacist or doctor before buying.',
  };
}

/**
 * Searches for comparable medicine listings across indexed pharmacies.
 * 
 * @param {Object} params
 * @param {string} params.query - Branded medicine name (required)
 * @param {string} params.pincode - 6-digit delivery pincode (required)
 * @param {boolean} [params.forceMock] - Force use of local mock dataset
 * @returns {Promise<Object>} Search response containing resolved medicine, listings, savings, sources
 */
export async function searchMedicine({ query, pincode = '', forceMock = false }) {
  if (!query || !query.trim()) {
    throw new Error('Medicine name query is required.');
  }

  const cleanQuery = query.trim();
  const cleanPincode = (pincode || '').trim();

  if (!cleanPincode) {
    throw new Error('Pincode is mandatory. Please provide a 6-digit pincode.');
  }

  if (!/^\d{6}$/.test(cleanPincode)) {
    throw new Error('Pincode must be exactly 6 digits (e.g. 110001).');
  }

  // If explicitly forced to mock mode
  if (forceMock) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const mockData = generateMockResponse(cleanQuery, cleanPincode);
    return {
      ...mockData,
      _dataSource: 'mock',
    };
  }

  // Attempt real API connection
  try {
    const controller = new AbortController();
    // 30 seconds timeout to accommodate concurrent TinyFish search/fetch
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: cleanQuery,
        pincode: cleanPincode,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody.detail || `Server responded with status ${response.status} (${response.statusText})`
      );
    }

    const rawData = await response.json();
    const normalized = normalizeSearchResponse(rawData, cleanQuery, cleanPincode);
    return {
      ...normalized,
      _dataSource: rawData._cached ? 'cached' : 'live',
    };
  } catch (error) {
    console.warn(
      `[Dawa Dost API] Live backend at ${API_BASE_URL} unreachable (${error.message}). Falling back to verified mock dataset.`
    );

    // Fallback to mock data for resilience
    await new Promise((resolve) => setTimeout(resolve, 250));
    const mockData = generateMockResponse(cleanQuery, cleanPincode);
    return {
      ...mockData,
      _dataSource: 'mock_fallback',
      _connectionError: error.message,
    };
  }
}
