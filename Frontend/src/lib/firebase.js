import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";


// TODO: Replace with your actual Firebase config from Firebase Console
// Note: You only need this for the read-only real-time listener.
// Uploads and writes are handled securely via our FastAPI backend.
const firebaseConfig = {
  apiKey: "AIzaSyBy2ZUcPvny0lxeJYFcT8dPTf4REcW7u9k",
  authDomain: "finvibe-baa9d.firebaseapp.com",
  projectId: "finvibe-baa9d",
  storageBucket: "finvibe-baa9d.firebasestorage.app",
  messagingSenderId: "956218500440",
  appId: "1:956218500440:web:d7448595c5d55b051a712d"
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
