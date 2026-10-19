/**
 * Dawa Dost API Client
 * Connects to the FastAPI / Python backend endpoint: POST /api/search
 * Falls back gracefully to realistic mock data if the backend server is unreachable.
 */

import { generateMockResponse } from '../data/mockResults.js';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Searches for comparable medicine listings across indexed pharmacies.
 * 
 * @param {Object} params
 * @param {string} params.query - Branded medicine name (required)
 * @param {string} [params.pincode] - Optional 6-digit delivery pincode
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

  // If explicitly in mock mode
  if (forceMock) {
    // Artificial slight network delay for realistic UI feedback
    await new Promise((resolve) => setTimeout(resolve, 400));
    const mockData = generateMockResponse(cleanQuery, cleanPincode);
    return {
      ...mockData,
      _dataSource: 'mock'
    };
  }

  // Attempt real API connection
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query: cleanQuery,
        pincode: cleanPincode || undefined
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody.detail || `Server responded with status ${response.status} (${response.statusText})`
      );
    }

    const data = await response.json();
    return {
      ...data,
      _dataSource: 'live'
    };
  } catch (error) {
    console.warn(
      `[Dawa Dost API] Live backend at ${API_BASE_URL} unavailable or timed out: ${error.message}. Switching gracefully to verified mock dataset.`
    );

    // Fallback to mock data for seamless hackathon presentation & resilience
    await new Promise((resolve) => setTimeout(resolve, 350));
    const mockData = generateMockResponse(cleanQuery, cleanPincode);
    return {
      ...mockData,
      _dataSource: 'mock_fallback',
      _connectionError: error.message
    };
  }
}
