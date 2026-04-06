import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Fallback config for development/AI Studio
let firebaseConfig: any = {};

try {
  // Try to load from the JSON file first (AI Studio default)
  // We use a dynamic import to avoid build errors if the file is missing
  // @ts-ignore
  const config = await import('../firebase-applet-config.json');
  firebaseConfig = config.default || config;
} catch (e) {
  // ignore
}

// Override with environment variables if available (for Render/Production)
const env = (import.meta as any).env;
const envConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId
};

// Merge configs: prefer env variables if they exist
const finalConfig = {
  ...firebaseConfig,
  ...(envConfig.apiKey ? envConfig : {})
};

// Ensure we have at least a project ID to avoid crash
if (!finalConfig.projectId && !finalConfig.apiKey) {
  console.error("Firebase configuration is missing! Please set environment variables or provide firebase-applet-config.json");
}

const app = getApps().length === 0 ? initializeApp(finalConfig) : getApp();
export const db = getFirestore(app, finalConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Test connection to Firestore
async function testConnection() {
  if (!finalConfig.projectId) return;
  try {
    // Attempt to fetch a non-existent doc from server to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection test successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore configuration error: The client is offline. Please check your Firebase project and database settings.");
    } else {
      console.error("Firestore connection test failed:", error);
    }
  }
}

testConnection();
