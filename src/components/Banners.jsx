import { useInstall, useOnline } from "../lib/pwa";

export function OfflineBar() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="bg-ink text-white text-sm font-semibold text-center py-2 px-4" role="status">
      You're offline. Showing what was saved, messages will send when you're back.
    </div>
  );
}

export function InstallBanner() {
  const { mode, install, dismiss } = useInstall();
  if (!mode) return null;
  return (
    <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-mist">
      <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 text-sm">
        <div className="font-bold">Get Hangout on your home screen</div>
        {mode === "ios" ? (
          <div className="text-muted mt-0.5">
            Tap <span className="font-semibold text-ink">Share</span>, then <span className="font-semibold text-ink">Add to Home Screen</span>.
          </div>
        ) : (
          <div className="text-muted mt-0.5">Opens like an app, works on a weak connection.</div>
        )}
        <div className="mt-2 flex gap-2 font-bold">
          {mode === "android" && (
            <button onClick={install} className="px-4 py-1.5 rounded-full bg-tangerine text-ink">
              Install
            </button>
          )}
          <button onClick={dismiss} className="px-4 py-1.5 rounded-full bg-white">
            {mode === "ios" ? "Got it" : "Not now"}
          </button>
        </div>
      </div>
    </div>
  );
}
