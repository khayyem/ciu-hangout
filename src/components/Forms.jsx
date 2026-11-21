import { useState } from "react";
import { CATS, DEPTS, MAX_OPTIONS, REPORT_REASONS, YEARS } from "../lib/constants";
import { firstName, toDateInput, toTimeInput } from "../lib/format";
import { resizeImage } from "../lib/image";
import { CAMPUS_PLACES, isCampusPlace } from "../lib/places";

const OTHER = "__other";
import { useNow } from "../lib/useNow";
import { Avatar, ErrorText, Field, Sheet, fieldClass } from "./ui";

function useForm(initial) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return [f, setF, set];
}

function SubmitButton({ busy, className, children }) {
  return (
    <button type="submit" disabled={busy} className={`mt-5 w-full font-bold py-3 rounded-full ${busy ? "opacity-60" : ""} ${className}`}>
      {busy ? "Saving…" : children}
    </button>
  );
}

export function ProfileForm({ initial, firstTime, onClose, onSave, onSignOut }) {
  const [f, setF, set] = useForm({
    name: initial?.name || "",
    sid: initial?.sid || "",
    dept: initial?.dept || "",
    year: initial?.year || "",
    bio: initial?.bio || "",
    photoURL: initial?.photoURL || null,
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const photoURL = await resizeImage(file);
      setF((p) => ({ ...p, photoURL }));
    } catch (x) {
      setErr(x.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const name = f.name.trim().replace(/\s+/g, " ");
    if (name.split(" ").length < 2) return setErr("Enter your first and last name.");
    if (name.length > 60) return setErr("That name is too long.");
    if (!/^\d{6,10}$/.test(f.sid.trim())) return setErr("Student ID should be 6–10 digits, as on your student card.");
    if (!f.dept) return setErr("Choose your department.");
    if (!f.year) return setErr("Choose your year.");
    setErr("");
    setBusy(true);
    try {
      await onSave(
        { name, short: firstName(name), dept: f.dept, year: f.year, bio: f.bio.trim().slice(0, 300), photoURL: f.photoURL || null },
        f.sid.trim(),
      );
    } catch (x) {
      setErr(x.message || "Couldn't save. Try again.");
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={onClose} label="Your profile">
      <form onSubmit={submit}>
        <h2 className="text-2xl font-extrabold pr-10">{firstTime ? "Set up your profile" : "Edit profile"}</h2>
        {firstTime && <p className="mt-1 text-muted">Only CIU students can join. Your student ID stays private.</p>}
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={f.name || "?"} photo={f.photoURL} size={64} ring={false} />
          <label className="text-sm font-bold px-4 py-2 rounded-full cursor-pointer bg-mist">
            {f.photoURL ? "Change photo" : "Add photo"}
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
          {f.photoURL && (
            <button type="button" onClick={() => setF((p) => ({ ...p, photoURL: null }))} className="text-sm font-semibold text-muted">
              Remove
            </button>
          )}
        </div>
        <div className="mt-4 space-y-3">
          <Field label="Full name">
            <input className={fieldClass} value={f.name} onChange={set("name")} placeholder="First and last name" autoComplete="name" />
          </Field>
          <Field label="Student ID">
            <input className={fieldClass} inputMode="numeric" value={f.sid} onChange={set("sid")} placeholder="From your student card" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <select className={fieldClass} value={f.dept} onChange={set("dept")}>
                <option value="">Choose</option>
                {DEPTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <select className={fieldClass} value={f.year} onChange={set("year")}>
                <option value="">Choose</option>
                {YEARS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="About you">
            <textarea rows={2} maxLength={300} className={fieldClass} value={f.bio} onChange={set("bio")} placeholder="What you're into, languages you speak" />
          </Field>
        </div>
        <ErrorText>{err}</ErrorText>
        <SubmitButton busy={busy} className="bg-ink text-white">
          {firstTime ? "Continue" : "Save changes"}
        </SubmitButton>
        {firstTime && onSignOut && (
          <button type="button" onClick={onSignOut} className="mt-3 w-full text-sm font-semibold text-muted">
            Use a different account
          </button>
        )}
      </form>
    </Sheet>
  );
}

export function ActivityForm({ initial, onClose, onSubmit }) {
  const today = toDateInput(useNow());
  const editing = !!initial;
  const [f, , set] = useForm(
    initial
      ? {
          title: initial.title,
          cat: initial.cat,
          date: toDateInput(initial.at),
          time: toTimeInput(initial.at),
          spot: isCampusPlace(initial.place) ? initial.place : OTHER,
          place: isCampusPlace(initial.place) ? "" : initial.place,
          max: String(initial.max || 0),
          desc: initial.desc,
        }
      : { title: "", cat: "Chill", date: today, time: "19:00", spot: "", place: "", max: "6", desc: "" },
  );
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const going = initial?.memberUids.length || 1;
  const maxOptions = MAX_OPTIONS.filter((n) => n >= going);
  if (initial?.max && !maxOptions.includes(initial.max)) maxOptions.push(initial.max);

  const submit = async (e) => {
    e.preventDefault();
    const title = f.title.trim();
    const place = f.spot === OTHER ? f.place.trim() : f.spot;
    if (!title) return setErr('Add a title, like "Football at 7".');
    if (title.length > 80) return setErr("Keep the title under 80 characters.");
    if (!place) return setErr(f.spot === OTHER ? "Type where people should meet." : "Choose where people should meet.");
    if (place.length > 120) return setErr("Keep the place under 120 characters.");
    const ts = new Date(`${f.date}T${f.time}`).getTime();
    if (!ts || ts < Date.now() - 5 * 60_000) return setErr("Pick a time that hasn't passed yet.");
    if (ts > Date.now() + 90 * 86_400_000) return setErr("Pick a date within the next 3 months.");
    setErr("");
    setBusy(true);
    try {
      await onSubmit({ title, cat: f.cat, at: ts, place, max: Number(f.max) || 0, desc: f.desc.trim().slice(0, 1000) });
    } catch (x) {
      setErr(x.message || "Couldn't save. Try again.");
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={onClose} label={editing ? "Edit activity" : "Create an activity"}>
      <form onSubmit={submit}>
        <h2 className="text-2xl font-extrabold pr-10">{editing ? "Edit activity" : "Create an activity"}</h2>
        <div className="mt-4 space-y-3">
          <Field label="What are you doing?">
            <input className={fieldClass} value={f.title} onChange={set("title")} maxLength={80} placeholder="e.g. Basketball, sushi night, study for finals" />
          </Field>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => set("cat")({ target: { value: c } })}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${f.cat === c ? "bg-ink text-white border-ink" : "border-line text-ink"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" min={today} className={fieldClass} value={f.date} onChange={set("date")} />
            </Field>
            <Field label="Time">
              <input type="time" className={fieldClass} value={f.time} onChange={set("time")} />
            </Field>
          </div>
          <Field label="Where">
            <select className={fieldClass} value={f.spot} onChange={set("spot")}>
              <option value="">Choose a place</option>
              {CAMPUS_PLACES.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.places.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={OTHER}>Somewhere else…</option>
            </select>
          </Field>
          {f.spot === OTHER && (
            <input
              className={fieldClass}
              value={f.place}
              onChange={set("place")}
              maxLength={120}
              placeholder="e.g. Kyrenia harbour, a café in Lefkoşa"
              aria-label="Place"
              autoFocus
            />
          )}
          <Field label="How many people, including you">
            <select className={fieldClass} value={f.max} onChange={set("max")}>
              {maxOptions.sort((a, b) => a - b).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="0">No limit</option>
            </select>
          </Field>
          <Field label="Details">
            <textarea rows={3} maxLength={1000} className={fieldClass} value={f.desc} onChange={set("desc")} placeholder="What to bring, cost, level" />
          </Field>
        </div>
        <ErrorText>{err}</ErrorText>
        <SubmitButton busy={busy} className="bg-tangerine text-ink">
          {editing ? "Save changes" : "Publish activity"}
        </SubmitButton>
      </form>
    </Sheet>
  );
}

export function ReportSheet({ target, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return setErr("Choose a reason.");
    setBusy(true);
    try {
      await onSubmit({ ...target, reason, details: details.trim().slice(0, 500) });
    } catch (x) {
      setErr(x.message || "Couldn't send. Try again.");
      setBusy(false);
    }
  };
  return (
    <Sheet onClose={onClose} label="Report">
      <form onSubmit={submit}>
        <h2 className="text-2xl font-extrabold pr-10">Report {target.type === "user" ? "this person" : "this activity"}</h2>
        <p className="mt-1 text-muted break-words">{target.targetTitle}. The CIU Hangout team will review it. They won't know who reported.</p>
        <div className="mt-4 flex flex-col gap-2">
          {REPORT_REASONS.map((r) => (
            <label key={r} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer ${reason === r ? "border-ink" : "border-line"}`}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-grove" />
              <span className="font-semibold">{r}</span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <Field label="Anything else? (optional)">
            <textarea rows={2} maxLength={500} className={fieldClass} value={details} onChange={(e) => setDetails(e.target.value)} />
          </Field>
        </div>
        <ErrorText>{err}</ErrorText>
        <SubmitButton busy={busy} className="bg-ink text-white">
          Send report
        </SubmitButton>
      </form>
    </Sheet>
  );
}

export function ConfirmSheet({ title, text, action, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet onClose={onClose} label={title}>
      <h2 className="text-2xl font-extrabold pr-10">{title}</h2>
      {text && <p className="mt-2 text-muted">{text}</p>}
      <div className="mt-5 flex gap-3">
        <button onClick={onClose} className="flex-1 font-bold py-3 rounded-full bg-mist">
          Cancel
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
            }
          }}
          className={`flex-1 font-bold py-3 rounded-full bg-danger text-white ${busy ? "opacity-60" : ""}`}
        >
          {action}
        </button>
      </div>
    </Sheet>
  );
}
