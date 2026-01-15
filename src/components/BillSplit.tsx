import React, { useState, useMemo } from 'react';
import { Bill, BillItem } from '../types';

interface PercentageInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onClose: () => void;
}

function PercentageInput({ value, onChange, onClose }: PercentageInputProps) {
  const [inputValue, setInputValue] = useState(value?.toString() ?? '');

  const handleSave = () => {
    const parsed = parseFloat(inputValue);
    if (inputValue === '' || isNaN(parsed)) {
      onChange(undefined);
    } else {
      onChange(Math.max(0, Math.min(100, parsed)));
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="percentage-input-overlay" onClick={onClose}>
      <div className="percentage-input-modal" onClick={(e) => e.stopPropagation()}>
        <p className="percentage-input-title">Enter percentage</p>
        <p className="percentage-input-hint">Leave empty for equal split</p>
        <input
          type="number"
          className="form-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 50"
          min="0"
          max="100"
          autoFocus
        />
        <div className="percentage-input-actions">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}

interface ParticipantCardProps {
  participantId: string;
  participantName: string;
  isExpanded: boolean;
  items: BillItem[];
  bill: Bill;
  participantTotal: number;
  isLastParticipant: boolean;
  onToggle: () => void;
  onItemChange: (itemIndex: number, checked: boolean) => void;
  onPercentageChange: (itemIndex: number, percentage: number | undefined) => void;
  onRemove: () => void;
}

function ParticipantCard({
  participantId,
  participantName,
  isExpanded,
  items,
  bill,
  participantTotal,
  isLastParticipant,
  onToggle,
  onItemChange,
  onPercentageChange,
  onRemove,
}: ParticipantCardProps) {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const participant = bill.participants.find(p => p.id === participantId);

  const getSelection = (itemIndex: number) => {
    return participant?.selectedItems.find((s) => s.itemIndex === itemIndex);
  };

  return (
    <div className="participant-card">
      <div className="participant-header" onClick={onToggle}>
        <div className="participant-info">
          <span className={`participant-expand ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
          <span className="participant-name">{participantName}</span>
        </div>
        <span className="participant-total">${participantTotal.toFixed(2)}</span>
      </div>
      {isExpanded && (
        <div className="participant-items">
          {items.map((item, index) => {
            const selection = getSelection(index);
            const isSelected = !!selection;
            const contribution = bill.getParticipantItemContribution(participantId, index);
            const itemInfo = bill.getItemSplitInfo(index);
            const isOverAllocated = itemInfo.isOverAssigned;
            const isUnderAssigned = !itemInfo.isFullyAssigned && !itemInfo.isOverAssigned;
            const isUnassigned = itemInfo.isUnassigned;
            const showOverAllocationError = isSelected && selection?.percentage !== undefined && isOverAllocated;
            const showUnderAssignedWarning = isLastParticipant && isUnderAssigned;

            let rowClass = 'participant-item-row';
            if (showOverAllocationError) rowClass += ' item-over-allocated';
            if (showUnderAssignedWarning) rowClass += ' item-unassigned';

            return (
              <div key={index} className={rowClass}>
                <label className="participant-item">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onItemChange(index, e.target.checked)}
                  />
                  <span className="participant-item-name">{item.name}</span>
                </label>
                {isSelected && (
                  <div className="participant-item-details">
                    {showOverAllocationError && (
                      <span className="item-error">sum: {itemInfo.totalAssignedPercentage.toFixed(0)}%</span>
                    )}
                    {showUnderAssignedWarning && !showOverAllocationError && (
                      <span className="item-warning">
                        {isUnassigned ? 'unassigned' : `${itemInfo.totalAssignedPercentage.toFixed(0)}% assigned`}
                      </span>
                    )}
                    <button
                      className={`participant-item-amount ${showOverAllocationError ? 'amount-error' : ''} ${showUnderAssignedWarning ? 'amount-warning' : ''}`}
                      onClick={() => setEditingItemIndex(index)}
                    >
                      {selection?.percentage !== undefined ? (
                        <span className="amount-with-percent">
                          {selection.percentage}% · ${contribution.toFixed(2)}
                        </span>
                      ) : (
                        <span>${contribution.toFixed(2)}</span>
                      )}
                    </button>
                  </div>
                )}
                {!isSelected && (
                  <div className="participant-item-details">
                    {showUnderAssignedWarning && (
                      <span className="item-warning">
                        {isUnassigned ? 'unassigned' : `${itemInfo.totalAssignedPercentage.toFixed(0)}% assigned`}
                      </span>
                    )}
                    <span className="participant-item-price">${item.price.toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}
          <button className="btn btn-danger btn-full participant-remove" onClick={onRemove}>
            Remove
          </button>
        </div>
      )}
      {editingItemIndex !== null && (
        <PercentageInput
          value={getSelection(editingItemIndex)?.percentage}
          onChange={(pct) => onPercentageChange(editingItemIndex, pct)}
          onClose={() => setEditingItemIndex(null)}
        />
      )}
    </div>
  );
}

interface BillSplitProps {
  bill: Bill;
  onBillChange: (bill: Bill) => void;
  onFinish: () => void;
}

export function BillSplit({ bill, onBillChange, onFinish }: BillSplitProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');

  const items = bill.items;
  const participantTotals = useMemo(() => bill.participantTotals, [bill]);

  const handleAddParticipant = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const newBill = bill.addParticipant(trimmedName);
    const newParticipantId = newBill.participants[newBill.participants.length - 1].id;

    setExpandedIds(new Set([newParticipantId]));
    onBillChange(newBill);
    setNewName('');
  };

  const handleToggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleItemChange = (participantId: string, itemIndex: number, checked: boolean) => {
    onBillChange(bill.setParticipantItemSelection(participantId, itemIndex, checked));
  };

  const handlePercentageChange = (participantId: string, itemIndex: number, percentage: number | undefined) => {
    onBillChange(bill.setParticipantItemPercentage(participantId, itemIndex, percentage));
  };

  const handleRemove = (id: string) => {
    onBillChange(bill.removeParticipant(id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  const handleFinish = () => {
    onFinish();
  };

  return (
    <div className="bill-split">
      <div className="split-header">
        <h2 className="split-title">Split Bill</h2>
        <div className="split-totals">
          <span>Total: ${bill.grandTotal.toFixed(2)}</span>
          <span className={bill.isFullyAssigned ? 'split-totals-assigned' : 'split-totals-unassigned'}>
            Assigned: ${bill.assignedTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="add-participant">
        <input
          type="text"
          className="form-input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add participant..."
        />
        <button onClick={handleAddParticipant} className="btn btn-primary">
          Add
        </button>
      </div>

      <div className="participants-list">
        {bill.participants.map((participant, index) => {
          const total = participantTotals.find(t => t.id === participant.id)?.total ?? 0;
          return (
            <ParticipantCard
              key={participant.id}
              participantId={participant.id}
              participantName={participant.name}
              isExpanded={expandedIds.has(participant.id)}
              items={items}
              bill={bill}
              participantTotal={total}
              isLastParticipant={index === bill.participants.length - 1}
              onToggle={() => handleToggle(participant.id)}
              onItemChange={(itemIdx, checked) => handleItemChange(participant.id, itemIdx, checked)}
              onPercentageChange={(itemIdx, pct) => handlePercentageChange(participant.id, itemIdx, pct)}
              onRemove={() => handleRemove(participant.id)}
            />
          );
        })}
      </div>

      {bill.participants.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p className="empty-state-text">Add participants to start splitting</p>
        </div>
      )}

      {bill.isFullyAssigned && (
        <button onClick={handleFinish} className="btn btn-primary btn-full">
          Finish
        </button>
      )}
    </div>
  );
}
