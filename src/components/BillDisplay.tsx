import React from 'react';
import { BillItem } from '../types';

interface BillDisplayProps {
  items: BillItem[];
  onSplit?: () => void;
}

export function BillDisplay({ items, onSplit }: BillDisplayProps) {
  if (items.length === 0) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="bill-display">
      <div className="bill-display-header">
        <h2 className="bill-display-title">Your Items</h2>
      </div>
      <ul className="bill-items">
        {items.map((item, index) => (
          <li key={index} className="bill-item">
            <span className="bill-item-name">{item.name}</span>
            <span className="bill-item-price">${item.price.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="bill-total">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
      {onSplit && (
        <button onClick={onSplit} className="btn btn-primary btn-full">
          Split Bill
        </button>
      )}
    </div>
  );
}
