import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useStore } from "../data/store";
import { CAMPUS_PLACES } from "../lib/places";
import { FEED_GRACE_MS } from "../lib/constants";
import { dayLabel, hhmm } from "../lib/format";
import { useNow } from "../lib/useNow";
import { TimeBadge } from "./Activity";

// Стартовый вид — посёлок Haspolat, где находится кампус (35.2049, 33.4215, Wikipedia).
// Это только примерная область: точные точки мест ставит модератор, и карта сразу
// подстраивается под них.
const START = [35.2049, 33.4215];
const START_ZOOM = 14;

const ALL_PLACES = CAMPUS_PLACES.flatMap((g) => g.places);

function pinIcon({ count, selected, pending }) {
  const size = count ? 34 : 18;
  const bg = pending ? "#FF7A1A" : count ? "#0E6B56" : "#FFFFFF";
  const fg = count ? "#FFFFFF" : "#0E6B56";
  const ring = selected ? "0 0 0 4px rgba(255,122,26,.55)" : "0 0 0 2px #FFFFFF";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${bg};color:${fg};border:2px solid #0E6B56;box-shadow:${ring};display:flex;align-items:center;justify-content:center;font:800 14px 'Schibsted Grotesk',system-ui,sans-serif">${count || ""}</div>`,
  });
}

export function MapTab({ onOpen, onCreateAt, flash }) {
  const { acts, places, isAdmin, savePlace, clearPlace } = useStore();
  const now = useNow();
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const framed = useRef(false);
  const [selected, setSelected] = useState(null);
  // Режим модератора: какое место сейчас ставим и куда (до сохранения).
  const [editing, setEditing] = useState(false);
  const [editPlace, setEditPlace] = useState(ALL_PLACES[0]);
  const [pending, setPending] = useState(null);
  const editRef = useRef(false);
  useEffect(() => {
    editRef.current = editing;
  }, [editing]);

  // Ближайшие активности, сгруппированные по месту (только места кампуса с координатами).
  const byPlace = useMemo(() => {
    const m = {};
    acts
      .filter((a) => a.at > now - FEED_GRACE_MS)
      .forEach((a) => {
        if (places[a.place]) (m[a.place] ||= []).push(a);
      });
    return m;
  }, [acts, places, now]);
  const offMap = acts.filter((a) => a.at > now - FEED_GRACE_MS && !places[a.place]).length;

  // Создаём карту один раз.
  useEffect(() => {
    const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView(START, START_ZOOM);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    L.control.zoom({ position: "topright" }).addTo(m);
    m.on("click", (e) => {
      if (editRef.current) setPending({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) });
      else setSelected(null);
    });
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      framed.current = false;
    };
  }, []);

  // Точки мест и активностей.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layer.current.clearLayers();
    Object.entries(places).forEach(([name, c]) => {
      const count = byPlace[name]?.length || 0;
      L.marker([c.lat, c.lng], { icon: pinIcon({ count, selected: selected === name }), title: name, keyboard: true })
        .on("click", () => setSelected(name))
        .bindTooltip(name, { direction: "top", offset: [0, -14] })
        .addTo(layer.current);
    });
    if (pending) L.marker([pending.lat, pending.lng], { icon: pinIcon({ count: 0, pending: true }) }).addTo(layer.current);
    // Один раз подгоняем вид под расставленные места.
    const pts = Object.values(places).map((c) => [c.lat, c.lng]);
    if (!framed.current && pts.length) {
      framed.current = true;
      if (pts.length === 1) m.setView(pts[0], 17);
      else m.fitBounds(pts, { padding: [40, 40], maxZoom: 17 });
    }
  }, [places, byPlace, selected, pending]);

  const locate = (forEdit) => {
    if (!navigator.geolocation) return flash("Location isn't available on this device");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) };
        map.current?.setView([p.lat, p.lng], 18);
        if (forEdit) setPending(p);
      },
      () => flash("Couldn't get your location. Check location permission."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const savePending = async () => {
    try {
      await savePlace(editPlace, pending.lat, pending.lng);
      flash(`Saved: ${editPlace}`);
      setPending(null);
      const next = ALL_PLACES.find((p) => !places[p] && p !== editPlace);
      if (next) setEditPlace(next);
    } catch (e) {
      flash(e.message || "Couldn't save");
    }
  };

  const here = selected ? byPlace[selected] || [] : [];
  const setCount = ALL_PLACES.filter((p) => places[p]).length;

  return (
    <div className="mt-4">
      <div className="relative">
        <div ref={box} className="h-[52dvh] min-h-[280px] rounded-2xl overflow-hidden border border-line z-0" aria-label="Campus map" />
        <button onClick={() => locate(false)} className="absolute top-3 left-3 z-[400] px-3 py-1.5 rounded-full bg-white border border-line text-sm font-bold">
          Where am I
        </button>
        {setCount === 0 && !editing && (
          <div className="absolute inset-x-3 bottom-3 z-[400] p-3 rounded-2xl bg-white border border-line text-sm">
            <span className="font-bold">Campus places aren't on the map yet.</span>{" "}
            {isAdmin ? "Use Set places on the map below to pin them." : "They'll appear here soon."}
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-4 p-4 rounded-2xl border border-line">
          <div className="font-bold">Set places · {setCount} of {ALL_PLACES.length} pinned</div>
          <p className="mt-1 text-sm text-muted">Choose a place, then tap where it is on the map, or stand there and use your location.</p>
          <select
            className="w-full mt-3 px-3 py-2.5 rounded-xl border border-line bg-white text-base"
            value={editPlace}
            onChange={(e) => {
              setEditPlace(e.target.value);
              setPending(null);
              const c = places[e.target.value];
              if (c) map.current?.setView([c.lat, c.lng], 18);
            }}
          >
            {CAMPUS_PLACES.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.places.map((p) => (
                  <option key={p} value={p}>
                    {places[p] ? "✓ " : ""}
                    {p}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
            <button onClick={() => locate(true)} className="px-4 py-2 rounded-full bg-mist">
              Use my location
            </button>
            <button onClick={savePending} disabled={!pending} className={`px-4 py-2 rounded-full bg-tangerine text-ink ${pending ? "" : "opacity-40"}`}>
              Save pin
            </button>
            {places[editPlace] && (
              <button onClick={() => clearPlace(editPlace)} className="px-4 py-2 rounded-full bg-mist text-danger">
                Remove pin
              </button>
            )}
            <button
              onClick={() => {
                setEditing(false);
                setPending(null);
              }}
              className="px-4 py-2 rounded-full bg-ink text-white ml-auto"
            >
              Done
            </button>
          </div>
        </div>
      ) : selected ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-extrabold text-lg break-words">{selected}</h2>
            <button onClick={() => setSelected(null)} className="text-sm font-semibold text-muted shrink-0">
              Close
            </button>
          </div>
          {here.length === 0 ? (
            <div className="mt-1">
              <p className="text-sm text-muted">Nothing planned here yet.</p>
              <button onClick={() => onCreateAt(selected)} className="mt-3 font-bold px-5 py-2.5 rounded-full bg-tangerine text-ink">
                Create something here
              </button>
            </div>
          ) : (
            here.map((a) => (
              <button key={a.id} onClick={() => onOpen(a.id)} className="w-full text-left flex gap-3 py-3 border-b border-line">
                <span className="font-extrabold w-16 shrink-0 tabular">{hhmm(a.at)}</span>
                <span className="flex-1 min-w-0">
                  <TimeBadge a={a} />
                  <span className="font-semibold block truncate">{a.title}</span>
                  <span className="text-sm text-muted">
                    {dayLabel(a.at)} · {a.memberUids.length} going
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Tap a green pin to see what's on there.
          {offMap ? ` ${offMap} ${offMap === 1 ? "activity is" : "activities are"} off campus or not pinned yet.` : ""}
        </p>
      )}

      {isAdmin && !editing && (
        <button onClick={() => setEditing(true)} className="mt-4 w-full font-bold py-3 rounded-full bg-mist">
          Set places on the map
        </button>
      )}
    </div>
  );
}
