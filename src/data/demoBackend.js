// Демо-режим: те же функции, что у firebaseBackend, но всё в памяти браузера.
// Включается через ?demo в адресе или VITE_DEMO=1. Удобно для показа без интернета/аккаунта.

const at = (dayOffset, hh, mm = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
};
const minsAgo = (m) => Date.now() - m * 60_000;

const person = (name, dept, year, bio = "") => ({ uid: `u-${name.toLowerCase()}`, name: `${name} ${"ABDKMOSY"[name.length % 8]}.`, short: name, dept, year, bio, photoURL: null });

const PEOPLE = [
  person("Tunde", "Civil Engineering", "3rd year", "Football every evening if the weather allows."),
  person("Omar", "Business Administration", "2nd year"),
  person("Reza", "Computer Engineering", "4th year", "Ask me about C++."),
  person("Bilal", "Pharmacy", "2nd year"),
  person("Arda", "Architecture", "3rd year", "Hiking and photography."),
  person("Musa", "Electrical Engineering", "1st year"),
  person("Kemal", "Law", "2nd year"),
  person("Leyla", "Computer Engineering", "2nd year", "Library regular."),
  person("Sara", "Psychology", "1st year"),
  person("Elif", "Economics", "3rd year", "I know every good kebab place in Lefkoşa."),
  person("Amaka", "Medicine", "2nd year"),
  person("Daniel", "Software Engineering", "3rd year", "Board games collector."),
  person("Zara", "Nursing", "4th year", "Beach > everything."),
  person("Aisha", "Dentistry", "1st year"),
];
const U = (name) => `u-${name.toLowerCase()}`;
const us = (...names) => names.map(U);

const ME = "u-me";

const state = {
  user: null,
  users: Object.fromEntries(PEOPLE.map((p) => [p.uid, p])),
  privates: {},
  acts: [
    { id: "a1", title: "5-a-side football", cat: "Sports", at: at(0, 19, 30), place: "CIU Arena · Football pitches", max: 10, desc: "Casual game, all levels. Bring water. We split into teams on the spot.", hostUid: U("Tunde"), memberUids: us("Tunde", "Omar", "Reza", "Bilal", "Arda", "Musa", "Kemal") },
    { id: "a2", title: "Late-night study for CMPE 211", cat: "Study", at: at(0, 21, 0), place: "CIU Library", max: 6, desc: "Going through past midterm questions together.", hostUid: U("Leyla"), memberUids: us("Leyla", "Sara") },
    { id: "a3", title: "Hellim and kebab in Lefkoşa old town", cat: "Food", at: at(1, 20, 0), place: "Büyük Han, Lefkoşa (shared taxi from campus)", max: 5, desc: "Dinner at a local place near Büyük Han. Around 400 TL each.", hostUid: U("Elif"), memberUids: us("Elif", "Amaka", "Daniel") },
    { id: "a4", title: "Board games night", cat: "Games", at: at(1, 18, 30), place: "Soli Dormitory", max: 8, desc: "Catan, Codenames and UNO. Snacks welcome.", hostUid: U("Daniel"), memberUids: us("Daniel", "Sara", "Aisha") },
    { id: "a5", title: "Sunrise hike to St. Hilarion", cat: "Trips", at: at(3, 5, 30), place: "St. Hilarion Castle (two cars from campus)", max: 7, desc: "About 2 hours up and back. Wear proper shoes, it's rocky.", hostUid: U("Arda"), memberUids: us("Arda", "Musa") },
    { id: "a6", title: "Beach day in Kyrenia", cat: "Chill", at: at(4, 11, 0), place: "Escape Beach, Kyrenia", max: 0, desc: "Escape Beach. Bus there, figure out the way back together.", hostUid: U("Zara"), memberUids: us("Zara", "Aisha", "Omar", "Leyla", "Kemal") },
  ].map((a) => ({ lastMsgAt: 0, ...a })),
  msgs: {
    a1: [
      { id: "m1", uid: U("Tunde"), text: "Pitch is booked till 21:00", at: minsAgo(90) },
      { id: "m2", uid: U("Omar"), text: "I'll bring a second ball", at: minsAgo(40) },
    ],
    a2: [{ id: "m3", uid: U("Leyla"), text: "Bring the 2024 midterm if you have it", at: minsAgo(120) }],
  },
  reports: [],
  reads: {},
};
state.acts.forEach((a) => {
  const last = state.msgs[a.id]?.at(-1);
  a.lastMsgAt = last?.at || 0;
  a.lastMsgUid = last?.uid || null;
  a.createdAt = Date.now() - 86_400_000;
});

const subs = new Set();
const emit = () => subs.forEach((f) => f());
const watch = (fn) => {
  fn();
  subs.add(fn);
  return () => subs.delete(fn);
};
const tick = () => new Promise((r) => setTimeout(r, 120));
let seq = 100;

const updateAct = (id, fn) => {
  state.acts = state.acts.map((a) => (a.id === id ? fn(a) : a));
};

export const demoBackend = {
  mode: "demo",

  onAuth: (cb) => watch(() => cb(state.user)),

  async signIn() {
    await tick();
    state.user = { uid: ME, email: "you@demo", displayName: "", photoURL: null, isAdmin: true };
    emit();
  },

  async signOut() {
    state.user = null;
    emit();
  },

  onProfile: (uid, cb) => watch(() => cb(state.users[uid] || null)),
  onPrivate: (uid, cb) => watch(() => cb(state.privates[uid] || null)),

  async saveProfile(uid, profile, sid) {
    await tick();
    state.users = { ...state.users, [uid]: { uid, ...profile } };
    state.privates[uid] = { sid };
    emit();
  },

  onUsers: (cb) => watch(() => cb(state.users)),
  onActivities: (cb) => watch(() => cb([...state.acts].sort((a, b) => a.at - b.at))),

  async createActivity(uid, data) {
    await tick();
    const id = `a${++seq}`;
    state.acts = [...state.acts, { ...data, id, hostUid: uid, memberUids: [uid], lastMsgAt: 0, lastMsgUid: null, createdAt: Date.now() }];
    emit();
    return id;
  },

  async updateActivity(id, data) {
    await tick();
    updateAct(id, (a) => ({ ...a, ...data }));
    emit();
  },

  async deleteActivity(id) {
    await tick();
    state.acts = state.acts.filter((a) => a.id !== id);
    delete state.msgs[id];
    emit();
  },

  async join(id, uid) {
    await tick();
    const a = state.acts.find((x) => x.id === id);
    if (!a) throw new Error("This activity was removed.");
    if (a.memberUids.includes(uid)) return;
    if (a.max && a.memberUids.length >= a.max) throw new Error("Sorry, it just filled up.");
    updateAct(id, (x) => ({ ...x, memberUids: [...x.memberUids, uid] }));
    emit();
  },

  async leave(id, uid) {
    await tick();
    updateAct(id, (x) => ({ ...x, memberUids: x.memberUids.filter((u) => u !== uid) }));
    emit();
  },

  onMessages: (id, limit, cb) => watch(() => cb((state.msgs[id] || []).slice(-limit))),

  async sendMessage(id, uid, text) {
    const m = { id: `m${++seq}`, uid, text, at: Date.now() };
    state.msgs = { ...state.msgs, [id]: [...(state.msgs[id] || []), m] };
    updateAct(id, (a) => ({ ...a, lastMsgAt: m.at, lastMsgUid: uid }));
    emit();
  },

  onReads: (uid, cb) => watch(() => cb(state.reads[uid] || {})),

  async markRead(uid, id) {
    state.reads = { ...state.reads, [uid]: { ...(state.reads[uid] || {}), [id]: Date.now() } };
    emit();
  },

  countMessages: async () => Object.values(state.msgs).reduce((n, list) => n + list.length, 0),

  async report(uid, r) {
    await tick();
    state.reports = [{ ...r, id: `r${++seq}`, reporterUid: uid, status: "open", createdAt: Date.now() }, ...state.reports];
    emit();
  },

  onReports: (cb) => watch(() => cb(state.reports.filter((r) => r.status === "open"))),

  async resolveReport(id) {
    state.reports = state.reports.map((r) => (r.id === id ? { ...r, status: "resolved" } : r));
    emit();
  },
};
