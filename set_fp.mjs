import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

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

async function setFP() {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", "rascot8"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("User 'rascot8' not found in database!");
      process.exit(1);
    }
    
    for (const docSnap of querySnapshot.docs) {
      await updateDoc(doc(db, "users", docSnap.id), {
        fp: 2248
      });
      console.log(`Successfully updated user 'rascot8' (ID: ${docSnap.id}) to 2248 FP.`);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

setFP();
