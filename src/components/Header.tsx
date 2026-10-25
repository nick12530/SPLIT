import {
  RotateCcw,
  Bookmark,
  Sun,
  Moon,
  QrCode,
  Globe,
  Receipt,
  Camera,
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
  onOpenScan: () => void;
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
  onOpenScan,
  onOpenShare,
  onReset,
}) => {
  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors duration-200 px-4 sm:px-6 py-2.5 ${
        isDark
          ? 'bg-[#0c0d12]/90 backdrop-blur-xl border-white/[0.08]'
          : 'bg-white/90 backdrop-blur-xl border-slate-200/80'
      }`}
    >
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Zone: Clean Wordmark without pill badges */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all ${
              isDark
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-sm'
                : 'bg-sky-50 text-sky-600 border border-sky-200 shadow-xs'
            }`}
          >
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                SplitEasy
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium select-none">
                /
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Receipt Splitter
              </span>
            </div>
            <p
              className={`text-xs font-medium truncate max-w-[200px] sm:max-w-xs ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              {billTitle}
            </p>
          </div>
        </div>

        {/* Center / Right Control Cluster */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Global Currency Switcher with Flag Badge */}
          <div
            className={`flex items-center gap-1.5 border rounded-lg pl-2 pr-1.5 py-1 text-xs transition-all ${
              isDark
                ? 'bg-[#15161e] border-white/10 text-white hover:border-white/20'
                : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="text-sm select-none" role="img" aria-label={CURRENCIES[currency]?.name}>
              {CURRENCIES[currency]?.flag}
            </span>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer pr-1"
              title="Global Currency Switcher"
              aria-label="Select global currency"
            >
              <option
                value="USD"
                className={isDark ? 'bg-[#15161e] text-white' : 'bg-white text-slate-900'}
              >
                USD ($)
              </option>
              <option
                value="EUR"
                className={isDark ? 'bg-[#15161e] text-white' : 'bg-white text-slate-900'}
              >
                EUR (€)
              </option>
              <option
                value="GBP"
                className={isDark ? 'bg-[#15161e] text-white' : 'bg-white text-slate-900'}
              >
                GBP (£)
              </option>
              <option
                value="JPY"
                className={isDark ? 'bg-[#15161e] text-white' : 'bg-white text-slate-900'}
              >
                JPY (¥)
              </option>
              <option
                value="KSH"
                className={isDark ? 'bg-[#15161e] text-white' : 'bg-white text-slate-900'}
              >
                KSH (KSh)
              </option>
            </select>
          </div>

          {/* Allocation indicator */}
          <div
            className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs ${
              isDark
                ? 'bg-[#15161e] border-white/10 text-zinc-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Assigned:
            </span>
            <span className="font-mono font-bold">
              {formatCurrency(summary.totalAssigned, currency)}
            </span>
            <span className="text-zinc-500">/</span>
            <span className="font-mono font-semibold text-zinc-400">
              {formatCurrency(summary.grandTotal, currency)}
            </span>
            <div
              className={`w-14 h-1.5 rounded-full overflow-hidden ${
                isDark ? 'bg-zinc-800' : 'bg-slate-200'
              }`}
            >
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${summary.percentAssigned}%` }}
              />
            </div>
          </div>

          {/* Preset Example Bills Dropdown */}
          <div
            className={`flex items-center gap-1.5 border rounded-lg px-2 py-1.5 text-xs transition-colors ${
              isDark
                ? 'bg-[#15161e] border-white/10 text-zinc-300 hover:border-white/20'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <select
              onChange={(e) => {
                const sample = SAMPLE_RECEIPTS.find((s) => s.id === e.target.value);
                if (sample) onSelectSample(sample);
              }}
              className="bg-transparent font-medium text-xs focus:outline-none cursor-pointer pr-1"
              title="Load Preset Bill"
              defaultValue=""
            >
              <option
                value=""
                disabled
                className={isDark ? 'bg-[#15161e] text-zinc-400' : 'bg-white text-slate-500'}
              >
                Samples...
              </option>
              {SAMPLE_RECEIPTS.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  className={isDark ? 'bg-[#15161e] text-white' : 'bg-white text-slate-800'}
                >
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
              isDark
                ? 'bg-[#15161e] border-white/10 text-amber-400 hover:bg-[#1d1f2a]'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Dark/Light Mode"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Scan Physical Receipt Button */}
          <button
            onClick={onOpenScan}
            className="ios-btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            title="Scan Physical Receipt with Camera"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="font-bold whitespace-nowrap">Scan Receipt</span>
          </button>

          {/* Share via QR Code Button */}
          <button
            onClick={onOpenShare}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#15161e] border-white/10 text-zinc-200 hover:text-white hover:bg-[#1d1f2a]'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Scan & Share via QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">QR Share</span>
          </button>

          {/* Reset Bill to Clean Slate */}
          <button
            onClick={onReset}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#15161e] border-white/10 text-zinc-400 hover:text-white hover:bg-[#1d1f2a]'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Reset Bill to Clean Slate"
            aria-label="Reset bill to clean slate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
