export interface BillItem {
  name: string;
  price: number;
}

export interface ParsedBill {
  items: BillItem[];
  rawText: string;
}
