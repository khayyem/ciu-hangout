import { dayLabel, hhmm } from "./format";

const KEY = "hangout-open-activity";

// Ссылка вида /?a=<id> открывает активность. Запоминаем id до входа в аккаунт,
// а адрес сразу чистим, чтобы обновление страницы не открывало её снова.
try {
  const { pathname, search, hash } = window.location;
  const id = new URLSearchParams(search).get("a");
  if (id) {
    sessionStorage.setItem(KEY, id);
    // Убираем только a=..., остальные параметры (например ?demo) оставляем как были.
    const rest = search.slice(1).split("&").filter((p) => p && !p.startsWith("a=")).join("&");
    window.history.replaceState(null, "", pathname + (rest ? `?${rest}` : "") + hash);
  }
} catch {
  /* приватный режим без sessionStorage — просто не откроем */
}

export function pendingActivityId() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingActivity() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const activityUrl = (id) => `${window.location.origin}/?a=${encodeURIComponent(id)}`;

// Системное меню «Поделиться» на телефоне (WhatsApp, Telegram, Instagram…),
// иначе копируем ссылку. Возвращает "shared" | "copied" | "cancelled".
export async function shareActivity(a) {
  const url = activityUrl(a.id);
  const text = `${a.title} · ${dayLabel(a.at)} at ${hhmm(a.at)} · ${a.place}. Join on CIU Hangout:`;
  if (navigator.share) {
    try {
      await navigator.share({ title: a.title, text, url });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    window.prompt("Copy this link", url);
    return "copied";
  }
}

export const whatsappUrl = (a) =>
  `https://wa.me/?text=${encodeURIComponent(`${a.title} · ${dayLabel(a.at)} at ${hhmm(a.at)} · ${a.place}. Join on CIU Hangout: ${activityUrl(a.id)}`)}`;
