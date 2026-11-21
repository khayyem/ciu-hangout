import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Sheet } from "./ui";
import { t } from "../lib/i18n";

export function QrImage({ text, size = 240 }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#15171A", light: "#FFFFFF" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(""));
    return () => {
      alive = false;
    };
  }, [text]);
  return (
    <div
      className="mx-auto bg-white [&>svg]:w-full [&>svg]:h-full"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`QR: ${text}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// Большой QR для показа на экране или печати плаката (печатается только содержимое листа).
export function QrSheet({ url, kicker, title, subtitle, onClose }) {
  return (
    <Sheet onClose={onClose} label="QR">
      <div className="qr-print text-center pt-2">
        <div className="flex items-center justify-center gap-2">
          <img src="/ciu-logo.png" alt="" className="h-8" />
          <span className="text-2xl font-extrabold tracking-tight">hangout</span>
        </div>
        {kicker && <div className="mt-4 text-sm font-semibold text-grove">{kicker}</div>}
        <h2 className="mt-1 text-2xl font-extrabold leading-tight break-words">{title}</h2>
        {subtitle && <p className="mt-1 text-muted break-words">{subtitle}</p>}
        <div className="mt-5">
          <QrImage text={url} size={260} />
        </div>
        <p className="mt-4 font-bold">{t("Scan with your phone camera to join")}</p>
        <p className="mt-1 text-xs text-muted break-all">{url}</p>
      </div>
      <button onClick={() => window.print()} className="no-print mt-5 w-full font-bold py-3 rounded-full bg-mist">
        {t("Print poster")}
      </button>
    </Sheet>
  );
}
