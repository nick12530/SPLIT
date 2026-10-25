import React from 'react';
import {
  RefreshCw,
  Bookmark,
  Sun,
  Moon,
  QrCode,
  Coins,
} from 'lucide-react';
import { BillSummary, formatCurrency } from '../utils/calculator';
import { SAMPLE_RECEIPTS, SampleReceiptOption } from '../utils/sampleReceipts';
import { CurrencyCode, CURRENCIES } from '../types';

interface HeaderProps {
  summary: BillSummary;
  billTitle: string;
  currency: CurrencyCode;
  isDark: boolean;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onToggleTheme: () => void;
  onSelectSample: (sample: SampleReceiptOption) => void;
  onOpenShare: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  billTitle,
  currency,
  isDark,
  onCurrencyChange,
  onToggleTheme,
  onSelectSample,
  onOpenShare,
  onReset,
}) => {
  const currentConfig = CURRENCIES[currency] || CURRENCIES.USD;

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors duration-200 px-4 sm:px-6 lg:px-8 py-3 ${
        isDark
          ? 'bg-[#121214]/95 backdrop-blur-xl border-[#22222a] shadow-md shadow-black/30'
          : 'bg-[#eef6fd]/95 backdrop-blur-xl border-sky-200/80 shadow-sm shadow-sky-500/5'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Bill Subtitle (Logo and iOS Thermal Split badge removed) */}
        <div>
          <h1 className="text-lg font-black tracking-tight leading-none text-sky-500">
            SplitEasy
          </h1>
          <p
            className={`text-xs font-bold truncate max-w-[200px] sm:max-w-xs mt-1 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            {billTitle}
          </p>
        </div>

        {/* Global Currency Switcher (USD, EUR, GBP, JPY, KSH) */}
        <div
          className={`flex items-center gap-1.5 border rounded-2xl px-3 py-1.5 text-xs shadow-sm transition-all ${
            isDark
              ? 'bg-[#1e1e24] border-[#2e2e38] text-white hover:border-[#3e3e4a]'
              : 'bg-white/95 border-sky-200/90 text-slate-800 hover:border-sky-300'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span className="text-[11px] font-black tracking-wider uppercase text-sky-500">
            Currency
          </span>
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
            className="bg-transparent font-black text-xs focus:outline-none cursor-pointer pr-1 tracking-tight"
            title="Global Currency Switcher"
            aria-label="Select global currency"
          >
            <option
              value="USD"
              className={isDark ? 'bg-[#18181b] text-white' : 'bg-white text-slate-900'}
            >
              USD ($) • US Dollar
            </option>
            <option
              value="EUR"
              className={isDark ? 'bg-[#18181b] text-white' : 'bg-white text-slate-900'}
            >
              EUR (€) • Euro
            </option>
            <option
              value="GBP"
              className={isDark ? 'bg-[#18181b] text-white' : 'bg-white text-slate-900'}
            >
              GBP (£) • British Pound
            </option>
            <option
              value="JPY"
              className={isDark ? 'bg-[#18181b] text-white' : 'bg-white text-slate-900'}
            >
              JPY (¥) • Japanese Yen
            </option>
            <option
              value="KSH"
              className={isDark ? 'bg-[#18181b] text-white' : 'bg-white text-slate-900'}
            >
              KSH (KSh) • Kenyan Shilling
            </option>
          </select>
        </div>

        {/* Live Allocation Progress Tracker (iOS pill) */}
        <div
          className={`hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl border text-xs shadow-sm ${
            isDark
              ? 'bg-[#1e1e24] border-[#2e2e38] text-zinc-100'
              : 'bg-sky-50/90 border-sky-200/90 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
              Split:
            </span>
            <span className="font-mono font-black text-sky-500">
              {formatCurrency(summary.totalAssigned, currency)}
            </span>
            <span className="text-zinc-500">/</span>
            <span
              className={`font-mono font-bold ${
                isDark ? 'text-zinc-300' : 'text-slate-600'
              }`}
            >
              {formatCurrency(summary.grandTotal, currency)}
            </span>
          </div>

          <div
            className={`w-20 rounded-full h-2 overflow-hidden shadow-inner ${
              isDark ? 'bg-zinc-800' : 'bg-sky-200/80'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                summary.isFullyAssigned ? 'bg-sky-500' : 'bg-sky-400'
              }`}
              style={{ width: `${summary.percentAssigned}%` }}
            />
          </div>

          <span className="text-[11px] font-black text-sky-500">
            {summary.isFullyAssigned ? '100% Split' : `${summary.percentAssigned}%`}
          </span>
        </div>

        {/* Presets, Theme Toggle & Share Actions */}
        <div className="flex items-center gap-2">
          {/* Preset bills dropdown */}
          <div
            className={`flex items-center gap-1.5 border rounded-2xl px-3 py-1.5 text-xs shadow-sm transition-colors ${
              isDark
                ? 'bg-[#1e1e24] border-[#2e2e38] text-zinc-200'
                : 'bg-white/95 border-sky-200/80 text-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <select
              onChange={(e) => {
                const sample = SAMPLE_RECEIPTS.find((s) => s.id === e.target.value);
                if (sample) onSelectSample(sample);
              }}
              className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer pr-1"
              title="Load Preset Bill"
              defaultValue=""
            >
              <option value="" disabled className={isDark ? 'bg-[#18181b] text-zinc-400' : 'bg-white text-slate-500'}>
                Load Example...
              </option>
              {SAMPLE_RECEIPTS.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  className={isDark ? 'bg-[#18181b] text-white' : 'bg-white text-slate-800'}
                >
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* iOS Light / Charcoal Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-2xl border transition-all cursor-pointer flex items-center justify-center shadow-sm ${
              isDark
                ? 'bg-[#1e1e24] border-[#2e2e38] text-amber-300 hover:bg-[#282830]'
                : 'bg-white border-sky-200 text-slate-700 hover:text-sky-600 hover:bg-sky-50'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Charcoal Dark Mode'}
            aria-label="Toggle Dark/Light Mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Moon className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>

          {/* Share via QR Code Button */}
          <button
            onClick={onOpenShare}
            className="ios-btn-primary px-3.5 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Scan & Share via QR Code"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">QR Share</span>
            <span className="sm:hidden">QR</span>
          </button>

          {/* Reset Bill to Clean Slate */}
          <button
            onClick={onReset}
            className={`p-2 rounded-2xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1e1e24] border-[#2e2e38] text-zinc-400 hover:text-white hover:bg-[#282830]'
                : 'bg-white/90 border-sky-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Start Clean / Reset Bill"
            aria-label="Reset bill to clean slate"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
