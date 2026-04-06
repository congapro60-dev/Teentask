import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

let adminConfig: any = {
  projectId: firebaseConfig.projectId
};

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminConfig.credential = cert(serviceAccount);
    console.log("Firebase Admin initialized with Service Account.");
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT not found.");
}

initializeApp(adminConfig);

const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseConfig.firestoreDatabaseId)
  : getFirestore();

async function test() {
  try {
    const snapshot = await db.collection("applications").limit(1).get();
    console.log("Success! Found", snapshot.size, "docs.");
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
