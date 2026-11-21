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

// Компактный выбор языка для шапки: видна pill с кодом языка, по нажатию — системный список.
export function LangPicker() {
  const lang = useLang();
  return (
    <label className="relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-mist text-sm font-bold shrink-0 cursor-pointer">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
      </svg>
      {LANGS.find((l) => l.code === lang).label}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label="Language"
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
