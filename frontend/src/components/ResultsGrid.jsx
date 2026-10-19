import React from 'react';
import MedicineCard from './MedicineCard.jsx';

export default function ResultsGrid({ results = [], referenceListing }) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="results-grid" role="feed" aria-label="Comparable medicine listings grid">
      {results.map((item) => (
        <MedicineCard
          key={item.id || `${item.source}-${item.product_name}-${item.price_inr}`}
          item={item}
          referenceListing={referenceListing}
        />
      ))}
    </div>
  );
}
