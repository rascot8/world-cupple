import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, increment, query, where } from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const loadEnvLocal = () => {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
};
const env = loadEnvLocal();
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAKhlBJk6gAZ5oNrCDniNGmrDOqPSLeirI',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'triviaworldcup-3930a.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'triviaworldcup-3930a',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'triviaworldcup-3930a.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '909476377418',
  appId: env.VITE_FIREBASE_APP_ID || '1:909476377418:web:e741d725943865572207b3'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const run = async () => {
  console.log('Finding user Taydoe...');
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);
  let found = false;

  snap.forEach(d => {
    const data = d.data();
    if (data.username === 'Taydoe' || data.displayName === 'Taydoe' || data.email?.includes('taydoe')) {
      found = true;
      console.log('Found user:', d.id, data.username, data.displayName);
      const userRef = doc(db, 'users', d.id);
      updateDoc(userRef, {
        isAdmin: true,
        coins: increment(2000)
      }).then(() => {
        console.log('Successfully updated Taydoe.');
        process.exit(0);
      });
    }
  });

  if (!found) {
    console.log('User Taydoe not found. Checking all user documents for names:');
    snap.forEach(d => console.log(d.id, d.data().username, d.data().displayName));
    process.exit(1);
  }
};

run();
