// Плитки категорий с иллюстрациями: у каждой свой мягкий фон из «цитрусовой» палитры,
// рисунки — плоские SVG в тех же цветах (grove, tangerine, ink) с парой оттенков.

const INK = "#15171A";
const GROVE = "#0E6B56";
const TANGERINE = "#FF7A1A";

function Ball() {
  // Баскетбольный мяч
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="34" r="24" fill={TANGERINE} />
      <path d="M14 22 A 26 26 0 0 0 18 54" fill="#E86A10" opacity=".5" />
      <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round">
        <circle cx="32" cy="34" r="24" />
        <path d="M8 34 H56" />
        <path d="M32 10 V58" />
        <path d="M15 17 C 24 26, 24 42, 15 51" />
        <path d="M49 17 C 40 26, 40 42, 49 51" />
      </g>
      <ellipse cx="24" cy="20" rx="6" ry="3.5" fill="#fff" opacity=".45" transform="rotate(-30 24 20)" />
    </svg>
  );
}

function Burger() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 30 C 10 14, 54 14, 54 30 Z" fill="#F4A340" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <g fill="#FFF3DC">
        <ellipse cx="24" cy="22" rx="1.6" ry="1" />
        <ellipse cx="33" cy="19" rx="1.6" ry="1" />
        <ellipse cx="41" cy="23" rx="1.6" ry="1" />
      </g>
      <path d="M8 33 Q 14 29 20 33 T 32 33 T 44 33 T 56 33 L 56 36 L 8 36 Z" fill="#5BB98C" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <rect x="9" y="36" width="46" height="8" rx="4" fill="#7A3E1D" stroke={INK} strokeWidth="2.4" />
      <path d="M10 47 H54 C 54 54, 48 56, 32 56 C 16 56, 10 54, 10 47 Z" fill="#F4A340" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

function Books() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g stroke={INK} strokeWidth="2.4" strokeLinejoin="round">
        <rect x="8" y="42" width="46" height="11" rx="2.5" fill={GROVE} />
        <rect x="13" y="31" width="42" height="11" rx="2.5" fill={TANGERINE} />
        <rect x="9" y="20" width="40" height="11" rx="2.5" fill="#4C6FD8" />
      </g>
      <g fill="#fff" opacity=".85">
        <rect x="12" y="46" width="30" height="2.5" rx="1.2" />
        <rect x="17" y="35" width="26" height="2.5" rx="1.2" />
        <rect x="13" y="24" width="24" height="2.5" rx="1.2" />
      </g>
      <path d="M40 8 L 52 13 L 40 18 L 28 13 Z" fill={INK} />
      <path d="M34 15.5 V 20 C 34 22, 46 22, 46 20 V 15.5" fill={INK} />
      <path d="M52 13 V 20" stroke={TANGERINE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Dice() {
  const dot = (cx, cy) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="2.6" fill={INK} />;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g transform="rotate(-12 22 36)">
        <rect x="6" y="20" width="30" height="30" rx="7" fill="#fff" stroke={INK} strokeWidth="2.4" />
        {[dot(14, 28), dot(21, 35), dot(28, 42)]}
      </g>
      <g transform="rotate(14 44 30)">
        <rect x="30" y="14" width="28" height="28" rx="7" fill={TANGERINE} stroke={INK} strokeWidth="2.4" />
        <g fill="#fff">
          <circle cx="37.5" cy="21.5" r="2.5" />
          <circle cx="50.5" cy="21.5" r="2.5" />
          <circle cx="37.5" cy="34.5" r="2.5" />
          <circle cx="50.5" cy="34.5" r="2.5" />
        </g>
      </g>
    </svg>
  );
}

function Mountain() {
  // Горы и солнце — поездки (Kyrenia, St. Hilarion)
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="44" cy="18" r="9" fill={TANGERINE} stroke={INK} strokeWidth="2.4" />
      <path d="M4 56 L 24 24 L 36 42 L 44 32 L 60 56 Z" fill={GROVE} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M24 24 L 30 33.5 L 26 31 L 22 34 L 19 32 Z" fill="#fff" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 56 L 14 40 L 22 50 L 28 44 L 36 56 Z" fill="#5BB98C" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

function Cup() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round">
        <path d="M24 8 C 20 12, 28 14, 24 19" />
        <path d="M33 6 C 29 10, 37 12, 33 17" />
      </g>
      <path d="M44 30 H 49 C 56 30, 56 42, 49 42 H 43" fill="none" stroke={INK} strokeWidth="3" />
      <path d="M12 24 H 46 L 43 46 C 42 52, 37 55, 31 55 H 27 C 21 55, 16 52, 15 46 Z" fill="#fff" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M14 30 H 44.2 L 43.6 34 H 14.6 Z" fill={GROVE} />
      <ellipse cx="29" cy="24" rx="17" ry="3.2" fill="#7A3E1D" stroke={INK} strokeWidth="2.4" />
      <path d="M6 57 H 54" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

const CATEGORY_STYLE = {
  Sports: { bg: "#E4F2EB", Art: Ball },
  Food: { bg: "#FDEBDC", Art: Burger },
  Study: { bg: "#E6ECF8", Art: Books },
  Games: { bg: "#F0E9F7", Art: Dice },
  Trips: { bg: "#F6EFD9", Art: Mountain },
  Chill: { bg: "#F9E5E2", Art: Cup },
};

export function CategoryTiles({ cats, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {cats.map((c) => {
        const { bg, Art } = CATEGORY_STYLE[c];
        const on = value === c;
        const dim = value !== "All" && !on;
        return (
          <button
            key={c}
            onClick={() => onChange(on ? "All" : c)}
            aria-pressed={on}
            className={`relative h-[84px] rounded-2xl overflow-hidden text-left p-3 flex items-start transition ${on ? "ring-2 ring-ink" : ""} ${dim ? "opacity-55" : ""}`}
            style={{ background: bg }}
          >
            <span className="relative z-10 font-bold text-[15px] leading-tight">{c}</span>
            <span className="absolute -right-1 -bottom-1.5 w-[58px] h-[58px] [&>svg]:w-full [&>svg]:h-full">
              <Art />
            </span>
          </button>
        );
      })}
    </div>
  );
}
