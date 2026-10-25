import { ReceiptData } from '../types';

export interface SampleReceiptOption {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  data: ReceiptData;
}

export const SAMPLE_RECEIPTS: SampleReceiptOption[] = [
  {
    id: 'dinner-friends',
    name: 'Dinner with Friends',
    tagline: 'Pizza, Pasta & Drinks ($68.00)',
    icon: '🍽️',
    data: {
      billTitle: 'Dinner with Friends',
      date: 'Oct 25, 2026 • 7:30 PM',
      total: 68.00,
      currency: 'USD',
      items: [
        {
          id: 'item-1',
          name: 'Margherita Pizza',
          price: 18.00,
          quantity: 1,
          category: 'Mains',
          assignedTo: [],
        },
        {
          id: 'item-2',
          name: 'Pasta Carbonara',
          price: 21.00,
          quantity: 1,
          category: 'Mains',
          assignedTo: [],
        },
        {
          id: 'item-3',
          name: 'Garlic Truffle Fries',
          price: 11.00,
          quantity: 1,
          category: 'Sides',
          assignedTo: [],
        },
        {
          id: 'item-4',
          name: 'Sparkling Water (x2)',
          price: 8.00,
          quantity: 2,
          category: 'Drinks',
          assignedTo: [],
        },
        {
          id: 'item-5',
          name: 'Tiramisu',
          price: 10.00,
          quantity: 1,
          category: 'Desserts',
          assignedTo: [],
        },
      ],
    },
  },
  {
    id: 'weekend-brunch',
    name: 'Weekend Brunch',
    tagline: 'Avocado Toast & Coffees ($42.00)',
    icon: '☕',
    data: {
      billTitle: 'Weekend Brunch',
      date: 'Oct 25, 2026 • 11:15 AM',
      total: 42.00,
      currency: 'USD',
      items: [
        {
          id: 'item-b1',
          name: 'Avocado Toast & Poached Egg',
          price: 14.00,
          quantity: 1,
          category: 'Mains',
          assignedTo: [],
        },
        {
          id: 'item-b2',
          name: 'Eggs Florentine',
          price: 16.00,
          quantity: 1,
          category: 'Mains',
          assignedTo: [],
        },
        {
          id: 'item-b3',
          name: 'Cold Brew Coffee (x2)',
          price: 12.00,
          quantity: 2,
          category: 'Drinks',
          assignedTo: [],
        },
      ],
    },
  },
  {
    id: 'casual-bites',
    name: 'Casual Bites & Tacos',
    tagline: 'Nachos, Tacos & Drinks ($55.00)',
    icon: '🌮',
    data: {
      billTitle: 'Casual Bites & Tacos',
      date: 'Oct 24, 2026 • 8:40 PM',
      total: 55.00,
      currency: 'USD',
      items: [
        {
          id: 'item-c1',
          name: 'Loaded Nachos',
          price: 15.00,
          quantity: 1,
          category: 'Shared',
          assignedTo: [],
        },
        {
          id: 'item-c2',
          name: 'Street Tacos (3x)',
          price: 16.00,
          quantity: 1,
          category: 'Mains',
          assignedTo: [],
        },
        {
          id: 'item-c3',
          name: 'Guacamole & Fresh Chips',
          price: 9.00,
          quantity: 1,
          category: 'Shared',
          assignedTo: [],
        },
        {
          id: 'item-c4',
          name: 'Craft Lemonade (x2)',
          price: 15.00,
          quantity: 2,
          category: 'Drinks',
          assignedTo: [],
        },
      ],
    },
  },
];
