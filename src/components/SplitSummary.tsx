import React, { useState } from 'react';
import { ParticipantTotal } from '../types';

interface SplitSummaryProps {
  participants: ParticipantTotal[];
}

export function SplitSummary({ participants }: SplitSummaryProps) {
  const [copied, setCopied] = useState(false);
  const grandTotal = participants.reduce((sum, p) => sum + p.total, 0);

  const handleCopy = async () => {
    const lines = ['Bill Split', `Total: $${grandTotal.toFixed(2)}`];
    participants.forEach((p) => {
      lines.push(`${p.name}: $${p.total.toFixed(2)}`);
    });
    const text = lines.join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="split-summary">
      <div className="summary-header">
        <h2 className="summary-title">Summary</h2>
        <p className="summary-subtitle">Everyone's share</p>
      </div>
      <ul className="summary-list">
        {participants.map((participant) => (
          <li key={participant.id} className="summary-item">
            <span className="summary-name">{participant.name}</span>
            <span className="summary-total">${participant.total.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="summary-grand-total">
        <span>Total</span>
        <span>${grandTotal.toFixed(2)}</span>
      </div>
      <button onClick={handleCopy} className="btn btn-secondary btn-full">
        {copied ? 'Copied!' : 'Copy Summary'}
      </button>
    </div>
  );
}
