import { Bill, BillData, generateBillName } from './Bill';

let idCounter = 0;
beforeAll(() => {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => `test-uuid-${++idCounter}`,
    },
  });
});

beforeEach(() => {
  idCounter = 0;
});

function createTestBill(overrides: Partial<BillData> = {}): Bill {
  return new Bill({
    id: 'test-bill-id',
    name: 'Test Bill',
    createdAt: 1000,
    rawItems: [],
    taxes: [],
    participants: [],
    ...overrides,
  });
}

describe('Bill', () => {
  describe('generateBillName', () => {
    it('formats date correctly', () => {
      const timestamp = new Date('2026-01-15T12:00:00').getTime();
      expect(generateBillName(timestamp)).toBe('Bill - Jan 15, 2026');
    });
  });

  describe('Bill.create', () => {
    it('creates a new bill with defaults', () => {
      const bill = Bill.create();
      expect(bill.id).toBe('test-uuid-1');
      expect(bill.rawItems).toEqual([]);
      expect(bill.taxes).toEqual([]);
      expect(bill.participants).toEqual([]);
      expect(bill.status).toBe('draft');
    });

    it('accepts custom name', () => {
      const bill = Bill.create('My Custom Bill');
      expect(bill.name).toBe('My Custom Bill');
    });
  });

  describe('items and taxes', () => {
    it('returns raw items when no taxes', () => {
      const bill = createTestBill({
        rawItems: [
          { name: 'Burger', price: 10 },
          { name: 'Fries', price: 5 },
        ],
      });

      expect(bill.items).toEqual([
        { name: 'Burger', price: 10 },
        { name: 'Fries', price: 5 },
      ]);
      expect(bill.grandTotal).toBe(15);
    });

    it('applies single tax to all items', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 100 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
      });

      expect(bill.totalTaxPercent).toBe(10);
      expect(bill.items[0].price).toBeCloseTo(110);
      expect(bill.grandTotal).toBeCloseTo(110);
    });

    it('applies multiple taxes cumulatively', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 100 }],
        taxes: [
          { id: 't1', label: 'Service', percent: 10 },
          { id: 't2', label: 'Tax', percent: 5 },
        ],
      });

      expect(bill.totalTaxPercent).toBe(15);
      expect(bill.items[0].price).toBeCloseTo(115);
    });

    it('handles zero tax', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 100 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 0 }],
      });

      expect(bill.items[0].price).toBe(100);
    });
  });

  describe('addItem', () => {
    it('adds item and returns new bill', () => {
      const bill = createTestBill();
      const newBill = bill.addItem({ name: 'Burger', price: 10 });

      expect(bill.rawItems).toHaveLength(0);
      expect(newBill.rawItems).toHaveLength(1);
      expect(newBill.rawItems[0]).toEqual({ name: 'Burger', price: 10 });
    });

    it('preserves existing items', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 10 }],
      });
      const newBill = bill.addItem({ name: 'Fries', price: 5 });

      expect(newBill.rawItems).toHaveLength(2);
      expect(newBill.rawItems[0]).toEqual({ name: 'Burger', price: 10 });
      expect(newBill.rawItems[1]).toEqual({ name: 'Fries', price: 5 });
    });
  });

  describe('updateItem', () => {
    it('updates item at index', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 10 }],
      });
      const newBill = bill.updateItem(0, { name: 'Cheeseburger', price: 12 });

      expect(newBill.rawItems[0]).toEqual({ name: 'Cheeseburger', price: 12 });
    });
  });

  describe('removeItem', () => {
    it('removes item at index', () => {
      const bill = createTestBill({
        rawItems: [
          { name: 'Burger', price: 10 },
          { name: 'Fries', price: 5 },
        ],
      });
      const newBill = bill.removeItem(0);

      expect(newBill.rawItems).toHaveLength(1);
      expect(newBill.rawItems[0]).toEqual({ name: 'Fries', price: 5 });
    });

    it('updates participant item indices when item removed', () => {
      const bill = createTestBill({
        rawItems: [
          { name: 'A', price: 10 },
          { name: 'B', price: 20 },
          { name: 'C', price: 30 },
        ],
        participants: [
          {
            id: 'p1',
            name: 'Alice',
            selectedItems: [{ itemIndex: 0 }, { itemIndex: 2 }],
          },
        ],
      });

      const newBill = bill.removeItem(1);

      expect(newBill.participants[0].selectedItems).toEqual([
        { itemIndex: 0 },
        { itemIndex: 1 },
      ]);
    });

    it('removes selections for the deleted item', () => {
      const bill = createTestBill({
        rawItems: [
          { name: 'A', price: 10 },
          { name: 'B', price: 20 },
        ],
        participants: [
          {
            id: 'p1',
            name: 'Alice',
            selectedItems: [{ itemIndex: 0 }, { itemIndex: 1 }],
          },
        ],
      });

      const newBill = bill.removeItem(0);

      expect(newBill.participants[0].selectedItems).toEqual([
        { itemIndex: 0 },
      ]);
    });
  });

  describe('tax mutations', () => {
    it('setTaxes replaces all taxes', () => {
      const bill = createTestBill({
        taxes: [{ id: 't1', label: 'Old', percent: 5 }],
      });
      const newBill = bill.setTaxes([{ id: 't2', label: 'New', percent: 10 }]);

      expect(newBill.taxes).toHaveLength(1);
      expect(newBill.taxes[0]).toEqual({ id: 't2', label: 'New', percent: 10 });
    });

    it('addTax adds a new tax', () => {
      const bill = createTestBill();
      const newBill = bill.addTax({ label: 'Tax', percent: 10 });

      expect(newBill.taxes).toHaveLength(1);
      expect(newBill.taxes[0].label).toBe('Tax');
      expect(newBill.taxes[0].percent).toBe(10);
    });

    it('updateTax modifies existing tax', () => {
      const bill = createTestBill({
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
      });
      const newBill = bill.updateTax('t1', { percent: 15 });

      expect(newBill.taxes[0].percent).toBe(15);
      expect(newBill.taxes[0].label).toBe('Tax');
    });

    it('removeTax removes a tax', () => {
      const bill = createTestBill({
        taxes: [
          { id: 't1', label: 'Tax1', percent: 5 },
          { id: 't2', label: 'Tax2', percent: 10 },
        ],
      });
      const newBill = bill.removeTax('t1');

      expect(newBill.taxes).toHaveLength(1);
      expect(newBill.taxes[0].id).toBe('t2');
    });
  });

  describe('participant mutations', () => {
    it('addParticipant adds a new participant', () => {
      const bill = createTestBill();
      const newBill = bill.addParticipant('Alice');

      expect(newBill.participants).toHaveLength(1);
      expect(newBill.participants[0].name).toBe('Alice');
      expect(newBill.participants[0].selectedItems).toEqual([]);
    });

    it('removeParticipant removes participant by id', () => {
      const bill = createTestBill({
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [] },
          { id: 'p2', name: 'Bob', selectedItems: [] },
        ],
      });
      const newBill = bill.removeParticipant('p1');

      expect(newBill.participants).toHaveLength(1);
      expect(newBill.participants[0].name).toBe('Bob');
    });
  });

  describe('item selection', () => {
    it('setParticipantItemSelection adds selection', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 10 }],
        participants: [{ id: 'p1', name: 'Alice', selectedItems: [] }],
      });
      const newBill = bill.setParticipantItemSelection('p1', 0, true);

      expect(newBill.participants[0].selectedItems).toEqual([{ itemIndex: 0, percentage: undefined }]);
    });

    it('setParticipantItemSelection removes selection', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 10 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });
      const newBill = bill.setParticipantItemSelection('p1', 0, false);

      expect(newBill.participants[0].selectedItems).toEqual([]);
    });

    it('setParticipantItemSelection with percentage', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 10 }],
        participants: [{ id: 'p1', name: 'Alice', selectedItems: [] }],
      });
      const newBill = bill.setParticipantItemSelection('p1', 0, true, 50);

      expect(newBill.participants[0].selectedItems).toEqual([
        { itemIndex: 0, percentage: 50 },
      ]);
    });

    it('setParticipantItemPercentage updates percentage', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 10 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });
      const newBill = bill.setParticipantItemPercentage('p1', 0, 75);

      expect(newBill.participants[0].selectedItems[0].percentage).toBe(75);
    });

    it('setParticipantItemPercentage clears percentage with undefined', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Burger', price: 10 }],
        participants: [
          {
            id: 'p1',
            name: 'Alice',
            selectedItems: [{ itemIndex: 0, percentage: 50 }],
          },
        ],
      });
      const newBill = bill.setParticipantItemPercentage('p1', 0, undefined);

      expect(newBill.participants[0].selectedItems[0].percentage).toBeUndefined();
    });
  });

  describe('split calculations', () => {
    it('calculates equal split for single item', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
          { id: 'p2', name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
          { id: 'p3', name: 'Charlie', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      expect(bill.getParticipantTotal('p1')).toBeCloseTo(10);
      expect(bill.getParticipantTotal('p2')).toBeCloseTo(10);
      expect(bill.getParticipantTotal('p3')).toBeCloseTo(10);
    });

    it('calculates percentage-based split', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Wine', price: 100 }],
        participants: [
          {
            id: 'p1',
            name: 'Alice',
            selectedItems: [{ itemIndex: 0, percentage: 60 }],
          },
          {
            id: 'p2',
            name: 'Bob',
            selectedItems: [{ itemIndex: 0, percentage: 40 }],
          },
        ],
      });

      expect(bill.getParticipantTotal('p1')).toBe(60);
      expect(bill.getParticipantTotal('p2')).toBe(40);
    });

    it('calculates mixed percentage and equal split', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Steak', price: 100 }],
        participants: [
          {
            id: 'p1',
            name: 'Alice',
            selectedItems: [{ itemIndex: 0, percentage: 50 }],
          },
          { id: 'p2', name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
          { id: 'p3', name: 'Charlie', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      expect(bill.getParticipantTotal('p1')).toBe(50);
      expect(bill.getParticipantTotal('p2')).toBe(25);
      expect(bill.getParticipantTotal('p3')).toBe(25);
    });

    it('calculates participantTotals', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
          { id: 'p2', name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      const totals = bill.participantTotals;
      expect(totals).toHaveLength(2);
      expect(totals[0]).toEqual({ id: 'p1', name: 'Alice', total: 15 });
      expect(totals[1]).toEqual({ id: 'p2', name: 'Bob', total: 15 });
    });

    it('applies tax to split calculations', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 100 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
          { id: 'p2', name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      expect(bill.grandTotal).toBeCloseTo(110);
      expect(bill.getParticipantTotal('p1')).toBeCloseTo(55);
      expect(bill.getParticipantTotal('p2')).toBeCloseTo(55);
    });
  });

  describe('getItemSplitInfo', () => {
    it('returns info for fully assigned item', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      const info = bill.getItemSplitInfo(0);
      expect(info.isFullyAssigned).toBe(true);
      expect(info.isOverAssigned).toBe(false);
      expect(info.isUnassigned).toBe(false);
      expect(info.totalAssignedPercentage).toBe(100);
    });

    it('returns info for unassigned item', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [{ id: 'p1', name: 'Alice', selectedItems: [] }],
      });

      const info = bill.getItemSplitInfo(0);
      expect(info.isFullyAssigned).toBe(false);
      expect(info.isUnassigned).toBe(true);
      expect(info.totalAssignedPercentage).toBe(0);
    });

    it('returns info for over-assigned item', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [
          {
            id: 'p1',
            name: 'Alice',
            selectedItems: [{ itemIndex: 0, percentage: 70 }],
          },
          {
            id: 'p2',
            name: 'Bob',
            selectedItems: [{ itemIndex: 0, percentage: 50 }],
          },
        ],
      });

      const info = bill.getItemSplitInfo(0);
      expect(info.isFullyAssigned).toBe(false);
      expect(info.isOverAssigned).toBe(true);
      expect(info.totalAssignedPercentage).toBe(120);
    });

    it('returns info for partially assigned item', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [
          {
            id: 'p1',
            name: 'Alice',
            selectedItems: [{ itemIndex: 0, percentage: 50 }],
          },
        ],
      });

      const info = bill.getItemSplitInfo(0);
      expect(info.isFullyAssigned).toBe(false);
      expect(info.totalAssignedPercentage).toBe(50);
      expect(info.remainderPercentage).toBe(50);
    });
  });

  describe('isFullyAssigned', () => {
    it('returns false for empty bill', () => {
      const bill = createTestBill();
      expect(bill.isFullyAssigned).toBe(false);
    });

    it('returns false when no participants', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
      });
      expect(bill.isFullyAssigned).toBe(false);
    });

    it('returns false when item unassigned', () => {
      const bill = createTestBill({
        rawItems: [
          { name: 'Pizza', price: 30 },
          { name: 'Pasta', price: 20 },
        ],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });
      expect(bill.isFullyAssigned).toBe(false);
    });

    it('returns true when all items fully assigned', () => {
      const bill = createTestBill({
        rawItems: [
          { name: 'Pizza', price: 30 },
          { name: 'Pasta', price: 20 },
        ],
        participants: [
          {
            id: 'p1',
            name: 'Alice',
            selectedItems: [{ itemIndex: 0 }, { itemIndex: 1 }],
          },
        ],
      });
      expect(bill.isFullyAssigned).toBe(true);
    });
  });

  describe('status', () => {
    it('is draft when no items', () => {
      const bill = createTestBill();
      expect(bill.status).toBe('draft');
    });

    it('is draft when items but no participants', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
      });
      expect(bill.status).toBe('draft');
    });

    it('is splitting when participants but not fully assigned', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [{ id: 'p1', name: 'Alice', selectedItems: [] }],
      });
      expect(bill.status).toBe('splitting');
    });

    it('is completed when fully assigned', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });
      expect(bill.status).toBe('completed');
    });
  });

  describe('edge cases: add item after split started', () => {
    it('new item is unassigned and changes status', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      expect(bill.status).toBe('completed');
      expect(bill.isFullyAssigned).toBe(true);

      const newBill = bill.addItem({ name: 'Pasta', price: 20 });

      expect(newBill.status).toBe('splitting');
      expect(newBill.isFullyAssigned).toBe(false);
      expect(newBill.getItemSplitInfo(1).isUnassigned).toBe(true);
    });

    it('existing selections remain valid', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      const newBill = bill.addItem({ name: 'Pasta', price: 20 });

      expect(newBill.getParticipantTotal('p1')).toBe(30);
      expect(newBill.participants[0].selectedItems).toEqual([{ itemIndex: 0 }]);
    });
  });

  describe('edge cases: add tax after split started', () => {
    it('recalculates all totals with new tax', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 100 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
          { id: 'p2', name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      expect(bill.getParticipantTotal('p1')).toBe(50);
      expect(bill.getParticipantTotal('p2')).toBe(50);
      expect(bill.grandTotal).toBe(100);

      const newBill = bill.addTax({ label: 'Tax', percent: 20 });

      expect(newBill.grandTotal).toBe(120);
      expect(newBill.getParticipantTotal('p1')).toBe(60);
      expect(newBill.getParticipantTotal('p2')).toBe(60);
    });

    it('status remains same after adding tax', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 100 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      expect(bill.status).toBe('completed');

      const newBill = bill.addTax({ label: 'Tax', percent: 10 });

      expect(newBill.status).toBe('completed');
    });
  });

  describe('edge cases: modify tax after split', () => {
    it('recalculates totals when tax updated', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 100 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      expect(bill.getParticipantTotal('p1')).toBeCloseTo(110);

      const newBill = bill.updateTax('t1', { percent: 20 });

      expect(newBill.getParticipantTotal('p1')).toBeCloseTo(120);
    });

    it('recalculates totals when tax removed', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 100 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      expect(bill.getParticipantTotal('p1')).toBeCloseTo(110);

      const newBill = bill.removeTax('t1');

      expect(newBill.getParticipantTotal('p1')).toBeCloseTo(100);
    });
  });

  describe('serialization', () => {
    it('toData returns plain object', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      const data = bill.toData();

      expect(data).toEqual({
        id: 'test-bill-id',
        name: 'Test Bill',
        createdAt: 1000,
        rawItems: [{ name: 'Pizza', price: 30 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });
    });

    it('fromData creates Bill from plain object', () => {
      const data: BillData = {
        id: 'test-id',
        name: 'Test',
        createdAt: 1000,
        rawItems: [{ name: 'Pizza', price: 30 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      };

      const bill = Bill.fromData(data);

      expect(bill.id).toBe('test-id');
      expect(bill.rawItems).toHaveLength(1);
      expect(bill.items[0].price).toBe(33);
      expect(bill.getParticipantTotal('p1')).toBe(33);
    });

    it('round-trips through JSON', () => {
      const original = createTestBill({
        rawItems: [{ name: 'Pizza', price: 30 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      const json = JSON.stringify(original.toData());
      const restored = Bill.fromData(JSON.parse(json));

      expect(restored.grandTotal).toBe(original.grandTotal);
      expect(restored.participantTotals).toEqual(original.participantTotals);
      expect(restored.status).toBe(original.status);
    });
  });

  describe('complex scenarios', () => {
    it('handles multiple items with mixed assignments', () => {
      const bill = createTestBill({
        rawItems: [
          { name: 'Shared Appetizer', price: 30 },
          { name: 'Alice Steak', price: 50 },
          { name: 'Wine', price: 60 },
        ],
        taxes: [{ id: 't1', label: 'Tax', percent: 10 }],
        participants: [
          {
            id: 'p1',
            name: 'Alice',
            selectedItems: [
              { itemIndex: 0 },
              { itemIndex: 1, percentage: 100 },
              { itemIndex: 2, percentage: 50 },
            ],
          },
          {
            id: 'p2',
            name: 'Bob',
            selectedItems: [{ itemIndex: 0 }, { itemIndex: 2 }],
          },
          {
            id: 'p3',
            name: 'Charlie',
            selectedItems: [{ itemIndex: 0 }, { itemIndex: 2 }],
          },
        ],
      });

      expect(bill.grandTotal).toBeCloseTo(154);
      expect(bill.isFullyAssigned).toBe(true);

      const aliceTotal = bill.getParticipantTotal('p1');
      const bobTotal = bill.getParticipantTotal('p2');
      const charlieTotal = bill.getParticipantTotal('p3');

      expect(aliceTotal).toBeCloseTo(11 + 55 + 33);
      expect(bobTotal).toBeCloseTo(11 + 16.5);
      expect(charlieTotal).toBeCloseTo(11 + 16.5);

      expect(aliceTotal + bobTotal + charlieTotal).toBeCloseTo(154);
    });

    it('handles decimal prices with tax', () => {
      const bill = createTestBill({
        rawItems: [{ name: 'Coffee', price: 4.75 }],
        taxes: [{ id: 't1', label: 'Tax', percent: 8.875 }],
        participants: [
          { id: 'p1', name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        ],
      });

      expect(bill.items[0].price).toBeCloseTo(5.17);
      expect(bill.getParticipantTotal('p1')).toBeCloseTo(5.17);
    });
  });
});
