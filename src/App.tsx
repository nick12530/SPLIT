import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { ReceiptBuilder } from './components/ReceiptBuilder';
import { ReceiptPrinterAnimator } from './components/ReceiptPrinterAnimator';
import { ShareModal } from './components/ShareModal';
import { SampleReceiptOption } from './utils/sampleReceipts';
import {
  calculateBillSummary,
  getAvatarColor,
} from './utils/calculator';
import {
  ReceiptData,
  Participant,
  ReceiptItem,
  CurrencyCode,
} from './types';
import { Receipt, Printer } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('spliteasy_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('spliteasy_currency') as CurrencyCode;
      if (stored && ['USD', 'EUR', 'GBP', 'JPY', 'KSH'].includes(stored)) {
        return stored;
      }
    }
    return 'USD';
  });

  // Clean slate: 0 mock items, clean bill ready for user input
  const [receipt, setReceipt] = useState<ReceiptData>(() => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return {
      billTitle: 'My Itemized Bill',
      date: formattedDate,
      items: [],
      total: 0,
      currency: 'USD',
    };
  });

  // Clean state: start empty or let user add people splitting
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'receipt'>('items');
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Sync initial stored currency into receipt
  useEffect(() => {
    setReceipt((prev) => ({ ...prev, currency }));
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('spliteasy_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    localStorage.setItem('spliteasy_currency', newCurrency);
    setReceipt((prev) => ({
      ...prev,
      currency: newCurrency,
    }));
  };

  // Real-time pure item calculations (zero tips, zero tax)
  const summary = useMemo(() => {
    return calculateBillSummary(receipt, participants);
  }, [receipt, participants]);

  // Diner Management
  const handleAddParticipant = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const formatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    const existing = participants.find(
      (p) => p.name.toLowerCase() === formatted.toLowerCase()
    );
    if (!existing) {
      const newP: Participant = {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: formatted,
        avatarColor: getAvatarColor(participants.length),
      };
      setParticipants((prev) => [...prev, newP]);
    }
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    const updatedItems = receipt.items.map((item) => ({
      ...item,
      assignedTo: item.assignedTo.filter((pId) => pId !== id),
    }));
    setReceipt({ ...receipt, items: updatedItems });
  };

  // Item Management
  const handleAddItem = (newItem: Omit<ReceiptItem, 'id'>) => {
    const itemWithId: ReceiptItem = {
      ...newItem,
      id: `item-${Date.now()}`,
    };
    const updatedItems = [...receipt.items, itemWithId];
    const newTotal = updatedItems.reduce((acc, it) => acc + it.price, 0);
    setReceipt({
      ...receipt,
      items: updatedItems,
      total: newTotal,
    });
  };

  const handleToggleItemAssignment = (itemId: string, participantId: string) => {
    const updatedItems = receipt.items.map((item) => {
      if (item.id === itemId) {
        const isAssigned = item.assignedTo.includes(participantId);
        const newAssigned = isAssigned
          ? item.assignedTo.filter((id) => id !== participantId)
          : [...item.assignedTo, participantId];
        return { ...item, assignedTo: newAssigned };
      }
      return item;
    });
    setReceipt({ ...receipt, items: updatedItems });
  };

  const handleAssignItemToAll = (itemId: string) => {
    const allIds = participants.map((p) => p.id);
    const updatedItems = receipt.items.map((item) =>
      item.id === itemId ? { ...item, assignedTo: allIds } : item
    );
    setReceipt({ ...receipt, items: updatedItems });
  };

  const handleClearItemAssignment = (itemId: string) => {
    const updatedItems = receipt.items.map((item) =>
      item.id === itemId ? { ...item, assignedTo: [] } : item
    );
    setReceipt({ ...receipt, items: updatedItems });
  };

  const handleSelectSample = (sample: SampleReceiptOption) => {
    const cloned = JSON.parse(JSON.stringify(sample.data));
    cloned.currency = currency;
    setReceipt(cloned);
    // If no participants exist yet, add standard diners for the sample
    if (participants.length === 0) {
      setParticipants([
        { id: 'p-1', name: 'Alex', avatarColor: getAvatarColor(0) },
        { id: 'p-2', name: 'Sam', avatarColor: getAvatarColor(1) },
        { id: 'p-3', name: 'Sue', avatarColor: getAvatarColor(2) },
      ]);
    }
  };

  const handleReset = () => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    setReceipt({
      billTitle: 'My Itemized Bill',
      date: formattedDate,
      items: [],
      total: 0,
      currency,
    });
    setParticipants([]);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none transition-colors duration-300 ${
        isDark ? 'theme-dark' : 'theme-light'
      }`}
    >
      {/* Top iOS Header (Non-overlapping, pinned at top-0) */}
      <Header
        summary={summary}
        billTitle={receipt.billTitle}
        currency={currency}
        isDark={isDark}
        onCurrencyChange={handleCurrencyChange}
        onToggleTheme={toggleTheme}
        onSelectSample={handleSelectSample}
        onOpenShare={() => setIsShareOpen(true)}
        onReset={handleReset}
      />

      {/* Main Single-Column Tabbed Workspace (No Side Slider) */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-3.5 sm:p-6 flex flex-col gap-4">
        {/* Workspace Tab Switcher (Visible on all screen sizes) */}
        <div className="flex p-1.5 rounded-2xl ios-segmented shadow-sm text-xs font-black">
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'items'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 scale-[1.01]'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Bill Items ({receipt.items.length})</span>
            {summary.unassignedItemsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'receipt'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 scale-[1.01]'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Receipt</span>
          </button>
        </div>

        {/* Tab Content: Bill Items OR Receipt */}
        {activeTab === 'items' ? (
          <div className="flex flex-col gap-4">
            <ReceiptBuilder
              receipt={receipt}
              participants={participants}
              summary={summary}
              isDark={isDark}
              onUpdateReceipt={setReceipt}
              onAddParticipant={handleAddParticipant}
              onRemoveParticipant={handleRemoveParticipant}
              onToggleItemAssignment={handleToggleItemAssignment}
              onAssignItemToAll={handleAssignItemToAll}
              onClearItemAssignment={handleClearItemAssignment}
              onAddItem={handleAddItem}
              onViewReceipt={() => setActiveTab('receipt')}
            />

            {/* Quick Tab Switcher also below the Bill Items */}
            <div className="flex justify-center pt-1 pb-4">
              <button
                onClick={() => setActiveTab('receipt')}
                className={`text-xs font-black px-5 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                  isDark
                    ? 'bg-[#1a1a20] border-[#2e2e38] text-sky-400 hover:bg-[#25252e]'
                    : 'bg-white border-sky-200 text-sky-600 hover:bg-sky-50'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Switch to Receipt Tab</span>
                <span className="font-mono text-zinc-400">→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <ReceiptPrinterAnimator
              receipt={receipt}
              participants={participants}
              summary={summary}
              isDark={isDark}
              onOpenShare={() => setIsShareOpen(true)}
              onBackToItems={() => setActiveTab('items')}
            />

            {/* Quick return button below the receipt */}
            <div className="flex justify-center pt-1 pb-4">
              <button
                onClick={() => setActiveTab('items')}
                className={`text-xs font-black px-5 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                  isDark
                    ? 'bg-[#1a1a20] border-[#2e2e38] text-zinc-300 hover:text-white hover:bg-[#25252e]'
                    : 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
                }`}
              >
                <Receipt className="w-4 h-4 text-sky-500" />
                <span>← Back to Bill Items</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Share / Export Modal (Includes 'Share via QR Code' button) */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        summary={summary}
        receipt={receipt}
        isDark={isDark}
      />
    </div>
  );
}
