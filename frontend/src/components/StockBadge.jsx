import React from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export default function StockBadge({ inStock }) {
  if (inStock === true) {
    return (
      <span className="badge badge-stock-in" title="Verified in stock at pharmacy">
        <CheckCircle2 size={13} aria-hidden="true" />
        <span>In Stock</span>
      </span>
    );
  }

  if (inStock === false) {
    return (
      <span className="badge badge-stock-out" title="Currently out of stock">
        <XCircle size={13} aria-hidden="true" />
        <span>Out of Stock</span>
      </span>
    );
  }

  return (
    <span className="badge badge-stock-unknown" title="Stock availability unverified">
      <HelpCircle size={13} aria-hidden="true" />
      <span>Stock Unknown</span>
    </span>
  );
}
