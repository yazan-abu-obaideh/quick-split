import React, { useState } from 'react';
import { Bill } from '../types';
import { ItemsTab } from './ItemsTab';
import { TaxTab } from './TaxTab';
import { ParticipantsTab } from './ParticipantsTab';
import { SummaryTab } from './SummaryTab';

type TabId = 'items' | 'tax' | 'participants' | 'summary';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'items', label: 'Items' },
  { id: 'tax', label: 'Tax' },
  { id: 'participants', label: 'Split' },
  { id: 'summary', label: 'Summary' },
];

interface BillEditorProps {
  bill: Bill;
  onBillChange: (bill: Bill) => void;
}

export function BillEditor({ bill, onBillChange }: BillEditorProps) {
  const [activeTab, setActiveTab] = useState<TabId>('items');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(bill.name);

  const handleNameSave = () => {
    const trimmedName = nameInput.trim();
    if (trimmedName && trimmedName !== bill.name) {
      onBillChange(bill.setName(trimmedName));
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSave();
    } else if (e.key === 'Escape') {
      setNameInput(bill.name);
      setIsEditingName(false);
    }
  };

  const handleNameClick = () => {
    setNameInput(bill.name);
    setIsEditingName(true);
  };

  return (
    <div className="bill-editor">
      <div className="bill-header">
        {isEditingName ? (
          <input
            type="text"
            className="form-input bill-name-input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={handleNameSave}
            autoFocus
          />
        ) : (
          <h2 className="bill-name" onClick={handleNameClick}>
            {bill.name}
          </h2>
        )}
        <span className="bill-id">#{bill.id.slice(0, 8)}</span>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {activeTab === 'items' && (
          <ItemsTab bill={bill} onBillChange={onBillChange} />
        )}
        {activeTab === 'tax' && (
          <TaxTab bill={bill} onBillChange={onBillChange} />
        )}
        {activeTab === 'participants' && (
          <ParticipantsTab bill={bill} onBillChange={onBillChange} />
        )}
        {activeTab === 'summary' && (
          <SummaryTab bill={bill} />
        )}
      </div>
    </div>
  );
}
