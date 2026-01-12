import Tesseract from 'tesseract.js';
import { BillItem, ParsedBill } from '../types';

export async function extractTextFromImage(imageFile: File): Promise<string> {
  const result = await Tesseract.recognize(imageFile, 'eng', {
    logger: (m) => console.log(m),
  });
  return result.data.text;
}

export function parseLineIntoBillItem(line: string): BillItem | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Match patterns like "Item Name 12.99" or "Item Name $12.99"
  const pricePattern = /^(.+?)\s+\$?(\d+\.?\d*)\s*$/;
  const match = trimmed.match(pricePattern);

  if (match) {
    const name = match[1].trim();
    const price = parseFloat(match[2]);
    if (name && !isNaN(price)) {
      return { name, price };
    }
  }

  return null;
}

export function parseTextIntoBillItems(text: string): BillItem[] {
  const lines = text.split('\n');
  const items: BillItem[] = [];

  for (const line of lines) {
    const item = parseLineIntoBillItem(line);
    if (item) {
      items.push(item);
    }
  }

  return items;
}

export async function parseBillImage(imageFile: File): Promise<ParsedBill> {
  const rawText = await extractTextFromImage(imageFile);
  const items = parseTextIntoBillItems(rawText);
  return { items, rawText };
}
