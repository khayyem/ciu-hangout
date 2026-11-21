// Переходы «вступить / выйти / очередь» как чистые функции: возвращают только
// изменённые поля. Их используют оба бэкенда; правила Firestore проверяют то же самое.

const members = (a) => a.memberUids || [];
const waiting = (a) => a.waitUids || [];
export const isFullNow = (a) => !!a.max && members(a).length >= a.max;

export function joinPatch(a, uid) {
  if (members(a).includes(uid)) return null;
  if (isFullNow(a)) throw new Error("Sorry, it just filled up. You can join the waitlist.");
  const patch = { memberUids: [...members(a), uid] };
  if (waiting(a).includes(uid)) patch.waitUids = waiting(a).filter((u) => u !== uid);
  return patch;
}

// Освободившееся место сразу получает первый в очереди.
export function leavePatch(a, uid) {
  if (!members(a).includes(uid)) return null;
  const rest = members(a).filter((u) => u !== uid);
  const queue = waiting(a);
  if (!queue.length) return { memberUids: rest };
  return { memberUids: [...rest, queue[0]], waitUids: queue.slice(1) };
}

export function waitJoinPatch(a, uid) {
  if (members(a).includes(uid) || waiting(a).includes(uid)) return null;
  if (!isFullNow(a)) throw new Error("A spot is free now. Just join.");
  if (waiting(a).length >= 50) throw new Error("The waitlist is full.");
  return { waitUids: [...waiting(a), uid] };
}

export function waitLeavePatch(a, uid) {
  if (!waiting(a).includes(uid)) return null;
  return { waitUids: waiting(a).filter((u) => u !== uid) };
}
