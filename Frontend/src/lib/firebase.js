import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";

// TODO: Replace with your actual Firebase config from Firebase Console
// Note: You only need this for the read-only real-time listener.
// Uploads and writes are handled securely via our FastAPI backend.
const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_API_KEY",
  authDomain: "projek-juaravibecoding.firebaseapp.com",
  projectId: "projek-juaravibecoding",
  storageBucket: "projek-juaravibecoding.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Hook to listen to real-time transactions from Firestore
 */
export function subscribeToTransactions(callback) {
  const q = query(
    collection(db, "transactions"),
    orderBy("processed_at", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
}
