import React, { useState } from 'react';
import './App.css';
import { NavBar } from './components/NavBar';
import { BillDisplay } from './components/BillDisplay';
import { ManualInput } from './components/ManualInput';
import { BillSplit } from './components/BillSplit';
import { SplitSummary, ParticipantTotal } from './components/SplitSummary';
import { BillItem } from './types';

type Mode = 'select' | 'manual' | 'review' | 'split' | 'summary';

function App() {
  const [mode, setMode] = useState<Mode>('select');
  const [items, setItems] = useState<BillItem[]>([]);
  const [participantTotals, setParticipantTotals] = useState<ParticipantTotal[]>([]);

  const handleManualComplete = (completedItems: BillItem[]) => {
    setItems(completedItems);
  };

  const handleSplit = () => {
    setMode('split');
  };

  const handleSplitFinish = (totals: ParticipantTotal[]) => {
    setParticipantTotals(totals);
    setMode('summary');
  };

  const handleBack = () => {
    setMode('select');
    setItems([]);
    setParticipantTotals([]);
  };

  const showNavBack = mode !== 'select';

  return (
    <div className="App">
      <NavBar onBack={showNavBack ? handleBack : undefined} />

      {mode === 'select' && (
        <div className="landing">
          <div className="landing-icon">🧾</div>
          <h1 className="landing-title">Quick Split</h1>
          <p className="landing-subtitle">Split bills with friends, hassle-free</p>
          <div className="mode-buttons">
            <button onClick={() => setMode('manual')} className="btn btn-primary">
              Enter Bill
            </button>
          </div>
        </div>
      )}

      {mode !== 'select' && (
        <main className="main-content">
          {mode === 'manual' && (
            <ManualInput onComplete={handleManualComplete} onSplit={handleSplit} />
          )}
          {mode === 'review' && (
            <BillDisplay items={items} onSplit={handleSplit} />
          )}
          {mode === 'split' && (
            <BillSplit items={items} onFinish={handleSplitFinish} />
          )}
          {mode === 'summary' && (
            <SplitSummary participants={participantTotals} />
          )}
        </main>
      )}
    </div>
  );
}

export default App;
