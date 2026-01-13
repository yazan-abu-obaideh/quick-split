import { BillItem } from '../types';

export interface ItemSelection {
  itemIndex: number;
  percentage?: number; // undefined = split remainder equally
}

export interface ParticipantSelection {
  name: string;
  selectedItems: ItemSelection[];
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

export interface ItemSplitInfo {
  fixedPercentageTotal: number;
  remainderParticipantCount: number;
  remainderPercentage: number;
  totalAssignedPercentage: number;
  isFullyAssigned: boolean;
}

export function getItemSplitInfo(
  itemIndex: number,
  participants: ParticipantSelection[]
): ItemSplitInfo {
  let fixedPercentageTotal = 0;
  let remainderParticipantCount = 0;

  for (const participant of participants) {
    const selection = participant.selectedItems.find((s) => s.itemIndex === itemIndex);
    if (selection) {
      if (selection.percentage !== undefined) {
        fixedPercentageTotal += selection.percentage;
      } else {
        remainderParticipantCount++;
      }
    }
  }

  const remainderPercentage = Math.max(0, 100 - fixedPercentageTotal);

  // Total assigned: fixed percentages + remainder (if anyone is splitting it)
  const totalAssignedPercentage = fixedPercentageTotal +
    (remainderParticipantCount > 0 ? remainderPercentage : 0);

  // Item is fully assigned if exactly 100% is covered
  const isFullyAssigned = Math.abs(totalAssignedPercentage - 100) < 0.01;

  return {
    fixedPercentageTotal,
    remainderParticipantCount,
    remainderPercentage,
    totalAssignedPercentage,
    isFullyAssigned,
  };
}

export function getParticipantItemContribution(
  participant: ParticipantSelection,
  itemIndex: number,
  item: BillItem,
  participants: ParticipantSelection[]
): number {
  const selection = participant.selectedItems.find((s) => s.itemIndex === itemIndex);
  if (!selection) return 0;

  if (selection.percentage !== undefined) {
    return (item.price * selection.percentage) / 100;
  }

  const info = getItemSplitInfo(itemIndex, participants);
  if (info.remainderParticipantCount === 0) return 0;

  const perPersonPercentage = info.remainderPercentage / info.remainderParticipantCount;
  return (item.price * perPersonPercentage) / 100;
}

export function calculateParticipantTotal(
  participant: ParticipantSelection,
  items: BillItem[],
  participants: ParticipantSelection[]
): number {
  return participant.selectedItems.reduce((sum, selection) => {
    const item = items[selection.itemIndex];
    if (!item) return sum;
    return sum + getParticipantItemContribution(participant, selection.itemIndex, item, participants);
  }, 0);
}

export function calculateSplit(
  items: BillItem[],
  participants: ParticipantSelection[]
): SplitResult {
  const grandTotal = items.reduce((sum, item) => sum + item.price, 0);

  const participantTotals = participants.map((p) => ({
    name: p.name,
    total: calculateParticipantTotal(p, items, participants),
  }));

  const assignedTotal = participantTotals.reduce((sum, p) => sum + p.total, 0);

  // Check if ALL items are exactly 100% assigned (not just total amounts)
  const allItemsAssigned = items.length > 0 &&
    participants.length > 0 &&
    items.every((_, index) => getItemSplitInfo(index, participants).isFullyAssigned);

  return {
    participantTotals,
    assignedTotal,
    grandTotal,
    isFullyAssigned: allItemsAssigned,
  };
}

export function getItemContribution(
  itemIndex: number,
  items: BillItem[],
  participants: ParticipantSelection[],
  forParticipant?: ParticipantSelection
): number {
  const item = items[itemIndex];
  if (!item) return 0;

  if (forParticipant) {
    return getParticipantItemContribution(forParticipant, itemIndex, item, participants);
  }

  // Return the equal split amount for display purposes
  const info = getItemSplitInfo(itemIndex, participants);
  if (info.remainderParticipantCount === 0) {
    return item.price;
  }
  return (item.price * info.remainderPercentage) / 100 / info.remainderParticipantCount;
}
