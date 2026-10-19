import React from 'react';
import { Scale, Check } from 'lucide-react';

export default function PriceExampleCard() {
  return (
    <div className="price-example-section">
      <div className="price-example-cards-grid">
        {/* Pack A */}
        <div className="price-example-card card example-card-a">
          <div className="example-badge">
            <span>Listing A (Appears "Cheaper")</span>
          </div>
          <h4 className="example-title">Pack A</h4>
          <p className="example-spec">10 tablets per pack</p>
          <div className="example-pack-price">
            <span className="label">Pack Price:</span>
            <span className="val">₹80</span>
          </div>
          <div className="example-unit-price">
            <span className="unit-label">True Unit Cost:</span>
            <span className="unit-val">₹8.00 <small>/ tablet</small></span>
          </div>
          <div className="example-verdict verdict-higher">
            <span>25% higher cost per tablet</span>
          </div>
        </div>

        {/* Pack B */}
        <div className="price-example-card card example-card-b">
          <div className="example-badge example-badge-highlight">
            <Check size={12} aria-hidden="true" />
            <span>Listing B (Better Value)</span>
          </div>
          <h4 className="example-title">Pack B</h4>
          <p className="example-spec">20 tablets per pack</p>
          <div className="example-pack-price">
            <span className="label">Pack Price:</span>
            <span className="val">₹120</span>
          </div>
          <div className="example-unit-price text-teal">
            <span className="unit-label">True Unit Cost:</span>
            <span className="unit-val">₹6.00 <small>/ tablet</small></span>
          </div>
          <div className="example-verdict verdict-lower">
            <span>Save ₹2.00 per tablet consumed</span>
          </div>
        </div>
      </div>

      <div className="price-example-explanation card">
        <Scale size={20} className="explanation-icon" aria-hidden="true" />
        <div className="explanation-text">
          <strong>Why Pack Prices Mislead Consumers:</strong>
          <p>
            A patient seeing Listing A thinks they are spending less because ₹80 is less than ₹120. But in reality, they are
            paying <strong>₹8.00 per tablet</strong> instead of <strong>₹6.00 per tablet</strong>. Dawa Dost calculates
            standardized unit prices so you always see genuine cost parity across different pack sizes.
          </p>
        </div>
      </div>
    </div>
  );
}
