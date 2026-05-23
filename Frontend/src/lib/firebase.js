import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  startAfter,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBpa6Jwtv_FgxblR2JYLn4bCU68a-zHVH0",
  authDomain: "projek-juaravibecoding.firebaseapp.com",
  projectId: "projek-juaravibecoding",
  storageBucket: "projek-juaravibecoding.firebasestorage.app",
  messagingSenderId: "506277879291",
  appId: "1:506277879291:web:f8333f661e4b2f1880ff5e",
  measurementId: "G-RK3SGZ7P93"
};

// ── App Initialization ────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

// ── Firestore (Real-time Dashboard) ──────────────────────────────────────────
export const db = getFirestore(app);

// ── Firebase Auth ─────────────────────────────────────────────────────────────
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ── Auth Helper Functions ─────────────────────────────────────────────────────

/**
 * Sign in with Email & Password.
 */
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

/**
 * Resolve the Google redirect result after returning from sign-in.
 * Called once on every app startup in App.jsx to reconcile any pending session.
 * With signInWithPopup now used universally, this mainly serves as a no-op
 * safety net — it resolves immediately with null if no redirect is pending.
 */
export const resolveGoogleRedirect = () => getRedirectResult(auth);

/**
 * Sign out the current user.
 */
export const logout = () => signOut(auth);

/**
 * Subscribe to Firebase Auth state changes.
 */
export const subscribeToAuthState = (callback) =>
  onAuthStateChanged(auth, callback);

// ── Firestore Real-Time Listeners ─────────────────────────────────────────────

/**
 * Subscribe to real-time transaction updates from Firestore.
 * Ordered by most recent first. Returns ALL transactions (global collection).
 * @param {function} callback - Called with an array of transaction objects.
 * @returns {function} Unsubscribe function.
 */
export function subscribeToTransactions(callback) {
  const q = query(
    collection(db, "transactions"),
    orderBy("processed_at", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(data);
    },
    (error) => {
      console.error("[Firestore] subscribeToTransactions error:", error);
      callback([]);
    }
  );
}

/**
 * Delete a transaction document from Firestore by its document ID.
 * @param {string} docId - The Firestore document ID.
 * @returns {Promise<void>}
 */
export const deleteTransaction = (docId) =>
  deleteDoc(doc(db, "transactions", docId));
