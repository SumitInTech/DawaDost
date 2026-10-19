import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, MapPin, Clock, Info, Sparkles } from 'lucide-react';
import StockBadge from './StockBadge.jsx';
import ConfidenceBadge from './ConfidenceBadge.jsx';

function formatFreshness(isoString, isCached) {
  if (!isoString) return isCached ? 'Cached result' : 'Verified recently';
  try {
    const diffMins = Math.round((Date.now() - new Date(isoString).getTime()) / (1000 * 60));
    if (diffMins < 1) return 'Retrieved just now';
    if (diffMins < 60) return `Retrieved ${diffMins} min ago`;
    const diffHours = Math.round(diffMins / 60);
    return `Retrieved ${diffHours} hr ago`;
  } catch {
    return isCached ? 'Cached result' : 'Verified recently';
  }
}

export default function MedicineCard({ item = {}, referenceListing }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    source,
    product_name,
    brand,
    salts,
    strength,
    form,
    pack_size_units,
    price_inr,
    price_per_unit_inr,
    in_stock,
    distance_km,
    url,
    fetched_at,
    cached,
    is_reference_brand,
    match_confidence,
    savings_vs_ref_unit,
    flags = []
  } = item;

  const freshnessText = formatFreshness(fetched_at, cached);
  const unitLabel = form ? form.toLowerCase() : 'unit';
  const pharmacyInitial = source ? source.charAt(0).toUpperCase() : 'P';

  // Compute savings against reference listing if not explicitly provided
  const computedSavings = savings_vs_ref_unit !== undefined && savings_vs_ref_unit !== null
    ? savings_vs_ref_unit
    : (referenceListing?.price_per_unit_inr != null && price_per_unit_inr != null
        ? Math.max(0, +(referenceListing.price_per_unit_inr - price_per_unit_inr).toFixed(2))
        : 0);

  const hasSavings = computedSavings > 0;

  // Format salts string
  const saltsDisplay = Array.isArray(salts)
    ? salts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' + ')
    : (salts || 'Standard active formulation');

  // Format match confidence
  const confDisplay = typeof match_confidence === 'number'
    ? (match_confidence >= 0.8 ? 'High' : match_confidence >= 0.5 ? 'Review' : 'Low')
    : (match_confidence ? String(match_confidence).charAt(0).toUpperCase() + String(match_confidence).slice(1) : 'High');

  const cardId = item.id || `res-${source}-${product_name}-${price_inr}`;

  return (
    <article
      className={`medicine-card card ${is_reference_brand ? 'medicine-card-reference' : ''}`}
      aria-label={`Medicine listing for ${product_name} at ${source}`}
    >
      {/* CARD HEADER */}
      <div className="card-top-bar">
        <div className="card-pharmacy-identity">
          <div className="pharmacy-emblem" aria-hidden="true">
            {pharmacyInitial}
          </div>
          <div className="pharmacy-meta">
            <span className="pharmacy-name">{source}</span>
            {distance_km !== null && distance_km !== undefined && (
              <span className="pharmacy-distance" title="Distance from provided pincode">
                <MapPin size={11} aria-hidden="true" />
                <span>{distance_km} km away</span>
              </span>
            )}
          </div>
        </div>

        <div className="card-top-badges">
          <StockBadge inStock={in_stock} />
        </div>
      </div>

      {/* PRODUCT INFORMATION */}
      <div className="card-body">
        <div className="card-confidence-row">
          <ConfidenceBadge confidence={match_confidence} />
          {is_reference_brand && (
            <span className="badge badge-reference-tag">Reference Brand</span>
          )}
        </div>

        <h3 className="card-product-name" title={product_name}>
          {product_name}
        </h3>

        {brand && (
          <p className="card-brand-label">
            by <span>{brand}</span>
          </p>
        )}

        <div className="card-spec-chips">
          {strength && <span className="spec-chip">{strength}</span>}
          {form && <span className="spec-chip">{form}</span>}
          {pack_size_units && (
            <span className="spec-chip pack-chip">{pack_size_units} units/pack</span>
          )}
        </div>
      </div>

      {/* PRICE SECTION (Visual Priority) */}
      <div className="card-price-section">
        {/* Unit Price (Highest Emphasis) */}
        <div className="card-unit-price-row">
          <span className="price-metric-label">Unit Price:</span>
          <div className="unit-price-display">
            <span className="unit-currency">₹</span>
            <span className="unit-value">
              {price_per_unit_inr !== null && price_per_unit_inr !== undefined
                ? Number(price_per_unit_inr).toFixed(2)
                : '—'}
            </span>
            <span className="unit-denominator">/ {unitLabel}</span>
          </div>
        </div>

        {/* Full Pack Price */}
        <div className="card-pack-price-row">
          <span className="pack-price-text">
            Pack price: <strong>₹{price_inr !== null && price_inr !== undefined ? Number(price_inr).toFixed(2) : '—'}</strong>
          </span>
          {pack_size_units && (
            <span className="pack-quantity-note">({pack_size_units} {unitLabel}s)</span>
          )}
        </div>

        {/* SAVINGS BADGE */}
        {hasSavings && !is_reference_brand && (
          <div className="card-savings-pill">
            <Sparkles size={13} aria-hidden="true" />
            <span>
              ₹{Number(computedSavings).toFixed(2)} less / {unitLabel} than reference
            </span>
          </div>
        )}
      </div>

      {/* DATA FRESHNESS STRIP */}
      <div className="card-freshness-bar">
        <div className="freshness-indicator" title={cached ? 'Data served from cached query' : 'Freshly verified'}>
          <Clock size={12} aria-hidden="true" />
          <span>{freshnessText}</span>
          {cached && <span className="freshness-cache-tag">• Cached</span>}
        </div>
      </div>

      {/* CARD ACTIONS */}
      <div className="card-actions-row">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-pharmacy-link"
            title={`View listing directly on ${source}`}
          >
            <span>View at pharmacy</span>
            <ExternalLink size={14} className="action-icon" aria-hidden="true" />
          </a>
        ) : (
          <span className="pharmacy-link-disabled">Store direct only</span>
        )}

        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="btn btn-secondary btn-card-details"
          aria-expanded={detailsOpen}
          aria-controls={`details-${cardId}`}
        >
          <span>{detailsOpen ? 'Hide formulation details' : 'View details'}</span>
          {detailsOpen ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </button>
      </div>

      {/* SECTION G: CARD DETAILS EXPANSION */}
      {detailsOpen && (
        <div className="card-expanded-details" id={`details-${cardId}`}>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-term">Active Salt:</span>
              <span className="detail-val font-medium">{saltsDisplay}</span>
            </div>

            <div className="detail-item">
              <span className="detail-term">Form & Strength:</span>
              <span className="detail-val">{strength || '—'} {form || ''}</span>
            </div>

            <div className="detail-item">
              <span className="detail-term">Packaging Size:</span>
              <span className="detail-val">{pack_size_units ? `${pack_size_units} units per package` : 'Standard strip'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-term">Match Evaluation:</span>
              <span className="detail-val capitalize">{confDisplay} confidence bio-equivalence</span>
            </div>

            <div className="detail-item">
              <span className="detail-term">Source Registry:</span>
              <span className="detail-val">{source} ({cached ? 'Indexed cache' : 'Live query'})</span>
            </div>

            {fetched_at && (
              <div className="detail-item">
                <span className="detail-term">Timestamp:</span>
                <span className="detail-val">{new Date(fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>

          {flags && flags.length > 0 && (
            <div className="card-flags-list">
              <span className="flags-label">Clinical & Pharmacy Notes:</span>
              <ul>
                {flags.map((flag, idx) => (
                  <li key={idx}>
                    <Info size={12} className="flag-icon" aria-hidden="true" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
