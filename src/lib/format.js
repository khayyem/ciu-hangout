import { AVATAR_COLORS } from "./constants";
import { locale, t as tr, tn } from "./i18n";

const DAY = 86_400_000;

export const hhmm = (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function dayLabel(t) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const diff = Math.floor((t - start.getTime()) / DAY);
  if (diff === 0) return tr("Today");
  if (diff === 1) return tr("Tomorrow");
  if (diff === -1) return tr("Yesterday");
  const s = new Date(t).toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const colorOf = (key = "?") => AVATAR_COLORS[[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

export const firstName = (full = "") => full.trim().split(/\s+/)[0] || "";

export function spotsText(a) {
  if (!a.max) return { text: tr("Open to everyone"), hot: false };
  const left = a.max - a.memberUids.length;
  const waiting = a.waitUids?.length || 0;
  if (left <= 0) return { text: waiting ? `${tr("Full")} · ${tn("{n} waiting", waiting)}` : tr("Full"), hot: false };
  return { text: tn("{n} spots left", left), hot: left <= 2 };
}

export const isMember = (a, uid) => !!uid && a.memberUids.includes(uid);
export const isWaiting = (a, uid) => !!uid && !!a.waitUids?.includes(uid);
export const isFull = (a) => !!a.max && a.memberUids.length >= a.max;

// Локальная дата/время в формате для <input type="date|time">
export const toDateInput = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const toTimeInput = (t) => hhmm(t);

// Живые метки времени для ленты: «Starts in 25 min» за час до начала, «Happening now» 2 часа после.
export function timeBadge(at, now) {
  const diff = at - now;
  if (diff > 0 && diff <= 60 * 60_000) {
    const mins = Math.max(1, Math.round(diff / 60_000));
    return { text: tr("Starts in {n} min", { n: mins }), tone: "soon" };
  }
  if (diff <= 0 && diff > -2 * 3600_000) return { text: tr("Happening now"), tone: "now" };
  return null;
}
