import {
  calculateSplit,
  calculateItemParticipantCounts,
  calculateParticipantTotal,
  getItemContribution,
  ParticipantSelection,
} from './splitCalculator';
import { BillItem } from '../types';

describe('splitCalculator', () => {
  describe('calculateItemParticipantCounts', () => {
    it('counts how many participants selected each item', () => {
      const items: BillItem[] = [
        { name: 'Pizza', price: 20 },
        { name: 'Salad', price: 10 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItemIndices: [0, 1] },
        { name: 'Bob', selectedItemIndices: [0] },
      ];

      const counts = calculateItemParticipantCounts(items, participants);

      expect(counts).toEqual([2, 1]);
    });

    it('returns zeros when no participants', () => {
      const items: BillItem[] = [
        { name: 'Pizza', price: 20 },
      ];

      const counts = calculateItemParticipantCounts(items, []);

      expect(counts).toEqual([0]);
    });
  });

  describe('getItemContribution', () => {
    it('returns item price divided by participant count', () => {
      const items: BillItem[] = [{ name: 'Burger', price: 50 }];
      const counts = [5];

      const contribution = getItemContribution(0, items, counts);

      expect(contribution).toBe(10);
    });

    it('returns full price when count is zero', () => {
      const items: BillItem[] = [{ name: 'Burger', price: 50 }];
      const counts = [0];

      const contribution = getItemContribution(0, items, counts);

      expect(contribution).toBe(50);
    });
  });

  describe('calculateParticipantTotal', () => {
    it('sums contributions for selected items', () => {
      const items: BillItem[] = [
        { name: 'Pizza', price: 20 },
        { name: 'Salad', price: 10 },
      ];
      const participant: ParticipantSelection = {
        name: 'Alice',
        selectedItemIndices: [0, 1],
      };
      const counts = [2, 1];

      const total = calculateParticipantTotal(participant, items, counts);

      expect(total).toBe(10 + 10); // 20/2 + 10/1
    });
  });

  describe('calculateSplit', () => {
    it('splits a simple restaurant bill equally', () => {
      const items: BillItem[] = [
        { name: 'Burgers', price: 50 },
        { name: 'Fries', price: 15 },
        { name: 'Drinks', price: 20 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItemIndices: [0, 1, 2] },
        { name: 'Bob', selectedItemIndices: [0, 1, 2] },
        { name: 'Charlie', selectedItemIndices: [0, 1, 2] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.grandTotal).toBe(85);
      expect(result.isFullyAssigned).toBe(true);
      expect(result.participantTotals).toHaveLength(3);
      result.participantTotals.forEach((p) => {
        expect(p.total).toBeCloseTo(85 / 3, 10);
      });
    });

    it('handles unequal item selection', () => {
      const items: BillItem[] = [
        { name: 'Steak', price: 40 },
        { name: 'Salad', price: 12 },
        { name: 'Wine', price: 30 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItemIndices: [0, 2] },
        { name: 'Bob', selectedItemIndices: [1, 2] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.grandTotal).toBe(82);
      expect(result.isFullyAssigned).toBe(true);

      const alice = result.participantTotals.find((p) => p.name === 'Alice')!;
      const bob = result.participantTotals.find((p) => p.name === 'Bob')!;

      expect(alice.total).toBeCloseTo(40 + 15, 10); // Steak alone + Wine split
      expect(bob.total).toBeCloseTo(12 + 15, 10); // Salad alone + Wine split
    });

    it('handles five people splitting burgers', () => {
      const items: BillItem[] = [{ name: 'Burgers', price: 50 }];
      const participants: ParticipantSelection[] = [
        { name: 'Person1', selectedItemIndices: [0] },
        { name: 'Person2', selectedItemIndices: [0] },
        { name: 'Person3', selectedItemIndices: [0] },
        { name: 'Person4', selectedItemIndices: [0] },
        { name: 'Person5', selectedItemIndices: [0] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.isFullyAssigned).toBe(true);
      result.participantTotals.forEach((p) => {
        expect(p.total).toBe(10);
      });
    });

    it('handles four people splitting burgers', () => {
      const items: BillItem[] = [{ name: 'Burgers', price: 50 }];
      const participants: ParticipantSelection[] = [
        { name: 'Person1', selectedItemIndices: [0] },
        { name: 'Person2', selectedItemIndices: [0] },
        { name: 'Person3', selectedItemIndices: [0] },
        { name: 'Person4', selectedItemIndices: [0] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.isFullyAssigned).toBe(true);
      result.participantTotals.forEach((p) => {
        expect(p.total).toBe(12.5);
      });
    });

    it('detects incomplete assignment', () => {
      const items: BillItem[] = [
        { name: 'Pizza', price: 30 },
        { name: 'Pasta', price: 20 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItemIndices: [0] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.grandTotal).toBe(50);
      expect(result.assignedTotal).toBe(30);
      expect(result.isFullyAssigned).toBe(false);
    });

    it('handles complex dinner scenario', () => {
      const items: BillItem[] = [
        { name: 'Appetizer Platter', price: 24 },
        { name: 'Steak', price: 45 },
        { name: 'Salmon', price: 38 },
        { name: 'Pasta', price: 22 },
        { name: 'Dessert Sampler', price: 18 },
        { name: 'Wine Bottle', price: 60 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItemIndices: [0, 1, 4, 5] },
        { name: 'Bob', selectedItemIndices: [0, 2, 4, 5] },
        { name: 'Charlie', selectedItemIndices: [0, 3, 5] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.grandTotal).toBe(207);
      expect(result.isFullyAssigned).toBe(true);
      expect(result.assignedTotal).toBeCloseTo(207, 10);

      const alice = result.participantTotals.find((p) => p.name === 'Alice')!;
      const bob = result.participantTotals.find((p) => p.name === 'Bob')!;
      const charlie = result.participantTotals.find((p) => p.name === 'Charlie')!;

      // Alice: Appetizer/3 + Steak + Dessert/2 + Wine/3
      expect(alice.total).toBeCloseTo(24 / 3 + 45 + 18 / 2 + 60 / 3, 10);
      // Bob: Appetizer/3 + Salmon + Dessert/2 + Wine/3
      expect(bob.total).toBeCloseTo(24 / 3 + 38 + 18 / 2 + 60 / 3, 10);
      // Charlie: Appetizer/3 + Pasta + Wine/3
      expect(charlie.total).toBeCloseTo(24 / 3 + 22 + 60 / 3, 10);
    });

    it('handles edge case of empty bill', () => {
      const items: BillItem[] = [];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItemIndices: [] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.grandTotal).toBe(0);
      expect(result.assignedTotal).toBe(0);
      // Empty bill with participants is technically "fully assigned" (nothing to assign)
      expect(result.isFullyAssigned).toBe(true);
    });

    it('handles no participants', () => {
      const items: BillItem[] = [{ name: 'Pizza', price: 20 }];

      const result = calculateSplit(items, []);

      expect(result.grandTotal).toBe(20);
      expect(result.assignedTotal).toBe(0);
      expect(result.isFullyAssigned).toBe(false);
    });

    it('handles decimal prices correctly', () => {
      const items: BillItem[] = [
        { name: 'Coffee', price: 4.75 },
        { name: 'Muffin', price: 3.50 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Alice', selectedItemIndices: [0, 1] },
        { name: 'Bob', selectedItemIndices: [0, 1] },
      ];

      const result = calculateSplit(items, participants);

      expect(result.grandTotal).toBeCloseTo(8.25, 10);
      expect(result.isFullyAssigned).toBe(true);
      result.participantTotals.forEach((p) => {
        expect(p.total).toBeCloseTo(4.125, 10);
      });
    });

    it('handles one person paying for everything', () => {
      const items: BillItem[] = [
        { name: 'Dinner', price: 100 },
        { name: 'Drinks', price: 50 },
      ];
      const participants: ParticipantSelection[] = [
        { name: 'Generous Alice', selectedItemIndices: [0, 1] },
        { name: 'Lucky Bob', selectedItemIndices: [] },
      ];

      const result = calculateSplit(items, participants);

      const alice = result.participantTotals.find((p) => p.name === 'Generous Alice')!;
      const bob = result.participantTotals.find((p) => p.name === 'Lucky Bob')!;

      expect(alice.total).toBe(150);
      expect(bob.total).toBe(0);
      expect(result.isFullyAssigned).toBe(true);
    });
  });
});
