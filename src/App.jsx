import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove, orderBy, query, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDISzgCehbIiKAS4A3FuY7vJFai5nyyA2s",
  authDomain: "ciu-hangout-a7457.firebaseapp.com",
  projectId: "ciu-hangout-a7457",
  storageBucket: "ciu-hangout-a7457.firebasestorage.app",
  messagingSenderId: "546602904671",
  appId: "1:546602904671:web:ac554a2ea182c8546abfea",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const T = {
  ru: {
    title: "CIU Hangout", tagline: "Найди с кем сходить", campus: "Cyprus Int. University",
    activities: "активностей", login: "Войти", logout: "Выйти",
    all: "Все", billiards: "Бильярд", sport: "Спорт", study: "Учёба",
    trips: "Поездки", food: "Еда", games: "Игры",
    empty: "Пока пусто — создай первым!", join: "Участвую", joined: "✓ Иду",
    full: "Мест нет", spots: "мест", spot: "место", chat: "Чат", locked: "Чат",
    myTab: "Мои", feedTab: "Лента", profileTab: "Профиль",
    myActivities: "Мои активности", iGo: "Я участвую",
    noMyActivities: "Ты ещё ничего не создал", noJoined: "Ты ни к чему не присоединился", with: "с",
    loginTitle: "CIU Hangout", loginSub: "Только для студентов CIU",
    loginBtn: "Войти через Google", loginHint: "Используй почту @ciu.edu.tr",
    loginLoading: "Входим...", loginToSee: "Войди чтобы видеть профиль",
    newActivity: "Новая активность", whatToDo: "Что хочешь сделать?",
    when: "Когда? (Сегодня, 19:00)", where: "Где? (Student Center...)",
    needPeople: "Нужно человек:", create: "Создать", fillAll: "Заполни все поля!",
    created: "Готово! 🚀", error: "Ошибка", welcome: "Добро пожаловать! 👋",
    loginError: "Ошибка входа", cancelJoin: "Участие отменено", inDeal: "Ты в деле! 🎉",
    deleted: "Удалено", saved: "Сохранено ✅", deleteConfirm: "Удалить активность?",
    delete: "Удалить", cancel: "Отмена", edit: "Изменить", editActivity: "Редактировать",
    save: "Сохранить", participants: "Участники", noParticipants: "Пока никого",
    chatTitle: "Чат", messages: "сообщ.", members: "участн.",
    chatLocked: "Только участники видят чат", chatLockedSub: "Нажми «Участвую» чтобы войти",
    writeFirst: "Напиши первым!", writePlaceholder: "Сообщение...",
    you: "вы", organizer: "организатор", hoursLeft: "ч. осталось",
    editProfile: "Редактировать профиль", yourName: "Твоё имя", chooseEmoji: "Выбери эмодзи",
    chooseColor: "Выбери цвет", saveProfile: "Сохранить профиль",
    profileSaved: "Профиль обновлён! ✅", enterName: "Введи имя...",
    myProfile: "Мой профиль", activitiesCreated: "создано", activitiesJoined: "участвую",
  },
  en: {
    title: "CIU Hangout", tagline: "Find someone to hang out", campus: "Cyprus Int. University",
    activities: "activities", login: "Login", logout: "Logout",
    all: "All", billiards: "Billiards", sport: "Sport", study: "Study",
    trips: "Trips", food: "Food", games: "Games",
    empty: "Nothing yet — be the first!", join: "Join", joined: "✓ Joined",
    full: "Full", spots: "spots", spot: "spot", chat: "Chat", locked: "Chat",
    myTab: "Mine", feedTab: "Feed", profileTab: "Profile",
    myActivities: "My Activities", iGo: "Going",
    noMyActivities: "You haven't created anything", noJoined: "You haven't joined anything", with: "with",
    loginTitle: "CIU Hangout", loginSub: "For CIU students only",
    loginBtn: "Sign in with Google", loginHint: "Use your @ciu.edu.tr email",
    loginLoading: "Signing in...", loginToSee: "Login to see your profile",
    newActivity: "New Activity", whatToDo: "What do you want to do?",
    when: "When? (Today, 7PM)", where: "Where? (Student Center...)",
    needPeople: "Need people:", create: "Create", fillAll: "Fill all fields!",
    created: "Created! 🚀", error: "Error", welcome: "Welcome! 👋",
    loginError: "Login error", cancelJoin: "Cancelled", inDeal: "You're in! 🎉",
    deleted: "Deleted", saved: "Saved ✅", deleteConfirm: "Delete activity?",
    delete: "Delete", cancel: "Cancel", edit: "Edit", editActivity: "Edit Activity",
    save: "Save", participants: "Participants", noParticipants: "No one yet",
    chatTitle: "Chat", messages: "msg", members: "members",
    chatLocked: "Only participants can read", chatLockedSub: "Press \"Join\" to participate",
    writeFirst: "Write first!", writePlaceholder: "Message...",
    you: "you", organizer: "organizer", hoursLeft: "h left",
    editProfile: "Edit Profile", yourName: "Your name", chooseEmoji: "Choose emoji",
    chooseColor: "Choose color", saveProfile: "Save Profile",
    profileSaved: "Profile updated! ✅", enterName: "Enter name...",
    myProfile: "My Profile", activitiesCreated: "created", activitiesJoined: "joined",
  },
  tr: {
    title: "CIU Hangout", tagline: "Birlikte gidecek biri bul", campus: "Cyprus Int. University",
    activities: "etkinlik", login: "Giriş", logout: "Çıkış",
    all: "Tümü", billiards: "Bilardo", sport: "Spor", study: "Çalışma",
    trips: "Gezi", food: "Yemek", games: "Oyun",
    empty: "Henüz kimse yok — ilk sen ol!", join: "Katıl", joined: "✓ Katıldım",
    full: "Dolu", spots: "yer", spot: "yer", chat: "Sohbet", locked: "Sohbet",
    myTab: "Benim", feedTab: "Akış", profileTab: "Profil",
    myActivities: "Etkinliklerim", iGo: "Gidiyorum",
    noMyActivities: "Henüz bir şey oluşturmadın", noJoined: "Hiçbir şeye katılmadın", with: "ile",
    loginTitle: "CIU Hangout", loginSub: "Sadece CIU öğrencileri için",
    loginBtn: "Google ile Giriş", loginHint: "@ciu.edu.tr e-postanı kullan",
    loginLoading: "Giriş yapılıyor...", loginToSee: "Profili görmek için giriş yap",
    newActivity: "Yeni Etkinlik", whatToDo: "Ne yapmak istiyorsun?",
    when: "Ne zaman? (Bugün, 19:00)", where: "Nerede? (Öğrenci Merkezi...)",
    needPeople: "Kişi gerekli:", create: "Oluştur", fillAll: "Tüm alanları doldur!",
    created: "Oluşturuldu! 🚀", error: "Hata", welcome: "Hoş geldin! 👋",
    loginError: "Giriş hatası", cancelJoin: "İptal edildi", inDeal: "Katıldın! 🎉",
    deleted: "Silindi", saved: "Kaydedildi ✅", deleteConfirm: "Etkinliği sil?",
    delete: "Sil", cancel: "İptal", edit: "Düzenle", editActivity: "Düzenle",
    save: "Kaydet", participants: "Katılımcılar", noParticipants: "Henüz kimse yok",
    chatTitle: "Sohbet", messages: "mesaj", members: "üye",
    chatLocked: "Sadece katılımcılar görebilir", chatLockedSub: "Katılmak için \"Katıl\" bas",
    writeFirst: "İlk sen yaz!", writePlaceholder: "Mesaj...",
    you: "siz", organizer: "organizatör", hoursLeft: "s. kaldı",
    editProfile: "Profili Düzenle", yourName: "Adın", chooseEmoji: "Emoji seç",
    chooseColor: "Renk seç", saveProfile: "Profili Kaydet",
    profileSaved: "Profil güncellendi! ✅", enterName: "İsim gir...",
    myProfile: "Profilim", activitiesCreated: "oluşturuldu", activitiesJoined: "katılındı",
  }
};

const AVATAR_COLORS = ["#7C3AED","#2563EB","#059669","#DC2626","#D97706","#DB2777","#0891B2","#65A30D","#9333EA","#EA580C","#0284C7","#16A34A"];
const AVATAR_EMOJIS = ["😎","🔥","⚡","🎯","🚀","💎","👑","🦁","🐺","🦊","🐉","🎭","🏆","💪","🌟","🎸","🏄","🎮","🤝","✨"];
const TAGS = ["🎱","⚽","📚","🚗","🍽️","🏓","🎮","☕"];

const getInitials = (name) => name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "??";

function ProfileAvatar({ profile, size = 44 }) {
  const bg = profile?.avatarColor || "#7C3AED";
  const emoji = profile?.avatarEmoji;
  const initials = getInitials(profile?.displayName || profile?.name || "?");
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.32, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: emoji ? size * 0.45 : size * 0.3, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {emoji || initials}
    </div>
  );
}

function ChatModal({ activity, user, profile, profiles, t, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [tab, setTab] = useState("chat");
  const bottomRef = useRef(null);
  const canChat = user && (activity.userId === user.uid || activity.participants?.includes(user.uid));

  useEffect(() => {
    const q = query(collection(db, "activities", activity.id, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activity.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !canChat) return;
    await addDoc(collection(db, "activities", activity.id, "messages"), {
      text: text.trim(),
      userName: profile?.displayName || user.displayName?.split(" ")[0] || "Student",
      userId: user.uid,
      avatarColor: profile?.avatarColor || "#7C3AED",
      avatarEmoji: profile?.avatarEmoji || null,
      createdAt: Date.now(),
    });
    setText("");
  };

  const ownerProfile = profiles[activity.userId];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0E0C22", display: "flex", flexDirection: "column", zIndex: 400, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ padding: "52px 20px 0", background: "#13112A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: 12, cursor: "pointer", fontSize: 18 }}>←</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>{activity.tags?.[0]} {activity.activity}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{messages.length} {t.messages} · {(activity.participants?.length || 0) + 1} {t.members}</div>
          </div>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {["chat", "participants"].map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{ flex: 1, background: "none", border: "none", borderBottom: `2px solid ${tab === tb ? "#8B5CF6" : "transparent"}`, color: tab === tb ? "#8B5CF6" : "rgba(255,255,255,0.3)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "10px 0", marginBottom: -1 }}>
              {tb === "chat" ? `💬 ${t.chatTitle}` : `👥 ${t.participants}`}
            </button>
          ))}
        </div>
      </div>

      {tab === "chat" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, background: "#0E0C22" }}>
            {!canChat && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{t.chatLocked}</div>
                <div style={{ fontSize: 12, marginTop: 8, color: "rgba(255,255,255,0.2)" }}>{t.chatLockedSub}</div>
              </div>
            )}
            {canChat && messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <div style={{ color: "rgba(255,255,255,0.3)" }}>{t.writeFirst}</div>
              </div>
            )}
            {canChat && messages.map(msg => {
              const isMe = msg.userId === user.uid;
              return (
                <div key={msg.id} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: isMe ? "row-reverse" : "row" }}>
                  {!isMe && (
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: msg.avatarColor || "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: msg.avatarEmoji ? 16 : 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {msg.avatarEmoji || getInitials(msg.userName)}
                    </div>
                  )}
                  <div style={{ maxWidth: "72%" }}>
                    {!isMe && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 3, paddingLeft: 4 }}>{msg.userName}</div>}
                    <div style={{ background: isMe ? "#7C3AED" : "rgba(255,255,255,0.07)", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, color: "#fff", lineHeight: 1.5, wordBreak: "break-word" }}>{msg.text}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 3, textAlign: isMe ? "right" : "left", paddingLeft: 4 }}>{new Date(msg.createdAt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          {canChat && (
            <div style={{ padding: "12px 16px 36px", background: "#13112A", display: "flex", gap: 10 }}>
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={t.writePlaceholder}
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 16px", fontFamily: "'Nunito', sans-serif", fontSize: 15, color: "#fff", outline: "none" }} />
              <button onClick={send} style={{ width: 48, height: 48, borderRadius: 14, background: text.trim() ? "#7C3AED" : "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", fontSize: 20, color: text.trim() ? "#fff" : "rgba(255,255,255,0.2)" }}>↑</button>
            </div>
          )}
        </>
      )}

      {tab === "participants" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#0E0C22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <ProfileAvatar profile={ownerProfile || { avatarColor: activity.userColor, displayName: activity.userName }} size={44} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{ownerProfile?.displayName || activity.userName}</div>
              <div style={{ fontSize: 12, color: "#8B5CF6" }}>👑 {t.organizer}</div>
            </div>
          </div>
          {(!activity.participants || activity.participants.length === 0) ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)" }}><div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>{t.noParticipants}</div>
          ) : activity.participants.map((uid, i) => {
            const p = profiles[uid];
            return (
              <div key={uid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <ProfileAvatar profile={p || { avatarColor: "#7C3AED", displayName: `#${i+1}` }} size={44} />
                <div style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{p?.displayName || `Участник ${i+1}`}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditModal({ activity, t, onClose, onSave }) {
  const [form, setForm] = useState({ activity: activity.activity, time: activity.time, place: activity.place, tag: activity.tags?.[0] || "🎱" });
  const handleSave = async () => {
    if (!form.activity || !form.time || !form.place) return;
    await updateDoc(doc(db, "activities", activity.id), { activity: form.activity, time: form.time, place: form.place, tags: [form.tag] });
    onSave(); onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,8,25,0.97)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 400 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#13112A", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.08)", padding: "28px 20px 48px", width: "100%", maxWidth: 430 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>{t.editActivity}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.5)", width: 36, height: 36, borderRadius: 12, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {TAGS.map(tag => (
            <button key={tag} onClick={() => setForm({ ...form, tag })}
              style={{ background: form.tag === tag ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${form.tag === tag ? "#7C3AED" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "8px 12px", fontSize: 20, cursor: "pointer" }}>
              {tag}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[{ val: "activity", ph: t.whatToDo }, { val: "time", ph: t.when }, { val: "place", ph: t.where }].map(f => (
            <input key={f.val} value={form[f.val]} onChange={e => setForm({ ...form, [f.val]: e.target.value })} placeholder={f.ph}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", fontFamily: "'Nunito', sans-serif", fontSize: 15, color: "#fff", width: "100%", outline: "none" }} />
          ))}
          <button onClick={handleSave} style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontFamily: "'Nunito', sans-serif", fontWeight: 800, cursor: "pointer", marginTop: 8 }}>{t.save}</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [lang, setLang] = useState("ru");
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedCat, setSelectedCat] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [chatActivity, setChatActivity] = useState(null);
  const [editActivity, setEditActivity] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ activity: "", time: "", place: "", spots: "1", tag: "🎱" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#7C3AED");
  const [editEmoji, setEditEmoji] = useState("");

  const t = T[lang];

  const CATEGORIES = [
    { id: "all", label: t.all, emoji: "✨" },
    { id: "🎱", label: t.billiards, emoji: "🎱" },
    { id: "⚽", label: t.sport, emoji: "⚽" },
    { id: "📚", label: t.study, emoji: "📚" },
    { id: "🚗", label: t.trips, emoji: "🚗" },
    { id: "🍽️", label: t.food, emoji: "🍽️" },
    { id: "🏓", label: t.games, emoji: "🏓" },
  ];

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data());
          setEditName(snap.data().displayName || "");
          setEditColor(snap.data().avatarColor || "#7C3AED");
          setEditEmoji(snap.data().avatarEmoji || "");
        } else {
          const defaultProfile = {
            displayName: u.displayName?.split(" ")[0] || "Student",
            avatarColor: "#7C3AED", avatarEmoji: "", uid: u.uid,
          };
          await setDoc(ref, defaultProfile);
          setProfile(defaultProfile);
          setEditName(defaultProfile.displayName);
        }
      }
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "activities"), snap => {
      const now = Date.now();
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => !a.expiresAt || a.expiresAt > now);
      data.sort((a, b) => b.createdAt - a.createdAt);
      setActivities(data);
      // Load profiles for all unique userIds
      const uids = [...new Set(data.map(a => a.userId))];
      uids.forEach(async uid => {
        if (!profiles[uid]) {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) setProfiles(prev => ({ ...prev, [uid]: snap.data() }));
        }
      });
    });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleLogin = async () => {
    setLoading(true);
    try { await signInWithPopup(auth, provider); setShowAuth(false); showToast(t.welcome); }
    catch { showToast(t.loginError); }
    setLoading(false);
  };

  const handleJoin = async (item) => {
    if (!user) { setShowAuth(true); return; }
    const ref = doc(db, "activities", item.id);
    const isJoined = item.participants?.includes(user.uid);
    if (isJoined) { await updateDoc(ref, { participants: arrayRemove(user.uid), spots: item.spots + 1 }); showToast(t.cancelJoin); }
    else if (item.spots > 0) { await updateDoc(ref, { participants: arrayUnion(user.uid), spots: item.spots - 1 }); showToast(t.inDeal); }
  };

  const handleDelete = async (id) => { await deleteDoc(doc(db, "activities", id)); setDeleteTarget(null); showToast(t.deleted); };

  const handleCreate = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!form.activity || !form.time || !form.place) { showToast(t.fillAll); return; }
    try {
      await addDoc(collection(db, "activities"), {
        userId: user.uid,
        userName: profile?.displayName || user.displayName?.split(" ")[0] || "Student",
        avatarColor: profile?.avatarColor || "#7C3AED",
        avatarEmoji: profile?.avatarEmoji || null,
        activity: form.activity, time: form.time, place: form.place,
        spots: parseInt(form.spots), maxSpots: parseInt(form.spots),
        tags: [form.tag], participants: [], createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
      setForm({ activity: "", time: "", place: "", spots: "1", tag: "🎱" });
      setShowModal(false); showToast(t.created);
    } catch { showToast(t.error); }
  };

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;
    const updated = { displayName: editName.trim(), avatarColor: editColor, avatarEmoji: editEmoji, uid: user.uid };
    await setDoc(doc(db, "users", user.uid), updated);
    setProfile(updated);
    setProfiles(prev => ({ ...prev, [user.uid]: updated }));
    showToast(t.profileSaved);
  };

  const filtered = selectedCat === "all" ? activities : activities.filter(a => a.tags?.includes(selectedCat));
  const myActivities = user ? activities.filter(a => a.userId === user.uid) : [];
  const joinedActivities = user ? activities.filter(a => a.participants?.includes(user.uid)) : [];
  const canChat = (item) => user && (item.userId === user.uid || item.participants?.includes(user.uid));

  if (chatActivity) return <ChatModal activity={chatActivity} user={user} profile={profile} profiles={profiles} t={t} onClose={() => setChatActivity(null)} />;

  const currentProfile = profile || { avatarColor: "#7C3AED", displayName: user?.displayName?.split(" ")[0] || "?" };

  return (
    <div style={{ minHeight: "100vh", background: "#0E0C22", fontFamily: "'Nunito', sans-serif", color: "#fff", maxWidth: 430, margin: "0 auto", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        .card { background: #13112A; border-radius: 20px; padding: 16px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.06); transition: all 0.2s; }
        .card:hover { border-color: rgba(139,92,246,0.3); }
        .card.owner { border-color: rgba(139,92,246,0.5); background: linear-gradient(135deg, #1a1535 0%, #13112A 100%); }
        .join-btn { border: none; border-radius: 12px; padding: 10px 20px; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .chat-btn { border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 7px 12px; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 12px; cursor: pointer; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); transition: all 0.2s; }
        .chat-btn.active { border-color: rgba(139,92,246,0.5); color: #A78BFA; background: rgba(139,92,246,0.1); }
        .icon-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .icon-btn.danger:hover { border-color: rgba(239,68,68,0.5); background: rgba(239,68,68,0.08); }
        .tab-btn { background: none; border: none; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 12px; cursor: pointer; padding: 10px 0; transition: all 0.2s; color: rgba(255,255,255,0.25); flex: 1; }
        .cat-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border-radius: 100px; padding: 7px 14px; font-size: 12px; font-family: 'Nunito', sans-serif; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-weight: 700; }
        .cat-chip.active { background: #7C3AED; color: #fff; border-color: #7C3AED; }
        .lang-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 5px 9px; font-size: 11px; font-family: 'Nunito', sans-serif; cursor: pointer; color: rgba(255,255,255,0.4); transition: all 0.2s; font-weight: 800; }
        .lang-btn.active { background: #7C3AED; border-color: #7C3AED; color: #fff; }
        .input-dark { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; font-family: 'Nunito', sans-serif; font-size: 15px; color: #fff; width: 100%; outline: none; }
        .input-dark::placeholder { color: rgba(255,255,255,0.2); }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .slide-up { animation: slideUp 0.25s ease; }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .toast-anim { animation: toastIn 0.3s ease; }
        @keyframes toastIn { from { transform: translateX(-50%) translateY(8px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        .color-dot { width: 36px; height: 36px; border-radius: 50%; cursor: pointer; transition: all 0.15s; border: 3px solid transparent; }
        .color-dot.selected { border-color: #fff; transform: scale(1.15); }
        .emoji-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 8px; font-size: 22px; cursor: pointer; transition: all 0.15s; line-height: 1; }
        .emoji-btn.selected { background: rgba(139,92,246,0.2); border-color: #7C3AED; }
        .tag-sel { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 14px; font-size: 20px; cursor: pointer; transition: all 0.15s; }
        .tag-sel.active { background: rgba(139,92,246,0.2); border-color: #7C3AED; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#13112A", padding: "52px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{t.campus}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>{t.title}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2, fontWeight: 500 }}>{t.tagline}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {["ru", "en", "tr"].map(l => (
                <button key={l} className={`lang-btn ${lang === l ? "active" : ""}`} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            {user ? (
              <div style={{ cursor: "pointer" }} onClick={() => setActiveTab("profile")}>
                <ProfileAvatar profile={currentProfile} size={42} />
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ background: "#7C3AED", border: "none", borderRadius: 12, padding: "10px 18px", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>{t.login}</button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.12)", borderRadius: 100, padding: "5px 12px" }}>
            <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{activities.length} {t.activities}</span>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      {activeTab !== "profile" && (
        <div style={{ overflowX: "auto", display: "flex", gap: 8, padding: "14px 20px 10px" }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} className={`cat-chip ${selectedCat === cat.id ? "active" : ""}`} onClick={() => setSelectedCat(cat.id)}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* CONTENT */}
      <div style={{ padding: "4px 16px", paddingBottom: 100, overflowY: "auto", maxHeight: `calc(100vh - ${activeTab === "profile" ? 210 : 250}px)` }}>

        {/* FEED */}
        {activeTab === "feed" && (
          <div className="slide-up">
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌙</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{t.empty}</div>
              </div>
            )}
            {filtered.map(item => {
              const isJoined = user && item.participants?.includes(user.uid);
              const isOwner = user && item.userId === user.uid;
              const hasChat = canChat(item);
              const itemProfile = profiles[item.userId];
              const hoursLeft = item.expiresAt ? Math.max(0, Math.round((item.expiresAt - Date.now()) / 3600000)) : null;
              return (
                <div key={item.id} className={`card ${isOwner ? "owner" : ""}`}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <ProfileAvatar profile={itemProfile || { avatarColor: item.avatarColor || item.userColor || "#7C3AED", avatarEmoji: item.avatarEmoji, displayName: item.userName }} size={46} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{item.tags?.[0]} {item.activity}</div>
                        {isOwner && (
                          <div style={{ display: "flex", gap: 6, marginLeft: 8, flexShrink: 0 }}>
                            <button className="icon-btn" onClick={() => setEditActivity(item)}>✏️</button>
                            <button className="icon-btn danger" onClick={() => setDeleteTarget(item.id)}>🗑️</button>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2, fontWeight: 600 }}>
                        {itemProfile?.displayName || item.userName} {isOwner && <span style={{ color: "#8B5CF6" }}>· {t.you}</span>}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11 }}>🕐</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{item.time}</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11 }}>📍</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{item.place}</span>
                        </div>
                        {hoursLeft !== null && hoursLeft < 6 && (
                          <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 11 }}>⏰</span>
                            <span style={{ fontSize: 12, color: "#F87171", fontWeight: 700 }}>{hoursLeft} {t.hoursLeft}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                            {item.spots > 0 ? <><span style={{ color: "#A78BFA", fontWeight: 800 }}>{item.spots}</span> {item.spots === 1 ? t.spot : t.spots}</> : <span style={{ color: "rgba(255,255,255,0.2)" }}>{t.full}</span>}
                          </div>
                          <button className={`chat-btn ${hasChat ? "active" : ""}`} onClick={() => { if (!user) { setShowAuth(true); return; } setChatActivity(item); }}>
                            💬 {hasChat ? t.chat : t.locked}
                          </button>
                        </div>
                        {!isOwner && (
                          <button className="join-btn" onClick={() => handleJoin(item)}
                            disabled={item.spots === 0 && !isJoined}
                            style={{ background: isJoined ? "rgba(74,222,128,0.1)" : item.spots === 0 ? "rgba(255,255,255,0.04)" : "#7C3AED", color: isJoined ? "#4ADE80" : item.spots === 0 ? "rgba(255,255,255,0.2)" : "#fff", border: isJoined ? "1px solid rgba(74,222,128,0.3)" : "none", cursor: (item.spots === 0 && !isJoined) ? "not-allowed" : "pointer" }}>
                            {isJoined ? t.joined : item.spots === 0 ? t.full : t.join}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MY TAB */}
        {activeTab === "my" && (
          <div className="slide-up">
            {!user ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
                <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: 20, fontSize: 14 }}>{t.loginToSee}</div>
                <button onClick={() => setShowAuth(true)} style={{ background: "#7C3AED", border: "none", borderRadius: 14, padding: "12px 28px", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 800, cursor: "pointer" }}>{t.loginBtn}</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontWeight: 800 }}>{t.myActivities}</div>
                  {myActivities.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.2)", fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>{t.noMyActivities}</div>}
                  {myActivities.map(item => (
                    <div key={item.id} className="card owner">
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{item.tags?.[0]} {item.activity}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="icon-btn" onClick={() => setEditActivity(item)}>✏️</button>
                          <button className="icon-btn danger" onClick={() => setDeleteTarget(item.id)}>🗑️</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>🕐 {item.time}</div>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>📍 {item.place}</div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                        <div style={{ fontSize: 12, color: "#A78BFA", fontWeight: 700 }}>{item.spots} {t.spots} · {(item.maxSpots - item.spots)} {t.members}</div>
                        <button className="chat-btn active" onClick={() => setChatActivity(item)}>💬 {t.chat}</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontWeight: 800 }}>{t.iGo}</div>
                  {joinedActivities.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.2)", fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>{t.noJoined}</div>}
                  {joinedActivities.map(item => (
                    <div key={item.id} className="card" style={{ border: "1px solid rgba(74,222,128,0.2)", cursor: "pointer" }} onClick={() => setChatActivity(item)}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{item.tags?.[0]} {item.activity}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>🕐 {item.time}</div>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>📍 {item.place}</div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{t.with} {profiles[item.userId]?.displayName || item.userName}</div>
                        <div style={{ fontSize: 12, color: "#4ADE80", fontWeight: 700 }}>💬 {t.chat} →</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="slide-up">
            {!user ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
                <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: 20, fontSize: 14 }}>{t.loginToSee}</div>
                <button onClick={() => setShowAuth(true)} style={{ background: "#7C3AED", border: "none", borderRadius: 14, padding: "12px 28px", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 800, cursor: "pointer" }}>{t.loginBtn}</button>
              </div>
            ) : (
              <div style={{ paddingTop: 8 }}>
                {/* Profile header */}
                <div style={{ background: "#13112A", borderRadius: 20, padding: 20, marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
                  <ProfileAvatar profile={{ avatarColor: editColor, avatarEmoji: editEmoji, displayName: editName }} size={72} />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: "#fff" }}>{editName || "?"}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{user.email}</div>
                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#A78BFA" }}>{myActivities.length}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t.activitiesCreated}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#4ADE80" }}>{joinedActivities.length}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t.activitiesJoined}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit name */}
                <div style={{ background: "#13112A", borderRadius: 20, padding: 20, marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>{t.yourName}</div>
                  <input className="input-dark" value={editName} onChange={e => setEditName(e.target.value)} placeholder={t.enterName} />
                </div>

                {/* Choose emoji */}
                <div style={{ background: "#13112A", borderRadius: 20, padding: 20, marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{t.chooseEmoji}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button className={`emoji-btn ${editEmoji === "" ? "selected" : ""}`} onClick={() => setEditEmoji("")} style={{ fontSize: 14, color: editEmoji === "" ? "#A78BFA" : "rgba(255,255,255,0.3)", fontWeight: 800 }}>АА</button>
                    {AVATAR_EMOJIS.map(e => (
                      <button key={e} className={`emoji-btn ${editEmoji === e ? "selected" : ""}`} onClick={() => setEditEmoji(e)}>{e}</button>
                    ))}
                  </div>
                </div>

                {/* Choose color */}
                <div style={{ background: "#13112A", borderRadius: 20, padding: 20, marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{t.chooseColor}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {AVATAR_COLORS.map(c => (
                      <div key={c} className={`color-dot ${editColor === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setEditColor(c)} />
                    ))}
                  </div>
                </div>

                {/* Save */}
                <button onClick={handleSaveProfile} style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontFamily: "'Nunito', sans-serif", fontWeight: 800, cursor: "pointer", marginBottom: 12 }}>
                  {t.saveProfile}
                </button>

                {/* Logout */}
                <button onClick={() => signOut(auth)} style={{ width: "100%", background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: 14, fontSize: 14, fontFamily: "'Nunito', sans-serif", fontWeight: 700, cursor: "pointer" }}>
                  🚪 {t.logout}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => user ? setShowModal(true) : setShowAuth(true)}
        style={{ position: "fixed", bottom: 84, right: 20, width: 58, height: 58, borderRadius: "50%", background: "#7C3AED", border: "none", fontSize: 28, cursor: "pointer", boxShadow: "0 4px 24px rgba(124,58,237,0.5)", color: "#fff", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        +
      </button>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#13112A", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", padding: "10px 0 24px", zIndex: 99 }}>
        <button className="tab-btn" onClick={() => setActiveTab("feed")} style={{ color: activeTab === "feed" ? "#8B5CF6" : "rgba(255,255,255,0.25)" }}>
          <div style={{ fontSize: 22, marginBottom: 2 }}>🏠</div>
          <div style={{ fontSize: 11 }}>{t.feedTab}</div>
        </button>
        <button className="tab-btn" onClick={() => setActiveTab("my")} style={{ color: activeTab === "my" ? "#8B5CF6" : "rgba(255,255,255,0.25)" }}>
          <div style={{ fontSize: 22, marginBottom: 2 }}>📋</div>
          <div style={{ fontSize: 11 }}>{t.myTab}</div>
        </button>
        <button className="tab-btn" onClick={() => setActiveTab("profile")} style={{ color: activeTab === "profile" ? "#8B5CF6" : "rgba(255,255,255,0.25)" }}>
          <div style={{ fontSize: 22, marginBottom: 2 }}>👤</div>
          <div style={{ fontSize: 11 }}>{t.profileTab}</div>
        </button>
      </div>

      {/* DELETE CONFIRM */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,8,25,0.97)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20 }}>
          <div className="slide-up" style={{ background: "#13112A", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", padding: 28, width: "100%", maxWidth: 300, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 24 }}>{t.deleteConfirm}</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 14, color: "rgba(255,255,255,0.5)", fontFamily: "'Nunito', sans-serif", fontWeight: 800, cursor: "pointer" }}>{t.cancel}</button>
              <button onClick={() => handleDelete(deleteTarget)} style={{ flex: 1, background: "#EF4444", border: "none", borderRadius: 14, padding: 14, color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 800, cursor: "pointer" }}>{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {editActivity && <EditModal activity={editActivity} t={t} onClose={() => setEditActivity(null)} onSave={() => showToast(t.saved)} />}

      {/* AUTH MODAL */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,8,25,0.97)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <div className="slide-up" style={{ background: "#13112A", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", padding: "36px 28px", width: "100%", maxWidth: 340, textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>🎓</div>
            <div style={{ fontWeight: 900, fontSize: 24, color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>{t.loginTitle}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28, fontWeight: 500 }}>{t.loginSub}</div>
            <button onClick={handleLogin} disabled={loading}
              style={{ background: "#fff", border: "none", borderRadius: 16, padding: "14px 24px", width: "100%", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#111" }}>
              {loading ? t.loginLoading : <><span style={{ fontSize: 20 }}>G</span> {t.loginBtn}</>}
            </button>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 16, fontWeight: 600 }}>{t.loginHint}</div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,8,25,0.97)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="slide-up" style={{ background: "#13112A", borderRadius: "28px 28px 0 0", border: "1px solid rgba(255,255,255,0.08)", padding: "28px 20px 48px", width: "100%", maxWidth: 430 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: "#fff" }}>{t.newActivity}</div>
              <button onClick={() => setShowModal(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", width: 36, height: 36, borderRadius: 12, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {TAGS.map(tag => (
                <button key={tag} className={`tag-sel ${form.tag === tag ? "active" : ""}`} onClick={() => setForm({ ...form, tag })}>{tag}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="input-dark" placeholder={t.whatToDo} value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} />
              <input className="input-dark" placeholder={t.when} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              <input className="input-dark" placeholder={t.where} value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", fontWeight: 700 }}>{t.needPeople}</span>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm({ ...form, spots: String(n) })}
                    style={{ width: 42, height: 42, borderRadius: 12, background: form.spots === String(n) ? "#7C3AED" : "rgba(255,255,255,0.05)", border: `1px solid ${form.spots === String(n) ? "#7C3AED" : "rgba(255,255,255,0.08)"}`, color: form.spots === String(n) ? "#fff" : "rgba(255,255,255,0.3)", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={handleCreate} style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontFamily: "'Nunito', sans-serif", fontWeight: 800, cursor: "pointer", marginTop: 8 }}>{t.create}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-anim" style={{ position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)", background: "#1E1A3A", border: "1px solid rgba(139,92,246,0.3)", color: "#fff", padding: "12px 20px", borderRadius: 14, fontSize: 14, fontFamily: "'Nunito', sans-serif", fontWeight: 700, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
