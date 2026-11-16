import { useState } from "react";
import { useStore, usePerson } from "../data/store";
import { dayLabel, hhmm, isMember } from "../lib/format";
import { Avatar, CiuMark, Sheet } from "./ui";
import { useNow } from "../lib/useNow";

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

export function PersonCard({ uid, onClose, onReport }) {
  const { me, acts } = useStore();
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
        <button onClick={() => onReport({ type: "user", targetId: uid, targetTitle: p.name })} className="mt-4 text-sm font-semibold text-muted underline underline-offset-4">
          Report
        </button>
      )}
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

export function ProfileTab({ onEdit, onSignOut, onOpen, onAdminOpen, onDeleteActivity }) {
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
