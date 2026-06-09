import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAKhlBJk6gAZ5oNrCDniNGmrDOqPSLeirI",
  authDomain: "triviaworldcup-3930a.firebaseapp.com",
  projectId: "triviaworldcup-3930a",
  storageBucket: "triviaworldcup-3930a.firebasestorage.app",
  messagingSenderId: "909476377418",
  appId: "1:909476377418:web:e741d725943865572207b3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listUsers() {
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    
    console.log("All users in DB:");
    for (const docSnap of querySnapshot.docs) {
      console.log(`- Username: '${docSnap.data().username}', ID: ${docSnap.id}`);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

listUsers();
