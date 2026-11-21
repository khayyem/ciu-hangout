import { activityUrl } from "./share";

const DURATION = 2 * 3600_000; // длительность по умолчанию — у активностей нет времени окончания

const utc = (t) => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
// Экранирование текста для iCalendar (RFC 5545)
const esc = (s = "") => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function icsText(a) {
  const url = activityUrl(a.id);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CIU Hangout//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${a.id}@ciu-hangout`,
    `DTSTAMP:${utc(Date.now())}`,
    `DTSTART:${utc(a.at)}`,
    `DTEND:${utc(a.at + DURATION)}`,
    `SUMMARY:${esc(a.title)}`,
    `LOCATION:${esc(a.place)}`,
    `DESCRIPTION:${esc(`${a.desc ? `${a.desc}\n\n` : ""}Group chat on CIU Hangout: ${url}`)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(a.title)} starts in 1 hour`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// iPhone открывает .ics в «Календаре» с кнопкой «Добавить», Android/компьютер — скачивает файл.
export function downloadIcs(a) {
  const blob = new Blob([icsText(a)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${a.title.replace(/[^\w\s-]/g, "").trim().slice(0, 40) || "activity"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function googleCalendarUrl(a) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: a.title,
    dates: `${utc(a.at)}/${utc(a.at + DURATION)}`,
    location: a.place,
    details: `${a.desc ? `${a.desc}\n\n` : ""}Group chat on CIU Hangout: ${activityUrl(a.id)}`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
