import { firebaseBackend } from "./firebaseBackend";
import { demoBackend } from "./demoBackend";

// ?demo в адресе (или VITE_DEMO=1) включает демо-режим с данными в памяти.
// ?live выключает его, если он был запомнен.
function pickDemo() {
  if (import.meta.env.VITE_DEMO === "1") return true;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.has("live")) sessionStorage.removeItem("hangout-demo");
    if (q.has("demo")) sessionStorage.setItem("hangout-demo", "1");
    return sessionStorage.getItem("hangout-demo") === "1";
  } catch {
    return false;
  }
}

export const backend = pickDemo() ? demoBackend : firebaseBackend;
