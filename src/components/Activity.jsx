import { useState } from "react";
import { useStore, useMessages, usePerson } from "../data/store";
import { dayLabel, hhmm, spotsText, isMember, isFull, isWaiting, timeBadge } from "../lib/format";
import { downloadIcs, googleCalendarUrl } from "../lib/calendar";
import { activityUrl } from "../lib/share";
import { QrSheet } from "./Qr";
import { t, tn } from "../lib/i18n";
import { Avatar, Sheet } from "./ui";
import { useNow } from "../lib/useNow";
import { mapUrl } from "../lib/places";
import { shareActivity, whatsappUrl } from "../lib/share";

export function JoinButton({ a, onToggle, onWait, wide }) {
  const { me } = useStore();
  const [busy, setBusy] = useState(false);
  const going = isMember(a, me?.uid);
  const isHost = a.hostUid === me?.uid;
  const base = `font-bold rounded-full whitespace-nowrap ${wide ? "w-full py-3" : "px-4 py-2 text-sm"} ${busy ? "opacity-60" : ""}`;
  const run = (fn) => async (e) => {
    e.stopPropagation();
    if (busy || !fn) return;
    setBusy(true);
    try {
      await fn(a);
    } finally {
      setBusy(false);
    }
  };
  const click = run(onToggle);

  if (isHost) return <span className={`${base} text-center block bg-mist text-grove`}>{t("Hosting")}</span>;
  if (going)
    return (
      <button onClick={click} disabled={busy} className={`${base} ${wide ? "bg-mist text-danger" : "bg-grove text-white"}`}>
        {wide ? t("Leave activity") : t("Going")}
      </button>
    );
  if (isWaiting(a, me?.uid))
    return (
      <button onClick={run(onWait)} disabled={busy} className={`${base} bg-mist ${wide ? "text-danger" : "text-grove"}`}>
        {wide ? t("Leave waitlist") : t("Waitlisted")}
      </button>
    );
  if (isFull(a))
    return (
      <button onClick={run(onWait)} disabled={busy} className={`${base} border-2 border-line text-ink ${wide ? "bg-mist border-mist" : "bg-white"}`}>
        {wide ? t("Join the waitlist") : t("Waitlist")}
      </button>
    );
  return (
    <button onClick={click} disabled={busy} className={`${base} border-2 border-tangerine text-ink ${wide ? "bg-tangerine" : "bg-white"}`}>
      {wide ? t("Join and open group chat") : t("Join")}
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

export function TimeBadge({ a }) {
  const b = timeBadge(a.at, useNow());
  if (!b) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${b.tone === "now" ? "text-grove" : "text-tangerine"}`}>
      <span className={`w-2 h-2 rounded-full ${b.tone === "now" ? "bg-grove" : "bg-tangerine"}`} />
      {b.text}
    </span>
  );
}

export function ActivityRow({ a, onOpen, onToggle, onWait }) {
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
        <TimeBadge a={a} />
        <div className="font-bold text-lg leading-snug break-words">{a.title}</div>
        <div className="text-sm mt-0.5 text-muted break-words">
          {t(a.cat)} · {a.place}
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
        <JoinButton a={a} onToggle={onToggle} onWait={onWait} />
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
      {uid === me?.uid ? t("You") : p.short}
      {uid === a.hostUid ? ` · ${t("host")}` : ""}
    </button>
  );
}

function LastMessage({ a }) {
  const { me, blocked } = useStore();
  const msgs = useMessages(a.id, 1);
  const last = msgs?.[0];
  const who = usePerson(last?.uid);
  if (!last) return t("No messages yet. Say hi and agree where to meet.");
  if (blocked.has(last.uid)) return t("Message hidden");
  return `${last.uid === me?.uid ? t("You") : who.short}: ${last.text}`;
}

export function ActivityDetail({ a, onClose, onToggle, onWait, onChat, onPerson, onEdit, onDelete, onReport, flash }) {
  const { me, isAdmin } = useStore();
  const inIt = isMember(a, me?.uid);
  const isHost = a.hostUid === me?.uid;
  const badge = timeBadge(a.at, useNow());
  const [calOpen, setCalOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  return (
    <Sheet onClose={onClose} label={a.title}>
      <div className="pr-10">
        <div className="text-sm font-semibold text-grove">
          {t("{day} at {time}", { day: dayLabel(a.at), time: hhmm(a.at) })}
          {badge ? ` · ${badge.text}` : ""}
        </div>
        <h2 className="text-2xl font-extrabold mt-1 leading-tight break-words">{a.title}</h2>
        <div className="mt-1 text-muted break-words">
          {t(a.cat)} · {a.place}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
        <button
          onClick={async () => {
            const r = await shareActivity(a);
            if (r === "copied") flash?.(t("Link copied. Paste it in any chat."));
          }}
          className="px-4 py-2 rounded-full bg-ink text-white"
        >
          {t("Share")}
        </button>
        <a href={whatsappUrl(a)} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-mist">
          WhatsApp
        </a>
        <a href={mapUrl(a.place)} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-mist">
          {t("Map")}
        </a>
        <button onClick={() => setCalOpen((v) => !v)} className={`px-4 py-2 rounded-full ${calOpen ? "bg-ink text-white" : "bg-mist"}`} aria-expanded={calOpen}>
          {t("Calendar")}
        </button>
        <button onClick={() => setQrOpen(true)} className="px-4 py-2 rounded-full bg-mist">
          QR
        </button>
      </div>
      {calOpen && (
        <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
          <button onClick={() => downloadIcs(a)} className="px-4 py-2 rounded-full border border-line">
            {t("iPhone / Outlook")}
          </button>
          <a href={googleCalendarUrl(a)} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full border border-line">
            Google Calendar
          </a>
          <span className="self-center text-xs text-muted">{t("Reminder 1 hour before")}</span>
        </div>
      )}
      {qrOpen && (
        <QrSheet
          url={activityUrl(a.id)}
          kicker={t("{day} at {time}", { day: dayLabel(a.at), time: hhmm(a.at) })}
          title={a.title}
          subtitle={a.place}
          onClose={() => setQrOpen(false)}
        />
      )}
      <p className="mt-4 leading-relaxed whitespace-pre-line break-words">{a.desc || t("No details yet.")}</p>

      <div className="mt-5">
        <div className="font-bold">
          {a.max ? t("{n} going of {max}", { n: a.memberUids.length, max: a.max }) : tn("{n} going", a.memberUids.length)}
          {a.waitUids?.length ? <span className="font-normal text-muted"> · {tn("{n} on the waitlist", a.waitUids.length)}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {a.memberUids.map((uid) => (
            <MemberChip key={uid} uid={uid} a={a} onPerson={onPerson} />
          ))}
        </div>
      </div>

      {inIt && (
        <button onClick={() => onChat(a.id)} className="mt-5 w-full text-left p-4 rounded-2xl border-2 border-grove">
          <div className="font-bold text-grove">{t("Group chat")} · {tn("{n} people", a.memberUids.length)}</div>
          <div className="text-sm mt-0.5 truncate text-muted">
            <LastMessage a={a} />
          </div>
        </button>
      )}
      <div className="mt-3">
        <JoinButton a={a} onToggle={onToggle} onWait={onWait} wide />
      </div>
      {!inIt && (
        <p className="text-sm text-center mt-2 text-muted">
          {isWaiting(a, me?.uid)
            ? t("You're #{n} in line. If someone leaves, you're in automatically.", { n: a.waitUids.indexOf(me.uid) + 1 })
            : isFull(a)
              ? t("It's full. Join the waitlist and you'll get the next free spot.")
              : t("Everyone who joins gets added to the group chat.")}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 justify-center text-sm font-semibold">
        {isHost && (
          <button onClick={() => onEdit(a)} className="text-ink underline underline-offset-4">
            {t("Edit")}
          </button>
        )}
        {(isHost || isAdmin) && (
          <button onClick={() => onDelete(a)} className="text-danger underline underline-offset-4">
            {t("Delete")}
          </button>
        )}
        {!isHost && (
          <button onClick={() => onReport({ type: "activity", targetId: a.id, targetTitle: a.title })} className="text-muted underline underline-offset-4">
            {t("Report")}
          </button>
        )}
      </div>
    </Sheet>
  );
}
