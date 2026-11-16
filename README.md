# CIU Hangout

Студенты Cyprus International University создают активности (футбол, учёба, ужин, поездка),
другие присоединяются, и у всех участников появляется общий групповой чат.

React 19 + Vite + Tailwind v4, Firebase Auth (Google) + Firestore с реалтаймом.

## Запуск

```bash
npm install
npm run dev            # http://localhost:5173 — реальный Firebase
npm run dev -- --open "/?demo"   # демо-режим: данные в памяти, вход без Google
```

- `/?demo` — демо-режим с примерами активностей, ничего не сохраняется. `/?live` — выйти из него.
  Удобно показывать на встрече, если нет сети или домен ещё не разрешён в Firebase Auth.
- Переменные окружения — см. `.env.example`. Конфиг Firebase берётся из `VITE_FIREBASE_*`,
  без них используется проект `ciu-hangout-app`.

## Локально с эмуляторами Firebase

```bash
npx firebase-tools emulators:start --only auth,firestore    # нужна Java
VITE_USE_EMULATORS=1 npm run dev                            # вход: спросит email, без попапа
npm run test:rules     # тесты правил Firestore (через firebase-tools в PATH или npx)
```

## Деплой

1. **Правила Firestore** (обязательно, иначе приложение получит permission-denied):
   `npx firebase-tools deploy --only firestore:rules`
2. **Firebase Console → Authentication → Settings → Authorized domains**: добавить домен Vercel
   (например `ciu-hangout.vercel.app`; для превью PR — их домены тоже).
3. Vercel собирает `npm run build`, папка `dist`.

## Модерация

Кнопка Report на активности и в карточке человека пишет в коллекцию `reports`.
Модераторы (custom claim `admin`) видят жалобы во вкладке Profile и могут удалить любую активность.
Выдать роль: `scripts/set-admin.mjs` (инструкция внутри файла).

## Структура

```
src/
  App.jsx                 экраны, вкладки, навигация
  components/             ui, Activity, Chat, Forms, Profile
  data/firebaseBackend.js Firestore/Auth: подписки, транзакции join/leave
  data/demoBackend.js     то же API в памяти (демо-режим)
  data/store.jsx          React-контекст поверх бэкенда
  lib/                    константы, форматирование, ресайз фото
firestore.rules           правила доступа (тесты в tests/)
prototype/                исходный утверждённый прототип (эталон дизайна)
```

## Данные

| Коллекция | Поля | Доступ |
|---|---|---|
| `users/{uid}` | name, short, dept, year, bio, photoURL | читают все вошедшие, пишет владелец |
| `users_private/{uid}` | sid (Student ID, 6–10 цифр) | только владелец |
| `activities/{id}` | title, cat, at (ms), place, max, desc, hostUid, memberUids[], createdAt, lastMsgAt | читают студенты с профилем; join/leave только за себя и с проверкой лимита |
| `activities/{id}/messages/{id}` | uid, text, createdAt | только участники |
| `reports/{id}` | type, targetId, targetTitle, reason, details, reporterUid, status | создают все, читают админы |

Фото профиля уменьшается до 256×256 JPEG и хранится в `photoURL` как data URL (Storage/Blaze не нужен).
