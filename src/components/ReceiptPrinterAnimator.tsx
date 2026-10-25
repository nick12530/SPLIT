import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  RotateCw,
  QrCode,
  ArrowLeft,
} from 'lucide-react';
import { ReceiptData, Participant } from '../types';
import { BillSummary, formatCurrency } from '../utils/calculator';

interface ReceiptPrinterProps {
  receipt: ReceiptData;
  participants: Participant[];
  summary: BillSummary;
  isDark?: boolean;
  onOpenShare: () => void;
  onBackToItems?: () => void;
}

export const ReceiptPrinterAnimator: React.FC<ReceiptPrinterProps> = ({
  receipt,
  participants,
  summary,
  isDark = false,
  onOpenShare,
  onBackToItems,
}) => {
  const [printKey, setPrintKey] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeView, setActiveView] = useState<'master' | 'individual'>('master');
  const [selectedDinerId, setSelectedDinerId] = useState<string>(
    participants[0]?.id || ''
  );
  const [copied, setCopied] = useState(false);

  // Trigger printer animation
  const triggerPrintAnimation = () => {
    setIsPrinting(true);
    setPrintKey((prev) => prev + 1);
    setTimeout(() => {
      setIsPrinting(false);
    }, 600);
  };

  const handleCopyReceiptText = () => {
    let text = `====================================\n`;
    text += `       ${receipt.billTitle.toUpperCase()}\n`;
    text += `          OFFICIAL ITEMIZED BILL (${receipt.currency})\n`;
    text += `====================================\n`;
    text += `Date: ${receipt.date}\n`;
    text += `Order: #SPLIT-${Math.floor(1000 + Math.random() * 9000)}\n`;
    text += `------------------------------------\n`;
    if (receipt.items.length === 0) {
      text += `No items registered.\n`;
    } else {
      receipt.items.forEach((item) => {
        const assignedNames = participants
          .filter((p) => item.assignedTo.includes(p.id))
          .map((p) => p.name);
        text += `${item.name} (x${item.quantity})\n`;
        text += `  ${formatCurrency(item.price, receipt.currency)} ${
          assignedNames.length > 0 ? `[${assignedNames.join(', ')}]` : '[Unassigned]'
        }\n`;
      });
    }
    text += `====================================\n`;
    text += `TOTAL DUE:      ${formatCurrency(summary.grandTotal, receipt.currency)}\n`;
    text += `====================================\n\n`;

    if (summary.breakdowns.length > 0) {
      text += `PER-PERSON BREAKDOWN:\n`;
      summary.breakdowns.forEach((b) => {
        text += `• ${b.name}: ${formatCurrency(b.totalOwed, receipt.currency)} (${b.sharePercentage.toFixed(0)}%)\n`;
        b.items.forEach((it) => {
          text += `    - ${it.name}: ${formatCurrency(it.shareAmount, receipt.currency)}\n`;
        });
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedDinerBreakdown = summary.breakdowns.find(
    (b) => b.participantId === selectedDinerId
  );

  return (
    <div className="flex flex-col h-full ios-glass rounded-3xl p-4 sm:p-6 overflow-hidden transition-all shadow-xl">
      {/* Top Printer Housing */}
      <div
        className={`rounded-2xl p-4 mb-3.5 border transition-all ${
          isDark
            ? 'bg-[#1a1a20] border-[#2e2e38] shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 border-sky-100 shadow-[0_4px_16px_rgba(14,165,233,0.08)]'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-md font-bold">
              <Printer className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">
                Receipt
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPrinting
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span
                  className={`text-[11px] font-bold ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  {isPrinting ? 'Generating Receipt Paper...' : `Receipt Ready • ${receipt.currency} Synced`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToItems && (
              <button
                onClick={onBackToItems}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#22222a] text-zinc-300 hover:bg-[#2c2c36] border border-[#333342]'
                    : 'bg-white text-slate-700 hover:bg-sky-50 border border-sky-200 shadow-sm'
                }`}
                title="Return to Bill Items"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden sm:inline">Bill Items</span>
              </button>
            )}

            <button
              onClick={triggerPrintAnimation}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#22222a] text-sky-400 hover:bg-[#2c2c36] border border-[#333342]'
                  : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200'
              }`}
              title="Re-feed thermal paper"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isPrinting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Feed</span>
            </button>

            <button
              onClick={handleCopyReceiptText}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#22222a] text-zinc-300 hover:bg-[#2c2c36] border border-[#333342]'
                  : 'bg-white text-slate-700 hover:bg-sky-50 border border-sky-200 shadow-sm'
              }`}
              title="Copy receipt to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-black">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenShare}
              className="ios-btn-primary px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Share via QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">QR Code</span>
            </button>
          </div>
        </div>

        {/* Realistic Thermal Paper Ejection Mouth / Cutter Blade */}
        <div className="relative w-full h-4 bg-gradient-to-b from-stone-900 via-black to-zinc-900 rounded-lg shadow-[inset_0_3px_6px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.06)] flex items-center justify-between px-3 overflow-hidden border border-zinc-800/80">
          <div className="w-2 h-1 bg-zinc-700 rounded-sm" />
          <div className="flex-1 mx-2 h-0.5 bg-gradient-to-r from-transparent via-sky-400/50 to-transparent shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
          <div className="w-2 h-1 bg-zinc-700 rounded-sm" />
        </div>
      </div>

      {/* Prominent High-Contrast View Tabs (Fully Visible & Distinct) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        {/* Master vs Individual Slips */}
        <div
          className={`flex items-center p-1.5 rounded-2xl border shrink-0 ${
            isDark
              ? 'bg-[#1a1a20] border-[#2e2e38]'
              : 'bg-sky-100/90 border-sky-200'
          }`}
        >
          <button
            onClick={() => setActiveView('master')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
              activeView === 'master'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Master Bill
          </button>
          <button
            onClick={() => setActiveView('individual')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
              activeView === 'individual'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Per-Person Slips ({participants.length})
          </button>
        </div>

        {/* Person Selector for Individual Slips */}
        {activeView === 'individual' && participants.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {participants.map((person) => (
              <button
                key={person.id}
                onClick={() => setSelectedDinerId(person.id)}
                className={`text-xs px-3 py-1 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  selectedDinerId === person.id
                    ? 'bg-sky-500 text-white shadow-md ring-2 ring-sky-300'
                    : isDark
                    ? 'bg-[#1e1e24] text-zinc-300 border border-[#2e2e38] hover:bg-[#282830]'
                    : 'bg-white text-slate-700 border border-sky-200 hover:bg-sky-50 shadow-sm'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full ring-1 ring-white/50"
                  style={{ backgroundColor: person.avatarColor }}
                />
                <span>{person.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tactile Textured Thermal Receipt Paper */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-1 flex justify-center">
        <div
          key={printKey}
          className="receipt-paper-textured animate-print w-full max-w-md p-5 sm:p-6 font-mono text-xs rounded-t-sm flex flex-col justify-between"
        >
          {/* Top Perforation Sawtooth */}
          <div className="receipt-sawtooth-top h-3 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-3 border-b border-dashed border-stone-300" />

          {/* Receipt Content */}
          <div>
            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-stone-300">
              <span className="text-[10px] tracking-widest text-stone-500 block uppercase font-extrabold">
                *** ITEMIZED BILL RECEIPT ({receipt.currency}) ***
              </span>
              <h2 className="text-base font-black text-stone-900 tracking-tight mt-0.5">
                {receipt.billTitle}
              </h2>
              <p className="text-[11px] text-stone-600 mt-0.5 font-bold">{receipt.date}</p>
              <div className="flex items-center justify-between text-[10px] text-stone-500 mt-2 px-1 font-bold">
                <span>ORDER: #8291</span>
                <span>CURRENCY: {receipt.currency}</span>
                <span>SPLITEASY</span>
              </div>
            </div>

            {/* Content: Master vs Individual */}
            {activeView === 'master' ? (
              <div className="py-3 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-black text-stone-500 pb-1 border-b border-stone-200">
                  <span>ITEM & SPLIT WITH</span>
                  <span>PRICE</span>
                </div>

                {receipt.items.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 italic">
                    <p className="font-bold text-xs text-stone-600">No items on this bill yet</p>
                    <p className="text-[11px] mt-1">Add items to see your receipt printout</p>
                  </div>
                ) : (
                  receipt.items.map((item) => {
                    const assignees = participants.filter((p) =>
                      item.assignedTo.includes(p.id)
                    );
                    return (
                      <div key={item.id} className="text-xs">
                        <div className="flex items-start justify-between font-bold text-stone-900">
                          <span className="truncate pr-2">
                            {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                          </span>
                          <span className="font-black text-stone-950 shrink-0">
                            {formatCurrency(item.price, receipt.currency)}
                          </span>
                        </div>
                        <div className="text-[11px] text-sky-800 mt-0.5 font-semibold">
                          {assignees.length > 0 ? (
                            <>
                              <span>→ {assignees.map((a) => a.name).join(', ')}</span>
                              {assignees.length > 1 && (
                                <span className="text-stone-500 ml-1">
                                  ({formatCurrency(item.price / assignees.length, receipt.currency)} ea)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-amber-700 font-black">
                              → [Not assigned yet]
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Individual Diner Slip */
              <div className="py-3 space-y-3">
                {selectedDinerBreakdown ? (
                  <>
                    <div className="bg-sky-50/90 p-2.5 rounded-xl border border-sky-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full ring-2 ring-sky-300"
                          style={{ backgroundColor: selectedDinerBreakdown.avatarColor }}
                        />
                        <span className="font-black text-stone-900 text-sm">
                          {selectedDinerBreakdown.name}'s Share
                        </span>
                      </div>
                      <span className="text-xs text-sky-700 font-black">
                        {selectedDinerBreakdown.sharePercentage.toFixed(0)}% of total
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
                        Assigned Items:
                      </span>
                      {selectedDinerBreakdown.items.length > 0 ? (
                        selectedDinerBreakdown.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs text-stone-800 font-bold"
                          >
                            <span className="truncate pr-2">
                              {it.name}
                              {it.splitCount > 1 && (
                                <span className="text-stone-500 text-[10px] ml-1">
                                  (1/{it.splitCount} split)
                                </span>
                              )}
                            </span>
                            <span className="font-black text-stone-950">
                              {formatCurrency(it.shareAmount, receipt.currency)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-stone-400 text-xs italic py-2">
                          No items assigned to this person yet
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-stone-500 text-center py-4 font-bold">
                    Select a diner above
                  </p>
                )}
              </div>
            )}

            {/* Financial Calculations (Pure sum, zero tax, zero tips) */}
            <div className="pt-3 border-t-2 border-dashed border-stone-300 space-y-1 text-xs text-stone-800">
              {activeView === 'master' ? (
                <div className="flex items-center justify-between text-base font-black text-stone-950 pt-1">
                  <span>TOTAL AMOUNT:</span>
                  <span className="text-sky-700 font-black text-xl">
                    {formatCurrency(summary.grandTotal, receipt.currency)}
                  </span>
                </div>
              ) : selectedDinerBreakdown ? (
                <div className="flex items-center justify-between text-sm font-black text-stone-950 pt-1">
                  <span>AMOUNT TO PAY:</span>
                  <span className="text-sky-700 font-black text-lg">
                    {formatCurrency(selectedDinerBreakdown.totalOwed, receipt.currency)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-sky-50/80 border border-sky-100 text-[10px] text-sky-900 font-bold leading-tight">
              Direct proportional item split ({receipt.currency}). Zero tax, zero tip.
            </div>
          </div>

          {/* Receipt Footer with Realistic Barcode */}
          <div className="pt-4 border-t border-dashed border-stone-300 text-center space-y-2 mt-4">
            <div className="flex justify-center items-center gap-0.5 h-8 opacity-85 overflow-hidden">
              {[4, 1, 2, 1, 4, 2, 5, 1, 3, 4, 2, 5, 1, 2, 4, 1, 3, 2, 5, 2, 4, 1, 2, 3, 5, 1, 4, 2, 1, 3, 4, 2, 5, 1, 2, 4, 2].map(
                (w, i) => (
                  <span
                    key={i}
                    className="bg-stone-800 h-full"
                    style={{ width: `${(w % 3) + 1}px` }}
                  />
                )
              )}
            </div>
            <p className="text-[9px] tracking-widest text-stone-500 font-bold">
              #829104-SPLITEASY-{receipt.currency}
            </p>
            <p className="text-[10px] font-black text-stone-800 uppercase tracking-wide">
              THANK YOU FOR SPLITTING FAIRLY!
            </p>
          </div>

          {/* Bottom Sawtooth Perforation */}
          <div className="receipt-sawtooth-bottom h-3.5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 mt-3 border-t border-dashed border-stone-300" />
        </div>
      </div>
    </div>
  );
};
