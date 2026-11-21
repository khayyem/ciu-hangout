import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "./data/store";
import { CATS, FEED_GRACE_MS } from "./lib/constants";
import { dayLabel, isMember, isWaiting } from "./lib/format";
import { useNow } from "./lib/useNow";
import { CiuMark, EmptyState, Sheet, Splash } from "./components/ui";
import { InstallBanner, OfflineBar } from "./components/Banners";
import { StatsSheet } from "./components/Stats";
import { MapTab } from "./components/MapTab";
import { clearPendingActivity, pendingActivityId } from "./lib/share";
import { ActivityDetail, ActivityRow } from "./components/Activity";
import { ChatScreen, ChatsTab } from "./components/Chat";
import { ActivityForm, ConfirmSheet, ProfileForm, ReportSheet } from "./components/Forms";
import { PersonCard, ProfileTab, SignIn } from "./components/Profile";

const goDemo = () => (window.location.href = "/?demo");
const goLive = () => (window.location.href = "/?live");

function DemoBanner() {
  return (
    <div className="bg-mist text-grove text-sm font-semibold text-center py-2 px-4">
      Demo mode · nothing is saved.{" "}
      <button onClick={goLive} className="underline underline-offset-2">
        Exit demo
      </button>
    </div>
  );
}

export default function App() {
  const store = useStore();
  const { mode, user, me } = store;

  if (user === undefined) return <Splash />;
  if (user === null)
    return (
      <>
        {mode === "demo" && <DemoBanner />}
        <SignIn onDemo={mode === "demo" ? null : goDemo} />
      </>
    );
  if (me === undefined) return <Splash />;
  if (me === null)
    return (
      <>
        <Splash />
        <ProfileForm
          firstTime
          initial={{ name: user.displayName, photoURL: user.photoURL }}
          onSave={store.saveProfile}
          onSignOut={store.signOut}
        />
      </>
    );
  return <Main />;
}

function Main() {
  const store = useStore();
  const { me, acts, actsReady, mode } = store;
  const [tab, setTab] = useState("explore");
  const [cat, setCat] = useState("All");
  // Открыли ссылку /?a=<id> — сразу показываем эту активность (в том числе после входа).
  const [openId, setOpenId] = useState(pendingActivityId);
  useEffect(() => clearPendingActivity(), []);
  const [statsOpen, setStatsOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [personUid, setPersonUid] = useState(null);
  const [form, setForm] = useState(null); // { activity? } — создание или редактирование
  const [editingProfile, setEditingProfile] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const now = useNow();

  const flash = useCallback((t) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const toggle = async (a) => {
    const leaving = isMember(a, me.uid);
    try {
      if (leaving) {
        await store.leave(a.id);
        if (chatId === a.id) setChatId(null);
        flash(`You left "${a.title}"`);
      } else {
        await store.join(a.id);
        setOpenId(null);
        setChatId(a.id);
        flash("You're in. Say hi to the group.");
      }
    } catch (e) {
      flash(e.message || "Something went wrong");
    }
  };

  const toggleWait = async (a) => {
    try {
      if (isWaiting(a, me.uid)) {
        await store.leaveWaitlist(a.id);
        flash("You left the waitlist");
      } else {
        await store.joinWaitlist(a.id);
        flash(`You're on the waitlist (#${(a.waitUids?.length || 0) + 1}). We'll add you if a spot opens.`);
      }
    } catch (e) {
      flash(e.message || "Something went wrong");
    }
  };

  const submitActivity = async (data) => {
    if (form?.activity) {
      await store.updateActivity(form.activity.id, data);
      flash("Changes saved");
    } else {
      await store.createActivity(data);
      setCat("All");
      flash("Published. People can join now.");
    }
    setForm(null);
  };

  const deleteActivity = async (a) => {
    try {
      await store.deleteActivity(a.id);
      setConfirmDelete(null);
      setOpenId(null);
      setChatId(null);
      flash("Activity deleted");
    } catch (e) {
      flash(e.message || "Couldn't delete");
    }
  };

  const groups = useMemo(() => {
    // Активности заблокированных людей не показываем (кроме тех, где ты уже участник).
    const list = acts.filter(
      (a) =>
        a.at > now - FEED_GRACE_MS &&
        (cat === "All" || a.cat === cat) &&
        (!store.blocked.has(a.hostUid) || isMember(a, me.uid)),
    );
    const g = [];
    list.forEach((a) => {
      const label = dayLabel(a.at);
      const last = g[g.length - 1];
      if (last && last.label === label) last.items.push(a);
      else g.push({ label, items: [a] });
    });
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acts, cat, now, store.blocked]);

  const open = acts.find((a) => a.id === openId);
  const chat = acts.find((a) => a.id === chatId && isMember(a, me.uid));
  const chatCount = acts.filter((a) => isMember(a, me.uid)).length;
  const unreadCount = store.unread.size;

  return (
    <div className="min-h-dvh pb-24 bg-white text-ink">
      {mode === "demo" && <DemoBanner />}
      <OfflineBar />
      <header className="max-w-3xl mx-auto px-4 md:px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CiuMark size={40} />
            <h1 className="text-3xl font-extrabold tracking-tight">hangout</h1>
          </div>
          {tab === "explore" && (
            <button onClick={() => setForm({})} className="font-bold px-4 py-2.5 rounded-full shrink-0 bg-tangerine text-ink">
              Create
            </button>
          )}
        </div>
        {tab === "explore" && (
          <>
            <p className="mt-2 text-muted">What CIU students are doing. Join in or start something.</p>
            <InstallBanner />
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none]">
              {["All", ...CATS].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${
                    cat === c ? "bg-grove text-white border-grove" : "border-line text-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
        {tab === "chats" && <h2 className="mt-5 text-xl font-extrabold">Group chats</h2>}
        {tab === "map" && <h2 className="mt-5 text-xl font-extrabold">Campus map</h2>}
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6">
        {tab === "explore" &&
          (!actsReady ? (
            <p className="py-16 text-center text-muted">Loading…</p>
          ) : groups.length === 0 ? (
            <EmptyState
              title="Nothing planned here yet."
              text="Start the first one, people usually join within the hour."
              action="Create an activity"
              onAction={() => setForm({})}
            />
          ) : (
            groups.map((g) => (
              <section key={g.label} className="mt-7">
                <h2 className="text-sm font-bold pb-2 border-b-2 border-ink text-grove">{g.label}</h2>
                {g.items.map((a) => (
                  <ActivityRow key={a.id} a={a} onOpen={setOpenId} onToggle={toggle} onWait={toggleWait} />
                ))}
              </section>
            ))
          ))}
        {tab === "map" && <MapTab onOpen={setOpenId} onCreateAt={(place) => setForm({ place })} flash={flash} />}
        {tab === "chats" && <ChatsTab onChat={setChatId} goExplore={() => setTab("explore")} />}
        {tab === "profile" && (
          <ProfileTab
            onOpen={setOpenId}
            onEdit={() => setEditingProfile(true)}
            onSignOut={async () => {
              await store.signOut();
            }}
            onAdminOpen={({ person, activity }) => (person ? setPersonUid(person) : setOpenId(activity))}
            onDeleteActivity={setConfirmDelete}
            onStats={() => setStatsOpen(true)}
            flash={flash}
          />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 border-t border-line z-40 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto grid grid-cols-4">
          {[
            ["explore", "Activities"],
            ["map", "Map"],
            [
              "chats",
              <span key="c" className="inline-flex items-center gap-1.5">
                {unreadCount ? "Chats" : `Chats${chatCount ? ` (${chatCount})` : ""}`}
                {unreadCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-tangerine text-ink text-xs leading-5 tabular" aria-label={`${unreadCount} unread`}>
                    {unreadCount}
                  </span>
                )}
              </span>,
            ],
            ["profile", "Profile"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                window.scrollTo(0, 0);
              }}
              className={`py-4 text-sm font-bold border-t-4 ${tab === id ? "border-tangerine text-ink" : "border-transparent text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {open && (
        <ActivityDetail
          a={open}
          onClose={() => setOpenId(null)}
          onToggle={toggle}
          onWait={toggleWait}
          onChat={(id) => {
            setOpenId(null);
            setChatId(id);
          }}
          onPerson={setPersonUid}
          onEdit={(a) => {
            setOpenId(null);
            setForm({ activity: a });
          }}
          onDelete={setConfirmDelete}
          onReport={setReportTarget}
          flash={flash}
        />
      )}
      {openId && actsReady && !open && (
        <Sheet onClose={() => setOpenId(null)} label="Not available">
          <h2 className="text-2xl font-extrabold pr-10">This activity isn't available</h2>
          <p className="mt-2 text-muted">It may have ended or been removed by the host.</p>
          <button onClick={() => setOpenId(null)} className="mt-5 w-full font-bold py-3 rounded-full bg-ink text-white">
            See what's on
          </button>
        </Sheet>
      )}
      {statsOpen && <StatsSheet onClose={() => setStatsOpen(false)} />}
      {chat && <ChatScreen a={chat} onClose={() => setChatId(null)} onPerson={setPersonUid} flash={flash} />}
      {personUid && <PersonCard uid={personUid} onClose={() => setPersonUid(null)} onReport={setReportTarget} flash={flash} />}
      {form && <ActivityForm initial={form.activity} presetPlace={form.place} onClose={() => setForm(null)} onSubmit={submitActivity} />}
      {editingProfile && (
        <ProfileForm
          initial={me}
          onClose={() => setEditingProfile(false)}
          onSave={async (p, sid) => {
            await store.saveProfile(p, sid);
            setEditingProfile(false);
            flash("Profile saved");
          }}
        />
      )}
      {reportTarget && (
        <ReportSheet
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onSubmit={async (r) => {
            await store.report(r);
            setReportTarget(null);
            if (r.type === "activity") setOpenId(null);
            else setPersonUid(null);
            flash("Thanks. We'll take a look.");
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmSheet
          title="Delete this activity?"
          text={`"${confirmDelete.title}" and its group chat will be removed for everyone.`}
          action="Delete"
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => deleteActivity(confirmDelete)}
        />
      )}
      {toast && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-3 rounded-full font-semibold z-[60] text-sm bg-ink text-white max-w-[90vw] text-center"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
