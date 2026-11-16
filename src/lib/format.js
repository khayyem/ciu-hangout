import { AVATAR_COLORS } from "./constants";

const DAY = 86_400_000;

export const hhmm = (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function dayLabel(t) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const diff = Math.floor((t - start.getTime()) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return new Date(t).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

export const colorOf = (key = "?") => AVATAR_COLORS[[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

export const firstName = (full = "") => full.trim().split(/\s+/)[0] || "";

export function spotsText(a) {
  if (!a.max) return { text: "Open to everyone", hot: false };
  const left = a.max - a.memberUids.length;
  if (left <= 0) return { text: "Full", hot: false };
  return { text: left === 1 ? "1 spot left" : `${left} spots left`, hot: left <= 2 };
}

export const isMember = (a, uid) => !!uid && a.memberUids.includes(uid);
export const isFull = (a) => !!a.max && a.memberUids.length >= a.max;

// Локальная дата/время в формате для <input type="date|time">
export const toDateInput = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const toTimeInput = (t) => hhmm(t);
