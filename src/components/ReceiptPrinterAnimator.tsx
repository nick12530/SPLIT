import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  RotateCw,
  QrCode,
  ArrowLeft,
  FileText,
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

  // Trigger paper roll animation
  const triggerPrintAnimation = () => {
    setIsPrinting(true);
    setPrintKey((prev) => prev + 1);
    setTimeout(() => {
      setIsPrinting(false);
    }, 550);
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

  const handleBrowserPrint = () => {
    window.print();
  };

  const selectedDinerBreakdown = summary.breakdowns.find(
    (b) => b.participantId === selectedDinerId
  );

  return (
    <div className="flex flex-col h-full ios-glass rounded-2xl p-4 sm:p-5 transition-all">
      {/* Top Controls Toolbar */}
      <div
        className={`rounded-xl p-3.5 mb-3.5 border transition-all ${
          isDark
            ? 'bg-[#14151b] border-white/[0.08]'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Receipt</h3>
              <p
                className={`text-xs ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                {receipt.currency} · {receipt.items.length} item{receipt.items.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {onBackToItems && (
              <button
                onClick={onBackToItems}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#1c1d25] text-zinc-300 hover:text-white hover:bg-[#242630] border border-white/[0.08]'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Return to Bill Items"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden sm:inline">Items</span>
              </button>
            )}

            <button
              onClick={triggerPrintAnimation}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#1c1d25] text-sky-400 hover:bg-[#242630] border border-white/[0.08]'
                  : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200'
              }`}
              title="Re-feed receipt paper"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isPrinting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-feed</span>
            </button>

            <button
              onClick={handleBrowserPrint}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#1c1d25] text-zinc-300 hover:text-white hover:bg-[#242630] border border-white/[0.08]'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
              title="Print receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleCopyReceiptText}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#1c1d25] text-zinc-300 hover:text-white hover:bg-[#242630] border border-white/[0.08]'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
              title="Copy receipt to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied</span>
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
              className="ios-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Share via QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Switcher: Master Receipt vs Individual Diner Slips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div
          className={`flex items-center p-1 rounded-lg border shrink-0 ${
            isDark
              ? 'bg-[#14151b] border-white/[0.08]'
              : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveView('master')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'master'
                ? isDark
                  ? 'bg-[#1e2029] text-white shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Master Bill
          </button>
          <button
            onClick={() => setActiveView('individual')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'individual'
                ? isDark
                  ? 'bg-[#1e2029] text-white shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
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
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  selectedDinerId === person.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : isDark
                    ? 'bg-[#14151b] text-zinc-300 border border-white/[0.08] hover:bg-[#1e2029]'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: person.avatarColor }}
                />
                <span>{person.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tactile Textured Receipt Paper */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-3 py-2 flex justify-center">
        <div
          key={printKey}
          className="receipt-paper-textured animate-print w-full max-w-md p-5 sm:p-6 font-mono text-xs flex flex-col justify-between"
        >
          {/* Top Perforation Sawtooth */}
          <div className="receipt-sawtooth-top h-3 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-3 border-b border-dashed border-stone-300" />

          {/* Receipt Body */}
          <div>
            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-stone-300">
              <span className="text-[10px] tracking-widest text-stone-500 block uppercase font-bold">
                *** ITEMIZED BILL RECEIPT ({receipt.currency}) ***
              </span>
              <h2 className="text-base font-bold text-stone-900 tracking-tight mt-0.5">
                {receipt.billTitle}
              </h2>
              <p className="text-[11px] text-stone-600 mt-0.5">{receipt.date}</p>
              <div className="flex items-center justify-between text-[10px] text-stone-500 mt-2 px-1 font-semibold">
                <span>ORDER: #8291</span>
                <span>CURRENCY: {receipt.currency}</span>
                <span>SPLITEASY</span>
              </div>
            </div>

            {/* Content: Master vs Individual */}
            {activeView === 'master' ? (
              <div className="py-3 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 pb-1 border-b border-stone-200">
                  <span>ITEM & SPLIT WITH</span>
                  <span>PRICE</span>
                </div>

                {receipt.items.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 italic">
                    <p className="font-semibold text-xs text-stone-600">No items on this bill yet</p>
                    <p className="text-[11px] mt-1">Add items to view full receipt</p>
                  </div>
                ) : (
                  receipt.items.map((item) => {
                    const assignees = participants.filter((p) =>
                      item.assignedTo.includes(p.id)
                    );
                    return (
                      <div key={item.id} className="text-xs">
                        <div className="flex items-baseline justify-between font-semibold text-stone-900">
                          <span className="truncate max-w-[200px] sm:max-w-[240px]">
                            {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                          </span>
                          <span className="receipt-dots" />
                          <span className="font-bold text-stone-950 shrink-0 font-mono tabular-nums">
                            {formatCurrency(item.price, receipt.currency)}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-600 mt-0.5">
                          {assignees.length > 0 ? (
                            <>
                              <span className="text-stone-800 font-medium">
                                → {assignees.map((a) => a.name).join(', ')}
                              </span>
                              {assignees.length > 1 && (
                                <span className="text-stone-500 ml-1">
                                  ({formatCurrency(item.price / assignees.length, receipt.currency)} ea)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-amber-800 font-semibold">
                              → [Unassigned]
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
                    <div className="bg-stone-100 p-2.5 rounded-lg border border-stone-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedDinerBreakdown.avatarColor }}
                        />
                        <span className="font-bold text-stone-900 text-sm">
                          {selectedDinerBreakdown.name}'s Share
                        </span>
                      </div>
                      <span className="text-xs text-stone-700 font-semibold font-mono">
                        {selectedDinerBreakdown.sharePercentage.toFixed(0)}% of total
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                        Assigned Items:
                      </span>
                      {selectedDinerBreakdown.items.length > 0 ? (
                        selectedDinerBreakdown.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-baseline justify-between text-xs text-stone-800 font-medium"
                          >
                            <span className="truncate max-w-[190px] sm:max-w-[220px]">
                              {it.name}
                              {it.splitCount > 1 && (
                                <span className="text-stone-500 text-[10px] ml-1">
                                  (1/{it.splitCount})
                                </span>
                              )}
                            </span>
                            <span className="receipt-dots" />
                            <span className="font-bold text-stone-950 font-mono tabular-nums shrink-0">
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

                    {/* Guest Slip Signature & Verification Field */}
                    <div className="pt-3 border-t border-dashed border-stone-300">
                      <div className="flex items-center justify-between text-[10px] text-stone-500 font-semibold">
                        <span>GUEST VERIFICATION:</span>
                        <span className="text-emerald-700 font-bold uppercase tracking-wider">
                          ✓ SHARE ALLOCATED
                        </span>
                      </div>
                      <div className="mt-3.5 flex items-end justify-between gap-3">
                        <div className="flex-1">
                          <div className="border-b border-stone-400 h-4" />
                          <span className="text-[9px] text-stone-400 mt-1 block">
                            Signature of {selectedDinerBreakdown.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono shrink-0">
                          DATE: {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-stone-500 text-center py-4 font-medium">
                    Select a diner above
                  </p>
                )}
              </div>
            )}

            {/* Financial Calculations */}
            <div className="pt-3 border-t-2 border-dashed border-stone-300 space-y-1 text-xs text-stone-800">
              {activeView === 'master' ? (
                <div className="flex items-center justify-between text-base font-bold text-stone-950 pt-1">
                  <span>TOTAL AMOUNT:</span>
                  <span className="font-bold text-xl text-stone-950">
                    {formatCurrency(summary.grandTotal, receipt.currency)}
                  </span>
                </div>
              ) : selectedDinerBreakdown ? (
                <div className="flex items-center justify-between text-sm font-bold text-stone-950 pt-1">
                  <span>AMOUNT TO PAY:</span>
                  <span className="font-bold text-lg text-stone-950">
                    {formatCurrency(selectedDinerBreakdown.totalOwed, receipt.currency)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-3 p-2 rounded bg-stone-100/70 border border-stone-200 text-[10px] text-stone-600 leading-tight">
              Direct proportional item split ({receipt.currency}).
            </div>
          </div>

          {/* Receipt Footer with Barcode */}
          <div className="pt-4 border-t border-dashed border-stone-300 text-center space-y-2 mt-4">
            <div className="flex justify-center items-center gap-0.5 h-7 opacity-80 overflow-hidden">
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
            <p className="text-[9px] tracking-widest text-stone-500 font-semibold">
              #829104-SPLITEASY-{receipt.currency}
            </p>
            <p className="text-[10px] font-bold text-stone-800 uppercase tracking-wide">
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
