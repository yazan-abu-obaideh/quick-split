import { Bill, BillData } from './Bill';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = 'quicksplit_bills';
const CURRENT_BILL_KEY = 'quicksplit_current_bill_id';

export function serializeBills(bills: BillData[]): string {
  return JSON.stringify(bills);
}

export function deserializeBills(data: string | null): BillData[] {
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export class BillStorageService {
  constructor(private adapter: StorageAdapter) {}

  getAllBillData(): BillData[] {
    const data = this.adapter.getItem(STORAGE_KEY);
    return deserializeBills(data);
  }

  getAllBills(): Bill[] {
    return this.getAllBillData().map((data) => Bill.fromData(data));
  }

  getBillById(id: string): Bill | undefined {
    const data = this.getAllBillData().find((b) => b.id === id);
    return data ? Bill.fromData(data) : undefined;
  }

  saveBill(bill: Bill): void {
    const bills = this.getAllBillData();
    const existingIndex = bills.findIndex((b) => b.id === bill.id);
    const billData = bill.toData();

    if (existingIndex >= 0) {
      bills[existingIndex] = billData;
    } else {
      bills.push(billData);
    }

    this.adapter.setItem(STORAGE_KEY, serializeBills(bills));
  }

  deleteBill(id: string): void {
    const bills = this.getAllBillData().filter((b) => b.id !== id);
    this.adapter.setItem(STORAGE_KEY, serializeBills(bills));
  }

  getCurrentBillId(): string | null {
    return this.adapter.getItem(CURRENT_BILL_KEY);
  }

  setCurrentBillId(id: string | null): void {
    if (id) {
      this.adapter.setItem(CURRENT_BILL_KEY, id);
    } else {
      this.adapter.removeItem(CURRENT_BILL_KEY);
    }
  }

  getBillsSortedByDate(): Bill[] {
    return this.getAllBills().sort((a, b) => b.createdAt - a.createdAt);
  }
}

export function createLocalStorageAdapter(): StorageAdapter {
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  };
}

let defaultService: BillStorageService | null = null;

export function getBillStorageService(): BillStorageService {
  if (!defaultService) {
    defaultService = new BillStorageService(createLocalStorageAdapter());
  }
  return defaultService;
}
