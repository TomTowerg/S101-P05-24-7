/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import { Download, Loader2 } from "lucide-react";

interface QRModalProps {
  packageId: string;
  trackingCode: string;
  open: boolean;
  onClose: () => void;
}

export default function QRModal({ packageId, trackingCode, open, onClose }: QRModalProps) {
  const t = useTranslations("DashboardCommon");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !packageId) return;
    setLoading(true);
    QRCode.toDataURL(packageId, {
      width: 200,
      margin: 2,
      color: { dark: "#111827", light: "#F9FAFB" },
    })
      .then(setQrDataUrl)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, packageId]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${trackingCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal open={open} onClose={onClose} title={`${t("qrModalTitle")} · ${trackingCode}`}>
      <div className="flex flex-col items-center gap-6 py-2">
        {loading ? (
          <div className="w-[200px] h-[200px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-text-muted/40" />
          </div>
        ) : qrDataUrl ? (
          <div className="rounded-2xl overflow-hidden shadow-md border border-border-subtle">
            <img src={qrDataUrl} alt={`QR ${trackingCode}`} width={200} height={200} />
          </div>
        ) : null}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {t("qrDownload")}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-bg-base text-text-muted text-sm font-bold rounded-xl hover:bg-bg-surface transition-colors cursor-pointer border border-border-subtle"
          >
            {t("qrClose")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
