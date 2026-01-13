import {
  calculateSplit,
  getItemSplitInfo,
  getParticipantItemContribution,
  ParticipantSelection,
} from './splitCalculator';
import { BillItem } from '../types';

describe('splitCalculator', () => {
  describe('getItemSplitInfo', () => {
    it('calculates fixed percentage and remainder correctly', () => {
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 50 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
        { name: 'Charlie', selectedItems: [{ itemIndex: 0 }] },
      ];

      const info = getItemSplitInfo(0, participants);

      expect(info.fixedPercentageTotal).toBe(50);
      expect(info.remainderParticipantCount).toBe(2);
      expect(info.remainderPercentage).toBe(50);
      expect(info.totalAssignedPercentage).toBe(100);
      expect(info.isFullyAssigned).toBe(true);
    });

    it('handles all fixed percentages', () => {
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 60 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0, percentage: 40 }] },
      ];

      const info = getItemSplitInfo(0, participants);

      expect(info.fixedPercentageTotal).toBe(100);
      expect(info.remainderParticipantCount).toBe(0);
      expect(info.remainderPercentage).toBe(0);
      expect(info.totalAssignedPercentage).toBe(100);
      expect(info.isFullyAssigned).toBe(true);
    });

    it('handles all equal splits', () => {
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
      ];

      const info = getItemSplitInfo(0, participants);

      expect(info.fixedPercentageTotal).toBe(0);
      expect(info.remainderParticipantCount).toBe(2);
      expect(info.remainderPercentage).toBe(100);
      expect(info.totalAssignedPercentage).toBe(100);
      expect(info.isFullyAssigned).toBe(true);
    });

    it('detects under-assignment (fixed only, no remainder participants)', () => {
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 50 }] },
      ];

      const info = getItemSplitInfo(0, participants);

      expect(info.fixedPercentageTotal).toBe(50);
      expect(info.remainderParticipantCount).toBe(0);
      expect(info.totalAssignedPercentage).toBe(50);
      expect(info.isFullyAssigned).toBe(false);
    });

    it('detects over-assignment', () => {
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 70 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0, percentage: 50 }] },
      ];

      const info = getItemSplitInfo(0, participants);

      expect(info.fixedPercentageTotal).toBe(120);
      expect(info.totalAssignedPercentage).toBe(120);
      expect(info.isFullyAssigned).toBe(false);
    });

    it('detects unassigned item', () => {
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [] },
      ];

      const info = getItemSplitInfo(0, participants);

      expect(info.fixedPercentageTotal).toBe(0);
      expect(info.remainderParticipantCount).toBe(0);
      expect(info.totalAssignedPercentage).toBe(0);
      expect(info.isFullyAssigned).toBe(false);
    });
  });

  describe('getParticipantItemContribution', () => {
    it('calculates fixed percentage contribution', () => {
      const items: BillItem[] = [{ name: 'Burger', price: 100 }];
      const participant: ParticipantSelection = {
        name: 'Alice',
        selectedItems: [{ itemIndex: 0, percentage: 50 }],
      };
      const allParticipants = [participant];

      const contribution = getParticipantItemContribution(
        participant,
        0,
        items[0],
        allParticipants
      );

      expect(contribution).toBe(50);
    });

    it('calculates remainder split contribution', () => {
      const items: BillItem[] = [{ name: 'Burger', price: 100 }];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 50 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
        { name: 'Charlie', selectedItems: [{ itemIndex: 0 }] },
      ];

      const bobContribution = getParticipantItemContribution(
        participants[1],
        0,
        items[0],
        participants
      );

      expect(bobContribution).toBe(25); // 50% remainder / 2 people = 25%
    });
  });

  describe('calculateSplit', () => {
    it('splits equally when no percentages specified', () => {
      const items: BillItem[] = [
        { name: 'Burgers', price: 50 },
        { name: 'Fries', price: 15 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0 }, { itemIndex: 1 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0 }, { itemIndex: 1 }] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.grandTotal).toBe(65);
      expect(result.isFullyAssigned).toBe(true);
      result.participantTotals.forEach((p) => {
        expect(p.total).toBeCloseTo(32.5, 10);
      });
    });

    it('handles mixed percentage and equal splits', () => {
      const items: BillItem[] = [{ name: 'Expensive Steak', price: 100 }];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 50 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
        { name: 'Charlie', selectedItems: [{ itemIndex: 0 }] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.isFullyAssigned).toBe(true);
      expect(result.participantTotals.find((p) => p.name === 'Alice')?.total).toBe(50);
      expect(result.participantTotals.find((p) => p.name === 'Bob')?.total).toBe(25);
      expect(result.participantTotals.find((p) => p.name === 'Charlie')?.total).toBe(25);
    });

    it('handles multiple fixed percentages', () => {
      const items: BillItem[] = [{ name: 'Wine', price: 100 }];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 60 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0, percentage: 40 }] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.isFullyAssigned).toBe(true);
      expect(result.participantTotals.find((p) => p.name === 'Alice')?.total).toBe(60);
      expect(result.participantTotals.find((p) => p.name === 'Bob')?.total).toBe(40);
    });

    it('handles complex scenario with multiple items and mixed splits', () => {
      const items: BillItem[] = [
        { name: 'Shared Appetizer', price: 30 },
        { name: 'Alice Entree', price: 40 },
        { name: 'Wine', price: 60 },
      ];
      const participants: ParticipantSelection[] = [
        {
          name: 'Alice',
          selectedItems: [
            { itemIndex: 0 },
            { itemIndex: 1, percentage: 100 },
            { itemIndex: 2, percentage: 50 },
          ],
        },
        {
          name: 'Bob',
          selectedItems: [
            { itemIndex: 0 },
            { itemIndex: 2 },
          ],
        },
        {
          name: 'Charlie',
          selectedItems: [
            { itemIndex: 0 },
            { itemIndex: 2 },
          ],
        },
      ];

      const result = calculateSplit(items, participants);

      expect(result.grandTotal).toBe(130);
      expect(result.isFullyAssigned).toBe(true);

      const alice = result.participantTotals.find((p) => p.name === 'Alice')!;
      const bob = result.participantTotals.find((p) => p.name === 'Bob')!;
      const charlie = result.participantTotals.find((p) => p.name === 'Charlie')!;

      // Alice: Appetizer/3 + Entree(100%) + Wine(50%)
      expect(alice.total).toBeCloseTo(10 + 40 + 30, 10);
      // Bob: Appetizer/3 + Wine(25% of remainder)
      expect(bob.total).toBeCloseTo(10 + 15, 10);
      // Charlie: same as Bob
      expect(charlie.total).toBeCloseTo(10 + 15, 10);
    });

    it('detects incomplete assignment', () => {
      const items: BillItem[] = [
        { name: 'Pizza', price: 30 },
        { name: 'Pasta', price: 20 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0 }] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.grandTotal).toBe(50);
      expect(result.assignedTotal).toBe(30);
      expect(result.isFullyAssigned).toBe(false);
    });

    it('handles empty participants', () => {
      const items: BillItem[] = [{ name: 'Pizza', price: 20 }];

      const result = calculateSplit(items, []);

      expect(result.grandTotal).toBe(20);
      expect(result.assignedTotal).toBe(0);
      expect(result.isFullyAssigned).toBe(false);
    });

    it('handles decimal prices correctly', () => {
      const items: BillItem[] = [{ name: 'Coffee', price: 4.75 }];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 60 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0 }] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.isFullyAssigned).toBe(true);
      expect(result.participantTotals.find((p) => p.name === 'Alice')?.total).toBeCloseTo(2.85, 10);
      expect(result.participantTotals.find((p) => p.name === 'Bob')?.total).toBeCloseTo(1.90, 10);
    });

    it('handles over-allocation gracefully (percentages > 100%)', () => {
      const items: BillItem[] = [{ name: 'Item', price: 100 }];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 70 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0, percentage: 50 }] },
      ];

      const result = calculateSplit(items, participants);

      // Over-allocation: 70 + 50 = 120%, remainder = 0
      expect(result.participantTotals.find((p) => p.name === 'Alice')?.total).toBe(70);
      expect(result.participantTotals.find((p) => p.name === 'Bob')?.total).toBe(50);
      expect(result.assignedTotal).toBe(120); // Over the total
      expect(result.isFullyAssigned).toBe(false); // Over-allocated is NOT fully assigned
    });

    it('detects when over-allocation on one item masks under-allocation on another', () => {
      const items: BillItem[] = [
        { name: 'Item A', price: 50 },
        { name: 'Item B', price: 50 },
      ];
      const participants: ParticipantSelection[] = [
        // Item A: 150% over-allocated, Item B: 0% unassigned
        { name: 'Alice', selectedItems: [{ itemIndex: 0, percentage: 100 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0, percentage: 50 }] },
      ];

      const result = calculateSplit(items, participants);

      // Total amounts: Alice $50, Bob $25 = $75 assigned out of $100
      // But the real issue: Item A is 150%, Item B is 0%
      expect(result.assignedTotal).toBe(75);
      expect(result.grandTotal).toBe(100);
      expect(result.isFullyAssigned).toBe(false); // Each item must be 100%, not just totals
    });

    it('validates per-item assignment correctly', () => {
      const items: BillItem[] = [
        { name: 'Item A', price: 60 },
        { name: 'Item B', price: 40 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItems: [{ itemIndex: 0 }, { itemIndex: 1, percentage: 50 }] },
        { name: 'Bob', selectedItems: [{ itemIndex: 0 }, { itemIndex: 1, percentage: 50 }] },
      ];

      const result = calculateSplit(items, participants);

      // Item A: split equally (100%), Item B: 50% + 50% = 100%
      expect(result.isFullyAssigned).toBe(true);
      expect(result.participantTotals.find((p) => p.name === 'Alice')?.total).toBe(50); // 30 + 20
      expect(result.participantTotals.find((p) => p.name === 'Bob')?.total).toBe(50); // 30 + 20
    });
  });
});
