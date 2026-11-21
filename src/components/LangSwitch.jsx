import { LANGS, setLang, useLang } from "../lib/i18n";

// Переключатель языка: EN / TR / RU в виде pill-кнопок.
export function LangSwitch({ className = "" }) {
  const lang = useLang();
  return (
    <div className={`inline-flex p-1 rounded-full bg-mist gap-1 ${className}`} role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          title={l.name}
          className={`px-3 py-1 rounded-full text-sm font-bold ${lang === l.code ? "bg-ink text-white" : "text-ink"}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

