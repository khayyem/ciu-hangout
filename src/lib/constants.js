export const CATS = ["Sports", "Food", "Study", "Games", "Trips", "Chill"];

export const DEPTS = [
  "Computer Engineering", "Software Engineering", "Electrical Engineering", "Civil Engineering",
  "Architecture", "Business Administration", "Economics", "Psychology", "Law", "Medicine",
  "Dentistry", "Pharmacy", "Nursing", "Other",
];

export const YEARS = ["Prep school", "1st year", "2nd year", "3rd year", "4th year", "5th year+", "Master's", "PhD"];

export const AVATAR_COLORS = ["#0E6B56", "#FF7A1A", "#3B5BDB", "#9C36B5", "#C2255C", "#5C940D", "#E67700"];

export const MAX_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20];

export const REPORT_REASONS = ["Spam or scam", "Offensive or harassing", "Not a CIU student", "Unsafe activity", "Something else"];

// Активности показываются в ленте до 2 часов после начала, потом скрываются.
export const FEED_GRACE_MS = 2 * 3600_000;
// Чаты прошедших активностей ещё неделю доступны во вкладке Chats.
export const HISTORY_MS = 7 * 86_400_000;
