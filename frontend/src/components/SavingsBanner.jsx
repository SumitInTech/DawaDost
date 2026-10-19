import React from 'react';
import { AlertCircle, Sparkles, Scale } from 'lucide-react';

export default function SavingsBanner({ savings = {}, referenceListing }) {
  const refUnitPrice = savings?.reference_unit_price_inr ?? referenceListing?.price_per_unit_inr ?? null;
  const refPackPrice = savings?.reference_brand_price_inr ?? referenceListing?.price_inr ?? null;
  const unitSavings = savings?.potential_unit_savings_inr ?? savings?.vs_reference_inr_per_unit ?? 0;
  const pctSavings = savings?.percentage_unit_savings ?? savings?.vs_reference_percent ?? 0;
  const lowestUnitPrice = savings?.lowest_unit_price_inr ?? null;
  const lowestPackPrice = savings?.lowest_pack_price_inr ?? null;
  const packSavings = savings?.potential_pack_savings_inr ?? null;
  const packSavingsNote = savings?.pack_savings_note || 'Unit-level comparison isolates true medicine price irrespective of varying strip packaging.';

  // If baseline reference is completely missing
  if (refUnitPrice === null || refUnitPrice === undefined) {
    return (
      <div className="savings-banner savings-banner-unavailable">
        <div className="savings-unavailable-inner">
          <AlertCircle size={20} className="text-secondary" aria-hidden="true" />
          <div>
            <strong className="savings-unavailable-title">Reference price unavailable</strong>
            <p className="savings-unavailable-desc">
              A standard reference brand benchmark could not be established for this query. Listing unit prices are shown individually below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasSavings = unitSavings > 0;

  return (
    <section className="savings-banner card" aria-label="Potential Price Savings Summary">
      <div className="savings-banner-inner">
        {/* Left Side: Prominent Unit Savings Callout */}
        <div className="savings-highlight-col">
          <div className="savings-eyebrow-row">
            <span className="savings-badge-pill">
              <Sparkles size={13} aria-hidden="true" />
              <span>Unit Price Advantage</span>
            </span>
            {pctSavings > 0 && (
              <span className="savings-percentage-tag">
                {pctSavings}% Lower
              </span>
            )}
          </div>

          <div className="savings-figure-wrap">
            {hasSavings ? (
              <>
                <span className="savings-prefix">Save up to</span>
                <span className="savings-amount">₹{Number(unitSavings).toFixed(2)}</span>
                <span className="savings-unit">per unit</span>
              </>
            ) : (
              <span className="savings-amount savings-amount-neutral">Prices Comparable</span>
            )}
          </div>

          <div className="savings-clarity-note">
            <Scale size={14} className="note-icon" aria-hidden="true" />
            <span>{packSavingsNote}</span>
          </div>
        </div>

        {/* Right Side: Benchmark Price Metrics Grid */}
        <div className="savings-comparison-grid">
          {/* Reference Price */}
          <div className="savings-metric-box">
            <span className="metric-box-sub">Reference Brand Benchmark</span>
            <div className="metric-box-price">
              <span className="currency">₹</span>
              <span className="val">{Number(refUnitPrice).toFixed(2)}</span>
              <span className="per">/ unit</span>
            </div>
            {refPackPrice && (
              <span className="metric-box-pack">
                Pack: ₹{Number(refPackPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Lowest Equivalent Price */}
          <div className="savings-metric-box savings-metric-box-lowest">
            <span className="metric-box-sub">Lowest Equivalent Found</span>
            <div className="metric-box-price text-teal">
              <span className="currency">₹</span>
              <span className="val">
                {lowestUnitPrice !== undefined && lowestUnitPrice !== null
                  ? Number(lowestUnitPrice).toFixed(2)
                  : '—'}
              </span>
              <span className="per">/ unit</span>
            </div>
            {lowestPackPrice && (
              <span className="metric-box-pack">
                Pack: ₹{Number(lowestPackPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Potential Pack Savings */}
          {packSavings !== undefined && packSavings !== null && (
            <div className="savings-metric-box savings-metric-box-pack">
              <span className="metric-box-sub">Potential Strip Savings</span>
              <div className="metric-box-price text-success">
                <span className="currency">₹</span>
                <span className="val">{Number(packSavings).toFixed(2)}</span>
              </div>
              <span className="metric-box-pack">
                Normalized like-for-like quantity
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
