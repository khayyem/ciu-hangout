// Стартовые активности, чтобы лента не была пустой в первые дни.
// Модератор добавляет их от своего имени (он хост) и может убрать одной кнопкой.
const STARTERS = [
  { day: 0, time: [18, 30], title: "Pickup football, all levels", cat: "Sports", place: "CIU Arena · Football pitches", max: 12, desc: "Casual game, we split into teams on the spot. Bring water." },
  { day: 1, time: [16, 0], title: "Study group: past midterm questions", cat: "Study", place: "CIU Library", max: 6, desc: "Bring the course and past papers you have, we go through them together." },
  { day: 1, time: [19, 0], title: "Basketball 3 on 3", cat: "Sports", place: "CIU Arena · Basketball courts", max: 6, desc: "Quick games to 11. Any level." },
  { day: 2, time: [12, 30], title: "Lunch together", cat: "Food", place: "Lake View dining hall", max: 8, desc: "Meet new people over lunch." },
  { day: 2, time: [15, 0], title: "Coffee for new students", cat: "Chill", place: "Break Point Cafe (Student Union)", max: 10, desc: "First semester at CIU? Come say hi, ask anything about campus." },
  { day: 3, time: [19, 30], title: "Board games night", cat: "Games", place: "Student Union building", max: 8, desc: "Codenames, UNO, cards. Bring your favourite game." },
  { day: 4, time: [17, 0], title: "Try the climbing wall", cat: "Sports", place: "CIU Arena · Climbing wall", max: 6, desc: "First time is fine, staff explain the basics." },
  { day: 5, time: [10, 30], title: "Day trip to Kyrenia harbour", cat: "Trips", place: "Kyrenia harbour (bus from campus)", max: 10, desc: "Walk around the harbour and the castle, lunch by the sea. We agree on the bus time in the chat." },
];

export const STARTER_TITLES = new Set(STARTERS.map((s) => s.title));

// Даты от «сегодня»; если время сегодня уже прошло — переносим на завтра.
export function starterActivities(now = Date.now()) {
  return STARTERS.map(({ day, time, ...rest }) => {
    const d = new Date(now);
    d.setDate(d.getDate() + day);
    d.setHours(time[0], time[1], 0, 0);
    if (d.getTime() < now + 30 * 60_000) d.setDate(d.getDate() + 1);
    return { ...rest, at: d.getTime() };
  });
}
