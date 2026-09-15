import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2PMjqKfJpe15_eHHUkk4Zc_bMw4ca53k",
  authDomain: "aquabalance-9f3b5.firebaseapp.com",
  projectId: "aquabalance-9f3b5",
  storageBucket: "aquabalance-9f3b5.firebasestorage.app",
  messagingSenderId: "249696762983",
  appId: "1:249696762983:web:428594c60d65d42266e8c2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = "admin@aquabalance.com";
const password = "!4dm1n@123";

async function main() {
  let user;
  try {
    console.log("Attempting sign in with", email);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    user = cred.user;
    console.log("Admin account exists! UID:", user.uid);
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      console.log("Account does not exist yet. Creating user...");
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
        console.log("Created user with UID:", user.uid);
      } catch (createErr) {
        if (createErr.code === "auth/email-already-in-use") {
          console.log("Email already in use, trying to proceed with existing user...");
          const cred = await signInWithEmailAndPassword(auth, email, password);
          user = cred.user;
        } else {
          throw createErr;
        }
      }
    } else {
      console.error("Sign in error:", err.code, err.message);
      throw err;
    }
  }

  // Ensure role is admin in Firestore
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  
  const userData = {
    userId: user.uid,
    name: "System Administrator",
    email: email,
    role: "admin",
    volumeUnit: "ml",
    createdAt: snap.exists() && snap.data()?.createdAt ? snap.data().createdAt : new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  await setDoc(userRef, userData, { merge: true });
  console.log("Admin profile verified and updated in Firestore users/" + user.uid);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
