import { useState } from "react";
import { useStore, usePerson } from "../data/store";
import { dayLabel, hhmm, isMember } from "../lib/format";
import { Avatar, CiuMark, Sheet } from "./ui";
import { useNow } from "../lib/useNow";
import { STARTER_TITLES, starterActivities } from "../lib/starters";

export function SignIn({ onDemo }) {
  const { signIn } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    setBusy(true);
    setErr("");
    try {
      await signIn();
    } catch (e) {
      setErr(e.code === "auth/unauthorized-domain" ? "Sign-in isn't enabled for this web address yet." : e.message || "Couldn't sign in. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-dvh max-w-md mx-auto px-6 flex flex-col">
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2.5">
          <CiuMark size={48} />
          <h1 className="text-4xl font-extrabold tracking-tight">hangout</h1>
        </div>
        <p className="mt-6 text-2xl font-bold leading-snug">Football tonight, kebab tomorrow, a study group before finals.</p>
        <p className="mt-3 text-muted">See what CIU students are doing. Join in or start something, and plan it together in a group chat.</p>
        <button onClick={go} disabled={busy} className={`mt-8 w-full font-bold py-3.5 rounded-full bg-tangerine text-ink ${busy ? "opacity-60" : ""}`}>
          {busy ? "Signing in…" : "Continue with Google"}
        </button>
        {err && <p className="mt-3 text-sm font-semibold text-danger">{err}</p>}
        <p className="mt-3 text-sm text-center text-muted">For Cyprus International University students only.</p>
      </div>
      {onDemo && (
        <button onClick={onDemo} className="py-6 text-sm font-semibold text-muted">
          Just looking? Try the demo
        </button>
      )}
    </div>
  );
}

export function PersonCard({ uid, onClose, onReport, flash }) {
  const { me, acts, blocked, block, unblock } = useStore();
  const isBlocked = blocked.has(uid);
  const p = usePerson(uid);
  const isMe = uid === me?.uid;
  const now = useNow();
  const hosting = acts.filter((a) => a.hostUid === uid && a.at > now).length;
  return (
    <Sheet onClose={onClose} label={p.name}>
      <div className="flex items-center gap-4 pr-10">
        <Avatar name={p.short || p.name} photo={p.photoURL} colorKey={uid} size={64} ring={false} />
        <div className="min-w-0">
          <div className="text-xl font-extrabold break-words">{p.name}</div>
          <div className="text-sm text-muted">{[p.dept, p.year].filter(Boolean).join(" · ") || "CIU student"}</div>
        </div>
      </div>
      {p.bio && <p className="mt-4 leading-relaxed break-words">{p.bio}</p>}
      <p className="mt-4 text-sm text-muted">
        Hosting {hosting} upcoming {hosting === 1 ? "activity" : "activities"}
      </p>
      {!isMe && (
        <div className="mt-5 flex gap-3">
          <button
            onClick={async () => {
              try {
                if (isBlocked) {
                  await unblock(uid);
                  flash?.(`${p.short} is unblocked`);
                } else {
                  await block(uid);
                  flash?.(`Blocked. You won't see ${p.short}'s activities or messages.`);
                  onClose();
                }
              } catch (e) {
                flash?.(e.message || "Something went wrong");
              }
            }}
            className={`flex-1 font-bold py-3 rounded-full bg-mist ${isBlocked ? "text-ink" : "text-danger"}`}
          >
            {isBlocked ? "Unblock" : "Block"}
          </button>
          <button onClick={() => onReport({ type: "user", targetId: uid, targetTitle: p.name })} className="flex-1 font-bold py-3 rounded-full bg-mist">
            Report
          </button>
        </div>
      )}
      {isBlocked && <p className="mt-2 text-sm text-center text-muted">You've blocked {p.short}. Their activities and messages are hidden.</p>}
    </Sheet>
  );
}

function ReportItem({ r, onOpen, onDeleteActivity }) {
  const { acts, resolveReport } = useStore();
  const reporter = usePerson(r.reporterUid);
  const act = r.type === "activity" ? acts.find((a) => a.id === r.targetId) : null;
  return (
    <div className="py-3 border-b border-line">
      <div className="text-xs font-bold uppercase tracking-wide text-muted">
        {r.type === "user" ? "Person" : "Activity"} · {dayLabel(r.createdAt)} {hhmm(r.createdAt)}
      </div>
      <div className="font-bold break-words">{r.targetTitle || r.targetId}</div>
      <div className="text-sm">
        {r.reason}
        {r.details ? ` — ${r.details}` : ""}
      </div>
      <div className="text-xs text-muted">Reported by {reporter.name}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold">
        {r.type === "user" && (
          <button onClick={() => onOpen({ person: r.targetId })} className="px-3 py-1.5 rounded-full bg-mist">
            View person
          </button>
        )}
        {act && (
          <>
            <button onClick={() => onOpen({ activity: act.id })} className="px-3 py-1.5 rounded-full bg-mist">
              Open
            </button>
            <button onClick={() => onDeleteActivity(act)} className="px-3 py-1.5 rounded-full bg-mist text-danger">
              Delete activity
            </button>
          </>
        )}
        <button onClick={() => resolveReport(r.id)} className="px-3 py-1.5 rounded-full bg-mist">
          Mark resolved
        </button>
      </div>
    </div>
  );
}

function StarterControls({ flash }) {
  const { me, acts, createActivity, deleteActivity } = useStore();
  const [busy, setBusy] = useState(false);
  const now = useNow();
  const mine = acts.filter((a) => a.hostUid === me.uid && STARTER_TITLES.has(a.title) && a.at > now);
  const run = async (fn, done) => {
    setBusy(true);
    try {
      await fn();
      flash(done);
    } catch (e) {
      flash(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };
  const add = () =>
    run(async () => {
      const have = new Set(mine.map((a) => a.title));
      for (const a of starterActivities()) if (!have.has(a.title)) await createActivity(a);
    }, "Starter activities added to the feed");
  const remove = () => run(async () => Promise.all(mine.map((a) => deleteActivity(a.id))), "Starter activities removed");
  return (
    <div className="mb-6 p-4 rounded-2xl border border-line">
      <div className="font-bold">Starter activities</div>
      <p className="mt-1 text-sm text-muted">
        Adds {STARTER_TITLES.size} activities at campus places over the next days, hosted by you, so the feed isn't empty. Real people can join them.
      </p>
      <div className="mt-3 flex gap-2 text-sm font-bold">
        <button onClick={add} disabled={busy || mine.length >= STARTER_TITLES.size} className={`px-4 py-2 rounded-full bg-ink text-white ${busy || mine.length >= STARTER_TITLES.size ? "opacity-50" : ""}`}>
          {mine.length ? "Add missing" : "Add to feed"}
        </button>
        {mine.length > 0 && (
          <button onClick={remove} disabled={busy} className={`px-4 py-2 rounded-full bg-mist text-danger ${busy ? "opacity-50" : ""}`}>
            Remove ({mine.length})
          </button>
        )}
      </div>
    </div>
  );
}

function BlockedList({ flash }) {
  const { blocked, unblock, people } = useStore();
  if (!blocked.size) return null;
  return (
    <div className="mt-6">
      <div className="font-bold">Blocked</div>
      {[...blocked].map((uid) => (
        <div key={uid} className="flex items-center justify-between gap-3 py-2 border-b border-line">
          <span className="truncate">{people[uid]?.name || "CIU student"}</span>
          <button
            onClick={async () => {
              await unblock(uid);
              flash("Unblocked");
            }}
            className="text-sm font-bold px-3 py-1.5 rounded-full bg-mist"
          >
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
}

export function ProfileTab({ onEdit, onSignOut, onOpen, onAdminOpen, onDeleteActivity, onStats, flash }) {
  const { me, acts, isAdmin, reports } = useStore();
  const now = useNow();
  const upcoming = acts.filter((a) => isMember(a, me.uid) && a.at > now).sort((x, y) => x.at - y.at);
  const hosting = upcoming.filter((a) => a.hostUid === me.uid).length;
  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <Avatar name={me.short || me.name} photo={me.photoURL} colorKey={me.uid} size={80} ring={false} />
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-tight break-words">{me.name}</div>
          <div className="text-muted">
            {me.dept} · {me.year}
          </div>
        </div>
      </div>
      {me.bio && <p className="mt-4 leading-relaxed break-words">{me.bio}</p>}

      <div className="mt-5 grid grid-cols-3 rounded-2xl overflow-hidden border border-line">
        {[
          ["Student ID", me.sid || "—"],
          ["Going", upcoming.length - hosting],
          ["Hosting", hosting],
        ].map(([k, v], i) => (
          <div key={k} className={`p-3 min-w-0 ${i ? "border-l border-line" : ""}`}>
            <div className="text-xs text-muted">{k}</div>
            <div className="font-extrabold text-lg tabular truncate">{v}</div>
          </div>
        ))}
      </div>
      <p className="text-xs mt-2 text-muted">Only you can see your student ID.</p>

      <div className="mt-6 font-bold">Your upcoming plans</div>
      {upcoming.length === 0 ? (
        <p className="mt-1 text-sm text-muted">Nothing yet. Join something or create your own.</p>
      ) : (
        upcoming.map((a) => (
          <button key={a.id} onClick={() => onOpen(a.id)} className="w-full text-left flex gap-3 py-3 border-b border-line">
            <span className="font-extrabold w-16 shrink-0 tabular">{hhmm(a.at)}</span>
            <span className="flex-1 min-w-0">
              <span className="font-semibold block truncate">{a.title}</span>
              <span className="text-sm text-muted">
                {dayLabel(a.at)}
                {a.hostUid === me.uid ? " · hosting" : ""}
              </span>
            </span>
          </button>
        ))
      )}

      {isAdmin && (
        <div className="mt-8">
          <button onClick={onStats} className="w-full mb-5 font-bold py-3 rounded-full bg-grove text-white">
            Open stats
          </button>
          <StarterControls flash={flash} />
          <div className="font-bold">
            Reports to review{reports.length ? ` (${reports.length})` : ""}
          </div>
          {reports.length === 0 ? (
            <p className="mt-1 text-sm text-muted">All clear.</p>
          ) : (
            reports.map((r) => <ReportItem key={r.id} r={r} onOpen={onAdminOpen} onDeleteActivity={onDeleteActivity} />)
          )}
        </div>
      )}

      <BlockedList flash={flash} />

      <div className="mt-6 flex gap-3">
        <button onClick={onEdit} className="flex-1 font-bold py-3 rounded-full bg-mist">
          Edit profile
        </button>
        <button onClick={onSignOut} className="flex-1 font-bold py-3 rounded-full bg-mist text-danger">
          Sign out
        </button>
      </div>
    </div>
  );
}
