import React from 'react';
import { ParticipantTotal } from '../utils/splitCalculator';

export type { ParticipantTotal };

interface SplitSummaryProps {
  participants: ParticipantTotal[];
}

export function SplitSummary({ participants }: SplitSummaryProps) {
  const grandTotal = participants.reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="split-summary">
      <div className="summary-header">
        <h2 className="summary-title">Summary</h2>
        <p className="summary-subtitle">Everyone's share</p>
      </div>
      <ul className="summary-list">
        {participants.map((participant, index) => (
          <li key={index} className="summary-item">
            <span className="summary-name">{participant.name}</span>
            <span className="summary-total">${participant.total.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="summary-grand-total">
        <span>Total</span>
        <span>${grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
