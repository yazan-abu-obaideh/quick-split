export interface BillItem {
  name: string;
  price: number;
}

export interface TaxEntry {
  id: string;
  label: string;
  percent: number;
}

export interface ItemSelection {
  itemIndex: number;
  percentage?: number;
}

export interface ParticipantData {
  id: string;
  name: string;
  selectedItems: ItemSelection[];
}

export interface ParticipantTotal {
  id: string;
  name: string;
  total: number;
}

export interface ItemSplitInfo {
  itemIndex: number;
  fixedPercentageTotal: number;
  remainderParticipantCount: number;
  remainderPercentage: number;
  totalAssignedPercentage: number;
  isFullyAssigned: boolean;
  isOverAssigned: boolean;
  isUnassigned: boolean;
}

export type BillStatus = 'draft' | 'splitting' | 'completed';

export interface BillData {
  id: string;
  name: string;
  createdAt: number;
  rawItems: BillItem[];
  taxes: TaxEntry[];
  participants: ParticipantData[];
}

export class Bill {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly rawItems: ReadonlyArray<BillItem>;
  readonly taxes: ReadonlyArray<TaxEntry>;
  readonly participants: ReadonlyArray<ParticipantData>;

  constructor(data: BillData) {
    this.id = data.id;
    this.name = data.name;
    this.createdAt = data.createdAt;
    this.rawItems = data.rawItems;
    this.taxes = data.taxes;
    this.participants = data.participants;
  }

  static create(name?: string): Bill {
    const now = Date.now();
    return new Bill({
      id: crypto.randomUUID(),
      name: name ?? generateBillName(now),
      createdAt: now,
      rawItems: [],
      taxes: [],
      participants: [],
    });
  }

  get totalTaxPercent(): number {
    return this.taxes.reduce((sum, t) => sum + t.percent, 0);
  }

  get items(): BillItem[] {
    const multiplier = 1 + this.totalTaxPercent / 100;
    return this.rawItems.map((item) => ({
      name: item.name,
      price: item.price * multiplier,
    }));
  }

  get grandTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  get status(): BillStatus {
    if (this.rawItems.length === 0) {
      return 'draft';
    }
    if (this.participants.length === 0) {
      return 'draft';
    }
    if (this.isFullyAssigned) {
      return 'completed';
    }
    return 'splitting';
  }

  getItemSplitInfo(itemIndex: number): ItemSplitInfo {
    let fixedPercentageTotal = 0;
    let remainderParticipantCount = 0;

    for (const participant of this.participants) {
      const selection = participant.selectedItems.find(
        (s) => s.itemIndex === itemIndex
      );
      if (selection) {
        if (selection.percentage !== undefined) {
          fixedPercentageTotal += selection.percentage;
        } else {
          remainderParticipantCount++;
        }
      }
    }

    const remainderPercentage = Math.max(0, 100 - fixedPercentageTotal);
    const totalAssignedPercentage =
      fixedPercentageTotal +
      (remainderParticipantCount > 0 ? remainderPercentage : 0);

    const isFullyAssigned = Math.abs(totalAssignedPercentage - 100) < 0.01;
    const isOverAssigned = totalAssignedPercentage > 100.01;
    const isUnassigned = totalAssignedPercentage < 0.01;

    return {
      itemIndex,
      fixedPercentageTotal,
      remainderParticipantCount,
      remainderPercentage,
      totalAssignedPercentage,
      isFullyAssigned,
      isOverAssigned,
      isUnassigned,
    };
  }

  getParticipantItemContribution(
    participantId: string,
    itemIndex: number
  ): number {
    const participant = this.participants.find((p) => p.id === participantId);
    if (!participant) return 0;

    const selection = participant.selectedItems.find(
      (s) => s.itemIndex === itemIndex
    );
    if (!selection) return 0;

    const item = this.items[itemIndex];
    if (!item) return 0;

    if (selection.percentage !== undefined) {
      return (item.price * selection.percentage) / 100;
    }

    const info = this.getItemSplitInfo(itemIndex);
    if (info.remainderParticipantCount === 0) return 0;

    const perPersonPercentage =
      info.remainderPercentage / info.remainderParticipantCount;
    return (item.price * perPersonPercentage) / 100;
  }

  getParticipantTotal(participantId: string): number {
    const participant = this.participants.find((p) => p.id === participantId);
    if (!participant) return 0;

    return participant.selectedItems.reduce((sum, selection) => {
      return sum + this.getParticipantItemContribution(participantId, selection.itemIndex);
    }, 0);
  }

  get participantTotals(): ParticipantTotal[] {
    return this.participants.map((p) => ({
      id: p.id,
      name: p.name,
      total: this.getParticipantTotal(p.id),
    }));
  }

  get assignedTotal(): number {
    return this.participantTotals.reduce((sum, p) => sum + p.total, 0);
  }

  get isFullyAssigned(): boolean {
    if (this.items.length === 0) return false;
    if (this.participants.length === 0) return false;
    return this.items.every((_, index) => this.getItemSplitInfo(index).isFullyAssigned);
  }

  get allItemSplitInfo(): ItemSplitInfo[] {
    return this.items.map((_, index) => this.getItemSplitInfo(index));
  }

  // Mutation methods - return new Bill instances

  addItem(item: BillItem): Bill {
    return new Bill({
      ...this.toData(),
      rawItems: [...this.rawItems, item],
    });
  }

  updateItem(index: number, item: BillItem): Bill {
    const newRawItems = [...this.rawItems];
    newRawItems[index] = item;
    return new Bill({
      ...this.toData(),
      rawItems: newRawItems,
    });
  }

  removeItem(index: number): Bill {
    const newRawItems = this.rawItems.filter((_, i) => i !== index);
    const newParticipants = this.participants.map((p) => ({
      ...p,
      selectedItems: p.selectedItems
        .filter((s) => s.itemIndex !== index)
        .map((s) => ({
          ...s,
          itemIndex: s.itemIndex > index ? s.itemIndex - 1 : s.itemIndex,
        })),
    }));

    return new Bill({
      ...this.toData(),
      rawItems: newRawItems,
      participants: newParticipants,
    });
  }

  setTaxes(taxes: TaxEntry[]): Bill {
    return new Bill({
      ...this.toData(),
      taxes,
    });
  }

  addTax(tax: Omit<TaxEntry, 'id'>): Bill {
    const newTax: TaxEntry = { ...tax, id: crypto.randomUUID() };
    return new Bill({
      ...this.toData(),
      taxes: [...this.taxes, newTax],
    });
  }

  updateTax(id: string, updates: Partial<Omit<TaxEntry, 'id'>>): Bill {
    return new Bill({
      ...this.toData(),
      taxes: this.taxes.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    });
  }

  removeTax(id: string): Bill {
    return new Bill({
      ...this.toData(),
      taxes: this.taxes.filter((t) => t.id !== id),
    });
  }

  addParticipant(name: string): Bill {
    const newParticipant: ParticipantData = {
      id: crypto.randomUUID(),
      name,
      selectedItems: [],
    };
    return new Bill({
      ...this.toData(),
      participants: [...this.participants, newParticipant],
    });
  }

  removeParticipant(id: string): Bill {
    return new Bill({
      ...this.toData(),
      participants: this.participants.filter((p) => p.id !== id),
    });
  }

  setParticipantItemSelection(
    participantId: string,
    itemIndex: number,
    selected: boolean,
    percentage?: number
  ): Bill {
    return new Bill({
      ...this.toData(),
      participants: this.participants.map((p) => {
        if (p.id !== participantId) return p;

        const existingIndex = p.selectedItems.findIndex(
          (s) => s.itemIndex === itemIndex
        );

        if (!selected) {
          return {
            ...p,
            selectedItems: p.selectedItems.filter(
              (s) => s.itemIndex !== itemIndex
            ),
          };
        }

        const newSelection: ItemSelection = { itemIndex, percentage };

        if (existingIndex >= 0) {
          const newSelectedItems = [...p.selectedItems];
          newSelectedItems[existingIndex] = newSelection;
          return { ...p, selectedItems: newSelectedItems };
        }

        return {
          ...p,
          selectedItems: [...p.selectedItems, newSelection],
        };
      }),
    });
  }

  setParticipantItemPercentage(
    participantId: string,
    itemIndex: number,
    percentage: number | undefined
  ): Bill {
    return new Bill({
      ...this.toData(),
      participants: this.participants.map((p) => {
        if (p.id !== participantId) return p;

        return {
          ...p,
          selectedItems: p.selectedItems.map((s) =>
            s.itemIndex === itemIndex ? { ...s, percentage } : s
          ),
        };
      }),
    });
  }

  toData(): BillData {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      rawItems: [...this.rawItems],
      taxes: [...this.taxes],
      participants: this.participants.map((p) => ({
        ...p,
        selectedItems: [...p.selectedItems],
      })),
    };
  }

  static fromData(data: BillData): Bill {
    return new Bill(data);
  }
}

export function generateBillName(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return `Bill - ${date.toLocaleDateString('en-US', options)}`;
}
