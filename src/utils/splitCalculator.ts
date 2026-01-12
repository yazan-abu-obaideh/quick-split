import { BillItem } from '../types';

export interface ParticipantSelection {
  name: string;
  selectedItemIndices: number[];
}

export interface ParticipantTotal {
  name: string;
  total: number;
}

export interface SplitResult {
  participantTotals: ParticipantTotal[];
  assignedTotal: number;
  grandTotal: number;
  isFullyAssigned: boolean;
}

export function calculateItemParticipantCounts(
  items: BillItem[],
  participants: ParticipantSelection[]
): number[] {
  return items.map((_, index) =>
    participants.filter((p) => p.selectedItemIndices.includes(index)).length
  );
}

export function calculateParticipantTotal(
  participant: ParticipantSelection,
  items: BillItem[],
  itemParticipantCounts: number[]
): number {
  return participant.selectedItemIndices.reduce((sum, itemIndex) => {
    const item = items[itemIndex];
    const count = itemParticipantCounts[itemIndex];
    if (!item || count === 0) return sum;
    return sum + item.price / count;
  }, 0);
}

export function calculateSplit(
  items: BillItem[],
  participants: ParticipantSelection[]
): SplitResult {
  const grandTotal = items.reduce((sum, item) => sum + item.price, 0);
  const itemParticipantCounts = calculateItemParticipantCounts(items, participants);

  const participantTotals = participants.map((p) => ({
    name: p.name,
    total: calculateParticipantTotal(p, items, itemParticipantCounts),
  }));

  const assignedTotal = participantTotals.reduce((sum, p) => sum + p.total, 0);
  const isFullyAssigned = Math.abs(assignedTotal - grandTotal) < 0.01 && participants.length > 0;

  return {
    participantTotals,
    assignedTotal,
    grandTotal,
    isFullyAssigned,
  };
}

export function getItemContribution(
  itemIndex: number,
  items: BillItem[],
  itemParticipantCounts: number[]
): number {
  const item = items[itemIndex];
  const count = itemParticipantCounts[itemIndex];
  if (!item || count === 0) return item?.price ?? 0;
  return item.price / count;
}
