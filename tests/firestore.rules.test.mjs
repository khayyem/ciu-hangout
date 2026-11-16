// Тесты правил Firestore. Запуск: npm run test:rules (нужна Java для эмулятора).
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, collectionGroup, getDocs, getCountFromServer, query, where,
  serverTimestamp, arrayUnion, arrayRemove, writeBatch, runTransaction,
} from "firebase/firestore";

let env;
const HOUR = 3600_000;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-hangout",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
});
after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const db = (uid, claims = {}) => env.authenticatedContext(uid, claims).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const profile = (name = "Test User") => ({ name, short: name.split(" ")[0], dept: "Law", year: "1st year", bio: "", photoURL: null, updatedAt: serverTimestamp() });

async function seed(fn) {
  await env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}
async function withProfiles(...uids) {
  await seed(async (f) => {
    for (const u of uids) await setDoc(doc(f, "users", u), { name: `${u} X`, short: u, dept: "Law", year: "1st year" });
  });
}
const activity = (host, extra = {}) => ({
  title: "Football", cat: "Sports", at: Date.now() + HOUR, place: "Pitch", max: 3, desc: "",
  hostUid: host, memberUids: [host], createdAt: serverTimestamp(), ...extra,
});
async function seedActivity(id, host, members = [host], max = 3) {
  await seed((f) => setDoc(doc(f, "activities", id), { ...activity(host), memberUids: members, max, createdAt: new Date() }));
}

// ---- профили ----
test("profile: write own, not others; valid fields only", async () => {
  await assertSucceeds(setDoc(doc(db("alice"), "users/alice"), profile()));
  await assertFails(setDoc(doc(db("alice"), "users/bob"), profile()));
  await assertFails(setDoc(doc(db("alice"), "users/alice"), { ...profile(), role: "admin" }));
  await assertFails(setDoc(doc(db("alice"), "users/alice"), { ...profile(), name: "" }));
  await assertSucceeds(getDoc(doc(db("bob"), "users/alice")));
  await assertFails(getDoc(doc(anon(), "users/alice")));
});

test("student ID is private and validated", async () => {
  await assertSucceeds(setDoc(doc(db("alice"), "users_private/alice"), { sid: "2201234" }));
  await assertFails(setDoc(doc(db("alice"), "users_private/alice"), { sid: "12ab" }));
  await assertFails(setDoc(doc(db("alice"), "users_private/alice"), { sid: "12345" }));
  await assertSucceeds(getDoc(doc(db("alice"), "users_private/alice")));
  await assertFails(getDoc(doc(db("bob"), "users_private/alice")));
  await assertFails(getDoc(doc(db("admin", { admin: true }), "users_private/alice")));
});

// ---- активности ----
test("activities: need a profile to read or create", async () => {
  await assertFails(addDoc(collection(db("alice"), "activities"), activity("alice")));
  await assertFails(getDocs(collection(db("alice"), "activities")));
  await withProfiles("alice");
  await assertSucceeds(addDoc(collection(db("alice"), "activities"), activity("alice")));
  await assertSucceeds(getDocs(query(collection(db("alice"), "activities"), where("at", ">", 0))));
});

test("activities: create must make you host and only member, valid data", async () => {
  await withProfiles("alice", "bob");
  const c = collection(db("alice"), "activities");
  await assertFails(addDoc(c, activity("bob")));
  await assertFails(addDoc(c, activity("alice", { memberUids: ["alice", "bob"] })));
  await assertFails(addDoc(c, activity("alice", { cat: "Party" })));
  await assertFails(addDoc(c, activity("alice", { at: Date.now() - 2 * HOUR })));
  await assertFails(addDoc(c, activity("alice", { title: "x".repeat(81) })));
  await assertFails(addDoc(c, activity("alice", { lastMsgAt: 1 })));
});

test("join: only yourself, only with free spots; leave: not the host", async () => {
  await withProfiles("alice", "bob", "carol", "dave");
  await seedActivity("a1", "alice", ["alice"], 3);
  const ref = (u) => doc(db(u), "activities/a1");

  await assertFails(updateDoc(ref("bob"), { memberUids: arrayUnion("carol") }));
  await assertSucceeds(updateDoc(ref("bob"), { memberUids: arrayUnion("bob") }));
  const carol = db("carol");
  const carolRef = doc(carol, "activities/a1");
  await assertSucceeds(runTransaction(carol, async (tx) => {
    const s = await tx.get(carolRef);
    tx.update(carolRef, { memberUids: [...s.data().memberUids, "carol"] });
  }));
  await assertFails(updateDoc(ref("dave"), { memberUids: arrayUnion("dave") })); // full (3/3)
  await assertFails(updateDoc(ref("bob"), { memberUids: arrayRemove("carol") }));
  await assertFails(updateDoc(ref("alice"), { memberUids: arrayRemove("alice") }));
  await assertSucceeds(updateDoc(ref("bob"), { memberUids: arrayRemove("bob") }));
  await assertSucceeds(updateDoc(ref("dave"), { memberUids: arrayUnion("dave") }));
  await assertFails(updateDoc(ref("bob"), { memberUids: arrayUnion("bob"), title: "Hacked" }));
});

test("host edits and deletes; others cannot; admin can delete", async () => {
  await withProfiles("alice", "bob");
  await seedActivity("a1", "alice", ["alice", "bob"], 5);
  await assertSucceeds(updateDoc(doc(db("alice"), "activities/a1"), { title: "Football 2", max: 2 }));
  await assertFails(updateDoc(doc(db("alice"), "activities/a1"), { max: 1 })); // меньше участников
  await assertFails(updateDoc(doc(db("alice"), "activities/a1"), { hostUid: "bob" }));
  await assertFails(updateDoc(doc(db("bob"), "activities/a1"), { title: "Mine now" }));
  await assertFails(deleteDoc(doc(db("bob"), "activities/a1")));
  await assertSucceeds(deleteDoc(doc(db("mod", { admin: true }), "activities/a1")));
  await seedActivity("a2", "alice");
  await assertSucceeds(deleteDoc(doc(db("alice"), "activities/a2")));
});

// ---- чат ----
test("chat: only members read and write, as themselves", async () => {
  await withProfiles("alice", "bob", "eve");
  await seedActivity("a1", "alice", ["alice", "bob"], 5);
  const send = (u, data) => {
    const f = db(u);
    const b = writeBatch(f);
    b.set(doc(collection(f, "activities/a1/messages")), data);
    b.update(doc(f, "activities/a1"), { lastMsgAt: serverTimestamp(), lastMsgUid: data.uid });
    return b.commit();
  };
  await assertSucceeds(send("bob", { uid: "bob", text: "hi", createdAt: serverTimestamp() }));
  await assertFails(send("bob", { uid: "alice", text: "spoof", createdAt: serverTimestamp() }));
  await assertFails(send("eve", { uid: "eve", text: "let me in", createdAt: serverTimestamp() }));
  await assertFails(send("bob", { uid: "bob", text: "", createdAt: serverTimestamp() }));
  await assertSucceeds(getDocs(collection(db("alice"), "activities/a1/messages")));
  await assertFails(getDocs(collection(db("eve"), "activities/a1/messages")));
  await assertFails(updateDoc(doc(db("eve"), "activities/a1"), { lastMsgAt: serverTimestamp(), lastMsgUid: "eve" }));
  // нельзя приписать последнее сообщение другому
  await assertFails(updateDoc(doc(db("bob"), "activities/a1"), { lastMsgAt: serverTimestamp(), lastMsgUid: "alice" }));
});

test("chat: host can delete messages (for deleting the activity)", async () => {
  await withProfiles("alice", "bob");
  await seedActivity("a1", "alice", ["alice", "bob"], 5);
  await seed((f) => setDoc(doc(f, "activities/a1/messages/m1"), { uid: "bob", text: "hi", createdAt: new Date() }));
  await assertFails(deleteDoc(doc(db("bob"), "activities/a1/messages/m1")));
  await assertSucceeds(deleteDoc(doc(db("alice"), "activities/a1/messages/m1")));
});

// ---- жалобы ----
test("reports: anyone with a profile files, only admins read/resolve", async () => {
  await withProfiles("alice");
  const r = { type: "activity", targetId: "a1", targetTitle: "Football", reason: "Spam or scam", details: "", reporterUid: "alice", status: "open", createdAt: serverTimestamp() };
  await assertSucceeds(addDoc(collection(db("alice"), "reports"), r));
  await assertFails(addDoc(collection(db("alice"), "reports"), { ...r, reporterUid: "bob" }));
  await assertFails(addDoc(collection(db("nobody"), "reports"), { ...r, reporterUid: "nobody" }));
  await assertFails(getDocs(collection(db("alice"), "reports")));
  const admin = db("mod", { admin: true });
  const snap = await assertSucceeds(getDocs(query(collection(admin, "reports"), where("status", "==", "open"))));
  await assertSucceeds(updateDoc(snap.docs[0].ref, { status: "resolved", resolvedAt: serverTimestamp() }));
});

// ---- непрочитанные ----
test("reads: only your own read markers", async () => {
  await assertSucceeds(setDoc(doc(db("alice"), "reads/alice"), { at: { a1: serverTimestamp() } }, { merge: true }));
  await assertSucceeds(getDoc(doc(db("alice"), "reads/alice")));
  await assertFails(getDoc(doc(db("bob"), "reads/alice")));
  await assertFails(setDoc(doc(db("bob"), "reads/alice"), { at: {} }));
  await assertFails(setDoc(doc(db("alice"), "reads/alice"), { at: {}, extra: 1 }));
});

// ---- статистика ----
test("stats: only admins can count all messages", async () => {
  await withProfiles("alice");
  await seedActivity("a1", "alice");
  await seed((f) => setDoc(doc(f, "activities/a1/messages/m1"), { uid: "alice", text: "hi", createdAt: new Date() }));
  await assertFails(getCountFromServer(collectionGroup(db("alice"), "messages")));
  const snap = await assertSucceeds(getCountFromServer(collectionGroup(db("mod", { admin: true }), "messages")));
  if (snap.data().count !== 1) throw new Error("expected 1 message");
});
