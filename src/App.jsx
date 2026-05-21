import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove, orderBy, query, getDoc } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDISzgCehbIiKAS4A3FuY7vJFai5nyyA2s",
  authDomain: "ciu-hangout-a7457.firebaseapp.com",
  projectId: "ciu-hangout-a7457",
  storageBucket: "ciu-hangout-a7457.firebasestorage.app",
  messagingSenderId: "546602904671",
  appId: "1:546602904671:web:ac554a2ea182c8546abfea",
  measurementId: "G-JZYE02VGXB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ===== TRANSLATIONS =====
const T = {
  ru: {
    title: "Найди с кем", subtitle: "сходить", campus: "CIU Кампус",
    activities: "активностей сейчас", login: "Войти", logout: "выйти",
    all: "Все", billiards: "🎱 Бильярд", sport: "⚽ Спорт", study: "📚 Учёба",
    trips: "🚗 Поездки", food: "🍽️ Еда", games: "🏓 Игры",
    empty: "Пока никого нет — создай первым!", join: "Иду →", joined: "✓ Иду",
    full: "Занято", spots: "мест", spot: "место", chat: "Чат", locked: "🔒",
    myTab: "Мои", feedTab: "Лента", myActivities: "Мои активности",
    iGo: "Я иду", noMyActivities: "Ты ещё ничего не создал",
    noJoined: "Ты ни к чему не присоединился", with: "с",
    loginTitle: "Войди в CIU Hangout", loginSub: "Только для студентов CIU",
    loginBtn: "Войти через Google", loginHint: "Используй почту @ciu.edu.tr",
    loginLoading: "Входим...", loginToSee: "Войди чтобы видеть свои активности",
    newActivity: "Новая активность", whatToDo: "Что хочешь сделать?",
    when: "Когда? (Сегодня, 19:00)", where: "Где? (Student Center...)",
    needPeople: "Нужно людей:", create: "Создать →", fillAll: "Заполни все поля!",
    created: "Активность создана! 🚀", error: "Ошибка, попробуй снова",
    welcome: "Добро пожаловать! 👋", loginError: "Ошибка входа",
    cancelJoin: "Ты отменил участие", inDeal: "Ты в деле! 🎉",
    deleted: "Активность удалена 🗑️", saved: "Сохранено ✅",
    deleteConfirm: "Удалить активность?", delete: "Удалить", cancel: "Отмена",
    edit: "Редактировать", editActivity: "Редактировать", save: "Сохранить",
    participants: "Участники", noParticipants: "Пока никого нет",
    chatTitle: "Чат", messages: "сообщений", members: "участников",
    chatLocked: "Только участники могут читать чат",
    chatLockedSub: "Нажми \"Иду →\" чтобы присоединиться",
    writeFirst: "Напиши первым!", writePlaceholder: "Написать...",
    you: "ты", goOut: "выйти", expired: "истекло",
  },
  en: {
    title: "Find someone to", subtitle: "hang out", campus: "CIU Campus",
    activities: "activities now", login: "Login", logout: "logout",
    all: "All", billiards: "🎱 Billiards", sport: "⚽ Sport", study: "📚 Study",
    trips: "🚗 Trips", food: "🍽️ Food", games: "🏓 Games",
    empty: "Nothing here yet — be the first!", join: "I'm in →", joined: "✓ Going",
    full: "Full", spots: "spots", spot: "spot", chat: "Chat", locked: "🔒",
    myTab: "Mine", feedTab: "Feed", myActivities: "My Activities",
    iGo: "I'm going", noMyActivities: "You haven't created anything yet",
    noJoined: "You haven't joined anything", with: "with",
    loginTitle: "Join CIU Hangout", loginSub: "For CIU students only",
    loginBtn: "Sign in with Google", loginHint: "Use your @ciu.edu.tr email",
    loginLoading: "Signing in...", loginToSee: "Login to see your activities",
    newActivity: "New Activity", whatToDo: "What do you want to do?",
    when: "When? (Today, 7PM)", where: "Where? (Student Center...)",
    needPeople: "Need people:", create: "Create →", fillAll: "Fill all fields!",
    created: "Activity created! 🚀", error: "Error, try again",
    welcome: "Welcome! 👋", loginError: "Login error",
    cancelJoin: "You cancelled", inDeal: "You're in! 🎉",
    deleted: "Activity deleted 🗑️", saved: "Saved ✅",
    deleteConfirm: "Delete activity?", delete: "Delete", cancel: "Cancel",
    edit: "Edit", editActivity: "Edit Activity", save: "Save",
    participants: "Participants", noParticipants: "No one yet",
    chatTitle: "Chat", messages: "messages", members: "members",
    chatLocked: "Only participants can read the chat",
    chatLockedSub: "Press \"I'm in →\" to join",
    writeFirst: "Write first!", writePlaceholder: "Message...",
    you: "you", goOut: "sign out", expired: "expired",
  },
  tr: {
    title: "Birlikte gidecek", subtitle: "biri bul", campus: "CIU Kampüs",
    activities: "etkinlik şu an", login: "Giriş", logout: "çıkış",
    all: "Tümü", billiards: "🎱 Bilardo", sport: "⚽ Spor", study: "📚 Çalışma",
    trips: "🚗 Gezi", food: "🍽️ Yemek", games: "🏓 Oyun",
    empty: "Henüz kimse yok — ilk sen ol!", join: "Katılıyorum →", joined: "✓ Gidiyorum",
    full: "Dolu", spots: "yer", spot: "yer", chat: "Sohbet", locked: "🔒",
    myTab: "Benim", feedTab: "Akış", myActivities: "Etkinliklerim",
    iGo: "Gidiyorum", noMyActivities: "Henüz bir şey oluşturmadın",
    noJoined: "Hiçbir şeye katılmadın", with: "ile",
    loginTitle: "CIU Hangout'a Giriş", loginSub: "Sadece CIU öğrencileri için",
    loginBtn: "Google ile Giriş", loginHint: "@ciu.edu.tr e-postanı kullan",
    loginLoading: "Giriş yapılıyor...", loginToSee: "Etkinliklerini görmek için giriş yap",
    newActivity: "Yeni Etkinlik", whatToDo: "Ne yapmak istiyorsun?",
    when: "Ne zaman? (Bugün, 19:00)", where: "Nerede? (Öğrenci Merkezi...)",
    needPeople: "Kişi gerekli:", create: "Oluştur →", fillAll: "Tüm alanları doldur!",
    created: "Etkinlik oluşturuldu! 🚀", error: "Hata, tekrar dene",
    welcome: "Hoş geldin! 👋", loginError: "Giriş hatası",
    cancelJoin: "Katılımı iptal ettin", inDeal: "Katıldın! 🎉",
    deleted: "Etkinlik silindi 🗑️", saved: "Kaydedildi ✅",
    deleteConfirm: "Etkinliği sil?", delete: "Sil", cancel: "İptal",
    edit: "Düzenle", editActivity: "Etkinliği Düzenle", save: "Kaydet",
    participants: "Katılımcılar", noParticipants: "Henüz kimse yok",
    chatTitle: "Sohbet", messages: "mesaj", members: "üye",
    chatLocked: "Sadece katılımcılar sohbeti okuyabilir",
    chatLockedSub: "Katılmak için \"Katılıyorum →\" bas",
    writeFirst: "İlk sen yaz!", writePlaceholder: "Mesaj...",
    you: "sen", goOut: "çıkış yap", expired: "süresi doldu",
  }
};

const getAvatarColor = (uid) => {
  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#FF8B94", "#B4A7D6", "#6C8EBF", "#FF6B35"];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};
const getInitials = (name) => name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "??";

// ===== CHAT MODAL =====
function ChatModal({ activity, user, t, onClose }) {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [text, setText] = useState("");
  const [tab, setTab] = useState("chat");
  const bottomRef = useRef(null);
  const canChat = user && (activity.userId === user.uid || activity.participants?.includes(user.uid));

  useEffect(() => {
    const q = query(collection(db, "activities", activity.id, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [activity.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !canChat) return;
    await addDoc(collection(db, "activities", activity.id, "messages"), {
      text: text.trim(), userName: user.displayName || "Student",
      userId: user.uid, userColor: getAvatarColor(user.uid),
      userInitials: getInitials(user.displayName), createdAt: Date.now(),
    });
    setText("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 400 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111", borderRadius: "24px 24px 0 0", border: "1px solid #222", width: "100%", maxWidth: 430, height: "78vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 0", borderBottom: "1px solid #1E1E1E" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>{activity.tags?.[0]} {activity.activity}</div>
              <div style={{ fontSize: 12, color: "#555", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                {messages.length} {t.messages} · {(activity.participants?.length || 0) + 1} {t.members}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#888", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {["chat", "participants"].map(tb => (
              <button key={tb} onClick={() => setTab(tb)} style={{ flex: 1, background: "none", border: "none", borderBottom: `2px solid ${tab === tb ? "#FF6B35" : "transparent"}`, color: tab === tb ? "#FF6B35" : "#555", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                {tb === "chat" ? `💬 ${t.chatTitle}` : `👥 ${t.participants}`}
              </button>
            ))}
          </div>
        </div>

        {tab === "chat" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {!canChat && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
                  <div>{t.chatLocked}</div>
                  <div style={{ fontSize: 12, marginTop: 8, color: "#333" }}>{t.chatLockedSub}</div>
                </div>
              )}
              {canChat && messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                  <div>{t.writeFirst}</div>
                </div>
              )}
              {canChat && messages.map(msg => {
                const isMe = msg.userId === user.uid;
                return (
                  <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexDirection: isMe ? "row-reverse" : "row" }}>
                    {!isMe && <div style={{ width: 32, height: 32, borderRadius: 10, background: msg.userColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0D0D0D", flexShrink: 0 }}>{msg.userInitials}</div>}
                    <div style={{ maxWidth: "70%" }}>
                      {!isMe && <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Sans', sans-serif", marginBottom: 4, paddingLeft: 4 }}>{msg.userName}</div>}
                      <div style={{ background: isMe ? "#FF6B35" : "#1A1A1A", border: isMe ? "none" : "1px solid #2A2A2A", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#F5F0E8", lineHeight: 1.4, wordBreak: "break-word" }}>{msg.text}</div>
                      <div style={{ fontSize: 10, color: "#333", fontFamily: "'DM Sans', sans-serif", marginTop: 4, textAlign: isMe ? "right" : "left", paddingLeft: 4 }}>{new Date(msg.createdAt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {canChat && (
              <div style={{ padding: "12px 20px 32px", borderTop: "1px solid #1E1E1E", display: "flex", gap: 10 }}>
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={t.writePlaceholder}
                  style={{ flex: 1, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 14, padding: "12px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#F5F0E8", outline: "none" }} />
                <button onClick={sendMessage} style={{ width: 48, height: 48, borderRadius: 14, background: text.trim() ? "#FF6B35" : "#1A1A1A", border: "none", cursor: "pointer", fontSize: 20 }}>↑</button>
              </div>
            )}
          </>
        )}

        {tab === "participants" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {/* Owner */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #1E1E1E" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: activity.userColor || "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0D0D0D" }}>{activity.userAvatar}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{activity.userName}</div>
                <div style={{ fontSize: 11, color: "#FF6B35", fontFamily: "'DM Sans', sans-serif" }}>👑 организатор</div>
              </div>
            </div>
            {(!activity.participants || activity.participants.length === 0) && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                <div>{t.noParticipants}</div>
              </div>
            )}
            {activity.participants?.map((uid, i) => (
              <div key={uid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #1A1A1A" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: getAvatarColor(uid), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0D0D0D" }}>#{i + 1}</div>
                <div style={{ fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#888" }}>Участник {i + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== EDIT MODAL =====
function EditModal({ activity, t, onClose, onSave }) {
  const [form, setForm] = useState({ activity: activity.activity, time: activity.time, place: activity.place, spots: String(activity.spots + (activity.maxSpots - activity.spots - activity.spots)), tag: activity.tags?.[0] || "🎱" });

  const handleSave = async () => {
    if (!form.activity || !form.time || !form.place) return;
    await updateDoc(doc(db, "activities", activity.id), {
      activity: form.activity, time: form.time, place: form.place, tags: [form.tag],
    });
    onSave();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 400 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111", borderRadius: "24px 24px 0 0", border: "1px solid #222", padding: "28px 20px 40px", width: "100%", maxWidth: 430 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>{t.editActivity}</div>
          <button onClick={onClose} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#888", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {["🎱", "⚽", "📚", "🚗", "🍽️", "🏓", "🎮", "☕"].map(tag => (
            <button key={tag} onClick={() => setForm({ ...form, tag })}
              style={{ background: form.tag === tag ? "#FF6B35" : "#1A1A1A", border: `1px solid ${form.tag === tag ? "#FF6B35" : "#2A2A2A"}`, borderRadius: 10, padding: "8px 12px", fontSize: 18, cursor: "pointer" }}>
              {tag}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="input-field" value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} placeholder={t.whatToDo} />
          <input className="input-field" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder={t.when} />
          <input className="input-field" value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} placeholder={t.where} />
          <button onClick={handleSave} style={{ background: "#FF6B35", color: "#fff", border: "none", borderRadius: 16, padding: 16, fontSize: 15, fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer", marginTop: 8 }}>{t.save}</button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState(null);
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

  const t = T[lang];

  const CATEGORIES = [
    { id: "all", label: t.all },
    { id: "🎱", label: t.billiards },
    { id: "⚽", label: t.sport },
    { id: "📚", label: t.study },
    { id: "🚗", label: t.trips },
    { id: "🍽️", label: t.food },
    { id: "🏓", label: t.games },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "activities"), (snapshot) => {
      const now = Date.now();
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(a => !a.expiresAt || a.expiresAt > now); // автоудаление
      data.sort((a, b) => b.createdAt - a.createdAt);
      setActivities(data);
    });
    return () => unsub();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try { await signInWithPopup(auth, provider); setShowAuth(false); showToast(t.welcome); }
    catch (e) { showToast(t.loginError); }
    setLoading(false);
  };

  const handleLogout = async () => { await signOut(auth); showToast("👋"); };

  const handleJoin = async (item) => {
    if (!user) { setShowAuth(true); return; }
    const ref = doc(db, "activities", item.id);
    const isJoined = item.participants?.includes(user.uid);
    if (isJoined) {
      await updateDoc(ref, { participants: arrayRemove(user.uid), spots: item.spots + 1 });
      showToast(t.cancelJoin);
    } else if (item.spots > 0) {
      await updateDoc(ref, { participants: arrayUnion(user.uid), spots: item.spots - 1 });
      showToast(t.inDeal);
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "activities", id));
    setDeleteTarget(null);
    showToast(t.deleted);
  };

  const handleCreate = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!form.activity || !form.time || !form.place) { showToast(t.fillAll); return; }
    // Автоудаление через 24 часа
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    try {
      await addDoc(collection(db, "activities"), {
        userId: user.uid, userName: user.displayName || "Student",
        userAvatar: getInitials(user.displayName), userColor: getAvatarColor(user.uid),
        activity: form.activity, time: form.time, place: form.place,
        spots: parseInt(form.spots), maxSpots: parseInt(form.spots),
        tags: [form.tag], participants: [], createdAt: Date.now(), expiresAt,
      });
      setForm({ activity: "", time: "", place: "", spots: "1", tag: "🎱" });
      setShowModal(false);
      showToast(t.created);
      setActiveTab("feed");
    } catch (e) { showToast(t.error); }
  };

  const filtered = selectedCat === "all" ? activities : activities.filter(a => a.tags?.includes(selectedCat));
  const myActivities = user ? activities.filter(a => a.userId === user.uid) : [];
  const joinedActivities = user ? activities.filter(a => a.participants?.includes(user.uid)) : [];
  const canChat = (item) => user && (item.userId === user.uid || item.participants?.includes(user.uid));

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", fontFamily: "'Syne', sans-serif", color: "#F5F0E8", maxWidth: 430, margin: "0 auto", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        .card { background: #161616; border: 1px solid #222; border-radius: 20px; padding: 18px; margin-bottom: 12px; transition: all 0.2s ease; }
        .card:hover { border-color: #333; }
        .join-btn { border: none; border-radius: 12px; padding: 9px 18px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; cursor: pointer; transition: all 0.2s ease; }
        .chat-btn { border: 1px solid #2A2A2A; border-radius: 10px; padding: 7px 11px; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 11px; cursor: pointer; transition: all 0.2s; background: #1A1A1A; color: #888; }
        .chat-btn.active { border-color: #FF6B35; color: #FF6B35; background: #1A0A00; }
        .icon-btn { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 10px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .icon-btn:hover { border-color: #444; }
        .icon-btn.danger:hover { border-color: #FF4444; background: #1A0000; }
        .tab-btn { background: none; border: none; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; padding: 10px 0; transition: all 0.2s; color: #555; flex: 1; }
        .cat-chip { background: #1A1A1A; border: 1px solid #2A2A2A; color: #888; border-radius: 100px; padding: 7px 14px; font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-weight: 500; }
        .cat-chip.active { background: #F5F0E8; color: #0D0D0D; border-color: #F5F0E8; }
        .input-field { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 14px; padding: 14px 16px; font-family: 'DM Sans', sans-serif; font-size: 15px; color: #F5F0E8; width: 100%; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: #555; }
        .input-field::placeholder { color: #444; }
        .lang-btn { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 8px; padding: 4px 8px; font-size: 11px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: #666; transition: all 0.2s; font-weight: 600; }
        .lang-btn.active { background: #FF6B35; border-color: #FF6B35; color: #fff; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .slide-up { animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .toast-anim { animation: toastIn 0.3s ease; }
        @keyframes toastIn { from { transform: translateX(-50%) translateY(10px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        .tag-btn { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 10px; padding: 8px 12px; font-size: 18px; cursor: pointer; transition: all 0.15s; }
        .tag-btn.active { background: #FF6B35; border-color: #FF6B35; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "48px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>{t.campus}</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>
              {t.title}<br /><span style={{ color: "#FF6B35" }}>{t.subtitle}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {/* Lang switcher */}
            <div style={{ display: "flex", gap: 4 }}>
              {["ru", "en", "tr"].map(l => (
                <button key={l} className={`lang-btn ${lang === l ? "active" : ""}`} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            {user ? (
              <div onClick={handleLogout} style={{ cursor: "pointer", textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: getAvatarColor(user.uid), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#0D0D0D" }}>
                  {getInitials(user.displayName)}
                </div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{t.logout}</div>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ background: "#FF6B35", border: "none", borderRadius: 12, padding: "8px 14px", color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{t.login}</button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
          <div className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80" }} />
          <span style={{ fontSize: 12, color: "#4ADE80", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            {activities.length} {t.activities}
          </span>
          {user && <span style={{ fontSize: 12, color: "#555", fontFamily: "'DM Sans', sans-serif" }}>· {user.displayName?.split(" ")[0]}</span>}
        </div>
      </div>

      {/* Categories */}
      <div style={{ overflowX: "auto", display: "flex", gap: 8, padding: "0 20px 16px" }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} className={`cat-chip ${selectedCat === cat.id ? "active" : ""}`} onClick={() => setSelectedCat(cat.id)}>{cat.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 20px", paddingBottom: 100, overflowY: "auto", maxHeight: "calc(100vh - 240px)" }}>
        {activeTab === "feed" && (
          <div className="slide-up">
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌙</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif" }}>{t.empty}</div>
              </div>
            )}
            {filtered.map(item => {
              const isJoined = user && item.participants?.includes(user.uid);
              const isOwner = user && item.userId === user.uid;
              const hasChat = canChat(item);
              const hoursLeft = item.expiresAt ? Math.max(0, Math.round((item.expiresAt - Date.now()) / 3600000)) : null;
              return (
                <div key={item.id} className="card" style={{ border: isOwner ? "1px solid #FF6B35" : "1px solid #222" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: item.userColor || "#6C8EBF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0D0D0D", flexShrink: 0 }}>
                      {item.userAvatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>{item.tags?.[0]} {item.activity}</div>
                        {isOwner && (
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                            <button className="icon-btn" onClick={() => setEditActivity(item)} title={t.edit}>✏️</button>
                            <button className="icon-btn danger" onClick={() => setDeleteTarget(item.id)} title={t.delete}>🗑️</button>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#666", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                        {item.userName} {isOwner && <span style={{ color: "#FF6B35" }}>· {t.you}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 12 }}>🕐</span>
                          <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>{item.time}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 12 }}>📍</span>
                          <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>{item.place}</span>
                        </div>
                        {hoursLeft !== null && hoursLeft < 6 && (
                          <div style={{ fontSize: 11, color: "#FF4444", fontFamily: "'DM Sans', sans-serif" }}>⏰ {hoursLeft}h</div>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 12, color: "#555", fontFamily: "'DM Sans', sans-serif" }}>
                            {item.spots > 0
                              ? <span><span style={{ color: "#FF6B35", fontWeight: 600 }}>{item.spots}</span> {item.spots === 1 ? t.spot : t.spots}</span>
                              : <span style={{ color: "#444" }}>{t.full}</span>}
                          </div>
                          <button className={`chat-btn ${hasChat ? "active" : ""}`} onClick={() => { if (!user) { setShowAuth(true); return; } setChatActivity(item); }}>
                            💬 {hasChat ? t.chat : t.locked}
                          </button>
                        </div>
                        {!isOwner && (
                          <button className="join-btn" onClick={() => handleJoin(item)}
                            disabled={item.spots === 0 && !isJoined}
                            style={{ background: isJoined ? "#1A2A1A" : item.spots === 0 ? "#1A1A1A" : "#FF6B35", color: isJoined ? "#4ADE80" : item.spots === 0 ? "#444" : "#fff", border: isJoined ? "1px solid #4ADE80" : "none", cursor: (item.spots === 0 && !isJoined) ? "not-allowed" : "pointer" }}>
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

        {activeTab === "my" && (
          <div className="slide-up">
            {!user ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#666", marginBottom: 20 }}>{t.loginToSee}</div>
                <button onClick={() => setShowAuth(true)} style={{ background: "#FF6B35", border: "none", borderRadius: 14, padding: "12px 24px", color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>{t.loginBtn}</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: "#555", fontFamily: "'DM Sans', sans-serif", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>{t.myActivities}</div>
                  {myActivities.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "#444", fontFamily: "'DM Sans', sans-serif" }}><div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>{t.noMyActivities}</div>}
                  {myActivities.map(item => (
                    <div key={item.id} className="card" style={{ border: "1px solid #FF6B35" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{item.tags?.[0]} {item.activity}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="icon-btn" onClick={() => setEditActivity(item)}>✏️</button>
                          <button className="icon-btn danger" onClick={() => setDeleteTarget(item.id)}>🗑️</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif", marginTop: 6 }}>🕐 {item.time} · 📍 {item.place}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: "#FF6B35", fontFamily: "'DM Sans', sans-serif" }}>{item.spots} {t.spots} · {(item.maxSpots - item.spots)} {t.members}</div>
                        <button className="chat-btn active" onClick={() => setChatActivity(item)}>💬 {t.chat}</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#555", fontFamily: "'DM Sans', sans-serif", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>{t.iGo}</div>
                  {joinedActivities.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "#444", fontFamily: "'DM Sans', sans-serif" }}><div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>{t.noJoined}</div>}
                  {joinedActivities.map(item => (
                    <div key={item.id} className="card" style={{ border: "1px solid #4ADE80", cursor: "pointer" }} onClick={() => setChatActivity(item)}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{item.tags?.[0]} {item.activity}</div>
                      <div style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif", marginTop: 6 }}>🕐 {item.time} · 📍 {item.place}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>{t.with} {item.userName}</div>
                        <span style={{ fontSize: 12, color: "#4ADE80", fontFamily: "'DM Sans', sans-serif" }}>💬 {t.chat} →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => user ? setShowModal(true) : setShowAuth(true)}
        style={{ position: "fixed", bottom: 84, right: 20, width: 56, height: 56, borderRadius: "50%", background: "#FF6B35", border: "none", fontSize: 26, cursor: "pointer", boxShadow: "0 4px 24px rgba(255,107,53,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        +
      </button>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#111", borderTop: "1px solid #1E1E1E", display: "flex", padding: "8px 0 20px", zIndex: 99 }}>
        <button className="tab-btn" onClick={() => setActiveTab("feed")} style={{ color: activeTab === "feed" ? "#FF6B35" : "#555" }}>
          <div style={{ fontSize: 20, marginBottom: 2 }}>🏠</div><div>{t.feedTab}</div>
        </button>
        <button className="tab-btn" onClick={() => setActiveTab("my")} style={{ color: activeTab === "my" ? "#FF6B35" : "#555" }}>
          <div style={{ fontSize: 20, marginBottom: 2 }}>👤</div><div>{t.myTab}</div>
        </button>
      </div>

      {/* Delete Confirm */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20 }}>
          <div className="slide-up" style={{ background: "#111", borderRadius: 24, border: "1px solid #333", padding: 28, width: "100%", maxWidth: 320, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 24 }}>{t.deleteConfirm}</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 14, padding: 14, color: "#888", fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>{t.cancel}</button>
              <button onClick={() => handleDelete(deleteTarget)} style={{ flex: 1, background: "#FF4444", border: "none", borderRadius: 14, padding: 14, color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editActivity && <EditModal activity={editActivity} t={t} onClose={() => setEditActivity(null)} onSave={() => showToast(t.saved)} />}

      {/* Chat Modal */}
      {chatActivity && <ChatModal activity={chatActivity} user={user} t={t} onClose={() => setChatActivity(null)} />}

      {/* Auth Modal */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <div className="slide-up" style={{ background: "#111", borderRadius: 24, border: "1px solid #222", padding: 28, width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5, marginBottom: 8 }}>{t.loginTitle}</div>
            <div style={{ fontSize: 14, color: "#666", fontFamily: "'DM Sans', sans-serif", marginBottom: 28 }}>{t.loginSub}</div>
            <button onClick={handleGoogleLogin} disabled={loading}
              style={{ background: "#fff", border: "none", borderRadius: 16, padding: "14px 24px", width: "100%", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#333" }}>
              {loading ? t.loginLoading : <><span style={{ fontSize: 20 }}>G</span> {t.loginBtn}</>}
            </button>
            <div style={{ fontSize: 11, color: "#444", fontFamily: "'DM Sans', sans-serif", marginTop: 16 }}>{t.loginHint}</div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="slide-up" style={{ background: "#111", borderRadius: "24px 24px 0 0", border: "1px solid #222", padding: "28px 20px 40px", width: "100%", maxWidth: 430 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>{t.newActivity}</div>
              <button onClick={() => setShowModal(false)} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#888", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["🎱", "⚽", "📚", "🚗", "🍽️", "🏓", "🎮", "☕"].map(tag => (
                <button key={tag} className={`tag-btn ${form.tag === tag ? "active" : ""}`} onClick={() => setForm({ ...form, tag })}>{tag}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input-field" placeholder={t.whatToDo} value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} />
              <input className="input-field" placeholder={t.when} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              <input className="input-field" placeholder={t.where} value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#666", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>{t.needPeople}</span>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setForm({ ...form, spots: String(n) })}
                    style={{ width: 40, height: 40, borderRadius: 12, background: form.spots === String(n) ? "#FF6B35" : "#1A1A1A", border: `1px solid ${form.spots === String(n) ? "#FF6B35" : "#2A2A2A"}`, color: form.spots === String(n) ? "#fff" : "#666", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={handleCreate}
                style={{ background: "#FF6B35", color: "#fff", border: "none", borderRadius: 16, padding: 16, fontSize: 15, fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
                {t.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-anim" style={{ position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)", background: "#1A1A1A", border: "1px solid #333", color: "#F5F0E8", padding: "12px 20px", borderRadius: 14, fontSize: 14, fontFamily: "'DM Sans', sans-serif", zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
