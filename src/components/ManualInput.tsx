import React, { useState } from 'react';
import { BillItem } from '../types';
import { BillDisplay } from './BillDisplay';

type Step = 'entry' | 'tax' | 'complete';

interface ItemFormProps {
  items: BillItem[];
  onNext: (item: BillItem) => void;
  onFinish: (item: BillItem | null) => void;
  onBack: () => void;
}

function ItemForm({ items, onNext, onFinish, onBack }: ItemFormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const getCurrentItem = (): BillItem | null => {
    const trimmedName = name.trim();
    const parsedPrice = parseFloat(price);
    if (!trimmedName || isNaN(parsedPrice) || parsedPrice <= 0) {
      return null;
    }
    return { name: trimmedName, price: parsedPrice };
  };

  const handleNext = () => {
    const item = getCurrentItem();
    if (item) {
      onNext(item);
      setName('');
      setPrice('');
    }
  };

  const handleFinish = () => {
    onFinish(getCurrentItem());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="manual-input">
      {items.length > 0 && (
        <div className="items-preview">
          <span className="items-preview-count">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          <span className="items-preview-last">{items[items.length - 1].name}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="item-name" className="form-label">Item Name</label>
        <input
          id="item-name"
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Burger"
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="item-price" className="form-label">Price</label>
        <input
          id="item-price"
          type="number"
          className="form-input"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0.00"
        />
      </div>

      <div className="form-actions">
        {items.length > 0 && (
          <button type="button" onClick={onBack} className="btn btn-ghost">
            Back
          </button>
        )}
        <button type="button" onClick={handleNext} className="btn btn-secondary">
          Next
        </button>
        <button type="button" onClick={handleFinish} className="btn btn-primary">
          Finish
        </button>
      </div>
    </div>
  );
}

interface TaxFormProps {
  onSubmit: (taxPercent: number) => void;
  onBack: () => void;
}

function TaxForm({ onSubmit, onBack }: TaxFormProps) {
  const [includedTax, setIncludedTax] = useState<boolean | null>(null);
  const [taxPercent, setTaxPercent] = useState('');

  const handleYes = () => {
    onSubmit(0);
  };

  const handleNo = () => {
    setIncludedTax(false);
  };

  const handleTaxSubmit = () => {
    const parsed = parseFloat(taxPercent);
    if (!isNaN(parsed) && parsed >= 0) {
      onSubmit(parsed);
    }
  };

  const handleBack = () => {
    if (includedTax === false) {
      setIncludedTax(null);
    } else {
      onBack();
    }
  };

  if (includedTax === false) {
    return (
      <div className="tax-form">
        <div className="form-group">
          <label htmlFor="tax-percent" className="form-label">Tax Percentage</label>
          <input
            id="tax-percent"
            type="number"
            className="form-input"
            step="0.1"
            min="0"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            placeholder="e.g. 8.5"
            autoFocus
          />
        </div>
        <div className="form-actions">
          <button type="button" onClick={handleBack} className="btn btn-ghost">
            Back
          </button>
          <button type="button" onClick={handleTaxSubmit} className="btn btn-primary">
            Apply Tax
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tax-form">
      <p className="tax-question">Did the prices include tax?</p>
      <div className="form-actions">
        <button type="button" onClick={handleBack} className="btn btn-ghost">
          Back
        </button>
        <button type="button" onClick={handleYes} className="btn btn-secondary">
          Yes
        </button>
        <button type="button" onClick={handleNo} className="btn btn-primary">
          No
        </button>
      </div>
    </div>
  );
}

interface ManualInputProps {
  onComplete: (items: BillItem[]) => void;
  onSplit: () => void;
}

export function ManualInput({ onComplete, onSplit }: ManualInputProps) {
  const [step, setStep] = useState<Step>('entry');
  const [items, setItems] = useState<BillItem[]>([]);

  const handleNext = (item: BillItem) => {
    setItems((prev) => [...prev, item]);
  };

  const handleBack = () => {
    setItems((prev) => prev.slice(0, -1));
  };

  const handleBackFromTax = () => {
    setStep('entry');
  };

  const handleFinish = (item: BillItem | null) => {
    const finalItems = item ? [...items, item] : items;
    if (finalItems.length === 0) {
      return;
    }
    setItems(finalItems);
    setStep('tax');
  };

  const handleTaxSubmit = (taxPercent: number) => {
    const finalItems = taxPercent > 0
      ? items.map((item) => ({
          ...item,
          price: item.price * (1 + taxPercent / 100),
        }))
      : items;
    setItems(finalItems);
    setStep('complete');
    onComplete(finalItems);
  };

  if (step === 'complete') {
    return <BillDisplay items={items} onSplit={onSplit} />;
  }

  return (
    <>
      {step === 'entry' && (
        <ItemForm
          items={items}
          onNext={handleNext}
          onFinish={handleFinish}
          onBack={handleBack}
        />
      )}
      {step === 'tax' && <TaxForm onSubmit={handleTaxSubmit} onBack={handleBackFromTax} />}
    </>
  );
}
