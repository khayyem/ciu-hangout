// Выдаёт (или снимает) роль модератора через custom claim `admin`.
//
//   1. Firebase Console → Project settings → Service accounts → Generate new private key
//      Сохрани JSON рядом, НЕ коммить (service-account*.json в .gitignore).
//   2. GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
//        npx -y -p firebase-admin node scripts/set-admin.mjs someone@gmail.com
//      Снять роль: добавь флаг --remove
//   3. Пользователю нужно выйти и войти снова, чтобы роль применилась.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
const remove = process.argv.includes("--remove");
if (!email) {
  console.error("Usage: node scripts/set-admin.mjs <email> [--remove]");
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: !remove });
console.log(`${remove ? "Removed admin from" : "Granted admin to"} ${email} (${user.uid})`);
