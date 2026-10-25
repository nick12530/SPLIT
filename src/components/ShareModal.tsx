import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  QrCode,
  FileText,
  Smartphone,
} from 'lucide-react';
import QRCode from 'qrcode';
import { BillSummary, formatCurrency } from '../utils/calculator';
import { ReceiptData } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: BillSummary;
  receipt: ReceiptData;
  isDark?: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  summary,
  receipt,
  isDark = false,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'text'>('qr');
  const [qrType, setQrType] = useState<'url' | 'summary'>('url');
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateFullSummaryText = () => {
    let text = `🧾 ${receipt.billTitle.toUpperCase()} - ITEMIZED SPLIT (${receipt.currency})\n`;
    text += `Date: ${receipt.date}\n`;
    text += `Grand Total: ${formatCurrency(summary.grandTotal, receipt.currency)}\n`;
    text += `----------------------------------------\n\n`;

    summary.breakdowns.forEach((b) => {
      text += `👤 ${b.name}: ${formatCurrency(b.totalOwed, receipt.currency)} (${b.sharePercentage.toFixed(0)}%)\n`;
      if (b.items.length > 0) {
        b.items.forEach((it) => {
          text += `   • ${it.name}${
            it.splitCount > 1 ? ` (1/${it.splitCount} share)` : ''
          }: ${formatCurrency(it.shareAmount, receipt.currency)}\n`;
        });
      }
      text += `\n`;
    });

    if (summary.unassignedTotal > 0.01) {
      text += `⚠️ Unassigned Items: ${formatCurrency(summary.unassignedTotal, receipt.currency)}\n\n`;
    }

    text += `Split seamlessly with SplitEasy`;
    return text;
  };

  // Generate QR Code as direct high-contrast SVG and PNG fallback
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    const contentToEncode =
      qrType === 'url' ? window.location.href : generateFullSummaryText();

    // 1. Generate direct crisp SVG string (guaranteed to render synchronously without canvas issues)
    QRCode.toString(contentToEncode, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#020617', // Pure dark ink
        light: '#ffffff', // Pure white background
      },
      width: 260,
    })
      .then((svgString) => {
        setQrSvg(svgString);
      })
      .catch((err) => {
        console.error('Failed to generate QR SVG:', err);
        setErrorMsg('Could not render QR SVG.');
      });

    // 2. Generate PNG Data URL for direct download
    QRCode.toDataURL(contentToEncode, {
      margin: 2,
      width: 400,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrPngUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR PNG URL:', err);
      });
  }, [isOpen, qrType, receipt, summary]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generateFullSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const text = generateFullSummaryText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-split-${receipt.billTitle.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadQrImage = () => {
    if (!qrPngUrl) return;
    const a = document.createElement('a');
    a.href = qrPngUrl;
    a.download = `qrcode-${receipt.billTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] flex flex-col max-h-[92vh] border transition-all ${
          isDark
            ? 'bg-[#18181e] border-[#2e2e38] text-white backdrop-blur-2xl'
            : 'bg-white/95 border-sky-200/90 text-slate-800 backdrop-blur-2xl'
        }`}
      >
        {/* iOS Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-[#2a2a34] bg-[#16161b]' : 'border-sky-100 bg-white/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 flex items-center justify-center text-white shadow-md font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Share Bill Breakdown
              </h3>
              <p
                className={`text-xs font-semibold ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                {receipt.billTitle} • {formatCurrency(summary.grandTotal, receipt.currency)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isDark
                ? 'bg-[#24242c] text-zinc-300 hover:text-white hover:bg-[#2c2c36]'
                : 'bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Segmented Tab Switcher (Prominent & High Contrast) */}
        <div className="px-6 pt-4">
          <div
            className={`grid grid-cols-2 p-1.5 rounded-2xl border ${
              isDark
                ? 'bg-[#141418] border-[#2a2a34]'
                : 'bg-sky-100/80 border-sky-200'
            }`}
          >
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-[1.02]'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Share via QR Code</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-[1.02]'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Text Summary</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'qr' ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {/* QR Source Switcher */}
              <div
                className={`inline-flex p-1 rounded-xl border text-[11px] font-bold ${
                  isDark
                    ? 'bg-[#1e1e24] border-[#2e2e38] text-zinc-300'
                    : 'bg-white border-sky-200 text-slate-600 shadow-sm'
                }`}
              >
                <button
                  onClick={() => setQrType('url')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    qrType === 'url'
                      ? 'bg-sky-500 text-white shadow'
                      : 'hover:text-sky-500'
                  }`}
                >
                  Live Web Link
                </button>
                <button
                  onClick={() => setQrType('summary')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    qrType === 'summary'
                      ? 'bg-sky-500 text-white shadow'
                      : 'hover:text-sky-500'
                  }`}
                >
                  Direct Breakdown Text
                </button>
              </div>

              {/* QR Code Container: Solid Pure White Card for Maximum Optical Scanner Contrast */}
              <div className="relative group p-4 bg-white rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.25)] border-4 border-sky-400/40 flex items-center justify-center">
                {qrSvg ? (
                  <div
                    className="w-60 h-60 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <div className="w-60 h-60 flex flex-col items-center justify-center text-zinc-400 text-xs gap-2">
                    <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold">Rendering QR Code...</span>
                  </div>
                )}
                {errorMsg && (
                  <p className="absolute bottom-2 text-rose-600 text-xs font-bold bg-white px-2 py-0.5 rounded">
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Instructions and Scan Guide */}
              <div className="space-y-1.5 max-w-sm">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${
                    isDark
                      ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-sky-500" />
                  <span>Scan with Smartphone Camera</span>
                </div>
                <p
                  className={`text-xs font-medium leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-slate-600'
                  }`}
                >
                  Friends can point their camera at this code to immediately inspect their itemized share on any iPhone or Android phone.
                </p>
              </div>

              {/* Quick Bill Metric Pill */}
              <div
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between ${
                  isDark
                    ? 'bg-[#1a1a20] border-[#2e2e38]'
                    : 'bg-sky-50/70 border-sky-100'
                }`}
              >
                <div>
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    Diners & Currency
                  </p>
                  <p className="text-xs font-extrabold mt-0.5">
                    {summary.breakdowns.length} people • {receipt.items.length} items ({receipt.currency})
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    Total Amount
                  </p>
                  <p className="text-base font-black font-mono text-sky-500">
                    {formatCurrency(summary.grandTotal, receipt.currency)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className={`p-4 rounded-2xl border ${
                  isDark
                    ? 'bg-[#121214] border-[#2e2e38] text-zinc-100'
                    : 'bg-sky-50/70 border-sky-100 text-slate-800'
                }`}
              >
                <pre className="text-xs font-mono whitespace-pre-wrap select-all leading-relaxed max-h-80 overflow-y-auto">
                  {generateFullSummaryText()}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          className={`p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-[#2a2a34] bg-[#16161b]' : 'border-sky-100 bg-sky-50/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {activeTab === 'qr' && qrPngUrl && (
              <button
                onClick={handleDownloadQrImage}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#24242c] text-sky-400 hover:bg-[#2e2e38]'
                    : 'bg-white text-sky-700 hover:bg-sky-100 border border-sky-200 shadow-sm'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR Image</span>
              </button>
            )}

            <button
              onClick={handleDownloadText}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#24242c] text-zinc-300 hover:bg-[#2e2e38]'
                  : 'bg-white text-slate-700 hover:bg-sky-100 border border-sky-200 shadow-sm'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              <span>Save .txt</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="ios-btn-primary px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Summary Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
