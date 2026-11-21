import { initializeApp } from "firebase/app";
import {
  getAuth, connectAuthEmulator, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithCredential, signInWithRedirect, signOut as fbSignOut } from "firebase/auth";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator, collection, collectionGroup, doc, onSnapshot, query, where, orderBy, limitToLast,
  addDoc, setDoc, getCountFromServer, updateDoc, deleteDoc, getDocs, runTransaction, writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { HISTORY_MS } from "../lib/constants";
import { joinPatch, leavePatch, waitJoinPatch, waitLeavePatch } from "../lib/membership";
import { t } from "../lib/i18n";

// Конфиг веб-клиента Firebase не секретный (он всё равно попадает в бандл),
// но по договорённости берётся из env. Значения по умолчанию — текущий проект,
// чтобы деплой работал и без настроенных переменных.
const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDpLWpZyLmQIaGqcQ1Yv1t17w3Es3pOsBg",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "ciu-hangout-app.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "ciu-hangout-app",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "ciu-hangout-app.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "259207621004",
  appId: env.VITE_FIREBASE_APP_ID || "1:259207621004:web:b9c5b0e987c19330b6cea9",
};

const app = initializeApp(config);
const auth = getAuth(app);
// Кэш в IndexedDB: лента и чаты открываются мгновенно и без сети (PWA).
const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
// Локальная разработка: VITE_USE_EMULATORS=1 и `firebase emulators:start`
const useEmulators = env.VITE_USE_EMULATORS === "1";
if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const toMs = (ts) => (ts && typeof ts.toMillis === "function" ? ts.toMillis() : typeof ts === "number" ? ts : Date.now());

const mapActivity = (d) => {
  const x = d.data();
  return {
    id: d.id,
    title: x.title,
    cat: x.cat,
    at: x.at,
    place: x.place,
    max: x.max || 0,
    desc: x.desc || "",
    hostUid: x.hostUid,
    memberUids: x.memberUids || [],
    waitUids: x.waitUids || [],
    lastMsgAt: x.lastMsgAt ? toMs(x.lastMsgAt) : 0,
    lastMsgUid: x.lastMsgUid || null,
    createdAt: x.createdAt ? toMs(x.createdAt) : 0,
  };
};

function applyTx(id, makePatch) {
  return runTransaction(db, async (tx) => {
    const ref = doc(db, "activities", id);
    const s = await tx.get(ref);
    if (!s.exists()) throw new Error(t("This activity was removed."));
    const patch = makePatch(s.data());
    if (patch) tx.update(ref, patch);
  });
}

const fail = (onError) => (e) => {
  console.error(e);
  onError?.(e);
};

export const firebaseBackend = {
  mode: "firebase",

  onAuth(cb) {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return cb(null);
      let isAdmin = false;
      try {
        // true — свежий токен с сервера: роль модератора видна сразу, без повторного входа.
        isAdmin = (await u.getIdTokenResult(true)).claims.admin === true;
      } catch {
        /* нет сети — считаем обычным пользователем */
      }
      cb({ uid: u.uid, email: u.email, displayName: u.displayName || "", photoURL: u.photoURL || null, isAdmin });
    });
  },

  async signIn() {
    if (useEmulators) {
      // Эмулятор принимает неподписанный Google-токен — вход без попапа и без интернета.
      const email = window.prompt("Emulator sign-in: email", "student@example.com");
      if (!email) return;
      const name = email.split("@")[0];
      await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true, name })));
      return;
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      // Попапы блокируются во встроенных браузерах (Instagram, Telegram) — пробуем редирект.
      if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, provider);
      } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
        throw e;
      }
    }
  },

  signOut: () => fbSignOut(auth),

  onProfile(uid, cb, onError) {
    // Ждём подтверждения сервером: правила для ленты проверяют, что профиль уже существует.
    return onSnapshot(doc(db, "users", uid), { includeMetadataChanges: true }, (s) => {
      if (s.metadata.hasPendingWrites) return;
      cb(s.exists() ? { uid, ...s.data() } : null);
    }, fail(onError));
  },

  onPrivate(uid, cb, onError) {
    return onSnapshot(doc(db, "users_private", uid), (s) => cb(s.exists() ? s.data() : null), fail(onError));
  },

  async saveProfile(uid, profile, sid) {
    const batch = writeBatch(db);
    batch.set(doc(db, "users", uid), { ...profile, updatedAt: serverTimestamp() });
    batch.set(doc(db, "users_private", uid), { sid });
    await batch.commit();
  },

  onUsers(cb, onError) {
    return onSnapshot(collection(db, "users"), (snap) => {
      const map = {};
      snap.forEach((d) => (map[d.id] = { uid: d.id, ...d.data() }));
      cb(map);
    }, fail(onError));
  },

  onActivities(cb, onError) {
    const q = query(collection(db, "activities"), where("at", ">", Date.now() - HISTORY_MS), orderBy("at"));
    return onSnapshot(q, (snap) => cb(snap.docs.map(mapActivity)), fail(onError));
  },

  async createActivity(uid, data) {
    const ref = await addDoc(collection(db, "activities"), {
      ...data,
      hostUid: uid,
      memberUids: [uid],
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  updateActivity: (id, data) => updateDoc(doc(db, "activities", id), data),

  async deleteActivity(id) {
    // Сначала сообщения (пока активность существует, правила их пропускают), потом сама активность.
    const msgs = await getDocs(collection(db, "activities", id, "messages"));
    for (let i = 0; i < msgs.docs.length; i += 450) {
      const batch = writeBatch(db);
      msgs.docs.slice(i, i + 450).forEach((m) => batch.delete(m.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, "activities", id));
  },

  // Все переходы — в транзакции: лимит мест и очередь проверяются на свежих данных,
  // даже если несколько человек нажали одновременно.
  join: (id, uid) => applyTx(id, (a) => joinPatch(a, uid)),
  leave: (id, uid) => applyTx(id, (a) => leavePatch(a, uid)),
  joinWaitlist: (id, uid) => applyTx(id, (a) => waitJoinPatch(a, uid)),
  leaveWaitlist: (id, uid) => applyTx(id, (a) => waitLeavePatch(a, uid)),

  // Кого пользователь заблокировал (видит только он).
  onBlocks(uid, cb, onError) {
    return onSnapshot(doc(db, "blocks", uid), (s) => cb(s.data()?.uids || []), fail(onError));
  },
  setBlocks: (uid, uids) => setDoc(doc(db, "blocks", uid), { uids }),

  onMessages(id, limit, cb, onError) {
    const q = query(collection(db, "activities", id, "messages"), orderBy("createdAt"), limitToLast(limit));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => {
        const m = d.data({ serverTimestamps: "estimate" });
        return { id: d.id, uid: m.uid, text: m.text, at: toMs(m.createdAt) };
      }));
    }, fail(onError));
  },

  async sendMessage(id, uid, text) {
    const batch = writeBatch(db);
    batch.set(doc(collection(db, "activities", id, "messages")), { uid, text, createdAt: serverTimestamp() });
    batch.update(doc(db, "activities", id), { lastMsgAt: serverTimestamp(), lastMsgUid: uid });
    await batch.commit();
  },

  // Когда пользователь последний раз открывал каждый чат (для счётчика непрочитанных).
  onReads(uid, cb, onError) {
    return onSnapshot(doc(db, "reads", uid), (s) => {
      const at = s.data({ serverTimestamps: "estimate" })?.at || {};
      cb(Object.fromEntries(Object.entries(at).map(([k, v]) => [k, toMs(v)])));
    }, fail(onError));
  },

  markRead: (uid, id) => setDoc(doc(db, "reads", uid), { at: { [id]: serverTimestamp() } }, { merge: true }),

  // Только для админов (правила): общее число сообщений во всех чатах.
  async countMessages() {
    const snap = await getCountFromServer(collectionGroup(db, "messages"));
    return snap.data().count;
  },

  async report(uid, r) {
    await addDoc(collection(db, "reports"), { ...r, reporterUid: uid, status: "open", createdAt: serverTimestamp() });
  },

  onReports(cb, onError) {
    const q = query(collection(db, "reports"), where("status", "==", "open"));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toMs(d.data().createdAt) })).sort((a, b) => b.createdAt - a.createdAt));
    }, fail(onError));
  },

  resolveReport: (id) => updateDoc(doc(db, "reports", id), { status: "resolved", resolvedAt: serverTimestamp() }),
};
