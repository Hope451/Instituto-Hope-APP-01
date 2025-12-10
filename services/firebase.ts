import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { SYSTEM_CONFIG } from "../constants";

// Check if config is valid
const isConfigured = () => {
    return SYSTEM_CONFIG.FIREBASE_CONFIG && 
           SYSTEM_CONFIG.FIREBASE_CONFIG.apiKey && 
           SYSTEM_CONFIG.FIREBASE_CONFIG.apiKey.length > 5;
};

let auth: any;
let db: any;

if (isConfigured()) {
  try {
    const app = initializeApp(SYSTEM_CONFIG.FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("🔥 Firebase: Conectado com sucesso.");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    // Continue in offline mode
  }
}

export const firebaseService = {
  isConfigured: isConfigured,

  login: async (email, password) => {
    if (!auth) throw new Error("Firebase não configurado.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  register: async (email, password) => {
    if (!auth) throw new Error("Firebase não configurado.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  logout: async () => {
    if (!auth) return;
    await signOut(auth);
  },

  // Helper to subscribe to users collection
  subscribeToUsers: (callback: (users: any[]) => void) => {
      if (!db) return () => {};
      
      const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
          const users: any[] = [];
          snapshot.forEach((doc) => {
              users.push({ ...doc.data(), id: doc.id });
          });
          callback(users);
      });
      return unsub;
  },
  
  // Generic save document
  saveDocument: async (collectionName: string, id: string, data: any) => {
      if (!db) return;
      try {
        await setDoc(doc(db, collectionName, id), data, { merge: true });
        console.log(`Documento salvo em ${collectionName}`);
      } catch (e) {
          console.error("Erro ao salvar no Firestore", e);
      }
  }
};