"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Camera, X, RefreshCw, AlertCircle, Maximize, ShieldAlert } from "lucide-react";

import type { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  onClose: () => void;
}

/** Matches a CUID (c…) or UUID (xxxxxxxx-xxxx-…) — the two ID formats Prisma generates */
const VALID_PACKAGE_ID_REGEX =
  /^[a-z0-9]{20,30}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ScannerState = "loading" | "scanning" | "error";

interface ScannerError {
  type: "permission" | "notfound" | "https" | "browser" | "invalidqr" | "generic";
  message: string;
}

/** Progressive camera constraint fallback — typed for html5-qrcode's start() signature */
const CAMERA_CONSTRAINTS: MediaTrackConstraints[] = [
  { facingMode: { exact: "environment" } }, // rear camera, strict (Android Chrome)
  { facingMode: "environment" },             // rear camera, relaxed (iOS Safari)
  { facingMode: "user" },                    // front camera fallback
  {},                                        // any available camera (last resort)
];

export default function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
  const t = useTranslations("Scanner");
  const [state, setState] = useState<ScannerState>("loading");
  const [error, setError] = useState<ScannerError | null>(null);

  // Refs to manage the scanner lifecycle safely
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);
  const scannerId = "qr-reader-container";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors — the scanner may already be stopped
      }
    }
    scannerRef.current = null;
  }, []);

  const startScanner = useCallback(async () => {
    if (!isMountedRef.current || isStartingRef.current) return;
    isStartingRef.current = true;

    setState("loading");
    setError(null);

    // ── Guard 1: HTTPS is required for getUserMedia in production ──
    if (typeof window !== "undefined" && !window.isSecureContext) {
      if (isMountedRef.current) {
        setError({ type: "https", message: t("errorHttps") });
        setState("error");
      }
      isStartingRef.current = false;
      return;
    }

    // ── Guard 2: Check browser support ──
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      if (isMountedRef.current) {
        setError({ type: "browser", message: t("errorBrowser") });
        setState("error");
      }
      isStartingRef.current = false;
      return;
    }

    try {
      // ── Lazy-load html5-qrcode at runtime only (never on the server) ──
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      if (!isMountedRef.current) {
        isStartingRef.current = false;
        return;
      }

      // Ensure any previous scanner instance is fully stopped
      await stopScanner();

      if (!isMountedRef.current) {
        isStartingRef.current = false;
        return;
      }

      const html5QrCode = new Html5Qrcode(scannerId, { verbose: false });
      scannerRef.current = html5QrCode;

      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const boxSize = isMobile ? Math.min(window.innerWidth * 0.7, 280) : 250;
      const config = {
        fps: isMobile ? 15 : 10,
        qrbox: { width: boxSize, height: boxSize },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      };

      // ── Progressive camera constraint fallback ──
      let started = false;
      let lastError: unknown = null;
      // Track if the success/error callback already handled state
      // (e.g. invalid QR detected synchronously in test mocks)
      let callbackFired = false;

      for (const constraint of CAMERA_CONSTRAINTS) {
        if (!isMountedRef.current) break;
        try {
          await html5QrCode.start(
            constraint,
            config,
            (decodedText: string) => {
              callbackFired = true;
              const decoded = decodedText.trim();
              // ── Validate: must look like a Prisma CUID or UUID ──
              if (!VALID_PACKAGE_ID_REGEX.test(decoded)) {
                setError({ type: "invalidqr", message: t("errorInvalidQR") });
                setState("error");
                stopScanner();
                if (onScanError) onScanError("invalid_qr: " + decoded);
                return;
              }
              // Valid package ID — hand off and close scanner
              stopScanner();
              onScanSuccess(decoded);
            },
            () => {
              // Per-frame "no QR found" callback — intentionally silent
            }
          );
          started = true;
          break;
        } catch (err) {
          lastError = err;
          // OverconstrainedError or NotFoundError with this constraint — try next
          const msg = err instanceof Error ? err.message : String(err);
          if (
            msg.includes("OverconstrainedError") ||
            msg.includes("NotFoundError") ||
            msg.includes("DevicesNotFoundError") ||
            msg.includes("Constraints") ||
            msg.includes("constraints") ||
            msg.includes("facing")
          ) {
            continue;
          }
          // Any other error breaks the loop
          break;
        }
      }

      if (!isMountedRef.current) {
        isStartingRef.current = false;
        return;
      }

      if (!started) {
        const errMsg: string = lastError instanceof Error ? lastError.message : String(lastError || "");
        let scannerError: ScannerError;

        if (errMsg.includes("NotAllowedError") || errMsg.includes("PermissionDenied")) {
          scannerError = { type: "permission", message: t("errorPermission") };
        } else if (
          errMsg.includes("NotFoundError") ||
          errMsg.includes("DevicesNotFoundError")
        ) {
          scannerError = { type: "notfound", message: t("errorNotFound") };
        } else {
          scannerError = { type: "generic", message: t("errorGeneric") };
        }

        setError(scannerError);
        setState("error");
        if (onScanError) onScanError(errMsg);
      } else if (!callbackFired) {
        // Only enter scanning state if the callback hasn't already handled state
        // (guards against synchronous callbacks in the invalid-QR flow)
        setState("scanning");
      }
    } catch (err) {
      if (!isMountedRef.current) {
        isStartingRef.current = false;
        return;
      }
      const errMsg: string = err instanceof Error ? err.message : String(err);
      let scannerError: ScannerError;

      if (errMsg.includes("NotAllowedError") || errMsg.includes("PermissionDenied")) {
        scannerError = { type: "permission", message: t("errorPermission") };
      } else if (
        errMsg.includes("NotFoundError") ||
        errMsg.includes("DevicesNotFoundError")
      ) {
        scannerError = { type: "notfound", message: t("errorNotFound") };
      } else {
        scannerError = { type: "generic", message: t("errorGeneric") };
      }

      setError(scannerError);
      setState("error");
      if (onScanError) onScanError(errMsg);
    } finally {
      isStartingRef.current = false;
    }
  }, [t, onScanSuccess, onScanError, stopScanner]);

  useEffect(() => {
    isMountedRef.current = true;
    startScanner();

    return () => {
      isMountedRef.current = false;
      // Fire-and-forget stop — we don't await in cleanup
      stopScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    startScanner();
  };

  // Choose icon based on error type
  const ErrorIcon = error?.type === "https" ? ShieldAlert : AlertCircle;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm md:max-w-lg bg-bg-surface rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 transition-theme">

        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-bg-base/30">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/15 p-2 rounded-xl">
              <Camera className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary leading-tight">{t("title")}</h3>
              <p className="text-xs text-text-muted font-medium">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="p-2 hover:bg-bg-base rounded-full transition-colors text-text-muted hover:text-text-primary cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative aspect-square bg-black overflow-hidden">

          {/* html5-qrcode mount target — always in the DOM so the lib can find it */}
          <div id={scannerId} className="w-full h-full" />

          {/* Loading overlay */}
          {state === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white gap-4">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-400" />
              <p className="font-bold text-sm tracking-widest uppercase opacity-80">
                {t("searching")}
              </p>
            </div>
          )}

          {/* Error overlay */}
          {state === "error" && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-8 text-center gap-4">
              <div className="bg-red-500/20 p-4 rounded-full">
                <ErrorIcon className="w-12 h-12 text-red-400" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">{t("errorHeader")}</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{error.message}</p>
              </div>
              {/* Only show retry for recoverable errors (not invalid QR or browser issues) */}
              {error.type !== "browser" && (
                <button
                  onClick={handleRetry}
                  className="mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors w-full cursor-pointer"
                >
                  {t("retry")}
                </button>
              )}
              {error.type === "invalidqr" && (
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors w-full cursor-pointer"
                >
                  {t("scanAgain")}
                </button>
              )}
            </div>
          )}

          {/* Scanning animation frame (only when actively scanning) */}
          {state === "scanning" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Corner boundary markers */}
              <div className="w-[260px] h-[260px] relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
                {/* Moving scan line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan-line" />
              </div>
              {/* Hint badge */}
              <div className="absolute bottom-10 left-0 w-full text-center">
                <span className="px-4 py-2 bg-indigo-600/90 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-sm border border-white/20">
                  {t("scanning")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-6 bg-bg-base flex items-center gap-4 border-t border-border-subtle">
          <div className="bg-bg-surface p-2.5 rounded-xl shadow-sm border border-border-subtle">
            <Maximize className="w-5 h-5 text-text-muted/60" />
          </div>
          <p className="text-xs text-text-muted font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
