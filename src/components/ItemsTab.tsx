import React, { useState } from 'react';
import { Bill, BillItem } from '../types';

interface ItemsTabProps {
  bill: Bill;
  onBillChange: (bill: Bill) => void;
}

export function ItemsTab({ bill, onBillChange }: ItemsTabProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const items = bill.rawItems;

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
      if (editingIndex !== null) {
        onBillChange(bill.updateItem(editingIndex, item));
        setEditingIndex(null);
      } else {
        onBillChange(bill.addItem(item));
      }
      setName('');
      setPrice('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    setName(item.name);
    setPrice(item.price.toString());
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setName('');
    setPrice('');
    setEditingIndex(null);
  };

  const handleDeleteItem = (index: number) => {
    onBillChange(bill.removeItem(index));
    if (editingIndex === index) {
      handleCancelEdit();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const isEditing = editingIndex !== null;
  const subtotal = bill.subtotal;

  return (
    <div className="tab-content">
      {items.length > 0 && (
        <div className="items-list">
          <div className="items-list-header">
            <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
            <span>Subtotal: ${subtotal.toFixed(2)}</span>
          </div>
          <ul className="items-list-items">
            {items.map((item, index) => (
              <li
                key={index}
                className={`items-list-item ${editingIndex === index ? 'editing' : ''}`}
              >
                <div className="items-list-item-info" onClick={() => handleEditItem(index)}>
                  <span className="items-list-item-name">{item.name}</span>
                  <span className="items-list-item-price">${item.price.toFixed(2)}</span>
                </div>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => handleDeleteItem(index)}
                  aria-label="Delete item"
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="item-form">
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

      {items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">+</div>
          <p className="empty-state-text">Add items to your bill</p>
        </div>
      )}
    </div>
  );
}
