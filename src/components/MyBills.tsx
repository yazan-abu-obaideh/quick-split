import React from 'react';
import { Bill } from '../types';

interface MyBillsProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
  onNewBill: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusLabel(status: Bill['status']): string {
  switch (status) {
    case 'draft':
      return 'In Progress';
    case 'splitting':
      return 'Splitting';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}

function getStatusClass(status: Bill['status']): string {
  switch (status) {
    case 'draft':
      return 'status-draft';
    case 'splitting':
      return 'status-splitting';
    case 'completed':
      return 'status-completed';
    default:
      return '';
  }
}

export function MyBills({ bills, onSelectBill, onDeleteBill, onNewBill }: MyBillsProps) {
  const handleDelete = (e: React.MouseEvent, billId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this bill?')) {
      onDeleteBill(billId);
    }
  };

  return (
    <div className="my-bills">
      <div className="my-bills-header">
        <h2 className="my-bills-title">My Bills</h2>
        <button onClick={onNewBill} className="btn btn-primary">
          New Bill
        </button>
      </div>

      {bills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">No saved bills yet</p>
          <button onClick={onNewBill} className="btn btn-primary">
            Create Your First Bill
          </button>
        </div>
      ) : (
        <ul className="bills-list">
          {bills.map((bill) => {
            const total = bill.grandTotal;
            const itemCount = bill.items.length;
            return (
              <li
                key={bill.id}
                className="bill-card"
                onClick={() => onSelectBill(bill)}
              >
                <div className="bill-card-header">
                  <span className="bill-card-name">{bill.name}</span>
                  <span className={`bill-card-status ${getStatusClass(bill.status)}`}>
                    {getStatusLabel(bill.status)}
                  </span>
                </div>
                <div className="bill-card-details">
                  <span className="bill-card-total">
                    ${total.toFixed(2)} · {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </span>
                  <span className="bill-card-date">{formatDate(bill.createdAt)}</span>
                </div>
                <button
                  className="btn btn-ghost btn-icon bill-card-delete"
                  onClick={(e) => handleDelete(e, bill.id)}
                  aria-label="Delete bill"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
