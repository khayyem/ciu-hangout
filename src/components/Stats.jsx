import { useEffect, useState } from "react";
import { useStore } from "../data/store";
import { CATS } from "../lib/constants";
import { useNow } from "../lib/useNow";
import { Sheet } from "./ui";

const WEEK = 7 * 86_400_000;

function Tile({ label, value, note }) {
  return (
    <div className="p-3 rounded-2xl border border-line min-w-0">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-extrabold tabular">{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}

// Горизонтальные полосы: одна серия, у каждой подпись и число — цвет ничего не кодирует сам по себе.
function Bars({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="mt-6">
      <h3 className="font-bold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-1 text-sm text-muted">No data yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="text-sm" title={`${r.label}: ${r.value}`}>
              <div className="flex justify-between gap-3">
                <span className="truncate">{r.label}</span>
                <span className="font-bold tabular shrink-0">{r.value}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-mist overflow-hidden">
                <div className="h-full rounded-full bg-grove" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? 4 : 0 }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const countBy = (items, key) => {
  const m = new Map();
  items.forEach((x) => {
    const k = key(x);
    if (k) m.set(k, (m.get(k) || 0) + 1);
  });
  return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

export function StatsSheet({ onClose }) {
  const { acts, people, countMessages } = useStore();
  const now = useNow();
  const [messages, setMessages] = useState(null);
  useEffect(() => {
    let alive = true;
    countMessages()
      .then((n) => alive && setMessages(n))
      .catch(() => alive && setMessages("—"));
    return () => {
      alive = false;
    };
    // Считаем один раз при открытии: функция из стора меняется при каждом обновлении данных.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const students = Object.values(people).filter((p) => p.dept);
  const recent = acts.filter((a) => a.createdAt > now - WEEK);
  const upcoming = acts.filter((a) => a.at > now);
  // «Присоединились» — участники кроме хоста, по активностям за последние 7 дней и будущим.
  const window_ = acts.filter((a) => a.at > now - WEEK);
  const joins = window_.reduce((n, a) => n + Math.max(0, a.memberUids.length - 1), 0);
  const cats = countBy(window_, (a) => a.cat);
  const catRows = CATS.map((c) => cats.find((r) => r.label === c) || { label: c, value: 0 }).sort((a, b) => b.value - a.value);

  return (
    <Sheet onClose={onClose} label="Stats">
      <h2 className="text-2xl font-extrabold pr-10">Stats</h2>
      <p className="mt-1 text-sm text-muted">Last 7 days and upcoming. Visible to moderators only.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Tile label="Students" value={students.length} note="with a profile" />
        <Tile label="New activities" value={recent.length} note="created this week" />
        <Tile label="Joins" value={joins} note={`${upcoming.length} upcoming activities`} />
        <Tile label="Messages" value={messages ?? "…"} note="in all group chats" />
      </div>
      <Bars title="Activities by category" rows={catRows} />
      <Bars title="Students by department" rows={countBy(students, (p) => p.dept).slice(0, 8)} />
      <Bars title="Students by year" rows={countBy(students, (p) => p.year)} />
    </Sheet>
  );
}
