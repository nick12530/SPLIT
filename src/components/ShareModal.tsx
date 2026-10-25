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
    let text = `${receipt.billTitle.toUpperCase()} - ITEMIZED SPLIT (${receipt.currency})\n`;
    text += `Date: ${receipt.date}\n`;
    text += `Grand Total: ${formatCurrency(summary.grandTotal, receipt.currency)}\n`;
    text += `----------------------------------------\n\n`;

    summary.breakdowns.forEach((b) => {
      text += `• ${b.name}: ${formatCurrency(b.totalOwed, receipt.currency)} (${b.sharePercentage.toFixed(0)}%)\n`;
      if (b.items.length > 0) {
        b.items.forEach((it) => {
          text += `   - ${it.name}${
            it.splitCount > 1 ? ` (1/${it.splitCount} share)` : ''
          }: ${formatCurrency(it.shareAmount, receipt.currency)}\n`;
        });
      }
      text += `\n`;
    });

    if (summary.unassignedTotal > 0.01) {
      text += `Unassigned Items: ${formatCurrency(summary.unassignedTotal, receipt.currency)}\n\n`;
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

    // 1. Generate direct crisp SVG string
    QRCode.toString(contentToEncode, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#090a0f', // Pure dark ink
        light: '#ffffff', // Pure white background
      },
      width: 240,
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
        dark: '#090a0f',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border transition-all ${
          isDark
            ? 'bg-[#111218] border-white/[0.08] text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isDark ? 'border-white/[0.08] bg-[#14151c]' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                Share Bill Breakdown
              </h3>
              <p
                className={`text-xs ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                {receipt.billTitle} · {formatCurrency(summary.grandTotal, receipt.currency)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3.5">
          <div
            className={`grid grid-cols-2 p-1 rounded-lg border ${
              isDark
                ? 'bg-[#161720] border-white/[0.08]'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'qr'
                  ? isDark
                    ? 'bg-[#222430] text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'text'
                  ? isDark
                    ? 'bg-[#222430] text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text Summary</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3.5">
          {activeTab === 'qr' ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3.5">
              {/* QR Source Switcher */}
              <div
                className={`inline-flex p-1 rounded-lg border text-xs font-medium ${
                  isDark
                    ? 'bg-[#161720] border-white/[0.08] text-zinc-300'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <button
                  onClick={() => setQrType('url')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    qrType === 'url'
                      ? 'bg-sky-500 text-white shadow-sm font-semibold'
                      : 'hover:text-sky-500'
                  }`}
                >
                  Live Web Link
                </button>
                <button
                  onClick={() => setQrType('summary')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    qrType === 'summary'
                      ? 'bg-sky-500 text-white shadow-sm font-semibold'
                      : 'hover:text-sky-500'
                  }`}
                >
                  Direct Summary Text
                </button>
              </div>

              {/* QR Code Container: Crisp White Surface for Reliable Scanner Recognition */}
              <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center">
                {qrSvg ? (
                  <div
                    className="w-52 h-52 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <div className="w-52 h-52 flex flex-col items-center justify-center text-zinc-400 text-xs gap-2">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <span>Generating QR...</span>
                  </div>
                )}
                {errorMsg && (
                  <p className="absolute bottom-2 text-rose-600 text-xs font-bold bg-white px-2 py-0.5 rounded">
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-1 max-w-xs">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-500">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Scan with Smartphone Camera</span>
                </div>
                <p
                  className={`text-xs ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  Scan with your phone camera to open and view your portion of the bill.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark
                    ? 'bg-[#14151c] border-white/[0.08] text-zinc-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <pre className="text-xs font-mono whitespace-pre-wrap select-all leading-relaxed max-h-72 overflow-y-auto">
                  {generateFullSummaryText()}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          className={`p-4 border-t flex flex-wrap items-center justify-between gap-2.5 ${
            isDark ? 'border-white/[0.08] bg-[#14151c]' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-2">
            {activeTab === 'qr' && qrPngUrl && (
              <button
                onClick={handleDownloadQrImage}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#1c1d25] text-zinc-300 hover:text-white border border-white/[0.08]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Image</span>
              </button>
            )}

            <button
              onClick={handleDownloadText}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#1c1d25] text-zinc-300 hover:text-white border border-white/[0.08]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Save .txt</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="ios-btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
