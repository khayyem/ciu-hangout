import { useEffect, useRef, useState } from "react";
import { useStore, useMessages, usePerson } from "../data/store";
import { dayLabel, hhmm, isMember } from "../lib/format";
import { Avatar, EmptyState, Sheet } from "./ui";
import { t, tn } from "../lib/i18n";

function Bubble({ m, mine, onPerson }) {
  const p = usePerson(m.uid);
  return (
    <div className={`flex gap-2 items-end ${mine ? "justify-end" : ""}`}>
      {!mine && (
        <button onClick={() => onPerson(m.uid)} aria-label={p.short}>
          <Avatar name={p.short} photo={p.photoURL} colorKey={m.uid} size={28} ring={false} />
        </button>
      )}
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words whitespace-pre-line ${mine ? "bg-grove text-white" : "bg-mist"}`}>
        {!mine && <div className="font-bold text-xs mb-0.5">{p.short}</div>}
        {m.text}
        <div className="text-xs mt-0.5 opacity-60">{hhmm(m.at)}</div>
      </div>
    </div>
  );
}

export function ChatScreen({ a, onClose, onPerson, flash }) {
  const { me, sendMessage, markRead, blocked } = useStore();
  const msgs = useMessages(a.id);
  // Чат открыт — всё, что в нём есть, считается прочитанным (и новые сообщения тоже).
  useEffect(() => {
    markRead(a.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.id, a.lastMsgAt]);
  const [msg, setMsg] = useState("");
  const end = useRef(null);
  const count = msgs?.length || 0;
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [count]);

  const send = async () => {
    const text = msg.trim().slice(0, 1000);
    if (!text) return;
    setMsg("");
    try {
      await sendMessage(a.id, text);
    } catch (e) {
      setMsg(text);
      flash(e.message || t("Message not sent"));
    }
  };

  return (
    <Sheet onClose={onClose} label={a.title} full>
      <div className="p-5 pr-14 border-b border-line">
        <div className="font-extrabold text-lg leading-tight break-words">{a.title}</div>
        <div className="text-sm text-muted">
          {t("{day} at {time}", { day: dayLabel(a.at), time: hhmm(a.at) })} · {tn("{n} people", a.memberUids.length)}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[260px]">
        <p className="text-xs text-center text-muted">{t("Chat for everyone going. Agree on where and when to meet.")}</p>
        {msgs === undefined && <p className="text-sm text-center text-muted">{t("Loading…")}</p>}
        {msgs
          ?.filter((m) => !blocked.has(m.uid))
          .map((m) => (
            <Bubble key={m.id} m={m} mine={m.uid === me.uid} onPerson={onPerson} />
          ))}
        {msgs?.some((m) => blocked.has(m.uid)) && (
          <p className="text-xs text-center text-muted">{t("Messages from people you blocked are hidden.")}</p>
        )}
        <div ref={end} />
      </div>
      <form
        className="p-4 border-t border-line flex gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          maxLength={1000}
          placeholder={t("Message the group")}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-line text-base"
          aria-label={t("Message")}
          enterKeyHint="send"
        />
        <button type="submit" className="px-4 rounded-full font-bold bg-ink text-white">
          {t("Send")}
        </button>
      </form>
    </Sheet>
  );
}

function ChatRow({ a, onChat }) {
  const { me, unread, blocked } = useStore();
  const isNew = unread.has(a.id);
  const msgs = useMessages(a.id, 1);
  const last = msgs?.[0];
  const who = usePerson(last?.uid);
  return (
    <button onClick={() => onChat(a.id)} className="w-full text-left flex gap-3 py-4 border-b border-line items-center">
      <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 bg-mist text-grove">
        <span className="text-xs font-bold leading-none">{dayLabel(a.at).slice(0, 3)}</span>
        <span className="text-sm font-extrabold leading-tight tabular">{hhmm(a.at)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <span className="font-bold truncate">{a.title}</span>
          {last && <span className={`text-xs shrink-0 ${isNew ? "text-tangerine font-bold" : "text-muted"}`}>{hhmm(last.at)}</span>}
        </div>
        <div className={`text-sm truncate flex items-center gap-2 ${isNew ? "text-ink font-semibold" : "text-muted"}`}>
          {isNew && <span className="w-2.5 h-2.5 rounded-full bg-tangerine shrink-0" aria-label={t("New messages")} />}
          <span className="truncate">
          {last ? (blocked.has(last.uid) ? t("Message hidden") : `${last.uid === me.uid ? t("You") : who.short}: ${last.text}`) : `${tn("{n} people", a.memberUids.length)} · ${t("no messages yet")}`}</span>
        </div>
      </div>
    </button>
  );
}

export function ChatsTab({ onChat, goExplore }) {
  const { me, acts } = useStore();
  const list = acts.filter((a) => isMember(a, me.uid)).sort((x, y) => (y.lastMsgAt || 0) - (x.lastMsgAt || 0) || x.at - y.at);
  if (!list.length)
    return (
      <EmptyState
        title={t("No group chats yet.")}
        text={t("Join an activity and you'll chat with everyone going.")}
        action={t("Find activities")}
        onAction={goExplore}
      />
    );
  return (
    <div className="mt-2">
      {list.map((a) => (
        <ChatRow key={a.id} a={a} onChat={onChat} />
      ))}
    </div>
  );
}
