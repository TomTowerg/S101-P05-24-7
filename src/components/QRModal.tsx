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
      color: { dark: "#FFFFFF", light: "#262626" },
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
            <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
          </div>
        ) : qrDataUrl ? (
          <div className="bg-[#262626] rounded-2xl p-6 flex items-center justify-center border border-white/[0.08]">
            <img src={qrDataUrl} alt={`QR ${trackingCode}`} width={200} height={200} />
          </div>
        ) : null}
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {t("qrDownload")}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-transparent text-[#A0A0A0] hover:text-white text-sm font-medium rounded-full transition-colors cursor-pointer border border-white/[0.12] hover:border-white/[0.2]"
          >
            {t("qrClose")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
