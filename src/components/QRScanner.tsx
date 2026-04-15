"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useTranslations } from "next-intl";
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, Maximize } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
  const t = useTranslations("Scanner");
  const [scannerStarted, setScannerStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-reader-container";

  useEffect(() => {
    const startScanner = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize the scanner instance
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // Success
            onScanSuccess(decodedText);
            // Optionally stop after first scan
            stopScanner();
          },
          (errorMessage) => {
            // This is called for every frame where no QR is found
            // usually we don't want to show this as an error to user
          }
        );

        setScannerStarted(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Scanner Error:", err);
        setIsLoading(false);
        if (err.toString().includes("NotAllowedError")) {
          setError(t("errorPermission"));
        } else if (err.toString().includes("NotFoundError")) {
          setError(t("errorNotFound"));
        } else {
          setError(t("errorGeneric"));
        }
        if (onScanError) onScanError(err.toString());
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setScannerStarted(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <Camera className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">{t('title')}</h3>
              <p className="text-xs text-slate-500 font-medium">{t('subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative aspect-square bg-black overflow-hidden group">
          
          {/* Scanning Container */}
          <div id={scannerId} className="w-full h-full"></div>

          {/* Overlays */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white gap-4">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-400" />
              <p className="font-bold text-sm tracking-widest uppercase opacity-80">{t('searching')}</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-10 text-center gap-4">
              <div className="bg-red-500/20 p-4 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">{t('errorHeader')}</h4>
                <p className="text-slate-300 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                {t('start')}
              </button>
            </div>
          )}

          {/* Scanning Animation Frame (only when started) */}
          {scannerStarted && !isLoading && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Corner boundaries */}
              <div className="w-[260px] h-[260px] relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                
                {/* Moving red line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan-line"></div>
              </div>
              
              {/* Hint text */}
              <div className="absolute bottom-10 left-0 w-full text-center">
                <span className="px-4 py-2 bg-indigo-600/90 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-sm border border-white/20">
                  {t('scanning')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-6 bg-slate-50 flex items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200">
            <Maximize className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0% }
          50% { top: 100% }
          100% { top: 0% }
        }
        .animate-scan-line {
          animation: scan-line 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
