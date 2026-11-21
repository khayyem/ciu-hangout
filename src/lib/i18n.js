import { useSyncExternalStore } from "react";
import { DICT, PLURALS } from "./i18n-dict";

// Языки интерфейса. Ключ перевода — английский текст; если перевода нет, показывается он.
export const LANGS = [
  { code: "en", label: "EN", name: "English", locale: "en-GB" },
  { code: "tr", label: "TR", name: "Türkçe", locale: "tr-TR" },
  { code: "ru", label: "RU", name: "Русский", locale: "ru-RU" },
];
const KEY = "hangout-lang";

function detect() {
  try {
    const saved = localStorage.getItem(KEY);
    if (LANGS.some((l) => l.code === saved)) return saved;
  } catch {
    /* ignore */
  }
  const nav = (navigator.languages || [navigator.language || "en"]).map((l) => l.slice(0, 2).toLowerCase());
  return nav.find((c) => LANGS.some((l) => l.code === c)) || "en";
}

let lang = detect();
document.documentElement.lang = lang;
const subs = new Set();

export const getLang = () => lang;
export const locale = () => LANGS.find((l) => l.code === lang).locale;

export function setLang(code) {
  if (code === lang || !LANGS.some((l) => l.code === code)) return;
  lang = code;
  document.documentElement.lang = code;
  try {
    localStorage.setItem(KEY, code);
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
}

// Компонент, вызвавший useLang, перерисуется при смене языка (вместе со всеми детьми).
export function useLang() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => lang,
    () => lang,
  );
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : s);

// t("Join") → "Katıl" / "Присоединиться"; t("Hi {name}", { name })
export function t(key, vars) {
  const s = (lang !== "en" && DICT[lang]?.[key]) || key;
  return fill(s, vars);
}

// Множественное число: tn("{n} spots left", 3). Формы — по правилам языка (Intl.PluralRules).
const rules = {};
export function tn(key, n, vars) {
  const forms = PLURALS[lang]?.[key] || PLURALS.en[key];
  if (!forms) return fill(key, { n, ...vars });
  const cat = (rules[lang] ||= new Intl.PluralRules(locale())).select(n);
  const s = forms[cat] || forms.other;
  return fill(s, { n, ...vars });
}
