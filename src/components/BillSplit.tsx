import React, { useState } from 'react';
import { BillItem } from '../types';
import {
  calculateSplit,
  calculateItemParticipantCounts,
  getItemContribution,
  ParticipantSelection,
  ParticipantTotal,
} from '../utils/splitCalculator';

interface Participant extends ParticipantSelection {
  id: string;
  isExpanded: boolean;
}

interface ParticipantCardProps {
  participant: Participant;
  items: BillItem[];
  itemParticipantCounts: number[];
  participantTotal: number;
  onToggle: () => void;
  onItemChange: (itemIndex: number, checked: boolean) => void;
  onRemove: () => void;
}

function ParticipantCard({
  participant,
  items,
  itemParticipantCounts,
  participantTotal,
  onToggle,
  onItemChange,
  onRemove,
}: ParticipantCardProps) {
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
            const isSelected = participant.selectedItemIndices.includes(index);
            const contribution = getItemContribution(index, items, itemParticipantCounts);

            return (
              <label key={index} className="participant-item">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onItemChange(index, e.target.checked)}
                />
                <span className="participant-item-name">{item.name}</span>
                <span className={`participant-item-price ${isSelected ? 'selected' : ''}`}>
                  ${contribution.toFixed(2)}
                </span>
              </label>
            );
          })}
          <button className="btn btn-danger btn-full participant-remove" onClick={onRemove}>
            Remove
          </button>
        </div>
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
    selectedItemIndices: p.selectedItemIndices,
  }));

  const splitResult = calculateSplit(items, participantSelections);
  const itemParticipantCounts = calculateItemParticipantCounts(items, participantSelections);

  const handleAddParticipant = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name: trimmedName,
      selectedItemIndices: [],
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
        const newSelected = checked
          ? [...p.selectedItemIndices, itemIndex]
          : p.selectedItemIndices.filter((i) => i !== itemIndex);
        return { ...p, selectedItemIndices: newSelected };
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
            itemParticipantCounts={itemParticipantCounts}
            participantTotal={splitResult.participantTotals[index]?.total ?? 0}
            onToggle={() => handleToggle(participant.id)}
            onItemChange={(itemIdx, checked) => handleItemChange(participant.id, itemIdx, checked)}
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
