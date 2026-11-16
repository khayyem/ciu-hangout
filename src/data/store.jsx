import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { backend } from "./backend";

const StoreCtx = createContext(null);

// Подписка, привязанная к ключу: данные от старого ключа не показываются,
// пока не придут данные для нового (без setState внутри эффектов).
function useKeyed(key, subscribe, initial) {
  const [box, setBox] = useState({ key: null, value: initial });
  useEffect(() => {
    if (key == null) return;
    return subscribe(
      (value) => setBox({ key, value }),
      // Ошибка доступа/сети: не висим на загрузке вечно, показываем пустое состояние.
      () => setBox({ key, value: null }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return box.key === key && key != null ? box.value : undefined;
}

const complete = (p) => !!(p && p.name && p.short && p.dept && p.year);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined — ещё грузится, null — не вошёл
  useEffect(() => backend.onAuth(setUser), []);

  const uid = user?.uid ?? null;
  const profile = useKeyed(uid, (cb, err) => backend.onProfile(uid, cb, err));
  const priv = useKeyed(uid, (cb, err) => backend.onPrivate(uid, cb, err));
  // Остальные данные читаем только после заполнения профиля (так требуют правила).
  const dataKey = complete(profile) ? uid : null;
  const acts = useKeyed(dataKey, (cb, err) => backend.onActivities(cb, err));
  const people = useKeyed(dataKey, (cb, err) => backend.onUsers(cb, err));
  const reports = useKeyed(user?.isAdmin && dataKey ? uid : null, (cb, err) => backend.onReports(cb, err));

  const value = useMemo(() => {
    let me;
    if (user === null) me = null;
    // Профиль из старой версии приложения (без факультета/курса) считается незаполненным.
    else if (user && profile !== undefined) me = complete(profile) ? { ...profile, sid: priv?.sid || "" } : null;

    const need = () => {
      if (!uid) throw new Error("Please sign in first.");
      return uid;
    };
    return {
      mode: backend.mode,
      user,
      me,
      isAdmin: !!user?.isAdmin,
      acts: acts || [],
      actsReady: acts !== undefined,
      people: people || {},
      reports: reports || [],
      signIn: () => backend.signIn(),
      signOut: () => backend.signOut(),
      saveProfile: (p, sid) => backend.saveProfile(need(), p, sid),
      createActivity: (data) => backend.createActivity(need(), data),
      updateActivity: (id, data) => backend.updateActivity(id, data),
      deleteActivity: (id) => backend.deleteActivity(id),
      join: (id) => backend.join(id, need()),
      leave: (id) => backend.leave(id, need()),
      sendMessage: (id, text) => backend.sendMessage(id, need(), text),
      report: (r) => backend.report(need(), r),
      resolveReport: (id) => backend.resolveReport(id),
    };
  }, [user, uid, profile, priv, acts, people, reports]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(StoreCtx);

// Последние `limit` сообщений чата активности, в хронологическом порядке.
// eslint-disable-next-line react-refresh/only-export-components
export function useMessages(activityId, limit = 200) {
  const key = activityId ? `${activityId}:${limit}` : null;
  return useKeyed(key, (cb, err) => backend.onMessages(activityId, limit, cb, err));
}

// Профиль по uid с запасным вариантом, если пользователь удалён.
// eslint-disable-next-line react-refresh/only-export-components
export function usePerson(uid) {
  const { people } = useStore();
  return people[uid] || { uid, name: "CIU student", short: "Student", dept: "", year: "", bio: "", photoURL: null };
}
