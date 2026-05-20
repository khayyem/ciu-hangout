import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, orderBy, query } from "firebase/firestore";
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

const getAvatarColor = (uid) => {
  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#FF8B94", "#B4A7D6", "#6C8EBF", "#FF6B35"];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name) => name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "??";

const CATEGORIES = ["Все", "🎱 Бильярд", "⚽ Спорт", "📚 Учёба", "🚗 Поездки", "🍽️ Еда", "🏓 Игры"];

// ===== CHAT COMPONENT =====
function ChatModal({ activity, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const canChat = user && (activity.userId === user.uid || activity.participants?.includes(user.uid));

  useEffect(() => {
    const q = query(collection(db, "activities", activity.id, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [activity.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !canChat) return;
    await addDoc(collection(db, "activities", activity.id, "messages"), {
      text: text.trim(),
      userName: user.displayName || "Студент",
      userId: user.uid,
      userColor: getAvatarColor(user.uid),
      userInitials: getInitials(user.displayName),
      createdAt: Date.now(),
    });
    setText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 400 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111", borderRadius: "24px 24px 0 0", border: "1px solid #222", width: "100%", maxWidth: 430, height: "75vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1E1E1E", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>{activity.tags?.[0]} {activity.activity}</div>
            <div style={{ fontSize: 12, color: "#555", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
              {messages.length} сообщений · {(activity.participants?.length || 0) + 1} участников
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#888", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {!canChat && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
              <div>Только участники могут читать чат</div>
              <div style={{ fontSize: 12, marginTop: 8, color: "#333" }}>Нажми "Иду →" чтобы присоединиться</div>
            </div>
          )}
          {canChat && messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
              <div>Напиши первым!</div>
            </div>
          )}
          {canChat && messages.map(msg => {
            const isMe = msg.userId === user.uid;
            return (
              <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexDirection: isMe ? "row-reverse" : "row" }}>
                {!isMe && (
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: msg.userColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0D0D0D", flexShrink: 0 }}>
                    {msg.userInitials}
                  </div>
                )}
                <div style={{ maxWidth: "70%" }}>
                  {!isMe && <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Sans', sans-serif", marginBottom: 4, paddingLeft: 4 }}>{msg.userName}</div>}
                  <div style={{
                    background: isMe ? "#FF6B35" : "#1A1A1A",
                    border: isMe ? "none" : "1px solid #2A2A2A",
                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "10px 14px",
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#F5F0E8",
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: "#333", fontFamily: "'DM Sans', sans-serif", marginTop: 4, textAlign: isMe ? "right" : "left", paddingLeft: 4 }}>
                    {new Date(msg.createdAt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {canChat && (
          <div style={{ padding: "12px 20px 32px", borderTop: "1px solid #1E1E1E", display: "flex", gap: 10 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Написать..."
              style={{ flex: 1, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 14, padding: "12px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#F5F0E8", outline: "none" }}
            />
            <button onClick={sendMessage}
              style={{ width: 48, height: 48, borderRadius: 14, background: text.trim() ? "#FF6B35" : "#1A1A1A", border: "none", cursor: "pointer", fontSize: 20, transition: "all 0.2s" }}>
              ↑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedCat, setSelectedCat] = useState("Все");
  const [showModal, setShowModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [chatActivity, setChatActivity] = useState(null);
  const [form, setForm] = useState({ activity: "", time: "", place: "", spots: "1", tag: "🎱" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "activities"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setActivities(data);
    });
    return () => unsub();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try { await signInWithPopup(auth, provider); setShowAuth(false); showToast("Добро пожаловать! 👋"); }
    catch (e) { showToast("Ошибка входа"); }
    setLoading(false);
  };

  const handleLogout = async () => { await signOut(auth); showToast("Вышел из аккаунта"); };

  const handleJoin = async (item) => {
    if (!user) { setShowAuth(true); return; }
    const ref = doc(db, "activities", item.id);
    const isJoined = item.participants?.includes(user.uid);
    if (isJoined) {
      await updateDoc(ref, { participants: arrayRemove(user.uid), spots: item.spots + 1 });
      showToast("Ты отменил участие");
    } else if (item.spots > 0) {
      await updateDoc(ref, { participants: arrayUnion(user.uid), spots: item.spots - 1 });
      showToast("Ты в деле! 🎉");
    }
  };

  const handleCreate = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!form.activity || !form.time || !form.place) { showToast("Заполни все поля!"); return; }
    try {
      await addDoc(collection(db, "activities"), {
        userId: user.uid,
        userName: user.displayName || "Студент",
        userAvatar: getInitials(user.displayName),
        userColor: getAvatarColor(user.uid),
        activity: form.activity,
        time: form.time,
        place: form.place,
        spots: parseInt(form.spots),
        maxSpots: parseInt(form.spots),
        tags: [form.tag],
        participants: [],
        createdAt: Date.now(),
      });
      setForm({ activity: "", time: "", place: "", spots: "1", tag: "🎱" });
      setShowModal(false);
      showToast("Активность создана! 🚀");
      setActiveTab("feed");
    } catch(e) { console.error(e); showToast("Ошибка, попробуй снова"); }
  };

  const filtered = selectedCat === "Все" ? activities : activities.filter(a => selectedCat.includes(a.tags?.[0]));
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
        .card:hover { border-color: #444; transform: translateY(-1px); }
        .join-btn { border: none; border-radius: 12px; padding: 10px 20px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
        .join-btn:hover { transform: scale(1.03); }
        .chat-btn { border: 1px solid #2A2A2A; border-radius: 10px; padding: 8px 12px; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s; background: #1A1A1A; color: #888; }
        .chat-btn.active { border-color: #FF6B35; color: #FF6B35; background: #1A0A00; }
        .tab-btn { background: none; border: none; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; padding: 10px 0; transition: all 0.2s; color: #555; flex: 1; }
        .cat-chip { background: #1A1A1A; border: 1px solid #2A2A2A; color: #888; border-radius: 100px; padding: 7px 14px; font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-weight: 500; }
        .cat-chip.active { background: #F5F0E8; color: #0D0D0D; border-color: #F5F0E8; }
        .input-field { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 14px; padding: 14px 16px; font-family: 'DM Sans', sans-serif; font-size: 15px; color: #F5F0E8; width: 100%; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: #555; }
        .input-field::placeholder { color: #444; }
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
      <div style={{ padding: "52px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>CIU Campus</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>
              Найди с кем<br /><span style={{ color: "#FF6B35" }}>сходить</span>
            </div>
          </div>
          {user ? (
            <div onClick={handleLogout} style={{ cursor: "pointer", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: getAvatarColor(user.uid), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0D0D0D" }}>
                {getInitials(user.displayName)}
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>выйти</div>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: "#FF6B35", border: "none", borderRadius: 14, padding: "10px 14px", color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Войти
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
          <div className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80" }} />
          <span style={{ fontSize: 12, color: "#4ADE80", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            {activities.length} активностей сейчас
          </span>
          {user && <span style={{ fontSize: 12, color: "#555", fontFamily: "'DM Sans', sans-serif" }}>· {user.displayName?.split(" ")[0]}</span>}
        </div>
      </div>

      {/* Categories */}
      <div style={{ overflowX: "auto", display: "flex", gap: 8, padding: "0 20px 16px" }}>
        {CATEGORIES.map(cat => (
          <button key={cat} className={`cat-chip ${selectedCat === cat ? "active" : ""}`} onClick={() => setSelectedCat(cat)}>{cat}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 20px", paddingBottom: 100, overflowY: "auto", maxHeight: "calc(100vh - 240px)" }}>
        {activeTab === "feed" && (
          <div className="slide-up">
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌙</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif" }}>Пока никого нет — создай первым!</div>
              </div>
            )}
            {filtered.map(item => {
              const isJoined = user && item.participants?.includes(user.uid);
              const isOwner = user && item.userId === user.uid;
              const hasChat = canChat(item);
              return (
                <div key={item.id} className="card" style={{ border: isOwner ? "1px solid #FF6B35" : "1px solid #222" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: item.userColor || "#6C8EBF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0D0D0D", flexShrink: 0 }}>
                      {item.userAvatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>{item.tags?.[0]} {item.activity}</div>
                      <div style={{ fontSize: 12, color: "#666", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                        {item.userName} {isOwner && <span style={{ color: "#FF6B35" }}>· ты</span>}
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 13 }}>🕐</span>
                          <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>{item.time}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 13 }}>📍</span>
                          <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>{item.place}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 12, color: "#555", fontFamily: "'DM Sans', sans-serif" }}>
                            {item.spots > 0
                              ? <span><span style={{ color: "#FF6B35", fontWeight: 600 }}>{item.spots}</span> мест{item.spots === 1 ? "о" : "а"}</span>
                              : <span style={{ color: "#444" }}>Мест нет</span>}
                          </div>
                          <button className={`chat-btn ${hasChat ? "active" : ""}`} onClick={() => { if (!user) { setShowAuth(true); return; } setChatActivity(item); }}>
                            💬 {hasChat ? "Чат" : "🔒"}
                          </button>
                        </div>
                        {!isOwner && (
                          <button className="join-btn" onClick={() => handleJoin(item)}
                            disabled={item.spots === 0 && !isJoined}
                            style={{ background: isJoined ? "#1A2A1A" : item.spots === 0 ? "#1A1A1A" : "#FF6B35", color: isJoined ? "#4ADE80" : item.spots === 0 ? "#444" : "#fff", border: isJoined ? "1px solid #4ADE80" : "none", cursor: (item.spots === 0 && !isJoined) ? "not-allowed" : "pointer" }}>
                            {isJoined ? "✓ Иду" : item.spots === 0 ? "Занято" : "Иду →"}
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
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#666", marginBottom: 20 }}>Войди чтобы видеть свои активности</div>
                <button onClick={() => setShowAuth(true)} style={{ background: "#FF6B35", border: "none", borderRadius: 14, padding: "12px 24px", color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>Войти через Google</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: "#555", fontFamily: "'DM Sans', sans-serif", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Мои активности</div>
                  {myActivities.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "#444", fontFamily: "'DM Sans', sans-serif" }}><div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>Ты ещё ничего не создал</div>}
                  {myActivities.map(item => (
                    <div key={item.id} className="card" style={{ border: "1px solid #FF6B35", cursor: "pointer" }} onClick={() => setChatActivity(item)}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{item.tags?.[0]} {item.activity}</div>
                      <div style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif", marginTop: 6 }}>🕐 {item.time} · 📍 {item.place}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: "#FF6B35", fontFamily: "'DM Sans', sans-serif" }}>{item.spots} мест · {(item.maxSpots - item.spots)} участников</div>
                        <span style={{ fontSize: 12, color: "#FF6B35", fontFamily: "'DM Sans', sans-serif" }}>💬 Чат →</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#555", fontFamily: "'DM Sans', sans-serif", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Я иду</div>
                  {joinedActivities.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "#444", fontFamily: "'DM Sans', sans-serif" }}><div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>Ты ни к чему не присоединился</div>}
                  {joinedActivities.map(item => (
                    <div key={item.id} className="card" style={{ border: "1px solid #4ADE80", cursor: "pointer" }} onClick={() => setChatActivity(item)}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{item.tags?.[0]} {item.activity}</div>
                      <div style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif", marginTop: 6 }}>🕐 {item.time} · 📍 {item.place}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>с {item.userName}</div>
                        <span style={{ fontSize: 12, color: "#4ADE80", fontFamily: "'DM Sans', sans-serif" }}>💬 Чат →</span>
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
          <div style={{ fontSize: 20, marginBottom: 2 }}>🏠</div><div>Лента</div>
        </button>
        <button className="tab-btn" onClick={() => setActiveTab("my")} style={{ color: activeTab === "my" ? "#FF6B35" : "#555" }}>
          <div style={{ fontSize: 20, marginBottom: 2 }}>👤</div><div>Мои</div>
        </button>
      </div>

      {/* Chat Modal */}
      {chatActivity && <ChatModal activity={chatActivity} user={user} onClose={() => setChatActivity(null)} />}

      {/* Auth Modal */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <div className="slide-up" style={{ background: "#111", borderRadius: 24, border: "1px solid #222", padding: 28, width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5, marginBottom: 8 }}>Войди в CIU Hangout</div>
            <div style={{ fontSize: 14, color: "#666", fontFamily: "'DM Sans', sans-serif", marginBottom: 28 }}>Только для студентов CIU</div>
            <button onClick={handleGoogleLogin} disabled={loading}
              style={{ background: "#fff", border: "none", borderRadius: 16, padding: "14px 24px", width: "100%", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#333" }}>
              {loading ? "Входим..." : <><span style={{ fontSize: 20 }}>G</span> Войти через Google</>}
            </button>
            <div style={{ fontSize: 11, color: "#444", fontFamily: "'DM Sans', sans-serif", marginTop: 16 }}>Используй почту @ciu.edu.tr</div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="slide-up" style={{ background: "#111", borderRadius: "24px 24px 0 0", border: "1px solid #222", padding: "28px 20px 40px", width: "100%", maxWidth: 430 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>Новая активность</div>
              <button onClick={() => setShowModal(false)} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#888", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["🎱", "⚽", "📚", "🚗", "🍽️", "🏓", "🎮", "☕"].map(tag => (
                <button key={tag} className={`tag-btn ${form.tag === tag ? "active" : ""}`} onClick={() => setForm({ ...form, tag })}>{tag}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input-field" placeholder="Что хочешь сделать?" value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} />
              <input className="input-field" placeholder="Когда? (Сегодня, 19:00)" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              <input className="input-field" placeholder="Где? (Student Center...)" value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#666", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>Нужно людей:</span>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setForm({ ...form, spots: String(n) })}
                    style={{ width: 40, height: 40, borderRadius: 12, background: form.spots === String(n) ? "#FF6B35" : "#1A1A1A", border: `1px solid ${form.spots === String(n) ? "#FF6B35" : "#2A2A2A"}`, color: form.spots === String(n) ? "#fff" : "#666", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                    {n}
                  </button>
                ))}
              </div>
              <button className="join-btn" onClick={handleCreate}
                style={{ background: "#FF6B35", color: "#fff", padding: "16px", fontSize: 15, marginTop: 8, borderRadius: 16, width: "100%" }}>
                Создать →
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
