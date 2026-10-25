export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KSH';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', decimals: 0 },
  KSH: { code: 'KSH', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪', decimals: 2 },
};

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  assignedTo: string[]; // array of participant IDs
}

export interface ReceiptData {
  billTitle: string;
  date: string;
  items: ReceiptItem[];
  total: number;
  currency: CurrencyCode;
}

export interface Participant {
  id: string;
  name: string;
  avatarColor: string;
}

export interface ParticipantShareBreakdown {
  participantId: string;
  name: string;
  avatarColor: string;
  items: {
    itemId: string;
    name: string;
    fullPrice: number;
    splitCount: number;
    shareAmount: number;
  }[];
  totalOwed: number;
  sharePercentage: number;
}
