import {
  BillStorageService,
  StorageAdapter,
  serializeBills,
  deserializeBills,
} from './billStorage';
import { Bill, BillData } from './Bill';

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

function createMockAdapter(): StorageAdapter & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

function createTestBillData(overrides: Partial<BillData> = {}): BillData {
  return {
    id: `test-id-${++idCounter}`,
    name: 'Test Bill',
    createdAt: Date.now(),
    rawItems: [],
    taxes: [],
    participants: [],
    ...overrides,
  };
}

describe('billStorage', () => {
  describe('serializeBills/deserializeBills', () => {
    it('round-trips bill data correctly', () => {
      const billData: BillData[] = [createTestBillData({ name: 'Test Bill' })];
      const serialized = serializeBills(billData);
      const deserialized = deserializeBills(serialized);
      expect(deserialized).toHaveLength(1);
      expect(deserialized[0].name).toBe('Test Bill');
    });

    it('handles null data', () => {
      expect(deserializeBills(null)).toEqual([]);
    });

    it('handles invalid JSON', () => {
      expect(deserializeBills('invalid json')).toEqual([]);
    });

    it('handles non-array JSON', () => {
      expect(deserializeBills('{"not": "array"}')).toEqual([]);
    });

    it('handles empty array', () => {
      expect(deserializeBills('[]')).toEqual([]);
    });
  });

  describe('BillStorageService', () => {
    let adapter: ReturnType<typeof createMockAdapter>;
    let service: BillStorageService;

    beforeEach(() => {
      adapter = createMockAdapter();
      service = new BillStorageService(adapter);
    });

    it('returns empty array when no bills stored', () => {
      expect(service.getAllBills()).toEqual([]);
    });

    it('saves and retrieves a bill', () => {
      const bill = Bill.create('Test');
      service.saveBill(bill);

      const bills = service.getAllBills();
      expect(bills).toHaveLength(1);
      expect(bills[0].name).toBe('Test');
    });

    it('updates existing bill by id', () => {
      const bill = Bill.create('Original');
      service.saveBill(bill);

      const updatedBill = bill.addItem({ name: 'Item', price: 10 });
      service.saveBill(updatedBill);

      const bills = service.getAllBills();
      expect(bills).toHaveLength(1);
      expect(bills[0].rawItems).toHaveLength(1);
    });

    it('deletes a bill', () => {
      const bill1 = Bill.create('Bill 1');
      const bill2 = Bill.create('Bill 2');
      service.saveBill(bill1);
      service.saveBill(bill2);

      service.deleteBill(bill1.id);

      const bills = service.getAllBills();
      expect(bills).toHaveLength(1);
      expect(bills[0].name).toBe('Bill 2');
    });

    it('handles deleting non-existent bill', () => {
      const bill = Bill.create('Bill 1');
      service.saveBill(bill);

      service.deleteBill('non-existent');

      const bills = service.getAllBills();
      expect(bills).toHaveLength(1);
    });

    it('gets bill by id', () => {
      const bill = Bill.create('Find Me');
      service.saveBill(bill);

      const found = service.getBillById(bill.id);
      expect(found?.name).toBe('Find Me');
    });

    it('returns undefined for non-existent bill id', () => {
      expect(service.getBillById('non-existent')).toBeUndefined();
    });

    it('sorts bills by date descending', () => {
      const billData = [
        createTestBillData({ name: 'Oldest', createdAt: 1000 }),
        createTestBillData({ name: 'Newest', createdAt: 3000 }),
        createTestBillData({ name: 'Middle', createdAt: 2000 }),
      ];
      adapter.setItem('quicksplit_bills', JSON.stringify(billData));

      const sorted = service.getBillsSortedByDate();
      expect(sorted[0].name).toBe('Newest');
      expect(sorted[1].name).toBe('Middle');
      expect(sorted[2].name).toBe('Oldest');
    });

    it('tracks current bill id', () => {
      service.setCurrentBillId('abc-123');
      expect(service.getCurrentBillId()).toBe('abc-123');

      service.setCurrentBillId(null);
      expect(service.getCurrentBillId()).toBeNull();
    });

    it('saves multiple bills', () => {
      service.saveBill(Bill.create('Bill 1'));
      service.saveBill(Bill.create('Bill 2'));
      service.saveBill(Bill.create('Bill 3'));

      expect(service.getAllBills()).toHaveLength(3);
    });

    it('preserves bill data through save/load cycle', () => {
      let bill = Bill.create('Full Bill');
      bill = bill.addItem({ name: 'Item 1', price: 10 });
      bill = bill.addTax({ label: 'Tax', percent: 5 });
      bill = bill.addParticipant('Alice');
      bill = bill.setParticipantItemSelection(bill.participants[0].id, 0, true);

      service.saveBill(bill);
      const loaded = service.getBillById(bill.id);

      expect(loaded?.name).toBe('Full Bill');
      expect(loaded?.rawItems).toEqual([{ name: 'Item 1', price: 10 }]);
      expect(loaded?.taxes[0].label).toBe('Tax');
      expect(loaded?.taxes[0].percent).toBe(5);
      expect(loaded?.participants[0].name).toBe('Alice');
      expect(loaded?.participants[0].selectedItems).toHaveLength(1);
      expect(loaded?.items[0].price).toBeCloseTo(10.5);
    });
  });
});
