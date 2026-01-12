import React, { useState } from 'react';
import './App.css';
import { NavBar } from './components/NavBar';
import { FileUpload } from './components/FileUpload';
import { BillDisplay } from './components/BillDisplay';
import { ManualInput } from './components/ManualInput';
import { BillSplit } from './components/BillSplit';
import { SplitSummary, ParticipantTotal } from './components/SplitSummary';
import { parseBillImage } from './utils/BillParser';
import { BillItem } from './types';

type Mode = 'select' | 'manual' | 'upload' | 'split' | 'summary';

function App() {
  const [mode, setMode] = useState<Mode>('select');
  const [items, setItems] = useState<BillItem[]>([]);
  const [participantTotals, setParticipantTotals] = useState<ParticipantTotal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await parseBillImage(file);
      setItems(result.items);
      setMode('upload');

      if (result.items.length === 0) {
        setError('No items found in the image. Try a clearer photo.');
      }
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
    setError(null);
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
              Manual Input
            </button>
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {mode !== 'select' && (
        <main className="main-content">
          {mode === 'manual' && (
            <ManualInput onComplete={handleManualComplete} onSplit={handleSplit} />
          )}
          {mode === 'upload' && (
            <BillDisplay items={items} onSplit={handleSplit} />
          )}
          {mode === 'split' && (
            <BillSplit items={items} onFinish={handleSplitFinish} />
          )}
          {mode === 'summary' && (
            <SplitSummary participants={participantTotals} />
          )}
          {error && <p className="error">{error}</p>}
        </main>
      )}
    </div>
  );
}

export default App;
