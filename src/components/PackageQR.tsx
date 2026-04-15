"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { Copy, Download, Printer, Check, QrCode as QrIcon } from "lucide-react";

interface PackageQRProps {
  packageId: string;
  trackingCode: string;
  recipientName?: string;
  apartmentNumber: string;
}

export default function PackageQR({
  packageId,
  trackingCode,
  recipientName,
  apartmentNumber,
}: PackageQRProps) {
  const t = useTranslations("PackageForm");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We encode the package ID for secure verification
    QRCode.toDataURL(
      packageId,
      {
        width: 300,
        margin: 2,
        color: {
          dark: "#0f172a", // slate-900
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (!err) setQrUrl(url);
      }
    );
  }, [packageId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.download = `QR-${trackingCode}.png`;
    link.href = qrUrl;
    link.click();
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const windowPrint = window.open("", "", "width=600,height=600");
    if (!windowPrint) return;

    windowPrint.document.write(`
      <html>
        <head>
          <title>Print QR - ${trackingCode}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .label {
              border: 2px solid #000;
              padding: 20px;
              text-align: center;
              border-radius: 8px;
              width: 300px;
            }
            img { width: 200px; height: 200px; margin-bottom: 10px; }
            .code { font-family: monospace; font-weight: bold; font-size: 1.2rem; }
            .info { margin-top: 10px; font-size: 0.9rem; color: #333; }
          </style>
        </head>
        <body>
          <div class="label">
            <h2 style="margin: 0 0 10px 0;">LOOMBOX</h2>
            <img src="${qrUrl}" />
            <div class="code">${trackingCode}</div>
            <div class="info">Depto: ${apartmentNumber}</div>
            ${recipientName ? `<div class="info">${recipientName}</div>` : ""}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-in fade-in zoom-in duration-700">
      {/* QR Code Mirror/Glass Container */}
      <div className="relative group mb-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-center">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="Package QR Code"
              className="w-44 h-44 md:w-52 md:h-52 transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-44 h-44 md:w-52 md:h-52 flex items-center justify-center">
              <QrIcon className="w-12 h-12 text-slate-200 animate-pulse" />
            </div>
          )}
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500/30 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-500/30 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-500/30 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-500/30 rounded-br-2xl"></div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="text-center mb-8 px-2">
        <h3 className="text-slate-900 font-extrabold text-xl tracking-tight leading-none mb-2">
          {t("qrTitle")}
        </h3>
        <p className="text-slate-500 text-sm font-medium">
          {t("qrSubtitle")}.
        </p>
      </div>

      <div className="w-full space-y-4">
        {/* Tracking Details Card */}
        <div 
          onClick={copyToClipboard}
          className="relative overflow-hidden bg-white border border-slate-200 p-4 rounded-xl cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.15em] text-indigo-500 font-black mb-1">
                {t("trackingLabel")}
              </span>
              <span className="font-mono font-bold text-slate-800 text-lg">
                {trackingCode}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-indigo-50 transition-colors">
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
              )}
            </div>
          </div>
          {/* Subtle background pattern */}
          <div className="absolute -right-2 -bottom-2 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
            <QrIcon size={80} />
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:shadow-none active:translate-y-0.5"
          >
            <Printer className="w-5 h-5 text-slate-500" />
            <span className="text-sm">{t("printQR")}</span>
          </button>
          <button
            onClick={downloadQR}
            className="flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-200 active:shadow-none active:translate-y-0.5"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm">{t("downloadQR")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
