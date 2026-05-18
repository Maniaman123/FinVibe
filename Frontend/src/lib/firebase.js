import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBy2ZUcPvny0lxeJYFcT8dPTf4REcW7u9k",
  authDomain: "finvibe-baa9d.firebaseapp.com",
  projectId: "finvibe-baa9d",
  storageBucket: "finvibe-baa9d.firebasestorage.app",
  messagingSenderId: "956218500440",
  appId: "1:956218500440:web:d7448595c5d55b051a712d",
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
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

/**
 * Sign in with Google via a pop-up window.
 * @returns {Promise<UserCredential>}
 */
export const loginWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

/**
 * Sign out the current user.
 * @returns {Promise<void>}
 */
export const logout = () => signOut(auth);

/**
 * Subscribe to Firebase Auth state changes.
 * @param {function} callback - Called with (user | null) on every auth change.
 * @returns {function} Unsubscribe function.
 */
export const subscribeToAuthState = (callback) =>
  onAuthStateChanged(auth, callback);

// ── Firestore Real-Time Listener ──────────────────────────────────────────────

/**
 * Subscribe to real-time transaction updates from Firestore.
 * Ordered by most recent first.
 * @param {function} callback - Called with an array of transaction objects.
 * @returns {function} Unsubscribe function.
 */
export function subscribeToTransactions(callback) {
  const q = query(
    collection(db, "transactions"),
    orderBy("processed_at", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data);
  });
}
