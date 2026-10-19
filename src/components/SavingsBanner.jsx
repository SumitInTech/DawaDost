import React from 'react';
import { AlertCircle, Sparkles, Scale } from 'lucide-react';

export default function SavingsBanner({ savings, referenceListing }) {
  // If baseline reference is completely missing
  if (!savings || !referenceListing || savings.reference_unit_price_inr === null || savings.reference_unit_price_inr === undefined) {
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

  const {
    reference_brand_price_inr,
    reference_unit_price_inr,
    lowest_pack_price_inr,
    lowest_unit_price_inr,
    potential_unit_savings_inr,
    percentage_unit_savings,
    potential_pack_savings_inr,
    pack_savings_note
  } = savings;

  const hasSavings = potential_unit_savings_inr !== null && potential_unit_savings_inr !== undefined && potential_unit_savings_inr > 0;

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
            {percentage_unit_savings && (
              <span className="savings-percentage-tag">
                {percentage_unit_savings}% Lower
              </span>
            )}
          </div>

          <div className="savings-figure-wrap">
            {hasSavings ? (
              <>
                <span className="savings-prefix">Save up to</span>
                <span className="savings-amount">₹{potential_unit_savings_inr.toFixed(2)}</span>
                <span className="savings-unit">per unit</span>
              </>
            ) : (
              <span className="savings-amount savings-amount-neutral">Prices Comparable</span>
            )}
          </div>

          <div className="savings-clarity-note">
            <Scale size={14} className="note-icon" aria-hidden="true" />
            <span>
              {pack_savings_note || 'Unit-level comparison isolates true medicine price irrespective of varying strip packaging.'}
            </span>
          </div>
        </div>

        {/* Right Side: Benchmark Price Metrics Grid */}
        <div className="savings-comparison-grid">
          {/* Reference Price */}
          <div className="savings-metric-box">
            <span className="metric-box-sub">Reference Brand Benchmark</span>
            <div className="metric-box-price">
              <span className="currency">₹</span>
              <span className="val">{reference_unit_price_inr.toFixed(2)}</span>
              <span className="per">/ unit</span>
            </div>
            {reference_brand_price_inr && (
              <span className="metric-box-pack">
                Pack: ₹{reference_brand_price_inr.toFixed(2)}
              </span>
            )}
          </div>

          {/* Lowest Equivalent Price */}
          <div className="savings-metric-box savings-metric-box-lowest">
            <span className="metric-box-sub">Lowest Equivalent Found</span>
            <div className="metric-box-price text-teal">
              <span className="currency">₹</span>
              <span className="val">
                {lowest_unit_price_inr !== undefined && lowest_unit_price_inr !== null
                  ? lowest_unit_price_inr.toFixed(2)
                  : '—'}
              </span>
              <span className="per">/ unit</span>
            </div>
            {lowest_pack_price_inr && (
              <span className="metric-box-pack">
                Pack: ₹{lowest_pack_price_inr.toFixed(2)}
              </span>
            )}
          </div>

          {/* Potential Pack Savings */}
          {potential_pack_savings_inr !== undefined && potential_pack_savings_inr !== null && (
            <div className="savings-metric-box savings-metric-box-pack">
              <span className="metric-box-sub">Potential Strip Savings</span>
              <div className="metric-box-price text-success">
                <span className="currency">₹</span>
                <span className="val">{potential_pack_savings_inr.toFixed(2)}</span>
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
