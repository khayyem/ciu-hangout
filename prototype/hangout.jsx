import { useState, useMemo, useEffect, useRef } from "react";

// Палитра: цитрусовые рощи Кипра — зелень листвы и мандарин
const C = {
  ink: "#15171A",
  grove: "#0E6B56",
  tangerine: "#FF7A1A",
  mist: "#EEF5F2",
  line: "#E2E6E4",
  muted: "#666C6A",
  white: "#FFFFFF",
  danger: "#B42318",
};
const FONT = "'Schibsted Grotesk', system-ui, sans-serif";
const CATS = ["Sports", "Food", "Study", "Games", "Trips", "Chill"];
const AVA = ["#0E6B56", "#FF7A1A", "#3B5BDB", "#9C36B5", "#C2255C", "#5C940D", "#E67700"];
const DEPTS = ["Computer Engineering", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Architecture", "Business Administration", "Economics", "Psychology", "Law", "Medicine", "Dentistry", "Pharmacy", "Nursing", "Other"];
const YEARS = ["Prep school", "1st year", "2nd year", "3rd year", "4th year", "5th year+", "Master's", "PhD"];

// Профили других студентов (в реальной версии — из Firestore)
const PEOPLE = {
  Tunde: { dept: "Civil Engineering", year: "3rd year", bio: "Football every evening if the weather allows." },
  Omar: { dept: "Business Administration", year: "2nd year", bio: "" },
  Reza: { dept: "Computer Engineering", year: "4th year", bio: "Ask me about C++." },
  Bilal: { dept: "Pharmacy", year: "2nd year", bio: "" },
  Arda: { dept: "Architecture", year: "3rd year", bio: "Hiking and photography." },
  Musa: { dept: "Electrical Engineering", year: "1st year", bio: "" },
  Kemal: { dept: "Law", year: "2nd year", bio: "" },
  Leyla: { dept: "Computer Engineering", year: "2nd year", bio: "Library regular." },
  Sara: { dept: "Psychology", year: "1st year", bio: "" },
  Elif: { dept: "Economics", year: "3rd year", bio: "I know every good kebab place in Lefkoşa." },
  Amaka: { dept: "Medicine", year: "2nd year", bio: "" },
  Daniel: { dept: "Software Engineering", year: "3rd year", bio: "Board games collector." },
  Zara: { dept: "Nursing", year: "4th year", bio: "Beach > everything." },
  Aisha: { dept: "Dentistry", year: "1st year", bio: "" },
};

const DAY = 86_400_000;
const at = (dayOffset, hh, mm = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
};
const minsAgo = (m) => Date.now() - m * 60_000;

const SEED = [
  { id: 1, title: "5-a-side football", cat: "Sports", at: at(0, 19, 30), place: "CIU pitch behind the sports hall", max: 10, desc: "Casual game, all levels. Bring water. We split into teams on the spot.", host: "Tunde", going: ["Tunde", "Omar", "Reza", "Bilal", "Arda", "Musa", "Kemal"], chat: [{ who: "Tunde", text: "Pitch is booked till 21:00", t: minsAgo(90) }, { who: "Omar", text: "I'll bring a second ball", t: minsAgo(40) }] },
  { id: 2, title: "Late-night study for CMPE 211", cat: "Study", at: at(0, 21, 0), place: "Library, 2nd floor group room", max: 6, desc: "Going through past midterm questions together.", host: "Leyla", going: ["Leyla", "Sara"], chat: [{ who: "Leyla", text: "Bring the 2024 midterm if you have it", t: minsAgo(120) }] },
  { id: 3, title: "Hellim and kebab in Lefkoşa old town", cat: "Food", at: at(1, 20, 0), place: "Meet at the main gate, shared taxi", max: 5, desc: "Dinner at a local place near Büyük Han. Around 400 TL each.", host: "Elif", going: ["Elif", "Amaka", "Daniel"], chat: [] },
  { id: 4, title: "Board games night", cat: "Games", at: at(1, 18, 30), place: "Dorm B common room", max: 8, desc: "Catan, Codenames and UNO. Snacks welcome.", host: "Daniel", going: ["Daniel", "Sara", "Aisha"], chat: [] },
  { id: 5, title: "Sunrise hike to St. Hilarion", cat: "Trips", at: at(3, 5, 30), place: "Main gate, two cars", max: 7, desc: "About 2 hours up and back. Wear proper shoes, it's rocky.", host: "Arda", going: ["Arda", "Musa"], chat: [] },
  { id: 6, title: "Beach day in Kyrenia", cat: "Chill", at: at(4, 11, 0), place: "Bus stop near the dorms", max: 0, desc: "Escape Beach. Bus there, figure out the way back together.", host: "Zara", going: ["Zara", "Aisha", "Omar", "Leyla", "Kemal"], chat: [] },
];

const hhmm = (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayLabel = (t) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const diff = Math.floor((t - start.getTime()) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return new Date(t).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
};
const colorOf = (name) => AVA[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVA.length];
const first = (full) => full.trim().split(/\s+/)[0];

// Официальный логотип: положи файл от университета в /public и укажи путь, например "/ciu-logo.png".
// Пока путь пустой, показывается текстовый значок.
const CIU_LOGO_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJoAAADICAYAAAAQufjrAABRTElEQVR42u1dZ3hU1dZea+9zpqYCCR0E6aEoQcVGEgVRUZEy41WvXYOKXVE/28lYrh27XmIv1zIjxYIKCklQEDFIkwDSOwRInX723uv7MQkEsFBSNft5lIcU5px93rPKu9d6F0Dz+t1FhsEAAMK//dIn/Pn7M4nIQgCMiLB5dw5/seYt+AvAdT8+LL//dFjgyeueQs2mICeTAzZjrRlotbXS0hAAgJdWdoRIUDqL5t5a+e7Td6CnQNBDD2nNG9QMtNpZKSkIAIDLf2jhQMkrineFnT988Kx/+sdXoccjyDCawda8asFlZmRoAACBZ24bT5d2o9Ix3aIV57WRkbtHmuVLlgwGAKC8ZrA1W7SjXZkFioiY3LTkajMUAQRg0hpH6reFXH/z9ncrf/yxNWZ5RHXS0LyagXb41szr4ugBFZn2/oj4QOnxAckkAHAE4iFmVZata3rw2W/PIqJUyM9vzkSbgXYEICNC8AEQkU0uy3sqUlqCoOkIQAAAwBnyCsWF/de8NP/EO97HgrkCcjI5ATSDrRloh7Hyczj6fDL03rM3OtYt7BWUILHGPhERMM618lDUtP38+Vn+J667Gz0FAjIyePPmNQPtEF2ml2OWRwSX/XIKmz/14cqSPRJ1K6u2ZjXMHpBm0UNhIZzrCp8sf/vJCVhQIMjIaE4O/mA1m/uaLhMRgIiHHr5qsb40L60SdMWA/vBlJGTEQpXKeUwPHv7XQ+fGnT70a8ozNMzyiOYdbbZov7sW5o7T0B5HgWdu/Ni67Lu0SuLiz0AGAICkUNrjWXjTaqVNfuLD8uXLu2OWR5DX2+xGm4H2O5YpO1sfNC7X9L+Wc59z5fwxFSYTjLFDcoOMFEYtTqANK5Ks/3toZqg01AXdbtlMezQD7WAqIzfXDLz/1Chr/rs5lbt3C9CtHIgOYxOJhZhNaqsWHENvTJhBRMlQVIREzWCrXv9oE0+GoeFNr8rAD7MusMx6b0po60YuLA7GSB127MoYsrAEM750Y4p/8Y9J1tc++SITgL9bsFE1w+wfbNHyDENDj0eEt+3uzaf/1xda8ysKq5OOBGR7aQ9N18srQ2bcpiXj/B88b2R55givy9Ucr/1Ts04iYoioiMgRuG3oLH3TysEBtEuGdNSgIGTEI0Fl7d4XYfyrx1uPPXYpGQZDj0cdlEsYBv7O15st2t/EXVaDzB42Lv7KsXPD4ADYagVk1Zmo0G2gb1rBzI/+83/IdYCiIvxdTHo8yviHPIN/FNCICMHjASKyRp+/4zPbbwsyysPSZBxr1b0xxlhlVCm+bc1oteKXY9Hn25uFGlV/Lpzy+cnLpn51vgdAERFrBtrfCWQ5mRyIKPj6I5MthdOHlYalQE3TDyfDPLQPU6i4rmyVuyzhudOvq7nXHo+HAAB2bl6/fFXB3Fd/mjK9ByKqvzsd8o85MlnuTtP7+oqiFeKSG+I3LxlR5g8Lplu0WgfZXh/KUEXCJLdvGAi6BQBA7fXeYLDz77274q1zL/1tjfeLb4ioew4iERAiIP0d9/8fYdEKs7P1vr6iaPnLD1xt37ri1fLyComHyZUdif8MBkMIUgykaCQFPZ69Vqtd9nYuQxFwduk4PbJkTZePrrvjCY/GVG72uL/ti/+3BxoZGdqg3FzTP/WNK+N+nflmsGS3JN3O4AhpjMNI51ESAZrhlgCQUPN7PS6+mAAAOqYPsISsoCoWrbhr5lMv3TUuN9eclD1JbwZaUwNZnqGhp0AEFhWOcvww+W3/5o1SWuwM6xhkB1wFQHj/r2Tu2kUAAC1SU7Yxp4Pt3LTZXPXBZ/flvf32ceNyx5l/x3jtbwu06pKf0h9/PIZ98OBbwdVLlLInIKsnkBEAMUQgrvvBdgDUXC4FAFCuwvnhaCSiOezcv7skecuM+bPCRL1yPB7w/s0O5v+WQCPDYOh2y/It5S2dk/8zma9dkhTVHYSk6u9+iciqa6AkrQSAHQAAkJNDVX8iAIA9Ls7KOEdSxJTOzZ0/Lm7xefZdb3ksunK73Yrg71Mi/rcDGhFhTowrS9beHP+tvrlooJ/ZJQOqXwtBSlmsNmKpHbYjY5KMDA0xllHmZ2YyAAA9ok63aZpFkZLImB5hUmyZNe/kLyZ4Xici+DslB+zvBjLIyeQ5RBh65X6vY+WPx5dEpOAM69kNIZCUCI545KkdvwQiyIfMvd/97bffEACgYsfu1hQxARlToBQwTdcC0ZDY88PCa2dMfO3icbm5Zt7fpH/075VOu9N09BVFA86bPY6lM4eWhYTJNV0nql9qihBIB8mC9sRSx7njPie4HmEfjwawcCEAAKz+YT6pUASQsWojCNxu51t+WyP8H1a+vOS77zYPGDr0e6/Xy91ut2y2aI1gFU5Kj4Hs7adusy4veKjcHxaoWXSgBuA/CVSchaNq13U2xrEd4IK9h+oEgNm5kwQRaSxinltRWgZc5/ueg1LI4uwssLs0+de3pnxKRHFut1s29Za+vwXQyMjQBo1baFb+75lbHT9Pey5QWipJs3KgBiiMQAQyIxiNSyZb+rmTAAjA5a3hVAGq2H+2c8nKvooh0IHPQREzNZRb8uanvjPm2veIyJI7aJDWlMGmNX2QxerKAvlfZTumPvV8+YY1khxJDEk2zEMhkHE6snDXgb/GDx892wBgWMPtGYbBAUD98Orb56ny8jiloWTq4ESFI+OmBUV09cZR3z710sRxCxfeBOPG6QBgNsXn1KTNMU3K1nFcrhmaO3s4/+Q/X4XXLSdpi284kCEDiISkvW1Hzq58eJh+yrDvyOvi6PbJ/fYcgbw33fvd5q/nnBkmIRH+IFlBJBWOiIRWrfDYi0eMGnHPbV96XV7u9jW9eI01aUs2LtcsnTH1OPb+g6+LjStAWJ3YYCADAEVKJNg4j7To+KF+2tkHgay6HGj9uvW9K1ZtOCkUCkpkjP1JGo3cYdPKd+xku3/4ZcrusrIT3T63bIpkbpMEWl5ezF1W/jinv/3rVz+HnRs7Rrid/qo9rm4zTUYWEWGRzv3K4+95935SEsHl3S8TycnMZIBAC596447Amk1xaLUQqD+Pu0gqZHF22rF0hf719fdMIiK7z+2GphavNTmgkdfLs7I8wu+nttrkxz/lm4o6BphN1FaF7JEmAGBGhD0xgamBw3Iw2b4BvF6GiKqGBWaeggK5q3hjux0Lfhnrj4YUcn5I14wEXDAQu+YvOm7aHQ997ONMuhFZM9DqaHm9Xo5utwwQtbM8e0WetqGoeyXYBEfSGrKISyklkpy6Hux16hTnJbc+T5OydTyA98oBYEzX6Psn3nwlUlaWBFYLgTr0c1fkXAuSFJu/m3vB148/f+WnjMmm1PjSZIBmGAZzu92KiOLx6Zu+1JcV9KyUTHCGGjUgygiYsssIi7TvtYFf+eQdZACD7EniQCvs8XjE8ukzh+/+aemFgUhIssM9rSACZrHwsj0ltD1/wdsr58/vutzno6ZSBt4kLpKIMDOmQ2YLvfJ/U6w/Tz++VKBknGvUgCgjZMQiftA792TkfuAqR7sWGyHNhdVnmtXXnv/KK0hEreZOfOP5Pes3kWazIakjuG6lUHPaaOcvv8L8p958+1GbRbnRjdgExJubhkUbN0jLKigQlU9e/6T9p6lDy00STNM4NDDIuBkWCW3bs9DgC2+1n3ByPhmGdgCVAbmDxmlZBQXCd8eDOeENW3pJnUk4GiukgEkrl/5164fMeuH1G31ssvzkk094M9COJsaGGOuPuQtN/4v3GXHLv7+5vCJkMq0Oa/0PlS8zIyI+zqqH+g99IP6SW16sJo73y44NQxu3MNec/eKkG3fM/nF8WSBgMk07SpKcgFt0LN1RTGumffs0SZmw3O0mo5EXSzbqi5ttZGjomSOCn7x8n/PXmTkVFX4BulVvkKOlGhmmFFGRFGfX/YPOf99x5wuPFWan65CTIw9w9yzL4xHz5s1rv3ryjMf9e0oUs+m18oKQIoY2iypbsdox5Zb77/cAqLTf7x1tBtpfbmaeoWV55ojA7C/G2X+c+lj51i2CdKvWkCBDRFBCiBYWpkVOHv1j3G0Tb6BoiKVPKhQ14zKjqkl5NwU6rJ349uySNRviwW6Fv+LMDutaOGcRM6LKVq+/cTcFOlzk+1Q2ZqvWKM86yYiJ2UW8k/rB5Gee829aJcmewJFkg4JMKiWSrUyL9DptkXX8f85DxECVvMJ+wb8PEYnIOfn6CZ8WL1zWQ1q13z3PPEpOBUHXZHDT9rifH8u9jYDuasxWrdEBjWJcmQgXre0Bk67/Sm1eZRfWONWQR0sxkJFIoohm9j1zUeSBd4fZEEuqNTz2B5mbua26nHzL/32w8Zs5J4UYCc7qJjtmus7Ky8po168rLyKiJxBxDxHtl/U2A+13aQyDIbolEXUNPzg2j21Z3S6sOyWS4g0KMilFkg5atOtJi4pHPTq0E2KJ1+vliChrxOiYi4O0cbjQfGPYlQ9v/vr7C8OcBGN1R8EQESOdy4qitR2+uPfRXkQ01+d2MwCQzUD7k00DNyIRWYPP3jrZVjS/XTlYG5b1RwQphUjUSYv2Pm1ROOeDMzshlsYOy/dn/vMyM3gWFpi+2x/w7J7104P+SNhkNl0HRXW5acAtOoRKSmnn8hVuRPzBgIxG6T4bTfCYn5nJ0Icy9OhlzzsWfnlcOVkEY6zBQIaIoKQSiRamRdOGLInkfDAsCbE05tr358qMjAwta06B+Ojq23N2zZz30J7SPaLOQbYPbKg4Q5AwjIiSATJVYzxwbxRAy8vI0LIKvhehd5541r668PrykBCM84bjyhBBSCGSWUSLDhy21HzovaGJiHsOtGREhNnp6bqnoED4bvq/nLLCX409ZaWCWa1avYAMABAZC5tR0hB7/bZgcWcPeBQ0wjrDBned1USnf8pbhm3WW3eUlfkFWuwNR2MgAyVM0cJh1cQJFy4wb3tuRALi7qokRR5AYQAAmP8d8S/PjllzH6oIBAS3WzVQ9XftRARc05S/eA8Lbtt6IgAsBp+v2aLtt0kuF0ePR5R/6TtJm5H7YOXGNQKsdt6gIDMjMlknTZ584XT/bc8N/z2QeV1e7vF4FBHBh1fe8mp0w46Hyv0Bibpeb5asZpwGCMSExOie0nQAgNzvvmPNFm0vjeHi4OpD0WUL0+U7938ttm9mwhYPTKkGK8MmMyKS451aaPDIL+zjHx+bjBitojD2gayq9Y2IWn5+m+HbkbcgK4hCMqvO6x1k1dZC4yAqg7D1199iAjELm3m0vW4H3B4CIoxOvvwzff3y5LBml6yBaAxCRmhGZFKiXYv2zXrSPv7xBwFRxuiWfTxZNcj8RG2/uDPn23VffJsWRCG4pmmkGpa6IikhUu5vtNpq9W5iCQDTPB5EzaKCd495XV+W3z7ILAIbqEKWkBFEgiqxVSst1OeMe6z3vXEvIAogIsR9QsZ5hqG53W65cdfGdp9ffMPsVd4v04JUBTJqBM8XGUSCAWgG2r4nxt3cIisn3vKmo2T9VQHFJSJqDQUyFg3KpNapPNTrlLsd9772FIkoByKoya57XS6e5fGIlQXzu8y87N7ZW+f/0itqYaKh6+H2vxkFjoSEZou2N8PM8oiKj17Mjlsy8+qy4uIGqysjxgnDlTKhY1ctNOTSCY4JLz9dmJ2uA5GqCbI8w9DcPp9cW7hoxLzHX5q/Z+mqnlENZF0y/keSeTKbBextWsS8Qvo/GGjk9XL0eEToi48y7XkfTAzsLhVgdTQMyJATBitk4jE9tFDWZXc7Lr/rGTIMbVDuQvNAkGV5PGL5zFnu2Q889eX2JctTlVOXSMgbjSUDAJAE3GaB5I7tgv9oi1ZND0QqI2k4z/tldOtap6nb6ll5MbYU44TBMkjs0V+LXHDr7Y6x2U8XZmfrBxYtTsrO1rM8HvHj+94bC59545Nti5ZJFmdXoBrZWCNEUEoxjHNAXIe23wAAJA8d2uiGZNR5bEREmB8rm9GCxmUvW1f/4gxqdsFI1XtcpgCVFioHS5c+Knzu9bfYh41+jYwMDT25Zs0HN2ngdfq43FyzIPft8UVvfPzyllWrpZ4Qz6ihqJc/xVlMIsuWlGC265+2CgDA5XLRP8qixfTKcniW1S78L979oWPNT5kV8tBHFNYqyAiUTYaZpWsaqEseuCwGspjGbc2fcxHxcQtzza8ff2H8qnenvrzltzXSEh/HoBGCLHZfSjqsNpRKzU9p336dARlaTUrmn+E6c3JizP8kz+Vxy2a7yv0hs77PMGPCZCgdFGXYoXuxvOw/ox2nDv24MDt9P3dJRGj0cVmm2Kxy2r2P3rJhyoyXd67bKPR4Z6O0ZPvdo1RgT4r7FBEb7eTjOgNadfAfXDD3FEfh9Nf9xdsFWez1DDIESSDjVIhDhx4bwkOuGuw8YfBnlJGhDcpdaNYEGSKSp8gX/WyC8cy2rwpe2L19u+RxDg6yEYMMEWQogvHHdBJDHrw9DwAgzTu+UVIcdeLCqh6cosKtjshH171E29ZZTN2hWD0G/4gAQioZzySXnXtvCp998xnJw0euP7BbqeYQsi/uevjZFR99cUMkGpHcbm207rJmvmllnMf36PRLx169VhoArLEqQ7K6ABnk5HAisgbynvrSuqloYAAtoj4FWGJVsSTj0eSq24BNcNsHWcnDR67PMzL2A5k3ZnUVESV+c//jX2z6fNYNEWEqZrXw2mwkqTNrFo1CQtvW0Dnr5OcR0czxev85PQMLc8dpgzy5Zllq6J7ElXlZpVESTMf6c5lVTSTxGNVgwBkbadRdZ9g7t1lXzYntx5G53WI3UYL32ttn7Pi+8KSKSMDULFa9oc8tD5XV0CUw2zHti06+xPUxXUqIbpT/CKBV8WVm+OcfRrI37360Yucuk9nj6q8+CxFIKZHEpSbTz9sornguy97Wvr664eUAjswsoWDnqeddNrlk6Yr0iMaEZrHqjYqI/ZP7NCNRSk5OYr3PPuM+RIxpprnh7w80MgwGbreiMmoRfvT8l8TOLaSscRzrK85BBJJCONDU5AkjF5oTXhnjQNx4YC1ZXkaGlpWba674eubwT06/+Nng9uK0qM4FZ0xrEiCLhSfSoVl46inHfX/KDVd85nK5Gr1qN6udGwf0FXkQLQ7yT7rpf9Z1izuGmS4R6mlSSYy0FEkOi2aedP48bcIrpx8EMkSYlJ6uZxUUiHn/87kWvPL+12XrNqaFQUnGsMmADBgShKPgaJPiP/H/bs5WkSh4vV46KgMB+wbWNu5kIMfgbh+T/jceuSdu5Q9nlysuWH1VZCADUlIkWUiLHHvCO867XxuOiKGaICMijBGxC82PsidctPTVDz7Z9MtSIodNIgBvKhiDWKe8jIuL521OOv7hLl26rKxq+zui2ISgSpbeZgVPjTGPjRJo1XxZZM7M/pbCr56o3LVLgmapn8PyqqrYJBvXQieNnmJ7/NOrENFfPQuq+k1FRJjqsMvZT73w1M65hR/v3rCRuNOOQNSktGAJSNoU09qeceLCURM9zxoZGZqraoDZ4TIDeZChIYBaOfXzi5bf8n/L1v1YeBJ6PKquJrUc1T9KRAiIREQtAvdf5OUblpO0xWO9HJYzBhAJm0mtWujBzv2edd79yl10akSDfJLVb3hVRawiIv7lPY98/OvbU8cEgpWKOWzY6OmLg94pVBCMYHyPrpu7Zp04GhHBMAx1uF3pRMRyEMFj0cXc7Fsv3vzUix+EV29mzsJFX2yaN8/V6ZRTCvIyDC2rwCMaDdAgP4ejpovK1x56PG5LUc8SZpcc6qEcGxlQOGgmpbTUg/2HTnTe/uJdRCarAhnVAJkkIvbJ1bdN271gyYjyynJTszcN+mL/22UggiHVun0H7bjsiycMco/dZBiG5vEcHhi8LhdHRElEfPTDT36845PPLiorLiYWHyfMRctS1jz49NRt69Zd2K5r1zkHJlFHfQ9H7jJj0uZlL9yZ7vzlm8JAaYUEi63uO5gYA4qEzaTWqXro+OHPOcY/dUfhQKGnF9JeRZ9qLf4KCvfxnXvNa2W/rh4S4srkuq6TUk0LZIggIhEzObGF3tl11v3nG/f850BO8FBW9e8QUY8fLroiN/jT4ozyqCmZzcJAKgSGkgUjPL5Ht7JWE7JPO37kyOW1CbYjAhqRwQA9AESpof8bW6iWz21rWuOhrudhEjLCUKVIbNdOD2Vc/rzjsjtvp4dO0yAnf68lm5SdrY/LzTVXL1uW+dMjL0/bPv+XxKiOkiHjTSazrAkyIc1EbtE7XnDmFNekp8bcf8JJWk7+vvs9hIAffQDMDSDXfvnl0O1veL2lP/6cHNKZZBrfr3OLEIUlENIcPboXdZn8Yla3tt2Ka2vg2REBIz8HGOpWVfnk9U/ZNy1ub+pOVfcg48SiQUzs2kMPD7vqCce/77idhsj9QJadnq6Py80157z/0ZkFdzw2Y8P3PyWaOgpEbJIgk1IKBzC9y6jh8y+c6LlWBMMMMjMPOS7zer08BwDddptc8XLuhN/uf3J68dz5yWGrJhnnB7UHIpEWddpkdP2GPlsuv3v22h1rW7vdblkb2ehhW7Rqlxn+8KULrHnvfla6Y4dkVludZpkKmOJRP+pJLaMwdsJjjpFXPUKgeHV9PxGhG5H5AOSndz84fOecRdPKNm+1ot1CQE1vlgIiglJS2BTTUgf1X/JvX+6ZiLjHMAzm8XgOyfd7XS7u9vkkWHRYOOGht/3f5F+5Y+NG4vFOAvnnRoGIhD0qtRbnnVl08hsvZeVgZgkYmepQP/uoLRoRIfgAiChVLs57Pbhzm0KrA+saZBYZZo5jeqMYes0ljpFXPEIZSsMaIENE9Oma/P61t57anvfzN6Wbt9qYw9okQVZVmi1skmkpA/styvI9cyYi7vHGJOQP6UEXZmfrbp9Phol6zTn34i93vT/5yh1btwge54S/AlksDGZaQEPhn/1jn5/ufOANj/aDSPMU4dGIxxzWL8bKngtE+RM3vpawPO/6Un+4TqtlFaC0yxBXCS3L2Pm3jLW7s2fR2DEcfb69RKwbkU2xWeV3jz3/5qoPpl29q3in4k2QvthnyZSwCqUl9ui66ORPc4f2TUo6SPDvz5YBoHkAxIqpU9NLPp3+TfnsH1v5OUmmaYfVSY+IIE3TjNd1vcWlox846QnPY4XXXqcPys0169SixXQyCkTluxOH2pZ+e0VlZUAe6oiZI7Rk0iYjHNp3LwseN3yY3XXtLBqr9oLMMAzmQ2RTrBb5yTW3v7/iTe/VxbuKTc1hb7ogk8q0SdBSTzxu0dhvPzmjb1JSSRUl8ZcgIyLmBeAeq0UsezX3tnUPPvVd8Xfft/JrKDjXDluugWIDNHR/KGyKgp8fXe377NpBRzF6mx3ihyL08RERxeH6xW9hJGIX3IJYRzpcClDaRYBrHbuURk69aljKHU8X0qRsHX2x6gSqilXcuibfv3jcuzvy5/97d0WZqdttOjX+YsXftx5KCqsgPTW9/6ILfK8PTUYs83q9sTjr0Pgx5bZocu5V4ydWvD/1ueCO3UnSblUMj+IcVylAp43vWLlKbnol9z87Nq7qmuXxiCM5Fz00dObkcPSACLTLecC5Zn7HUsUEY1QnLlMRSLsMct77xNJg1hXDkoaPWkhGhobjYia7eh4UESW/ed5lr+36fuFFlSJq6nZrk+PI9lIYUdN0aBb9mJEZi0e/9PgwRCzxHmJFRl5Ghpbl84myUNmx6yc8+trWqV8OCwoSLM7BQdUCEyCJqXiHCv76W8qax16ZTkT93ehWh6uV+5cXQl4vB49HhVet6k2LZ91WUe5XyHVeBzsOBCBsIsR5v1P3RK95emgMZPs6lWqw/a0+uuKWzwK/bbioUkYF17Umx/bHdh9BmqZMsNr1biOH/TT6pcezqgP/v7JkRIRecPGsggLx61TvcYtcN+YVT5s5LIhcMLtNq80ydCRgIU0TwYKfev1sPP6oD3wSYlq5tWnRfIBMVxXTXnzZXrzR6rc4ZO1zZghKKhmPpqYGjyim618eFtfCupTyYhIKAAB5eXlaVlaWIKLun1wyfvKmWfP6yXiLYI1FZOXwQUYyFFEJCQm88zmZr13wTM6diBg6UCbrdwP+qj4HQJDL33jv7h3PvPVI2crVFum0S45cq3XLTgRM13hFWZlUU6bfufaLbybj+Wcv2EuhHK1FI1eMMzNnThnl2LD4jIAAgVjLndqIQEQikUkue6YvojtyM60HgswwtKysLLF58+b+3qtun73ph5/7yXiLRGQNO6rnyO9ZiUBQprZpy9sPGXzXhRM9N1aBDP8q8K+alKeIyPlT9u05O19668k9q9fpFB+nGNQhMU2EZLdiePcevuWTqR8SkbWK6sKjAhoBIPTpQ0TEwl+9+rjcsQFIs7JafbCIoKQUCRDRogOyFor/TD3XZsMV1WIwey2ZxyMqKdL/xwefmbF2+uwOpgVjc8ibpiVTFIywzn3TtL43XTZh7KQnn500MFs/lJinuvypkih14a335pd9nWfs3r5DMocdaiUe+6vHpYhFORPhH34+duFjTz3sxk8l+HyH9Ln4p0FmQYEI/u+FO2xfv/pseSAqsDY5syqQJduYFu59ylzbg++dj3tVr2NBcLW73F2xu893Nz08Z33e3JbKwpvsuaWUyrSYUo/r1HHDiXdfc8egC8+famRkaJ6Cgr88IKdYByGtmzH7pPVPvfhGdOXavpUkTG6x1G8SxBhBMKgSux0rj3/7heNa9ey54lBcKPujQDOzoEARUUv69Yf/C/mDBFxjtQkyEsJMtpAW6nHKZNuD712AiKVE+woWYyOts0QlRfrOvvnhvDVf57VUFk0iNEGQxYJ+kcAtetezM9cc/+C4rMMBmdfr5QhAG/K+PW/H0y/O37Ngcd+AjrJBqlGUQrDbILJhs+XXp156rtp1/pX//H3w5GRyBFCB526/ybF5aasIcom1Nem2ypIlxdv1wDHpHzoe/XgsIpbEGnljRyxeV0xmfdPatf2+uXLCjLWzfkjFRIdERA7QxNwlQxLhiIy3O7WEtG7/HfP6Mxknn3POhsLsSfqhgAwAwOV2KzIMFi2pWExtWhYkt20NKmwiNdgoHuR+JST8+tvwddO+GO32+eQnXi8/LKAZhsHAU6Aqtla0gtWFtwQqqukMqh1LpqRIZlILdDzuo7iJ0y+l0SYnw4jVrlfFIVUjnDvMe/SlyWtnzGknrbpkTTEmQ1QyEMY2nTrx7pec958rP3/nBkTcZhgGG5Q77pCPchCAICeHeowZs+WU9984K/niC992xjkYhEKqQcBGBLrNCmVrN9DaSe94iIgtX76c4E8mIR8EtLSiIkRAxac8frezcneLKLdQrZRmV53jJXDSgsefOc/52IeXkRlG6GNQNcgMw2A5Hg/kEMFHl47/cnPevO7KaRGsiZX5YFUmzaOCtezaaU/fq8ZcfK7n3vuNIRkaEbEjqYKoUUBgDvL839UJw04d16Jde47RqARW/2AjIh61aorWb05b8sKr2R6PR3nHjuWHxKNVczhE1C14z+hbK8vKFbPHsaNtAEYAkIpkvApp5vFnr3Hc/5YLEBXUSOerNhHAqquuF437bMecnwcIh97kKAxkDGQkKmyEWqehp2zoddXYkf2HDFlqQCwe8xzF/PNqsC0cNE4f9NqLuUtffh3hrQ//u3vjJsHinfUr40AATNcwWO6nigWLHyCiD3MQ/X+UPe9v0caN4wAA/pfuu9qxrcgidZusDYZZAZMOMjn2PX0D3PD0SETcdiDI3IgMOFPvXnDlG2W/LL9AOnWBjDUpd4mcUTQQlC1btNTaDRn8oeutF07qP2TI0jzD0DxQIGrJWtKghblmYXq63v+m6yY5Lxh+Y0q3YzUVjhAwVr+bRcBMBjK6cGn7pROfv9oDoPIzM/mfuk4iQsjNFUSUBKsWXBmoqCTk2lGTswoZaZFyhl37lIevmTja1qpVUV6esVcsjgDQjcg+tejyiwnG65VLV11TaUZMaGpkLKIyKwLYukNH3ueqsS9eOvn1SxGxmAyDHW59/6GsQQsXmoXZ2fpJOfe+Fj/qrBuTWiYxFQxKYPVYgher8GCVJaW0c+bcm4jInpmZqYgOTkL3XZXPxxCAQh+/em1cuKRtlOkSjvKoiZCRboal1qmnGU4/b3hclw6LKM/QsrL2bXy+YfBPNS5nPjbx1R2zfrq2JFBhcouuNxWQISIoIskjgrXt2yt43PhLL8y4PftWCke4USPJqYs1KDdm2Qbde9dr9owT7mrZqpUmI1ETWT0WsJBipsYV27L92OWvv3MtejwqP8fgfwi0qooIm/xtYXZkdzGgZjm6V4MxgEhAxrVvr6nRd92TeMlNP9U8VgLY15nz/X/fu3TNh1/esH3rVlO325tOFQZjJKJRYRWCdznr9LXDXvIMG3zFxZ/lnZ6hAYD01CHIqld6YaHIy8jQTnvlpecSR583Odmi6VIoWW/z7QiAW3Xw795De34sHEdEWj6AOjADZdXkKBFheOanQ+wbl3YPETs63gwx1kGe3EILDTr3eefwMc9TdroOmTn7De7K8njE3Hc+HrLotQ9yS3bvkprTrjUpkAWD1Lp1G63bhWd5XW9MTD+md+95Xq+XZxUUiHq0qJSfmalyECH9kfuutA8e+LMlKup1CjER8DApkivXpG2bM3eEx+NReQ89pB1s0dxuQEQSc6e6eGUxoMVKR8ObKalkklXTQv0zpjiuefh2koJDbuHevksiYm6fW4XD4e6rp874qnLbdgfaLE2iMhZj5UwSAmFMaNWKul987h2uN1+4CBHLa6s17XCXx+NROV4vIqI/7c1Xrks+aSBQIIT1lhwQAbdZVXTjVlr92tsXgsYhPz9///ey6ghBUbG/rVZRMioQVUSAR5wEKEDlVGEe7HPaRvudL19PJBgQKYQqkAFgFc8Ek6+7870dhUuc5LRKUNToG0mQMRCmKbSI4F0yTyk588kHLsy646bnRgVCnIiwIaWj0O2WeYahtYiLW5J03tB/J6SkMgpHFCDW197wgDQhuGbdeWWmSPYUFAiqcTLF8nNyOAJQePa7Y20VxS2jwNURE7TIlEWEibr0K5VDrzobEXeBYew3VynHMDjompp6ywMf7vppyWBp5QKPAtj15yqRzFBYtopP0jqfdXrBOW8+c1K/s7O+nJSdrfsAJDbYcdC+leXxiLyMDG3A+Os+dJxywqdO5JxI1Q/4lULFmbBGZastr+ReTUSYb+xLCtiuIg8REZPrloyR5bsINf1IIQ0QDSlnSmuuzrr6loRTs1ZWCRPvDbqMjAzN4/GIz+5+xLXlux/+5Q8HBTLe+GkMBEmhKCa2bMlbnDxgwkVvPjciyW5fYxiGNu4Iu4LqamVmZipDSHbaG8/fbDvp+FIMRVl9uVDUNe4v3gUli4suRatOWR7PXpAzd6zhoz2WbDsxEBEYO7g+/OBfSSESE+yav8fgVx0jLv6AJu0/9sbr9XJPQYFYPmvWkF0/LfqgorJCMqu1UROyWCVViqEob9O9a2mfK8dccdHrE59BxEBVg0yj0/VHj0fluFyIiDtsHdrflhAfh2Sa9abtGiVFwcVLeuzaurFXLByPhUQMECH48SsDbcUb7UqzqiN58ApAOcjUgj1O+y1uwsv3eccqDtmT9hsW8Z37SUZEcXMf+++Le1assTCbBRq1vHosHpMJFrvWelD/Jac+flf6sNtveC8vI0OLjfL0NNr0mPl80gBgJ7/0xMfWEwYs14ViwOphmgoRkq5JvqfcudZ4/hxAhPzMzCqgEYFat/Q8FvEDcK4ON9skZKRHQkSpHYLmiOtGIGI5gGu/uMzndrNcvsiceudDbwc3bRtgWrkEgkYblyFDJUMh5WAW3n7YqVOvmvbOsF6DB6+flJ6tZxUUiMYQj/0FtQWZsb6CaIfLxjyR3LUzymBYQT0QuVzTMOQPQWDnTjdoHPILClR11ulU29b2jgoZ84GHzZeZKi4lhZsDhz6clH7KGsqLzbfcx5e5uPtTn/zmsYmXbPl27lh/NCQY440SZIgIhKCkP8Q69u7Jev77/AmjX3l8NCLuIsNg4xY2rnjsrxIDwzBY1xEjPoTux/xgZ4wD1T23RkQsgkpheWW/8J6SXh4ARUSMwe5gInB+ctiUcLjxmSJQTmbyQPfBhfHjHnmOXC5ek5StbjQtV9Ry44y5r/r3lCpureW+g9qkLoQ0bRJYQqe263pfPXboeY/c94xBMQqoMbvKP0wMABgiqpQRZ7wa36Y1qkiU6oHuQNIY0a4S58o33jsh5tJ8yELLZg+zBsuJkB2m20RlkVEQSSllzozLhyNiFLze/SSV0orS0O3zyW9umOCrWLcxkRwWIqVYowRZOCLiUde7nJO16rL5X5950sWuWUaGoXkAVGN3lX8INI9HGobBervdk1XHjkUWoTRAUHVs0oDpOkR27aHwpm2XAADkuF9BxkqLB1tBcYrVhx1qug9KCeVMiGfyhJFP4ymnlJBhaAfOIXf73HK65+nrt+cvyIwy1Sj5MmRMmYGgbJHUQjv2grPeGPXK44OTETfk5eVpngKPgCa8EIDabd/OETHaKuuUV+NSU0BF6yEDRcSIGUX/hg3diCjZAwWSqTWLoxD2AzB+GKBlykEmDxw7aF38DTkTCYBBzj6XSUTo9vnU6tXLOm77/udHg34/ME1rZC4TgQCUqAiwDmm9+HE3X/7Y+S95rkPEMjIMlpWV1aRBVr22tW0rAQD6337DNOzeJYqm1Oq6IhcBWQSIWHmg29alS1MBgDTQtVPDAT8Asx5aXwAiYTRMLCWVaScOvwURw3SA1n1OZiZHzsSiFz982b9hS0uyaAIUaY0GYlXKPRYCPblfn+KBd1x9+XHnnDXDBcC9Md01BX+T5fF4lJGRoQHANrSxtxw6jgvFkoI6ex6kFHCLhSJbtmHJrO8HAMAqpoToFzElIDu0KJEUqTgr8kifzM9sIy6fHlOAdO9XleEpKBDz3/rfecU/LLygMhKSDTFx+E+oC5BmVFgl6Meek1V00fR3zzjunLNm5GUYWmM5SqrtlVMlR0pJ9v8ypwOVkLzOkwLOFAsHIbR9y4gYvVG+zUIk4ZA0+ZABmiEUxxyn4rIffoCUQHDtGw9DRLjct5yIyLbM99ULlTt3gW6zYqNpLGEsdl7ZopXW+tT0d0a9+sTJ8Vbr8jyj9nX1GxfScogA8Iz//ncbP6bzBi1qItZ1UgAEBByKv5uvoaYBo/I9gIzDocRPSimZaLMy0XXAK5iY+Cu4XPspEfrcPuZBj5r51Et3hTZu7SqtXFIjqcpAhkpUBjClbTve+xrXS1dMefMqRKyorouDv/FCRMrPyOCIuCsurU+Rw+EAUnUrv4SMc384BLbUlHOVabZh5PcDcA3+Mj5DVBYZZsHULrudFz9skFIIXu9ekJFhMJfPrUhVtl7/Rf495aWlxGqzu/0o4jEiJSgYYSnHdvF3GTv83xk3X3eLikRZLGlp3FPhamvtSk0lAsDE3t1mMqcTSNTxbRMhMQaR8vK4VZ9/bmcUKI9lnH9q0RBICuVMboVw6oXvYRKWgtfL9jtmKipCBKDP7nz63uDmrXHMqkughi1krNaEtUjQjjnlhMohT0449+x7bv2fMSRDgybMjx3JcrlcgAAUP7Dfj5bWrYhMEau4qcOlEEmTgjttzrMYSPMvT54IkXQRZZHWXcscF9/8NAEg1Bh2FauY9aktW7b03LN8dXZQRhUia1DODBmCFEI4UNOSex375eBH7zw97bTTvp+UnX3IUgR/p8XcbkkA2HHQoOVhRiutms4RSNahRQPGUGoREys2bu7PQIq/TgSUlM7EOCa6DngLEXccZM3cbgQE+uW1D+6rXLfJwSy6oga0ZsgYmKGwmWhzaK0zTvjsmm8+Gtm1Z88lXpeLN7b6sfpaBAA5AIicB+K7tNvJZATqPPNkDGQoAuXLVpiMgiH4s15AQkaaCPNQq85lzmwjZs2WL98LMoOIubxetSewp+POnxeP8gcCCngDWjPGSITDIjW1td511PCpF7/5/JgcRDhU4eG/88rMyGBABKFt2z/QbU5QUtZt6ICIMhoFs6wiQUOnE/5M8gCVFA6nXQu16/MBItsRmzWwL0tLc7sRfT714RU3XxhYuykebJaGq/9HJBkKQ2JSstb3GvekU2+8+sYqGQH4O5GwR460TICCAohLO25PYN0uoIpSQK3uKE5kjIVCIUhOTjyFxWqU6I8eHCgzokVTuqJl9PXvABBA2vgDeLM+VEKUGCotvysUDRPnrGFcJkNF4QglpaRQh7NOc59287XXVzfB/JOC/r8EGgC0HXaqxZLSApQQdeo+ERGFFCCD4W4MdUcs4/ydDyQCGWfhYKZ0/kk/tteSat2yvT/g8zEPeFTRh5MvEbtKOplIihpgLE41R9ay6zHs2H+fP3b0xId9xulDtCr5nWaQVeMsP18BALRIT19eGQkFObJD4LWOCmlASoG5p5gzsNkB/qBRhpRCbtWQNPYYIoqUPsX7odHn8wER6Ru+yrugclsx6RYL1fvBOUOSwQi2T+tFaRefN/rcO2+eWp1ZNoPsgOdeVVMXn5qy3DTNLRauQZ0CjQiQM4iUlgHD+Hj4vcyTEMmiIiyQ3Glnwr2TfiQizMzJ36+o0e3zyV/mfptSvGzl0JAUSID1e6aJqES5nzr07R0ZeOe1Y0+/4Zqp1fM6m2H1J9um62BNTEYSAupaOgEZBxWWwDCpFZCSB7lOJCWdDgfx7icVIOJuyMnkNS1Eu+3bOQDA9i9+vgjLAxq3aqI+rRkypmQghF1PPYlOfvDmMcefO7wZZIdBO+gJdohNi8Y6NGgEyDmIUBgYJrSPxCq4af8kIBpFSG6NLO3kGbH0cvx+KBoXk7jS/GVll0dBxmj4egSZWV4JHQf0DQ2657oxPU87+avCSZOaQXbIjoCBnuAAovpLxBkwbYnVwgEU1WD6QVk1xiLMulV07TrdMIAdcBKAAEB79uxpXbpmfe+oFLGrr5dNQiX8Qex44vHshLuuG9tr8ODPJmVP0geNG9cMssNZ9TzSiIEZmm9zOAFIqpoBth0JI1bH/Phj++9MK4L95CIXjsvVAACWvPfpaNhVpiPnZr0ItCCSDEcwtWsX6O4eMTZtaObXhdnZ+rjcZpAdQRJVvx+n9TrBArZ42E+iQQpCmw00EX2PiDClT8Z+V/Vk6XeKiNiuopWDA+UVjOmc1cPGEIWj0LJDB+p++UjXaZf/a/Kk7OwjHlT6T15ECkSgHo6g9n4gAMOktnPCwCVSrGsdEAHMKEDLtsBdd1aRnZn72RWfzye5zar8u8rOiEoRkweq25iMVCginPEJkVYnDXCdMe6qyc2B/1F4zUAQhT90ROoXh/fgYmXdTOPALF37FJiOBI5KMgAEIlA2nWsBqa21njpsFgFg1sP7jpwMw0AAgPWFC4/1b9hsAY0R1aHbREQQkYiZ2ipVb33G4PtdLzw6xesyLM0gO5oXFylaViZQO7SC1yPHGQIoCdxhAQadOgXADC+w6hyISAEgMCUAWreLomYNVJu+6pVZpaWwcc6CIQ7gLaRSh1gHfmRLKinjdZul1RknffGvlx9/ZVJ6tu7y5jSD7MjoBgQA8CtqCwAtZQxkdXkGBUpKsCTagSFiOcW1WGa1ahAjVhRxzQKsXfetJCKYc8CF5OfEvrLiq+9swVCQWB0eyhKCtEQUd3brMmfUs57RiBjNLpzUzPgf4crPz+cAAJULFpyenJCYEjVNUadAAwIABD0xNdburw/IWqmIExAhKKm40wkQFV8jIuUYGfsF+p6CAgmKsEWnTtdGwmFEVkd644yRCkVZynG9I+e//vhNiCjogDq45nXYSAMAgG3fzRHhnbuI6XV71AkUqw20tG0lGSKSbN/1G0zpgMqMMFAEYE8ATO1QVuUrD/4HOKOSTVt0rKuXARFUOKISW7XAjiOyRrXp1GmZYRgaut2yGS1HCTQEKFuwyGlW+hE1rW5xRkrZLFaQwXAeIwCMyzxvZyguZb2dMwSSBBYbQNvOVSlJZk0fzwCASKqems6PiUizKuKr5QtUSjisFt4+I/2toTdd+3VehqF5/uadSvWxdhUUEDAG9hbx55qhACDndcoWkFTK5nCAGQwtY/kZwBFxF7Q5ZoHdZgUgAkEIWnKrXQf9ps+HAADb1qw5xiIhXkqlsJZ9PCIqjAit9Snp20e/8OSthiKWmZ/TbMlqYS0HIBKSla7f2hO4Ber8bFopYDYrJA/oa2OZ470EiGDpdvy7KikVQEk9EAxHZHLLVTGDln/Qgdi2X1fyaCBIjDNVq6YXkZQpyBYfF0kd2GckIvqLYjKZzXHZ0WeczAOgdq5a1deGvE9ImgqgDmsHEUEpYmCzQFL3rrsYuFyKiFA7919zA86Wm6wkQbNaNeavTI1ZsbS9FstXbYLXbQQRjiDjrHZdvFLSwXXe+tT0KcNuH/9znmFovn94nX+tLbcPiQhLCn85CcoqrMAZQR0XCTEAFpbKlCCmxLK4WBdzBVisr9usGjosFk7BYGcAAEhJwRquEwAAKnbsABGOVBVs1BLUGCMZjrD47p3DZz1xn8cgYLvS0potWW3lAcWvICJS8Lf1w8yyMmCaVreuMzbOHKytWvI2551ZwqqyEQUIwC66e3o0sVUIgmUAZbv+kCAToRApU+6jSmolcJQyIS6epQ7s/2FK69RVmYbB3M1ZZm25TcwqKJBElFy5bFV6sDIAUMe9HUhK2nQLiIrKuXaw72LVATgRYNzxpyyK9jx9PlJYmasWy5rcy37shs1qqWX0E0VNbmmdUjHsodsfAUWYD9DctVRbKycHAYCWPPHEMZEVq7qaOieo494ORUA2jYGjR8e1iBje92FeFyMSaD9t5NOgWRmSeW7syOJg7db2nY5JI1BAtXWYTko6NCumHpf2od1u32AYGdzTBDVjG+0qKkIiwtDW4mtUWRlxiy7rPOMkQKkhtBzYfzPAfmMUfRK8LqZnnf91eVTOkZuWDUFuJfQc7By3rlm9FIFBbehRIUMQ4SiL79YR+l12QS4AYNoB1bzN6+jcJsYSqrjgjpKLQgoQsI471WIV2ownpQBZHJ/CQent8j4IIgq28294SiNMCc2Y0pWIgKrUtatXVAhVe8AHZWUaS+jS8fvuJ5xQZICBzbFZLSYBOTkcAHDtx58OU+s2tpIcZV27TUAklBK1jq0r+t14bflBQEOPR+QZhmYbc/103uaY+XLRTDciUj7kx37O5QIAgISUFNCsFqA/6Ac9LF9uCrIn2CEupcULiBjJcRVhMzxqb2Xm5Ehmt9PWb/MmhLfuAGapB6KWSDk0HaypKcsAYJMX4ODK2EwARVKwaLtjb0RHwrk78/LiMtNSqaZoizM5GbhVh6P1nIioNAmMJySs6ffY/V8ZAIw182a1trwuF89BxPVfzkwL/VKUHkZSAHU/sYaEBD0+HhxdOn6DiJSSkXFwQwl6PAoMg8W7xi/l3Y77LpEqxqPbJyE/n7uqfqZNz25ocTqAlDoqxo+IiHOGnTIGr+jEMFQE0HwEUMvLA6A2vPfhQ7S7RAeLRdW5NUMEMqOgt02llIwhswAAMseP/30xFvR4BJGXW4ePeYa1aJMeLlrcA7OyxMKuXRkAQNt+vcPMYQOSih0x0hBBRqKU1LEdpA7s8wkR4I1V1bvNqxasimGw5X360O5Vq04yV28YWRkNq7qv3QYABKUT45CctLn9qScuhyotvT8JCl0KEYNS0+5jVn0srV9vS09PlwAArdq3XxEyo7s0TWdER0zZEgPUpMNacaJr9AwEoMyc5sPzWqPO8vOZx+NRq156/cnopi1WtFmpPhQ4SZGyWywABO8iYoUBGRwR/1heqkruCe1909foXftMhECgWn8fUWPbENkOPTY77EiBpjTOwdEy6Ue06LurRmA3e85asmaeggKx+OmJZ5R//V16UElZP9YMgaIm8hZxsv1F580hAMw0MuFgeuMPwIaIYezbN7r3G1yD5E7tzaNJBpSUKsERDwnt2swkU2COy6U3Q6R2eDOfx4NEFFc6b9GL0h+JA4uG9SFXgQhKE4rzXr129LjkojkIQNWK5+yvfxn3yziNjAwOpoCSDZvetNpsBEodPqeGAEjEIzqGOw8+YRECUJrLJX/vzcwzDK0ZPoe+Fubmam4A+bPxyP1y+aq0kIaivoQRlZDKmZwELQb1+xY5i3pdrn0z1Q+RhqAavAwAEfQddV7I6YxDKcwjgT6BUExvkRg9bsyIeQAALrdb/V4GnNVcWXvo1szr5YPGjTPXzJ59auk3efeUlpRIpuv186IiAgiBrGW8jDvx+FdAEbhcLjgsoNVc+VVibqkDB3wfkGYJjw15pcM0aARSQlJq6tYaNn8/SwYAMO+m204tfNBzH9N1aLZsf74Mw2C5Tz7JiKjV5uffeDW0aQcwp+NPZWNreQkHch6RYnq3M88s9ML+oo2HDTSPx0MAAD1PGbgmvmvHKAiFeJjT0kgp5bA7QWrwHXIWMTIytANnFhCRFty4/Tkt/+fHVk/76rwsj0eQkdcMtj+2AGzcLwvNBRMeel0uX9U/qqGk+honjgjKjIK1ZQvoeMWlX5JS6DL67JfhHonvJsMwmAxHmKNl8iyda0CHmRWQIrJYLdC2b+8AKILze/bce1F5RmxU9sbpM6/A4tITflu0JLrhyRfe3LFiRT/0ZImqBpnmVWNVK1wWPvL0LXumfnlhaTBgMl7HLU77h1aKRSWHYzrs6T/+uo8RgOAAquqIHtr57dpxRFQpfboviktIAGVKdVjoFwr0pDho1evY2O+lp+/99q6iIkKrBTa87xsV2bSVWKsWEFi1JnXNs69+S0Qtc2ICyM1gq1qFVRokK30+dyRv3guByoBEq1WvT1FEJYRKTEzE5BOOewc5r8w7YEjwEQMtPTtbAgD0GXHGHEhJlEpK7XAO1xFJCympQNc+AwBYl5ysquMMt88nl734eqfyXxafGQCFAKSHLVxUfDW79cyMc5/zcKZ8sVT4H3+KQC4vH5Sba679/KsT1j383DPFy4okOmxYj3EZAEPCqOAiJXnPwIfumQhKYebvFK0eqWUgAMC2PXsuju/cfpuODOHQK2IJCRAtFhW04AYAgOVVAzIyARgyBv4VK2+0R6QN9ZjuGmNc8zMQuLn4sjmXZP/XrWnSh8j+yWDLMwwNfW5ZvKRo4JZJ782IFpd0FHYr1veMB1JKxuk6Jg08/mNE3JaXkcHxd4pWj+iiEJHyMgwOAMKi6y9ZmE6HrFOJAEoR2OKd0KlPn5ol4Zjl8QglJQsW77rIHw0CsqoJLETAONfKI0EzOu/ncbNHuie5NV4Ntn+cG83LMLQsj0cs/uijHoVXjPOVLVySbFp1ifW9FwwJwlHO+3QL98m56wUCwGqJ+dqyaJCfGZsO16Jntw/JqaMS4pDcJwICkQLNaoEWHTpQDQ6IAQDs/OWXLLFucydBB8wsIALUdb0kGDDV4pXZs11X5ro1LhFR1SQG/xEgK/CIFdOn9yv537T50W3FXU2bLhGg3veAlJJxdgcmnpT+TmJq6mrfAfNbawVoOVVTbc+84/rdqf17LtBjrcSHfCiOnIGjxt8XfvcdAwDYOu2rAXppGQNNO7iunQiYxaKXRqMimD/vunmjLpsRJuru9vlkYXb23/oIi4jQC8CzCjxirW/K1evu/s93ZT8tSjbtVgmK6v9FQ1SaKblKjN/SJvuKOwAAXTXmt9Ya0BCR8g2DI2LkmKzTZse3aoHKNOkQNw00q3UfaAFgUEzlG0PFJSMqKiqAaX8wVJYIkDEtyJkon7/orF/+PW7Oprlz+w7KzTUNyND+jnEbuVwcEcmtafKnu+6/eetzr78Z2VOSqhw2hUQNYs2VEMrhdGK7S0e/3alTp5A3Zs2o1oFWFbwrAsLe5w1719I2xSSp+KFUYMRUHKMHJwl2K4W2bu+hpPpz8ZiqmK0SpNjxzew2K+96eN7q9z+6w8PmCEQk8nr538WKTUpP19Hnk0TUZv6Nd3y+Z8rXL+5cs0Yqq66goeJTxpQeFcwysN/W4+6+7VEDgP2ZNTtqoKHHo3yALKVDh5W21MRP7YwhHWr2WdMtpsVkFygUaRfetM2uOAOgvyipJAKGqKl4pypfsy5+81OvPbtg/ITXiCgZ3W6ZBxnagU01TWl5q6zYuIULzTVTpp/z/ZirfirxTT/fHw4pdDh4g4EsJilGca1TWesRZ96CiNEcr/cvS7yO+mJdXi8AEfQZcdbLzrZtSEai+OdJAcVGUEsJQQjGvlRVubujoODUOE22NOkw5EqVYuh00O5dxaLk8xnX5587etH6aV/8K0v7QaDHo7wAvCm50yprjO6YFUtd/OCjuSvuz5m+Z+78TgENBdN1Vq882UHvt5IJXOOWgf2n9b3uqil5GRmHpFt31EDDiy6SAMCOH3vhwhYDei3TFbA/SwqoSgUwVFYBy/ILEADA98UXCACw45dfLRSpHnt4GMy2UsisFq1CSVlWuLzzbw9P/OjnG+78rLx4Sw83gIzRMY03fiMirLK+iG63ZPFO+vWF1y79fszli4s/nHZdqKQCpN2iEFGr96FuNa+TMWJRwVj3rrsHPHXPnQ9GTZaZmXlIqGe1sEtAMdMZ6XbmkKeTO7cHEflzDXtkDKL+IOxevi5WAlRUBAAAJT8tIhkWgIwd/jFdzJVy6bSr8m3bVfHkLy/4ecx1vyx84LFXKohSsqqm3RkAjLzeRmHljKp6O0Qk9HgU2m20ccZ3539//iVztrz67ge75vzYtiwSFMxW/0Ts77rMSEQ64+Kw9fln3ZfUpvO6TMNgeIiKAlibbyUAsA/+Pf63LXk/doE4K5H8nc2JNaWolh3bs9MfvPnyfuec9f5XN99sPfellyLfnDP6ErZm8//KQ0GBjGlHsykAJCkY4fF2O/De3XdbOqe+2OuaK15vfeopO0DEDK6RkaHlZGYqyMmpt7meZBjMV1SEy30+9ACIqr2zrnzkkb7+nRUTKxYsHhLYuBnCGlNosSAq1SisMAHJeOI87twzC057/bnMvNOHaFkFBYdcK1hrN+H1ernb7Zbfv/LW6F9efHdyRdgvuab9bvanTGm2SmmlH3fr1RMHX+6+0+ty2d0+X+jTfn0uifPr/6sUUiDWwkhGxoikkFwoza4hyJatQh0uOOvLziPP+yRp4ICvEDG09/oBuMvrrQo8Xaq2gEdECD4f8/l8AD4fuGuEFUTUZdW7H12+e0aeq+TH+X0gIjBESnGbFYCANaSbPMADKfQHocXgQdsGfPHWkCS0b4DDnOxca/VdLrdbGYbBTrvxqmmbC5euCM36obdiIEEdzFijxsAs88OGH36KPejNsa9bEloBBv0AJGvnFVAKEZkmLZz8RBK277Rve/sTV8nseS4tpcXyH2+56/PUYRnTel1y8QK33y/B7d7vMr0ALCXDQMjJhMzMTFm1sb8nCocx3BDLz8lhkJ8P+QUFygNQbSlj4GIIJFWXTc+9duzGZYuv/G742LFs+y5rxY4dIKw6gEVXHIDV90Cwv3pZVSAoW3XqqLe5dMxdyWhfT14vR8TD6lirNaAhAFFaGkNE+dv3399TsXLt58WbN4Nmsx3Ugs8Yw3A0AuEde3ppdhssn79cAgA423UGVfwbEIUBa/FEBWNuXQO7lYKKVOVva9C6BtP0+SzNv2DZ/319+jmLkgb03+zs0vH99sOzdsR36vQz2m0RdzgiocADkOXZ34v8nmeJ8YMKqukdzgB0HSgUdm6YVTCkYvHS4831W4bOPHvsQLZxW2K0ogQCggA4E8xpY6gIoZGd2yIiyGhUtEhuqTuGDnm41yWuTwonTdLR7TaPAB+1HOBmZGgPf/+9eHvk1Z/uXrhkTNTCBND+gEbOSFYGseOJA3dfPu2tzogYBAD46a4HLvF//t3/9vjLBdPqcFJGLFFRQEQyEkE7csaQgSO1FUDbVFBWy9q49u0C/o0b/8dSknZ2GnkOJtjUjPxzPi52kfd3LZobkV7I/3ZgcOWGvms+myHj27Q9Tdf54D1r1jkdCrqGNm8DEQhASApQuqa4rhMgMCDAxuIiD3IIQMIZEVqLi0YuHvzCE4N96BYu8h5RWFH70u1EDBFp09q1fb8d/9DSLYuXSUu8k1HNoBaRwBRobZlUcfJ/7upy6jlnlxABrJ827V8bch7/qHhHueBWXauXAtFq0AGRipighGBW5MiIwOKwg6broCfosHvHzlIFtoCtTSowTQPN6QCSCkQoCCochfDWrWBp6WiXbItn0YAJ0WgERDQKwDmEpZDcogPG+kQaNbj2URmorGGTxZ90/KrMaf87DRH3GIaBR6pbp9WBuVVGRobWqVu3ZVPvfvj+yKbtj5WEKgRjXKuBRlRAwi4wHrbuHkUEbwIAJPXqVhxhFgAg/vuhUJ2QWHtpHma1ALNZQAIoCQhRJRVFTKDtCnRLXLIOkKx2FoNUBGY1aco5ICLYEhIgGhKwM1AmGOeAGkPQ7QhEoIHOgQgaVez153GZwopKiBt4XHHvSRNdiLibvF5+NANF6iQmyMnPlwYRu/CJB150duv4MwtLDRlT+7tPTiIUxg0F89sSERoALKlnWqHQ7dsthAjYANKi1WBQxEAphoAaY1zjVl2TQGQCKaFrSlp1JR02JR1WJS2aEjpXJimFnBHXdQ0Z04CAg1IMiFhjt14HBf/lfmpz4kDW+d5x17Zp02ZZXi1MrakToCEipcVIXP8x52fd1LJTeymCIVlTiZRxxoORIEQjkYuYzUoeAMXjHBXxXTrL2DDkRkTiU6znOeb2KPafUgwU7ft7bC+bdOUIMUYUDKrUPj15yysvvvrYocO/yDNiRZZHjd+6umi32y29Xi/PGHfVgi6jh7/TIjlZl6Ypqk8MCACjUpJZUt6z+LfV6QAA0h9EPSUh32KzxMpwm1e9ggyCIZmc0ponjRp+Te9/jXk7LyNDq60G7jpNp10ul/KqsXzY3TfdaunQ9icrMI2AZBXSkHEmZVmlXjT9u2FVGh8Ud0yXn+MS4kHVonxp8zoEkPmDqkX79lrimHOuPe6uW9/yulyWw2H+GxRoiEgurwsQMXDiXVdPSDq2U5SCYULGqKpallXs2AU7l/12IWqMAABaDRsyL5KUaIJQWr3N/P4nL84IAgHVomNH7hh2evYJD9//ZmF6tu72+aK1GvrVOXvgdss8I08bMHTo920zT745OSVFE+GwQMaAANAEgp0LFnYNVGxsT0DYtl+/JXrnDht1jFUTNSOhTkGmVHmlSu3Zk7f494XZJz/18OuF6dn6oIW1P0a8XpjoLE+WyDMM7cLH7s/tNOKMD5Lt8bqImiZDRNJQgj+a8tn4iUMxpiwqnJ3bT423O0lJ2SzMV4c8GZVUsDYDB/C2d2Zfe/ydt7w+KbtuQFZvQAOIqUOPikT4eY/931Xth58+JdFi1WXUNLluwUAwQKaI3ElEdkSkpIEDPo3EW5CE1KBZnK+24xlQpIQ9IlhC/74bU8ZdckKPUSPf9IKLj8vNrbNZ9az+7g/JS6QQUV744qNjU08ZOCXBatdlOCJMJBXdWtxvxZy5pwMA9HCN+sV2bNefbZIAmt1nbT4EUqYp4hVq8aeftPTEme9l9na5Csnl4m6oWzV0Vr/3iWQYBiIiXvTOi2OPueDMKS2Tki1AKMs3bKaFuR9cjYwBIor2I0dMiWvbFlUk2sTZqUayGFMqEoUEZ7yWNHL4tCGfvJWZbE/eEOt4r3vJ/XqvFvB4PMowDEBEOP9pw9390pHvxcUn6H5/AMvWbRu9vnBpHwDAnlde8pZs17KYK2LN7vMoXm6GQEASKoOsRdtUbH21696TX39xFCKWkmGw+hI6bDBbQUSYg4geADXdeObCLT/89Gl45Qaeel7G25e8+dzVJCT8cMOdD/m/mOmpRJCIwJthc/jUhQyGZLLNoVkGpG3ocMn5/+72r3/NBQBWJU5cby9wg9U/ISJ5qg7gR3jumjbs8QlnOnt2XWyu2nxV4bTPegMADHz1kXe1vr38EAohMNZs1Q75qSIQkYSKACa3TNFSRp3jy/jsg9O6/etfc/MyDA0AVH0roDdsoR0ReAoKhNfl4l1PPLHgmlkfD04e0PON4sW/vUFEFgc6NrY6K+uVpBYtmRJmM9VxCBklMKZEMELxXOdJx/UvTr187NnHv/qMGxG3ksvLswoaRhO40YTZXpeXu32xCoFlswrOSmUt56Vm9Q0AUYuCMVcUleTPa0lJcUBCNrvQ343FmJKRqLQQ6baWydDq7GGT05/x3I2I67wA3BXL+BvMKzSa0mG3zy0JAL0uF+93ZsbM1ll9/T6vlyHintbnZF6b3LE9F2WVHBAlsmbBxxrZJCmlBARCrGVSkt7hwnMX93nynoxBL/5nLCKuI6+XV/e2NuiL0Bj3rrqjCiDWuc0v+7f88Y4HXyqf8e110Z0l1kAkrJjDHptt9E8V42OMyDQVREyemJQI2LHd5rajRryQdnP2q4gYMgAYGAY0lknOTeIheQG4G0CWrFjRb8NbHz1e+uPCEZH1myAgowC6LpAzDuofADhEAASlTEGaKXhcQiLY0nrsSRjQ9/EBnnvfRMSyWBji4u5GNo6yyTycarCB1QK7Fi/JWvmf564r+3WZy1oe1SoqK0FZdMF0relVtB6i9QIiJSMRtBCy+OQkwNZJ69ucc663zz03v4aIGwEA8jIytMz8fNkYZ2o1KStAsRZ8gqpmgvX5+b1LZsy5rXTJ8ovU6tWJgdJKiHIkZrEoxjlSUwYdIlUdGSmImpqTc9DbpELC8f1/TTqu79s9bxn3NiKWVlswl9erGvPQtibpbrxeL1/udteUFGi70PBcUrlo5TViV2lvub0YgsEACI6SWSwADLExdX7/oVuMNRwrJQSpqKlZCSAupRWoVsmhuLYtPut05SVT2p999pfVHfbkcnFo5ABr0kCraeHy8/NZdSUoEenFCxacUfxN/pjdP/0yVOzY1cUsLgZTCIgAKeSckDNAxhAAGTWY/FOs4R0ZAyJSQIqUKYARcJ0U2B1xIFunQFyPrkWtBg34X6+bx01Bm3UlVIkX5hmGlpmTI5vS2Mm/RQBNRJifk8NrntsRkWXd5zPOKp075yz/oqKTw6X+QSwQABEMQigQBBOBNLudCCjWcBpTAK/qt6Ta6/SrrhKuslikpERgQEpxEQqBQ7egbrWALSkJ/Ij+pF7HFLXo23NKylnDv293xmnzpD+mIWcAsByvF2tTF6QZaEdxP+T1Mp/bvZ+YCtissGby56dG1q7NCK/ffFrpug39+O7yDhXr14GNc1DEoTIUAOQciDEABImcESADZLH/4d4WLjpg22r+nWLjipRSREAkJYAihgCMhACOCHF2B0gKg9DskNSjG0Tt1iWJ/ftsbtm2zfstRp/3S1KHDmvA3FcWlmcYWiaAwkZCUzQD7WDnhLAPdApq2CgiauVfurTtshdfac8cce49i36Ns6e0HhHZtUdT4ZDFIiWQPwwqEoWIMME0TRDSrBZq3t/aVfU5E0lA5KBpOtgsVuCcA3PagewWiChSzhYtBcTZtqrK8nzngB57Qlu3fnDaf/+rLMnJKxBxryU2AFiay4XgcoH7KHspm4HWEMDzernP54OU4mI8qLuHMyAhO25fX8TEuu3Hh/eUnhhctT6+/Ld1xOPtfYBUL1VRmapESFOh39ErY0jczhF1Z4A747arSLQQLPqupN49mKNrxy1M5wXHnH32NgCoqM4Ua668jAwtMzWVoE8fauqW64/W/wMCXHOVxP5vTAAAAABJRU5ErkJggg==";

function CiuMark({ size = 34 }) {
  if (CIU_LOGO_SRC) return <img src={CIU_LOGO_SRC} alt="Cyprus International University" className="shrink-0 object-contain" style={{ height: size }} />;
  return (
    <div className="rounded-lg flex items-center justify-center font-extrabold shrink-0" style={{ width: size * 1.45, height: size, background: C.grove, color: C.white, fontSize: size * 0.4, letterSpacing: "0.02em" }} aria-label="CIU">
      CIU
    </div>
  );
}

function Avatar({ name, photo, size = 28, ring = true }) {
  const style = { width: size, height: size, boxShadow: ring ? `0 0 0 2px ${C.white}` : "none" };
  if (photo) return <img src={photo} alt={name} className="rounded-full object-cover shrink-0" style={style} />;
  return (
    <div className="rounded-full flex items-center justify-center font-bold shrink-0" style={{ ...style, background: colorOf(name), color: C.white, fontSize: size * 0.42 }} title={name}>
      {name[0]}
    </div>
  );
}

function spotsText(a) {
  if (!a.max) return { text: "Open to everyone", hot: false };
  const left = a.max - a.going.length;
  if (left <= 0) return { text: "Full", hot: false };
  return { text: left === 1 ? "1 spot left" : `${left} spots left`, hot: left <= 2 };
}

function Sheet({ onClose, children, label, full }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-label={label}>
      <div className="absolute inset-0" style={{ background: "rgba(21,23,26,0.45)" }} onClick={onClose} />
      <div className={`relative w-full md:max-w-lg overflow-y-auto rounded-t-3xl md:rounded-3xl ${full ? "h-screen md:h-auto md:max-h-screen flex flex-col" : "max-h-screen p-5 md:p-6"}`} style={{ background: C.white, color: C.ink }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full text-xl z-10" style={{ background: C.mist }} aria-label="Close">×</button>
        {children}
      </div>
    </div>
  );
}

function JoinButton({ a, me, onToggle, wide }) {
  const name = me?.short;
  const going = name && a.going.includes(name);
  const isHost = name && a.host === name;
  const full = a.max && a.going.length >= a.max;
  const base = `font-bold rounded-full ${wide ? "w-full py-3" : "px-4 py-2 text-sm"}`;
  if (isHost) return <span className={`${base} text-center block`} style={{ background: C.mist, color: C.grove }}>Hosting</span>;
  if (going)
    return (
      <button onClick={(e) => { e.stopPropagation(); onToggle(a); }} className={base} style={wide ? { background: C.mist, color: C.danger } : { background: C.grove, color: C.white }}>
        {wide ? "Leave activity" : "Going"}
      </button>
    );
  if (full) return <span className={`${base} text-center block`} style={{ background: C.mist, color: C.muted }}>Full</span>;
  return (
    <button onClick={(e) => { e.stopPropagation(); onToggle(a); }} className={`${base} border-2`} style={{ borderColor: C.tangerine, color: C.ink, background: wide ? C.tangerine : C.white }}>
      {wide ? "Join and open group chat" : "Join"}
    </button>
  );
}

function Row({ a, me, onOpen, onToggle }) {
  const s = spotsText(a);
  return (
    <div onClick={() => onOpen(a.id)} className="flex gap-4 py-4 border-b cursor-pointer items-start" style={{ borderColor: C.line }} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(a.id)}>
      <div className="w-20 shrink-0 text-3xl font-extrabold leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{hhmm(a.at)}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-lg leading-snug">{a.title}</div>
        <div className="text-sm mt-0.5" style={{ color: C.muted }}>{a.cat} · {a.place}</div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center">
            {a.going.slice(0, 4).map((n, i) => (
              <div key={n} style={{ marginLeft: i ? -8 : 0 }}><Avatar name={n} photo={me && n === me.short ? me.photo : null} size={24} /></div>
            ))}
            {a.going.length > 4 && <span className="ml-2 text-sm" style={{ color: C.muted }}>+{a.going.length - 4}</span>}
          </div>
          <span className="text-sm font-semibold" style={{ color: s.hot ? C.tangerine : C.muted }}>{s.text}</span>
        </div>
      </div>
      <div className="shrink-0 pt-0.5"><JoinButton a={a} me={me} onToggle={onToggle} /></div>
    </div>
  );
}

function Detail({ a, me, onClose, onToggle, onChat, onPerson }) {
  const inIt = me && (a.going.includes(me.short) || a.host === me.short);
  const last = a.chat[a.chat.length - 1];
  return (
    <Sheet onClose={onClose} label={a.title}>
      <div className="pr-10">
        <div className="text-sm font-semibold" style={{ color: C.grove }}>{dayLabel(a.at)} at {hhmm(a.at)}</div>
        <h2 className="text-2xl font-extrabold mt-1 leading-tight">{a.title}</h2>
        <div className="mt-1" style={{ color: C.muted }}>{a.cat} · {a.place}</div>
      </div>
      <p className="mt-4 leading-relaxed">{a.desc || "No details yet."}</p>

      <div className="mt-5">
        <div className="font-bold">{a.going.length} going{a.max ? ` of ${a.max}` : ""}</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {a.going.map((n) => (
            <button key={n} onClick={() => onPerson(n)} className="flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-sm" style={{ background: C.mist }}>
              <Avatar name={n} photo={me && n === me.short ? me.photo : null} size={22} ring={false} />
              {me && n === me.short ? "You" : n}{n === a.host ? " · host" : ""}
            </button>
          ))}
        </div>
      </div>

      {inIt && (
        <button onClick={() => onChat(a.id)} className="mt-5 w-full text-left p-4 rounded-2xl border-2" style={{ borderColor: C.grove }}>
          <div className="font-bold" style={{ color: C.grove }}>Group chat · {a.going.length} people</div>
          <div className="text-sm mt-0.5 truncate" style={{ color: C.muted }}>{last ? `${last.who === me.short ? "You" : last.who}: ${last.text}` : "No messages yet. Say hi and agree where to meet."}</div>
        </button>
      )}
      <div className="mt-3"><JoinButton a={a} me={me} onToggle={onToggle} wide /></div>
      {!inIt && <p className="text-sm text-center mt-2" style={{ color: C.muted }}>Everyone who joins gets added to the group chat.</p>}
    </Sheet>
  );
}

function ChatScreen({ a, me, onClose, onSend, onPerson }) {
  const [msg, setMsg] = useState("");
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [a.chat.length]);
  const send = () => { if (msg.trim()) { onSend(a.id, msg.trim()); setMsg(""); } };
  return (
    <Sheet onClose={onClose} label={`${a.title} chat`} full>
      <div className="p-5 pr-14 border-b" style={{ borderColor: C.line }}>
        <div className="font-extrabold text-lg leading-tight">{a.title}</div>
        <div className="text-sm" style={{ color: C.muted }}>{dayLabel(a.at)} at {hhmm(a.at)} · {a.going.length} people</div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ minHeight: 260 }}>
        <p className="text-xs text-center" style={{ color: C.muted }}>Chat for everyone going. Agree on where and when to meet.</p>
        {a.chat.map((m, i) => {
          const mine = m.who === me.short;
          return (
            <div key={i} className={`flex gap-2 items-end ${mine ? "justify-end" : ""}`}>
              {!mine && <button onClick={() => onPerson(m.who)}><Avatar name={m.who} size={28} ring={false} /></button>}
              <div className="max-w-xs px-3 py-2 rounded-2xl text-sm" style={mine ? { background: C.grove, color: C.white } : { background: C.mist }}>
                {!mine && <div className="font-bold text-xs mb-0.5">{m.who}</div>}
                {m.text}
                <div className="text-xs mt-0.5 opacity-60">{hhmm(m.t)}</div>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <div className="p-4 border-t flex gap-2" style={{ borderColor: C.line }}>
        <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message the group" className="flex-1 px-4 py-2.5 rounded-full border" style={{ borderColor: C.line }} aria-label="Message" />
        <button onClick={send} className="px-4 rounded-full font-bold" style={{ background: C.ink, color: C.white }}>Send</button>
      </div>
    </Sheet>
  );
}

function PersonCard({ name, me, acts, onClose }) {
  const isMe = me && name === me.short;
  const p = isMe ? me : PEOPLE[name] || {};
  const hosting = acts.filter((a) => a.host === name && a.at > Date.now()).length;
  return (
    <Sheet onClose={onClose} label={name}>
      <div className="flex items-center gap-4 pr-10">
        <Avatar name={name} photo={isMe ? me.photo : null} size={64} ring={false} />
        <div>
          <div className="text-xl font-extrabold">{isMe ? me.name : name}</div>
          <div className="text-sm" style={{ color: C.muted }}>{[p.dept, p.year].filter(Boolean).join(" · ") || "CIU student"}</div>
        </div>
      </div>
      {p.bio && <p className="mt-4 leading-relaxed">{p.bio}</p>}
      <p className="mt-4 text-sm" style={{ color: C.muted }}>Hosting {hosting} upcoming {hosting === 1 ? "activity" : "activities"}</p>
    </Sheet>
  );
}

function ProfileForm({ initial, onClose, onSave, firstTime }) {
  const [f, setF] = useState(initial || { name: "", sid: "", dept: "", year: "", bio: "", photo: null });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const field = "w-full mt-1 px-3 py-2.5 rounded-xl border bg-white";
  const fs = { borderColor: C.line, color: C.ink };
  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setF((p) => ({ ...p, photo: r.result }));
    r.readAsDataURL(file);
  };
  const submit = () => {
    if (f.name.trim().split(/\s+/).length < 2) return setErr("Enter your first and last name.");
    if (!/^\d{6,10}$/.test(f.sid.trim())) return setErr("Student ID should be 6–10 digits, as on your student card.");
    if (!f.dept) return setErr("Choose your department.");
    if (!f.year) return setErr("Choose your year.");
    onSave({ ...f, name: f.name.trim(), sid: f.sid.trim(), bio: f.bio.trim(), short: first(f.name) });
  };
  return (
    <Sheet onClose={onClose} label="Your profile">
      <h2 className="text-2xl font-extrabold pr-10">{firstTime ? "Set up your profile" : "Edit profile"}</h2>
      {firstTime && <p className="mt-1" style={{ color: C.muted }}>Only CIU students can join. Your student ID stays private.</p>}
      <div className="mt-4 flex items-center gap-4">
        <Avatar name={f.name || "?"} photo={f.photo} size={64} ring={false} />
        <label className="text-sm font-bold px-4 py-2 rounded-full cursor-pointer" style={{ background: C.mist }}>
          {f.photo ? "Change photo" : "Add photo"}
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      </div>
      <div className="mt-4 space-y-3">
        <label className="block text-sm font-semibold">Full name
          <input className={field} style={fs} value={f.name} onChange={set("name")} placeholder="First and last name" />
        </label>
        <label className="block text-sm font-semibold">Student ID
          <input className={field} style={fs} inputMode="numeric" value={f.sid} onChange={set("sid")} placeholder="From your student card" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">Department
            <select className={field} style={fs} value={f.dept} onChange={set("dept")}>
              <option value="">Choose</option>
              {DEPTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Year
            <select className={field} style={fs} value={f.year} onChange={set("year")}>
              <option value="">Choose</option>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold">About you
          <textarea rows={2} className={field} style={fs} value={f.bio} onChange={set("bio")} placeholder="What you're into, languages you speak" />
        </label>
      </div>
      {err && <p className="mt-3 text-sm font-semibold" style={{ color: C.danger }}>{err}</p>}
      <button onClick={submit} className="mt-5 w-full font-bold py-3 rounded-full" style={{ background: C.ink, color: C.white }}>
        {firstTime ? "Continue" : "Save changes"}
      </button>
    </Sheet>
  );
}

function CreateForm({ onClose, onCreate }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ title: "", cat: "Chill", date: today, time: "19:00", place: "", max: "6", desc: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const field = "w-full mt-1 px-3 py-2.5 rounded-xl border bg-white";
  const fs = { borderColor: C.line, color: C.ink };
  const submit = () => {
    if (!f.title.trim()) return setErr("Add a title, like \"Football at 7\".");
    if (!f.place.trim()) return setErr("Add where people should meet.");
    const ts = new Date(`${f.date}T${f.time}`).getTime();
    if (!ts || ts < Date.now() - 5 * 60_000) return setErr("Pick a time that hasn't passed yet.");
    onCreate({ title: f.title.trim(), cat: f.cat, at: ts, place: f.place.trim(), max: Number(f.max) || 0, desc: f.desc.trim() });
  };
  return (
    <Sheet onClose={onClose} label="Create an activity">
      <h2 className="text-2xl font-extrabold pr-10">Create an activity</h2>
      <div className="mt-4 space-y-3">
        <label className="block text-sm font-semibold">What are you doing?
          <input className={field} style={fs} value={f.title} onChange={set("title")} placeholder="e.g. Basketball, sushi night, study for finals" />
        </label>
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setF({ ...f, cat: c })} className="px-3 py-1.5 rounded-full text-sm font-semibold border" style={f.cat === c ? { background: C.ink, color: C.white, borderColor: C.ink } : { borderColor: C.line, color: C.ink }}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">Date
            <input type="date" min={today} className={field} style={fs} value={f.date} onChange={set("date")} />
          </label>
          <label className="block text-sm font-semibold">Time
            <input type="time" className={field} style={fs} value={f.time} onChange={set("time")} />
          </label>
        </div>
        <label className="block text-sm font-semibold">Where
          <input className={field} style={fs} value={f.place} onChange={set("place")} placeholder="e.g. Main gate, library, Dorm B" />
        </label>
        <label className="block text-sm font-semibold">How many people, including you
          <select className={field} style={fs} value={f.max} onChange={set("max")}>
            {[2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map((n) => <option key={n} value={n}>{n}</option>)}
            <option value="0">No limit</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">Details
          <textarea rows={3} className={field} style={fs} value={f.desc} onChange={set("desc")} placeholder="What to bring, cost, level" />
        </label>
      </div>
      {err && <p className="mt-3 text-sm font-semibold" style={{ color: C.danger }}>{err}</p>}
      <button onClick={submit} className="mt-5 w-full font-bold py-3 rounded-full" style={{ background: C.tangerine, color: C.ink }}>Publish activity</button>
    </Sheet>
  );
}

function ChatsTab({ acts, me, onChat, goExplore }) {
  const list = me
    ? acts
        .filter((a) => a.going.includes(me.short) || a.host === me.short)
        .sort((x, y) => (y.chat.at(-1)?.t || 0) - (x.chat.at(-1)?.t || 0) || x.at - y.at)
    : [];
  if (!list.length)
    return (
      <div className="py-16 text-center">
        <p className="text-xl font-bold">No group chats yet.</p>
        <p className="mt-1" style={{ color: C.muted }}>Join an activity and you'll chat with everyone going.</p>
        <button onClick={goExplore} className="mt-5 font-bold px-5 py-3 rounded-full" style={{ background: C.ink, color: C.white }}>Find activities</button>
      </div>
    );
  return (
    <div className="mt-2">
      {list.map((a) => {
        const last = a.chat.at(-1);
        return (
          <button key={a.id} onClick={() => onChat(a.id)} className="w-full text-left flex gap-3 py-4 border-b items-center" style={{ borderColor: C.line }}>
            <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ background: C.mist, color: C.grove }}>
              <span className="text-xs font-bold leading-none">{dayLabel(a.at).slice(0, 3)}</span>
              <span className="text-sm font-extrabold leading-tight" style={{ fontVariantNumeric: "tabular-nums" }}>{hhmm(a.at)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2">
                <span className="font-bold truncate">{a.title}</span>
                {last && <span className="text-xs shrink-0" style={{ color: C.muted }}>{hhmm(last.t)}</span>}
              </div>
              <div className="text-sm truncate" style={{ color: C.muted }}>
                {last ? `${last.who === me.short ? "You" : last.who}: ${last.text}` : `${a.going.length} people · no messages yet`}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ProfileTab({ me, acts, onEdit, onSetup, onSignOut, onOpen }) {
  if (!me)
    return (
      <div className="py-16 text-center">
        <p className="text-xl font-bold">You're not signed in.</p>
        <p className="mt-1" style={{ color: C.muted }}>Set up a profile to join and host activities.</p>
        <button onClick={onSetup} className="mt-5 font-bold px-5 py-3 rounded-full" style={{ background: C.ink, color: C.white }}>Set up profile</button>
      </div>
    );
  const upcoming = acts.filter((a) => (a.going.includes(me.short) || a.host === me.short) && a.at > Date.now()).sort((x, y) => x.at - y.at);
  const hosting = upcoming.filter((a) => a.host === me.short).length;
  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <Avatar name={me.name} photo={me.photo} size={80} ring={false} />
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-tight">{me.name}</div>
          <div style={{ color: C.muted }}>{me.dept} · {me.year}</div>
        </div>
      </div>
      {me.bio && <p className="mt-4 leading-relaxed">{me.bio}</p>}

      <div className="mt-5 grid grid-cols-3 rounded-2xl overflow-hidden border" style={{ borderColor: C.line }}>
        {[["Student ID", me.sid], ["Going", upcoming.length - hosting], ["Hosting", hosting]].map(([k, v], i) => (
          <div key={k} className={`p-3 ${i ? "border-l" : ""}`} style={{ borderColor: C.line }}>
            <div className="text-xs" style={{ color: C.muted }}>{k}</div>
            <div className="font-extrabold text-lg" style={{ fontVariantNumeric: "tabular-nums" }}>{v}</div>
          </div>
        ))}
      </div>
      <p className="text-xs mt-2" style={{ color: C.muted }}>Only you can see your student ID.</p>

      <div className="mt-6 font-bold">Your upcoming plans</div>
      {upcoming.length === 0 ? (
        <p className="mt-1 text-sm" style={{ color: C.muted }}>Nothing yet. Join something or create your own.</p>
      ) : (
        upcoming.map((a) => (
          <button key={a.id} onClick={() => onOpen(a.id)} className="w-full text-left flex gap-3 py-3 border-b" style={{ borderColor: C.line }}>
            <span className="font-extrabold w-16 shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>{hhmm(a.at)}</span>
            <span className="flex-1 min-w-0">
              <span className="font-semibold block truncate">{a.title}</span>
              <span className="text-sm" style={{ color: C.muted }}>{dayLabel(a.at)}{a.host === me.short ? " · hosting" : ""}</span>
            </span>
          </button>
        ))
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={onEdit} className="flex-1 font-bold py-3 rounded-full" style={{ background: C.mist }}>Edit profile</button>
        <button onClick={onSignOut} className="flex-1 font-bold py-3 rounded-full" style={{ background: C.mist, color: C.danger }}>Sign out</button>
      </div>
    </div>
  );
}

export default function Hangout() {
  const [acts, setActs] = useState(SEED);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("explore");
  const [cat, setCat] = useState("All");
  const [openId, setOpenId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [person, setPerson] = useState(null);
  const [creating, setCreating] = useState(false);
  const [profileForm, setProfileForm] = useState(null); // { firstTime, then }
  const [toast, setToast] = useState("");

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;700;800&display=swap";
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  const flash = (t) => { setToast(t); setTimeout(() => setToast(""), 2200); };
  const needProfile = (action) => (me ? action(me) : setProfileForm({ firstTime: true, then: action }));

  const toggle = (a) =>
    needProfile((p) => {
      const was = a.going.includes(p.short);
      if (!was && a.max && a.going.length >= a.max) return;
      setActs((list) => list.map((x) => (x.id === a.id ? { ...x, going: was ? x.going.filter((n) => n !== p.short) : [...x.going, p.short] } : x)));
      if (was) flash(`You left "${a.title}"`);
      else { setOpenId(null); setChatId(a.id); flash("You're in. Say hi to the group."); }
    });

  const create = (data) =>
    needProfile((p) => {
      const a = { ...data, id: Date.now(), host: p.short, going: [p.short], chat: [] };
      setActs((list) => [...list, a]);
      setCreating(false);
      setCat("All");
      flash("Published. People can join now.");
    });

  const send = (id, text) => setActs((list) => list.map((x) => (x.id === id ? { ...x, chat: [...x.chat, { who: me.short, text, t: Date.now() }] } : x)));

  const groups = useMemo(() => {
    const list = acts.filter((a) => a.at > Date.now() - 2 * 3600_000).filter((a) => cat === "All" || a.cat === cat).sort((a, b) => a.at - b.at);
    const g = [];
    list.forEach((a) => {
      const label = dayLabel(a.at);
      const last = g[g.length - 1];
      if (last && last.label === label) last.items.push(a);
      else g.push({ label, items: [a] });
    });
    return g;
  }, [acts, cat]);

  const open = acts.find((a) => a.id === openId);
  const chat = acts.find((a) => a.id === chatId);
  const chatCount = me ? acts.filter((a) => a.going.includes(me.short) || a.host === me.short).length : 0;

  return (
    <div className="min-h-screen pb-24" style={{ background: C.white, color: C.ink, fontFamily: FONT }}>
      <header className="max-w-3xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CiuMark size={40} />
            <h1 className="text-3xl font-extrabold tracking-tight">hangout</h1>
          </div>
          {tab === "explore" && (
            <button onClick={() => setCreating(true)} className="font-bold px-4 py-2.5 rounded-full shrink-0" style={{ background: C.tangerine, color: C.ink }}>Create</button>
          )}
        </div>
        {tab === "explore" && (
          <>
            <p className="mt-2" style={{ color: C.muted }}>What CIU students are doing. Join in or start something.</p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {["All", ...CATS].map((c) => (
                <button key={c} onClick={() => setCat(c)} className="px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border" style={cat === c ? { background: C.grove, color: C.white, borderColor: C.grove } : { borderColor: C.line, color: C.ink }}>{c}</button>
              ))}
            </div>
          </>
        )}
        {tab === "chats" && <h2 className="mt-5 text-xl font-extrabold">Group chats</h2>}
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6">
        {tab === "explore" &&
          (groups.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-xl font-bold">Nothing planned here yet.</p>
              <p className="mt-1" style={{ color: C.muted }}>Start the first one, people usually join within the hour.</p>
              <button onClick={() => setCreating(true)} className="mt-5 font-bold px-5 py-3 rounded-full" style={{ background: C.ink, color: C.white }}>Create an activity</button>
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.label} className="mt-7">
                <h2 className="text-sm font-bold pb-2 border-b-2" style={{ color: C.grove, borderColor: C.ink }}>{g.label}</h2>
                {g.items.map((a) => <Row key={a.id} a={a} me={me} onOpen={setOpenId} onToggle={toggle} />)}
              </section>
            ))
          ))}
        {tab === "chats" && <ChatsTab acts={acts} me={me} onChat={setChatId} goExplore={() => setTab("explore")} />}
        {tab === "profile" && (
          <ProfileTab
            me={me}
            acts={acts}
            onOpen={setOpenId}
            onSetup={() => setProfileForm({ firstTime: true })}
            onEdit={() => setProfileForm({ firstTime: false })}
            onSignOut={() => { setMe(null); flash("Signed out"); }}
          />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 border-t z-40" style={{ background: C.white, borderColor: C.line }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3">
          {[["explore", "Activities"], ["chats", `Chats${chatCount ? ` (${chatCount})` : ""}`], ["profile", "Profile"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className="py-4 text-sm font-bold border-t-4" style={{ borderColor: tab === id ? C.tangerine : "transparent", color: tab === id ? C.ink : C.muted }}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {open && <Detail a={open} me={me} onClose={() => setOpenId(null)} onToggle={toggle} onChat={(id) => { setOpenId(null); setChatId(id); }} onPerson={setPerson} />}
      {chat && me && <ChatScreen a={chat} me={me} onClose={() => setChatId(null)} onSend={send} onPerson={setPerson} />}
      {person && <PersonCard name={person} me={me} acts={acts} onClose={() => setPerson(null)} />}
      {creating && <CreateForm onClose={() => setCreating(false)} onCreate={create} />}
      {profileForm && (
        <ProfileForm
          firstTime={profileForm.firstTime}
          initial={profileForm.firstTime ? null : me}
          onClose={() => setProfileForm(null)}
          onSave={(p) => {
            const then = profileForm.then;
            if (me && me.short !== p.short) {
              setActs((list) => list.map((a) => ({ ...a, host: a.host === me.short ? p.short : a.host, going: a.going.map((n) => (n === me.short ? p.short : n)), chat: a.chat.map((m) => (m.who === me.short ? { ...m, who: p.short } : m)) })));
            }
            setMe(p);
            setProfileForm(null);
            if (then) then(p);
            else flash(profileForm.firstTime ? "Profile ready" : "Profile saved");
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-full font-semibold z-50 text-sm" style={{ background: C.ink, color: C.white }} role="status">{toast}</div>
      )}
    </div>
  );
}
