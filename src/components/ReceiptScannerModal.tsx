import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
  SwitchCamera,
  FileText,
  ArrowRight,
  Receipt,
  ScanLine,
} from 'lucide-react';
import { ReceiptItem, CurrencyCode, CURRENCIES } from '../types';
import { formatCurrency } from '../utils/calculator';
import { SAMPLE_RECEIPTS } from '../utils/sampleReceipts';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportItems: (newItems: ReceiptItem[], detectedTitle?: string, detectedCurrency?: CurrencyCode) => void;
  currency: CurrencyCode;
  isDark?: boolean;
}

interface ParsedItem {
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface ParsedReceiptResponse {
  restaurantName?: string;
  date?: string;
  currency?: string;
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
  items: ParsedItem[];
  note?: string;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onImportItems,
  currency,
  isDark = false,
}) => {
  const [step, setStep] = useState<'camera' | 'analyzing' | 'preview'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReceiptResponse | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported on this browser or device.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play was interrupted:', err);
        });
      }
      setIsStreaming(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser or upload a receipt photo below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can upload an image from your files instead.');
      } else {
        setCameraError(err.message || 'Unable to access device camera.');
      }
    }
  }, [facingMode, stopCamera]);

  // Manage camera lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen && step === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, step, startCamera, stopCamera]);

  // Capture frame from live video
  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCamera();
    setCapturedImage(dataUrl);
    analyzeReceiptImage(dataUrl);
  };

  // Handle file upload / photo library selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      stopCamera();
      setCapturedImage(dataUrl);
      analyzeReceiptImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Send receipt image to /api/parse-receipt
  const analyzeReceiptImage = async (imageDataUrl: string) => {
    setStep('analyzing');
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageDataUrl,
          mimeType: 'image/jpeg',
          model: 'gemini-3.8-flash',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data: ParsedReceiptResponse = await res.json();
      if (!data.items || data.items.length === 0) {
        throw new Error('No items could be extracted from this image. Please ensure the receipt is well-lit and clearly visible.');
      }

      setParsedData(data);
      setStep('preview');
    } catch (err: any) {
      console.error('Receipt parsing failed:', err);
      setAnalysisError(err.message || 'Failed to analyze receipt.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load sample receipt for instant testing without camera
  const handleLoadSampleScan = () => {
    const sample = SAMPLE_RECEIPTS[0].data;
    const mockData: ParsedReceiptResponse = {
      restaurantName: sample.billTitle,
      date: sample.date,
      total: sample.total,
      currency: currency,
      items: sample.items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity || 1,
        category: 'Food & Drinks',
      })),
      note: 'Loaded instant test receipt',
    };
    setParsedData(mockData);
    setStep('preview');
  };

  // Toggle front/back camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Reset to live camera view
  const handleRetake = () => {
    setCapturedImage(null);
    setParsedData(null);
    setAnalysisError(null);
    setStep('camera');
  };

  // Confirm and import items
  const handleConfirmImport = () => {
    if (!parsedData || !parsedData.items) return;

    const formattedItems: ReceiptItem[] = parsedData.items.map((it, idx) => ({
      id: `item-scan-${Date.now()}-${idx}`,
      name: it.name,
      price: it.price,
      quantity: it.quantity || 1,
      category: it.category || 'Purchased Item',
      assignedTo: [],
    }));

    // Detect currency code mapping if returned as symbol
    let detectedCurrency: CurrencyCode | undefined = undefined;
    if (parsedData.currency) {
      const match = Object.values(CURRENCIES).find(
        (c) => c.symbol === parsedData.currency || c.code === parsedData.currency
      );
      if (match) detectedCurrency = match.code;
    }

    onImportItems(formattedItems, parsedData.restaurantName, detectedCurrency);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl border flex flex-col overflow-hidden max-h-[92vh] shadow-2xl transition-all ${
          isDark
            ? 'bg-[#101118] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`flex items-center justify-between px-4 sm:px-5 py-3.5 border-b ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/25 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight">
                Scan Physical Receipt
              </h3>
              <p
                className={`text-xs ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                AI parses line items & prices into your bill
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-800/60 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col">
          {step === 'camera' && (
            <div className="flex flex-col gap-3.5">
              {/* Camera Viewfinder Box */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center group">
                {cameraError ? (
                  <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        Camera Unavailable
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {cameraError}
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="ios-btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer mt-1"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Receipt Photo</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Receipt Guide Overlay */}
                    <div className="absolute inset-6 sm:inset-8 border border-white/30 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                      {/* Corner Accents */}
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-t-2 border-l-2 border-sky-400" />
                        <div className="w-4 h-4 border-t-2 border-r-2 border-sky-400" />
                      </div>

                      <div className="text-center">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1 rounded-full border border-white/20 select-none shadow-sm">
                          Align receipt within frame
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-b-2 border-l-2 border-sky-400" />
                        <div className="w-4 h-4 border-b-2 border-r-2 border-sky-400" />
                      </div>
                    </div>

                    {/* Scanning Laser Beam Effect */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_#38bdf8] pointer-events-none animate-scan-line" />

                    {/* Camera Controls Overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        onClick={toggleCameraFacing}
                        className="bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 rounded-lg text-white border border-white/20 cursor-pointer transition-colors"
                        title="Switch camera"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Shutter & File Fallback Controls */}
              {!cameraError && isStreaming && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#171822] border-white/10 text-zinc-300 hover:text-white hover:bg-[#20222e]'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>

                  {/* Main Shutter Button */}
                  <button
                    onClick={handleCaptureFrame}
                    className="relative w-14 h-14 rounded-full border-4 border-white/80 bg-sky-500 hover:bg-sky-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
                    title="Snap Receipt Photo"
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sky-600">
                      <Camera className="w-4 h-4" />
                    </div>
                  </button>

                  <button
                    onClick={handleLoadSampleScan}
                    className="text-xs text-sky-500 hover:text-sky-400 font-semibold cursor-pointer flex items-center gap-1.5"
                    title="Test with pre-configured sample"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Try Sample</span>
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {step === 'analyzing' && (
            <div className="py-10 flex flex-col items-center justify-center text-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/25 flex items-center justify-center">
                <ScanLine className="w-10 h-10 animate-pulse text-sky-500" />
                <div className="absolute inset-0 rounded-2xl border-2 border-sky-400/40 animate-ping" />
              </div>

              <div>
                <h4 className="text-base font-bold mb-1">
                  Scanning Receipt with Gemini Vision...
                </h4>
                <p
                  className={`text-xs max-w-sm ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  Detecting line items, item quantities, and prices automatically.
                </p>
              </div>

              {analysisError && (
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs max-w-md text-left flex items-start gap-2.5 mt-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Analysis Failed</span>
                    <span>{analysisError}</span>
                    <button
                      onClick={handleRetake}
                      className="mt-2 text-xs font-semibold underline block cursor-pointer"
                    >
                      ← Retake or choose another photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && parsedData && (
            <div className="flex flex-col gap-3.5 flex-1">
              {/* Receipt Detection Card */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isDark
                    ? 'bg-[#151620] border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-sky-500" />
                    <h4 className="text-sm font-bold tracking-tight">
                      {parsedData.restaurantName || 'Receipt Detected'}
                    </h4>
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    Found {parsedData.items.length} line items · {parsedData.date || 'Recent'}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] uppercase font-semibold block ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    Detected Total
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-sky-500">
                    {formatCurrency(
                      parsedData.total ||
                        parsedData.items.reduce((s, it) => s + it.price, 0),
                      currency
                    )}
                  </span>
                </div>
              </div>

              {/* Extracted Items Checklist */}
              <div className="flex-1 overflow-y-auto max-h-60 space-y-1.5 pr-1">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  Extracted Items ({parsedData.items.length})
                </span>

                {parsedData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${
                      isDark
                        ? 'bg-[#171822] border-white/5 text-zinc-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-4 h-4 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{item.name}</span>
                      {item.quantity > 1 && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold shrink-0">
                      {formatCurrency(item.price, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div
                className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={handleRetake}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
                    isDark
                      ? 'border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>

                <button
                  onClick={handleConfirmImport}
                  className="ios-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Import {parsedData.items.length} Items to Bill</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
