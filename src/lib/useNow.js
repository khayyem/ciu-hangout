import { useEffect, useState } from "react";

// Текущее время, обновляется раз в минуту: лента сама скрывает прошедшие активности.
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
