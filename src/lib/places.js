// Места на кампусе CIU (Haspolat, Lefkoşa). Только названия, подтверждённые
// на официальном сайте ciu.edu.tr: раздел Accommodation (общежития), CIU Arena
// Facilities (спорт), Campus Services (еда), Library. Rectorate Building — из
// приглашения Software Department (RO103). Что-то не из списка — «Somewhere else».
export const CAMPUS_PLACES = [
  {
    group: "Sports · CIU Arena",
    places: [
      "CIU Arena",
      "CIU Arena · Football pitches",
      "CIU Arena · Basketball courts",
      "CIU Arena · Tennis courts",
      "CIU Arena · Squash courts",
      "CIU Arena · Swimming pool",
      "CIU Arena · Fitness center",
      "CIU Arena · Climbing wall",
      "CIU Arena · Jogging track",
      "CIU Arena · Beach volleyball court",
    ],
  },
  {
    group: "Food",
    places: ["Lake View dining hall", "Break Point Cafe (Student Union)", "Molto supermarket"],
  },
  {
    group: "Study and campus",
    places: ["CIU Library", "Student Union building", "Rectorate Building"],
  },
  {
    group: "Dormitories",
    places: ["Kantara Dormitory", "Lambusa Dormitory", "Soli Dormitory", "Vuni Dormitory", "Hilarion Dormitory"],
  },
];

const ALL = new Set(CAMPUS_PLACES.flatMap((g) => g.places));
export const isCampusPlace = (p) => ALL.has(p);

// Id документа места в Firestore (places/{slug}).
export const placeSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

// Ссылка в Google Maps: по точным координатам, если модератор их поставил, иначе поиском.
export function mapUrl(place, coords) {
  if (coords) return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  const q = isCampusPlace(place) ? `${place.replace(" · ", " ")}, Cyprus International University, Nicosia` : `${place}, North Cyprus`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
