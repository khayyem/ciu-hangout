import { useEffect } from "react";
import { colorOf } from "../lib/format";
import { t } from "../lib/i18n";

export function CiuMark({ size = 34 }) {
  return <img src="/ciu-logo.png" alt="Cyprus International University" className="shrink-0 object-contain" style={{ height: size }} />;
}

export function Avatar({ name = "?", photo, size = 28, ring = true, colorKey }) {
  const style = { width: size, height: size, boxShadow: ring ? "0 0 0 2px #fff" : "none" };
  if (photo) return <img src={photo} alt={name} className="rounded-full object-cover shrink-0" style={style} referrerPolicy="no-referrer" />;
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 text-white"
      style={{ ...style, background: colorOf(colorKey || name), fontSize: size * 0.42 }}
      title={name}
    >
      {(name.trim()[0] || "?").toUpperCase()}
    </div>
  );
}

export function Sheet({ onClose, children, label, full }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} />
      <div
        className={`relative w-full md:max-w-lg overflow-y-auto rounded-t-3xl md:rounded-3xl bg-white text-ink ${
          full ? "h-dvh md:h-auto md:max-h-[90dvh] flex flex-col" : "max-h-[92dvh] p-5 md:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        }`}
      >
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full text-xl z-10 bg-mist" aria-label={t("Close")}>
            ×
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export const fieldClass = "w-full mt-1 px-3 py-2.5 rounded-xl border border-line bg-white text-ink text-base";

export function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="mt-3 text-sm font-semibold text-danger">{children}</p>;
}

export function EmptyState({ title, text, action, onAction }) {
  return (
    <div className="py-16 text-center">
      <p className="text-xl font-bold">{title}</p>
      {text && <p className="mt-1 text-muted">{text}</p>}
      {action && (
        <button onClick={onAction} className="mt-5 font-bold px-5 py-3 rounded-full bg-ink text-white">
          {action}
        </button>
      )}
    </div>
  );
}

export function Splash() {
  return (
    <div className="min-h-dvh flex items-center justify-center gap-2.5">
      <CiuMark size={40} />
      <span className="text-3xl font-extrabold tracking-tight">hangout</span>
    </div>
  );
}
