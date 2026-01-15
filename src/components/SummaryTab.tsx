import React, { useState } from 'react';
import { Bill } from '../types';

interface SummaryTabProps {
  bill: Bill;
}

export function SummaryTab({ bill }: SummaryTabProps) {
  const [copied, setCopied] = useState(false);

  const participants = bill.participantTotals;
  const grandTotal = bill.grandTotal;
  const isFullyAssigned = bill.isFullyAssigned;

  const handleCopy = async () => {
    const items = bill.items;
    const lines = [bill.name, `Total: $${grandTotal.toFixed(2)}`, ''];

    bill.participants.forEach((participant) => {
      const total = participants.find(p => p.id === participant.id)?.total ?? 0;
      lines.push(`${participant.name}: $${total.toFixed(2)}`);
      participant.selectedItems.forEach((selection) => {
        const item = items[selection.itemIndex];
        const contribution = bill.getParticipantItemContribution(participant.id, selection.itemIndex);
        lines.push(`  - ${item.name}: $${contribution.toFixed(2)}`);
      });
      lines.push('');
    });

    const text = lines.join('\n').trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isFullyAssigned) {
    return (
      <div className="tab-content">
        <div className="empty-state">
          <div className="empty-state-icon">!</div>
          <p className="empty-state-text">
            Assign all items to participants to see the summary
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
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
