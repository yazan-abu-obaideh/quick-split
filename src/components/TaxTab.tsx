import React, { useState, useEffect } from 'react';
import { Bill, TaxEntry } from '../types';

interface TaxTabProps {
  bill: Bill;
  onBillChange: (bill: Bill) => void;
}

export function TaxTab({ bill, onBillChange }: TaxTabProps) {
  const initialTaxes = bill.taxes;

  const [servicePercent, setServicePercent] = useState(
    initialTaxes.find(t => t.label === 'Service')?.percent.toString() ?? '0'
  );
  const [taxPercent, setTaxPercent] = useState(
    initialTaxes.find(t => t.label === 'Tax')?.percent.toString() ?? '0'
  );
  const [additionalTaxes, setAdditionalTaxes] = useState<{ id: string; label: string; value: string }[]>(
    initialTaxes
      .filter(t => t.label !== 'Service' && t.label !== 'Tax')
      .map(t => ({ id: t.id, label: t.label, value: t.percent.toString() }))
  );

  // Sync local state when bill.taxes changes externally
  useEffect(() => {
    setServicePercent(initialTaxes.find(t => t.label === 'Service')?.percent.toString() ?? '0');
    setTaxPercent(initialTaxes.find(t => t.label === 'Tax')?.percent.toString() ?? '0');
    setAdditionalTaxes(
      initialTaxes
        .filter(t => t.label !== 'Service' && t.label !== 'Tax')
        .map(t => ({ id: t.id, label: t.label, value: t.percent.toString() }))
    );
  }, [initialTaxes]);

  const buildTaxes = (): TaxEntry[] => {
    const taxes: TaxEntry[] = [];

    const service = parseFloat(servicePercent) || 0;
    if (service > 0) {
      taxes.push({ id: 'service', label: 'Service', percent: service });
    }

    const tax = parseFloat(taxPercent) || 0;
    if (tax > 0) {
      taxes.push({ id: 'tax', label: 'Tax', percent: tax });
    }

    additionalTaxes.forEach(t => {
      const percent = parseFloat(t.value) || 0;
      if (percent > 0) {
        taxes.push({ id: t.id, label: t.label || 'Other', percent });
      }
    });

    return taxes;
  };

  const handleApply = () => {
    onBillChange(bill.setTaxes(buildTaxes()));
  };

  const handleAddTax = () => {
    setAdditionalTaxes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: '', value: '0' },
    ]);
  };

  const handleRemoveTax = (id: string) => {
    setAdditionalTaxes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAdditionalTaxChange = (
    id: string,
    field: 'label' | 'value',
    newValue: string
  ) => {
    setAdditionalTaxes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: newValue } : t))
    );
  };

  const totalPercent =
    (parseFloat(servicePercent) || 0) +
    (parseFloat(taxPercent) || 0) +
    additionalTaxes.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);

  const subtotal = bill.subtotal;
  const grandTotal = bill.grandTotal;
  const taxAmount = grandTotal - subtotal;

  return (
    <div className="tab-content">
      <div className="tax-summary">
        <div className="tax-summary-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="tax-summary-row">
          <span>Tax ({totalPercent.toFixed(1)}%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="tax-summary-row tax-summary-total">
          <span>Total</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="service-percent" className="form-label">
          Service %
        </label>
        <input
          id="service-percent"
          type="number"
          className="form-input"
          step="0.1"
          min="0"
          value={servicePercent}
          onChange={(e) => setServicePercent(e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="tax-percent" className="form-label">
          Tax %
        </label>
        <input
          id="tax-percent"
          type="number"
          className="form-input"
          step="0.1"
          min="0"
          value={taxPercent}
          onChange={(e) => setTaxPercent(e.target.value)}
          placeholder="0"
        />
      </div>

      {additionalTaxes.map((tax) => (
        <div key={tax.id} className="form-group tax-additional">
          <input
            type="text"
            className="form-input tax-label-input"
            value={tax.label}
            onChange={(e) =>
              handleAdditionalTaxChange(tax.id, 'label', e.target.value)
            }
            placeholder="Label (e.g. VAT)"
          />
          <input
            type="number"
            className="form-input tax-value-input"
            step="0.1"
            min="0"
            value={tax.value}
            onChange={(e) =>
              handleAdditionalTaxChange(tax.id, 'value', e.target.value)
            }
            placeholder="0"
          />
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => handleRemoveTax(tax.id)}
          >
            x
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddTax}
        className="btn btn-ghost btn-full"
      >
        + Add Another Tax
      </button>

      <button
        type="button"
        onClick={handleApply}
        className="btn btn-primary btn-full"
      >
        Apply Taxes
      </button>
    </div>
  );
}
