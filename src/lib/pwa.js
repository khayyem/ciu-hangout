import { useSyncExternalStore } from "react";

// --- Онлайн/офлайн ---
const subscribeOnline = (cb) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};
export const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

// --- Установка на главный экран ---
// Chrome/Android присылает beforeinstallprompt один раз и рано — ловим при загрузке модуля.
let deferred = null;
const listeners = new Set();
const emit = () => listeners.forEach((f) => f());
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e;
  emit();
});
window.addEventListener("appinstalled", () => {
  deferred = null;
  emit();
});

const DISMISS_KEY = "hangout-install-dismissed";
const readDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};
let dismissed = readDismissed();

export const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// "android" — можно показать системный диалог; "ios" — подсказка про «Поделиться → На экран Домой»; null — ничего.
function installMode() {
  if (dismissed || isStandalone()) return null;
  if (deferred) return "android";
  if (isIos()) return "ios";
  return null;
}

export function useInstall() {
  const mode = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    installMode,
    () => null,
  );
  return {
    mode,
    async install() {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice.catch(() => null);
      deferred = null;
      emit();
    },
    dismiss() {
      dismissed = true;
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
      emit();
    },
  };
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
