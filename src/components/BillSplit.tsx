import React, { useState } from 'react';
import { BillItem } from '../types';
import {
  calculateSplit,
  getParticipantItemContribution,
  getItemSplitInfo,
  ParticipantSelection,
  ParticipantTotal,
  ItemSelection,
} from '../utils/splitCalculator';

interface Participant extends ParticipantSelection {
  id: string;
  isExpanded: boolean;
}

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
  participant: Participant;
  items: BillItem[];
  allParticipants: ParticipantSelection[];
  participantTotal: number;
  isLastParticipant: boolean;
  onToggle: () => void;
  onItemChange: (itemIndex: number, checked: boolean) => void;
  onPercentageChange: (itemIndex: number, percentage: number | undefined) => void;
  onRemove: () => void;
}

function ParticipantCard({
  participant,
  items,
  allParticipants,
  participantTotal,
  isLastParticipant,
  onToggle,
  onItemChange,
  onPercentageChange,
  onRemove,
}: ParticipantCardProps) {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const getSelection = (itemIndex: number): ItemSelection | undefined => {
    return participant.selectedItems.find((s) => s.itemIndex === itemIndex);
  };

  return (
    <div className="participant-card">
      <div className="participant-header" onClick={onToggle}>
        <div className="participant-info">
          <span className={`participant-expand ${participant.isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
          <span className="participant-name">{participant.name}</span>
        </div>
        <span className="participant-total">${participantTotal.toFixed(2)}</span>
      </div>
      {participant.isExpanded && (
        <div className="participant-items">
          {items.map((item, index) => {
            const selection = getSelection(index);
            const isSelected = !!selection;
            const contribution = getParticipantItemContribution(
              participant,
              index,
              item,
              allParticipants
            );
            const itemInfo = getItemSplitInfo(index, allParticipants);
            const isOverAllocated = itemInfo.totalAssignedPercentage > 100;
            const isUnderAssigned = itemInfo.totalAssignedPercentage < 99.99;
            const isUnassigned = itemInfo.totalAssignedPercentage < 0.01;
            const showOverAllocationError = isSelected && selection?.percentage !== undefined && isOverAllocated;
            // Show under-assigned warning for last participant (both selected and unselected items)
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
  items: BillItem[];
  onFinish: (participants: ParticipantTotal[]) => void;
}

export function BillSplit({ items, onFinish }: BillSplitProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newName, setNewName] = useState('');

  const participantSelections: ParticipantSelection[] = participants.map((p) => ({
    name: p.name,
    selectedItems: p.selectedItems,
  }));

  const splitResult = calculateSplit(items, participantSelections);

  const handleAddParticipant = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name: trimmedName,
      selectedItems: [],
      isExpanded: true,
    };

    setParticipants((prev) => {
      const updated = prev.map((p) => ({ ...p, isExpanded: false }));
      return [...updated, newParticipant];
    });
    setNewName('');
  };

  const handleToggle = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isExpanded: !p.isExpanded } : p))
    );
  };

  const handleItemChange = (participantId: string, itemIndex: number, checked: boolean) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== participantId) return p;
        if (checked) {
          return {
            ...p,
            selectedItems: [...p.selectedItems, { itemIndex }],
          };
        } else {
          return {
            ...p,
            selectedItems: p.selectedItems.filter((s) => s.itemIndex !== itemIndex),
          };
        }
      })
    );
  };

  const handlePercentageChange = (participantId: string, itemIndex: number, percentage: number | undefined) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== participantId) return p;
        return {
          ...p,
          selectedItems: p.selectedItems.map((s) =>
            s.itemIndex === itemIndex ? { ...s, percentage } : s
          ),
        };
      })
    );
  };

  const handleRemove = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  const handleFinish = () => {
    onFinish(splitResult.participantTotals);
  };

  return (
    <div className="bill-split">
      <div className="split-header">
        <h2 className="split-title">Split Bill</h2>
        <div className="split-totals">
          <span>Total: ${splitResult.grandTotal.toFixed(2)}</span>
          <span className={splitResult.isFullyAssigned ? 'split-totals-assigned' : 'split-totals-unassigned'}>
            Assigned: ${splitResult.assignedTotal.toFixed(2)}
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
        {participants.map((participant, index) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            items={items}
            allParticipants={participantSelections}
            participantTotal={splitResult.participantTotals[index]?.total ?? 0}
            isLastParticipant={index === participants.length - 1}
            onToggle={() => handleToggle(participant.id)}
            onItemChange={(itemIdx, checked) => handleItemChange(participant.id, itemIdx, checked)}
            onPercentageChange={(itemIdx, pct) => handlePercentageChange(participant.id, itemIdx, pct)}
            onRemove={() => handleRemove(participant.id)}
          />
        ))}
      </div>

      {participants.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p className="empty-state-text">Add participants to start splitting</p>
        </div>
      )}

      {splitResult.isFullyAssigned && (
        <button onClick={handleFinish} className="btn btn-primary btn-full">
          Finish
        </button>
      )}
    </div>
  );
}
