import React, { useState } from "react";
import { Bill, BillItem, TaxEntry } from "../types";
import { BillDisplay } from "./BillDisplay";

type Step = "entry" | "tax" | "complete";

interface ItemsPreviewProps {
  items: BillItem[];
  onEditItem: (index: number) => void;
  onFinish: () => void;
}

function ItemsPreview({ items, onEditItem, onFinish }: ItemsPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="items-preview-section">
      <div className="items-preview-card">
        <div
          className="items-preview-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="items-preview-count">
            {items.length} item{items.length !== 1 ? "s" : ""} · $
            {total.toFixed(2)}
          </span>
          <span
            className={`items-preview-chevron ${isExpanded ? "expanded" : ""}`}
          >
            ▼
          </span>
        </div>
        {isExpanded && (
          <ul className="items-preview-list">
            {items.map((item, index) => (
              <li
                key={index}
                className="items-preview-item"
                onClick={() => onEditItem(index)}
              >
                <span className="items-preview-item-name">{item.name}</span>
                <span className="items-preview-item-price">
                  ${item.price.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onFinish}
        className="btn btn-primary btn-full"
      >
        Finish and Add Tax
      </button>
    </div>
  );
}

interface ItemFormProps {
  items: BillItem[];
  editingIndex: number | null;
  initialName?: string;
  initialPrice?: string;
  onSave: (item: BillItem) => void;
  onCancel: () => void;
  onFinish: () => void;
  onEditItem: (index: number) => void;
}

function ItemForm({
  items,
  editingIndex,
  initialName = "",
  initialPrice = "",
  onSave,
  onCancel,
  onFinish,
  onEditItem,
}: ItemFormProps) {
  const [name, setName] = useState(initialName);
  const [price, setPrice] = useState(initialPrice);

  const isEditing = editingIndex !== null;

  const getCurrentItem = (): BillItem | null => {
    const trimmedName = name.trim();
    const parsedPrice = parseFloat(price);
    if (!trimmedName || isNaN(parsedPrice) || parsedPrice <= 0) {
      return null;
    }
    return { name: trimmedName, price: parsedPrice };
  };

  const handleSave = () => {
    const item = getCurrentItem();
    if (item) {
      onSave(item);
      setName("");
      setPrice("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleCancelEdit = () => {
    setName("");
    setPrice("");
    onCancel();
  };

  return (
    <div className="manual-input">
      <ItemsPreview
        items={items}
        onEditItem={onEditItem}
        onFinish={onFinish}
      />

      <div className="form-group">
        <label htmlFor="item-name" className="form-label">
          Item Name
        </label>
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
        <label htmlFor="item-price" className="form-label">
          Price
        </label>
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
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
            >
              Update
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-full"
          >
            Add Item
          </button>
        )}
      </div>
    </div>
  );
}

interface TaxFormProps {
  onSubmit: (taxes: TaxEntry[]) => void;
  onBack: () => void;
  initialTaxes: readonly TaxEntry[];
}

function TaxForm({ onSubmit, onBack, initialTaxes }: TaxFormProps) {
  const [servicePercent, setServicePercent] = useState(
    initialTaxes.find(t => t.label === 'Service')?.percent.toString() ?? "0"
  );
  const [taxPercent, setTaxPercent] = useState(
    initialTaxes.find(t => t.label === 'Tax')?.percent.toString() ?? "0"
  );
  const [additionalTaxes, setAdditionalTaxes] = useState<{ id: string; label: string; value: string }[]>(
    initialTaxes
      .filter(t => t.label !== 'Service' && t.label !== 'Tax')
      .map(t => ({ id: t.id, label: t.label, value: t.percent.toString() }))
  );

  const handleAddTax = () => {
    setAdditionalTaxes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", value: "0" },
    ]);
  };

  const handleRemoveTax = (id: string) => {
    setAdditionalTaxes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAdditionalTaxChange = (
    id: string,
    field: "label" | "value",
    newValue: string
  ) => {
    setAdditionalTaxes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: newValue } : t))
    );
  };

  const handleSubmit = () => {
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

    onSubmit(taxes);
  };

  const totalPercent =
    (parseFloat(servicePercent) || 0) +
    (parseFloat(taxPercent) || 0) +
    additionalTaxes.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);

  return (
    <div className="tax-form">
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
              handleAdditionalTaxChange(tax.id, "label", e.target.value)
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
              handleAdditionalTaxChange(tax.id, "value", e.target.value)
            }
            placeholder="0"
          />
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => handleRemoveTax(tax.id)}
          >
            ×
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

      <div className="tax-total">Total: +{totalPercent.toFixed(1)}%</div>

      <div className="form-actions">
        <button type="button" onClick={onBack} className="btn btn-ghost">
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

interface ManualInputProps {
  bill: Bill;
  onBillChange: (bill: Bill) => void;
  onSplit: () => void;
}

export function ManualInput({ bill, onBillChange, onSplit }: ManualInputProps) {
  const hasTaxes = bill.taxes.length > 0;
  const [step, setStep] = useState<Step>(
    bill.rawItems.length > 0 && hasTaxes ? "complete" : "entry"
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSave = (item: BillItem) => {
    if (editingIndex !== null) {
      onBillChange(bill.updateItem(editingIndex, item));
      setEditingIndex(null);
    } else {
      onBillChange(bill.addItem(item));
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
  };

  const handleBackFromTax = () => {
    setStep("entry");
  };

  const handleFinish = () => {
    if (bill.rawItems.length === 0) {
      return;
    }
    setStep("tax");
  };

  const handleTaxSubmit = (taxes: TaxEntry[]) => {
    onBillChange(bill.setTaxes(taxes));
    setStep("complete");
  };

  if (step === "complete") {
    return <BillDisplay items={bill.items} onSplit={onSplit} />;
  }

  const editingItem = editingIndex !== null ? bill.rawItems[editingIndex] : null;

  return (
    <>
      {step === "entry" && (
        <ItemForm
          key={editingIndex ?? "new"}
          items={[...bill.rawItems]}
          editingIndex={editingIndex}
          initialName={editingItem?.name ?? ""}
          initialPrice={editingItem?.price.toString() ?? ""}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          onFinish={handleFinish}
          onEditItem={handleEditItem}
        />
      )}
      {step === "tax" && (
        <TaxForm
          onSubmit={handleTaxSubmit}
          onBack={handleBackFromTax}
          initialTaxes={bill.taxes}
        />
      )}
    </>
  );
}
