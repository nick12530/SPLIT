import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { ReceiptBuilder } from './components/ReceiptBuilder';
import { ReceiptPrinterAnimator } from './components/ReceiptPrinterAnimator';
import { ShareModal } from './components/ShareModal';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
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
import { Receipt, FileText } from 'lucide-react';

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

  // Clean slate: clean bill ready for user input
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

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'receipt'>('items');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);

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

  // Real-time pure item calculations
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

  const handleImportScannedItems = (
    newItems: ReceiptItem[],
    detectedTitle?: string,
    detectedCurrency?: CurrencyCode
  ) => {
    const updatedItems = [...receipt.items, ...newItems];
    const newTotal = updatedItems.reduce((acc, it) => acc + it.price, 0);

    setReceipt((prev) => ({
      ...prev,
      billTitle: detectedTitle || prev.billTitle,
      items: updatedItems,
      total: newTotal,
      currency: detectedCurrency || prev.currency,
    }));

    if (detectedCurrency) {
      setCurrency(detectedCurrency);
      localStorage.setItem('spliteasy_currency', detectedCurrency);
    }

    // Default 2-3 participants if none exist yet to immediately enable splitting
    if (participants.length === 0) {
      setParticipants([
        { id: 'p-1', name: 'Alex', avatarColor: getAvatarColor(0) },
        { id: 'p-2', name: 'Sam', avatarColor: getAvatarColor(1) },
      ]);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-250 ${
        isDark ? 'theme-dark' : 'theme-light'
      }`}
    >
      {/* Top Header */}
      <Header
        summary={summary}
        billTitle={receipt.billTitle}
        currency={currency}
        isDark={isDark}
        onCurrencyChange={handleCurrencyChange}
        onToggleTheme={toggleTheme}
        onSelectSample={handleSelectSample}
        onOpenScan={() => setIsScanOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onReset={handleReset}
      />

      {/* Main Single-Column Tabbed Workspace */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 sm:px-6 flex flex-col gap-4">
        {/* Workspace Tab Switcher */}
        <div className="flex p-1 rounded-xl ios-segmented text-xs font-semibold">
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'items'
                ? isDark
                  ? 'bg-[#1e2029] text-white shadow-sm border border-white/10'
                  : 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-sky-500" />
            <span>Bill Items</span>
            <span
              className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                activeTab === 'items'
                  ? isDark
                    ? 'bg-zinc-800 text-zinc-300'
                    : 'bg-slate-100 text-slate-700'
                  : isDark
                  ? 'bg-zinc-900 text-zinc-500'
                  : 'bg-slate-200/60 text-slate-500'
              }`}
            >
              {receipt.items.length}
            </span>
            {summary.unassignedItemsCount > 0 && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-amber-400"
                title={`${summary.unassignedItemsCount} unassigned`}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'receipt'
                ? isDark
                  ? 'bg-[#1e2029] text-white shadow-sm border border-white/10'
                  : 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-500" />
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

            {/* Quick Tab Switcher below the Bill Items */}
            <div className="flex justify-center pt-1 pb-4">
              <button
                onClick={() => setActiveTab('receipt')}
                className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2 ${
                  isDark
                    ? 'bg-[#14151b] border-white/10 text-sky-400 hover:bg-[#1c1d25]'
                    : 'bg-white border-slate-200 text-sky-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Switch to Receipt</span>
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
                className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2 ${
                  isDark
                    ? 'bg-[#14151b] border-white/10 text-zinc-300 hover:text-white hover:bg-[#1c1d25]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Receipt className="w-4 h-4 text-sky-500" />
                <span>← Back to Bill Items</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Share / Export Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        summary={summary}
        receipt={receipt}
        isDark={isDark}
      />

      {/* Camera Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onImportItems={handleImportScannedItems}
        currency={currency}
        isDark={isDark}
      />
    </div>
  );
}
