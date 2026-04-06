import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection to Firestore
async function testConnection() {
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
