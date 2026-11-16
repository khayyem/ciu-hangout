import { useState } from "react";
import { useStore, useMessages, usePerson } from "../data/store";
import { dayLabel, hhmm, spotsText, isMember, isFull } from "../lib/format";
import { Avatar, Sheet } from "./ui";
import { useNow } from "../lib/useNow";

export function JoinButton({ a, onToggle, wide }) {
  const { me } = useStore();
  const [busy, setBusy] = useState(false);
  const going = isMember(a, me?.uid);
  const isHost = a.hostUid === me?.uid;
  const base = `font-bold rounded-full whitespace-nowrap ${wide ? "w-full py-3" : "px-4 py-2 text-sm"} ${busy ? "opacity-60" : ""}`;
  const click = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await onToggle(a);
    } finally {
      setBusy(false);
    }
  };

  if (isHost) return <span className={`${base} text-center block bg-mist text-grove`}>Hosting</span>;
  if (going)
    return (
      <button onClick={click} disabled={busy} className={`${base} ${wide ? "bg-mist text-danger" : "bg-grove text-white"}`}>
        {wide ? "Leave activity" : "Going"}
      </button>
    );
  if (isFull(a)) return <span className={`${base} text-center block bg-mist text-muted`}>Full</span>;
  return (
    <button onClick={click} disabled={busy} className={`${base} border-2 border-tangerine text-ink ${wide ? "bg-tangerine" : "bg-white"}`}>
      {wide ? "Join and open group chat" : "Join"}
    </button>
  );
}

function MemberAvatar({ uid, size, ring, offset }) {
  const p = usePerson(uid);
  return (
    <div style={{ marginLeft: offset ? -8 : 0 }}>
      <Avatar name={p.short || p.name} photo={p.photoURL} colorKey={uid} size={size} ring={ring} />
    </div>
  );
}

export function ActivityRow({ a, onOpen, onToggle }) {
  const s = spotsText(a);
  return (
    <div
      onClick={() => onOpen(a.id)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(a.id)}
      className="flex gap-3 sm:gap-4 py-4 border-b border-line cursor-pointer items-start"
      role="button"
      tabIndex={0}
    >
      <div className="w-[4.25rem] sm:w-20 shrink-0 text-2xl sm:text-3xl font-extrabold leading-none tabular">{hhmm(a.at)}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-lg leading-snug break-words">{a.title}</div>
        <div className="text-sm mt-0.5 text-muted break-words">
          {a.cat} · {a.place}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center">
            {a.memberUids.slice(0, 4).map((uid, i) => (
              <MemberAvatar key={uid} uid={uid} size={24} ring offset={i > 0} />
            ))}
            {a.memberUids.length > 4 && <span className="ml-2 text-sm text-muted">+{a.memberUids.length - 4}</span>}
          </div>
          <span className={`text-sm font-semibold ${s.hot ? "text-tangerine" : "text-muted"}`}>{s.text}</span>
        </div>
      </div>
      <div className="shrink-0 pt-0.5">
        <JoinButton a={a} onToggle={onToggle} />
      </div>
    </div>
  );
}

function MemberChip({ uid, a, onPerson }) {
  const { me } = useStore();
  const p = usePerson(uid);
  return (
    <button onClick={() => onPerson(uid)} className="flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-sm bg-mist">
      <Avatar name={p.short || p.name} photo={p.photoURL} colorKey={uid} size={22} ring={false} />
      {uid === me?.uid ? "You" : p.short}
      {uid === a.hostUid ? " · host" : ""}
    </button>
  );
}

function LastMessage({ a }) {
  const { me } = useStore();
  const msgs = useMessages(a.id, 1);
  const last = msgs?.[0];
  const who = usePerson(last?.uid);
  if (!last) return "No messages yet. Say hi and agree where to meet.";
  return `${last.uid === me?.uid ? "You" : who.short}: ${last.text}`;
}

export function ActivityDetail({ a, onClose, onToggle, onChat, onPerson, onEdit, onDelete, onReport }) {
  const { me, isAdmin } = useStore();
  const inIt = isMember(a, me?.uid);
  const isHost = a.hostUid === me?.uid;
  const past = a.at < useNow();
  return (
    <Sheet onClose={onClose} label={a.title}>
      <div className="pr-10">
        <div className="text-sm font-semibold text-grove">
          {dayLabel(a.at)} at {hhmm(a.at)}
          {past ? " · started" : ""}
        </div>
        <h2 className="text-2xl font-extrabold mt-1 leading-tight break-words">{a.title}</h2>
        <div className="mt-1 text-muted break-words">
          {a.cat} · {a.place}
        </div>
      </div>
      <p className="mt-4 leading-relaxed whitespace-pre-line break-words">{a.desc || "No details yet."}</p>

      <div className="mt-5">
        <div className="font-bold">
          {a.memberUids.length} going{a.max ? ` of ${a.max}` : ""}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {a.memberUids.map((uid) => (
            <MemberChip key={uid} uid={uid} a={a} onPerson={onPerson} />
          ))}
        </div>
      </div>

      {inIt && (
        <button onClick={() => onChat(a.id)} className="mt-5 w-full text-left p-4 rounded-2xl border-2 border-grove">
          <div className="font-bold text-grove">Group chat · {a.memberUids.length} {a.memberUids.length === 1 ? "person" : "people"}</div>
          <div className="text-sm mt-0.5 truncate text-muted">
            <LastMessage a={a} />
          </div>
        </button>
      )}
      <div className="mt-3">
        <JoinButton a={a} onToggle={onToggle} wide />
      </div>
      {!inIt && <p className="text-sm text-center mt-2 text-muted">Everyone who joins gets added to the group chat.</p>}

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 justify-center text-sm font-semibold">
        {isHost && (
          <button onClick={() => onEdit(a)} className="text-ink underline underline-offset-4">
            Edit
          </button>
        )}
        {(isHost || isAdmin) && (
          <button onClick={() => onDelete(a)} className="text-danger underline underline-offset-4">
            Delete
          </button>
        )}
        {!isHost && (
          <button onClick={() => onReport({ type: "activity", targetId: a.id, targetTitle: a.title })} className="text-muted underline underline-offset-4">
            Report
          </button>
        )}
      </div>
    </Sheet>
  );
}
