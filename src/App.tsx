import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { NavBar } from './components/NavBar';
import { MyBills } from './components/MyBills';
import { BillEditor } from './components/BillEditor';
import { Bill } from './types';
import { getBillStorageService } from './utils/billStorage';

type Mode = 'select' | 'bills' | 'editor';

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

  const handleNewBill = useCallback(() => {
    const bill = Bill.create();
    setCurrentBill(bill);
    setMode('editor');
  }, []);

  const handleSelectBill = useCallback((bill: Bill) => {
    setCurrentBill(bill);
    setMode('editor');
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

  const handleBack = useCallback(() => {
    storageRef.current.setCurrentBillId(null);
    setCurrentBill(null);
    setMode('select');
  }, []);

  const getBackHandler = () => {
    switch (mode) {
      case 'editor':
      case 'bills':
        return handleBack;
      default:
        return undefined;
    }
  };

  return (
    <div className="App">
      <NavBar onBack={getBackHandler()} />

      {mode === 'select' && (
        <div className="landing">
          <div className="landing-icon">🧾</div>
          <h1 className="landing-title">Quick Split</h1>
          <p className="landing-subtitle">Split bills with friends, hassle-free</p>
          <div className="mode-buttons">
            <button onClick={handleNewBill} className="btn btn-primary">
              New Bill
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

      {mode === 'editor' && currentBill && (
        <main className="main-content">
          <BillEditor
            bill={currentBill}
            onBillChange={handleBillChange}
          />
        </main>
      )}
    </div>
  );
}

export default App;
