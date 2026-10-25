import { ReceiptData, Participant, ParticipantShareBreakdown, CurrencyCode, CURRENCIES } from '../types';

export const AVATAR_COLORS = [
  '#0284c7', // sky-600
  '#0d9488', // teal-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#ea580c', // orange-600
  '#d97706', // amber-600
  '#db2777', // pink-600
  '#059669', // emerald-600
];

export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode | string = 'USD'
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  // Find matching currency config
  let config = CURRENCIES[currency as CurrencyCode];
  if (!config) {
    // Check if the symbol was passed directly
    const match = Object.values(CURRENCIES).find((c) => c.symbol === currency);
    if (match) {
      config = match;
    } else {
      config = CURRENCIES.USD;
    }
  }

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);

  const prefix = config.symbol.length > 1 ? `${config.symbol} ` : config.symbol;
  return `${prefix}${formattedNum}`;
}

export interface BillSummary {
  breakdowns: ParticipantShareBreakdown[];
  grandTotal: number;
  totalAssigned: number;
  unassignedTotal: number;
  unassignedItemsCount: number;
  isFullyAssigned: boolean;
  percentAssigned: number;
}

export function calculateBillSummary(
  receipt: ReceiptData,
  participants: Participant[]
): BillSummary {
  const grandTotal = receipt.items.reduce((sum, item) => sum + item.price, 0);

  const participantMap = new Map<string, ParticipantShareBreakdown>();
  participants.forEach((p) => {
    participantMap.set(p.id, {
      participantId: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      items: [],
      totalOwed: 0,
      sharePercentage: 0,
    });
  });

  let totalAssigned = 0;
  let unassignedItemsCount = 0;

  receipt.items.forEach((item) => {
    if (!item.assignedTo || item.assignedTo.length === 0) {
      unassignedItemsCount++;
      return;
    }

    const validAssignees = item.assignedTo.filter((id) => participantMap.has(id));
    if (validAssignees.length === 0) {
      unassignedItemsCount++;
      return;
    }

    const sharePerPerson = item.price / validAssignees.length;

    validAssignees.forEach((pId) => {
      const breakdown = participantMap.get(pId)!;
      breakdown.items.push({
        itemId: item.id,
        name: item.name,
        fullPrice: item.price,
        splitCount: validAssignees.length,
        shareAmount: sharePerPerson,
      });
      breakdown.totalOwed += sharePerPerson;
      totalAssigned += sharePerPerson;
    });
  });

  const unassignedTotal = Math.max(0, grandTotal - totalAssigned);
  const percentAssigned = grandTotal > 0 ? (totalAssigned / grandTotal) * 100 : 0;

  participantMap.forEach((breakdown) => {
    if (grandTotal > 0) {
      breakdown.sharePercentage = (breakdown.totalOwed / grandTotal) * 100;
    }
  });

  return {
    breakdowns: Array.from(participantMap.values()),
    grandTotal,
    totalAssigned,
    unassignedTotal,
    unassignedItemsCount,
    isFullyAssigned: unassignedItemsCount === 0 && unassignedTotal < 0.01,
    percentAssigned: Math.min(100, Math.round(percentAssigned)),
  };
}
