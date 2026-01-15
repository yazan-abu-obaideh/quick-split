import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './App.css';
import { NavBar } from './components/NavBar';
import { ManualInput } from './components/ManualInput';
import { BillSplit } from './components/BillSplit';
import { SplitSummary } from './components/SplitSummary';
import { MyBills } from './components/MyBills';
import { Bill } from './types';
import { getBillStorageService } from './utils/billStorage';

type Mode = 'select' | 'bills' | 'manual' | 'split' | 'summary';

function App() {
  const [mode, setMode] = useState<Mode>('select');
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const storageRef = useRef(getBillStorageService());

  useEffect(() => {
    setBills(storageRef.current.getBillsSortedByDate());
  }, []);

  useEffect(() => {
    if (currentBill) {
      storageRef.current.saveBill(currentBill);
      storageRef.current.setCurrentBillId(currentBill.id);
      setBills(storageRef.current.getBillsSortedByDate());
    }
  }, [currentBill]);

  const participantTotals = useMemo(
    () => currentBill?.participantTotals ?? [],
    [currentBill]
  );

  const handleNewBill = useCallback(() => {
    const bill = Bill.create();
    setCurrentBill(bill);
    setMode('manual');
  }, []);

  const handleSelectBill = useCallback((bill: Bill) => {
    setCurrentBill(bill);
    const status = bill.status;
    if (status === 'completed') {
      setMode('summary');
    } else if (status === 'splitting') {
      setMode('split');
    } else {
      setMode('manual');
    }
  }, []);

  const handleDeleteBill = useCallback((billId: string) => {
    storageRef.current.deleteBill(billId);
    setBills(storageRef.current.getBillsSortedByDate());
    if (currentBill?.id === billId) {
      setCurrentBill(null);
      setMode('select');
    }
  }, [currentBill]);

  const handleBillChange = useCallback((bill: Bill) => {
    setCurrentBill(bill);
  }, []);

  const handleSplit = useCallback(() => {
    setMode('split');
  }, []);

  const handleSplitFinish = useCallback(() => {
    setMode('summary');
  }, []);

  const handleBackToEntry = useCallback(() => {
    setMode('manual');
  }, []);

  const handleBack = useCallback(() => {
    storageRef.current.setCurrentBillId(null);
    setCurrentBill(null);
    setMode('select');
  }, []);

  const showNavBack = mode !== 'select';

  return (
    <div className="App">
      <NavBar onBack={showNavBack ? (mode === 'split' ? handleBackToEntry : handleBack) : undefined} />

      {mode === 'select' && (
        <div className="landing">
          <div className="landing-icon">🧾</div>
          <h1 className="landing-title">Quick Split</h1>
          <p className="landing-subtitle">Split bills with friends, hassle-free</p>
          <div className="mode-buttons">
            <button onClick={handleNewBill} className="btn btn-primary">
              Enter Bill
            </button>
            <button onClick={() => setMode('bills')} className="btn btn-secondary">
              My Bills{bills.length > 0 && ` (${bills.length})`}
            </button>
          </div>
        </div>
      )}

      {mode === 'bills' && (
        <main className="main-content">
          <MyBills
            bills={bills}
            onSelectBill={handleSelectBill}
            onDeleteBill={handleDeleteBill}
            onNewBill={handleNewBill}
          />
        </main>
      )}

      {mode !== 'select' && mode !== 'bills' && currentBill && (
        <main className="main-content">
          {mode === 'manual' && (
            <ManualInput
              bill={currentBill}
              onBillChange={handleBillChange}
              onSplit={handleSplit}
            />
          )}
          {mode === 'split' && (
            <BillSplit
              bill={currentBill}
              onBillChange={handleBillChange}
              onFinish={handleSplitFinish}
            />
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
