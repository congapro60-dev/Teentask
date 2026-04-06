import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

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
}

initializeApp(adminConfig);

const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseConfig.firestoreDatabaseId)
  : getFirestore();

async function resetScores() {
  console.log("Starting to reset trust scores...");
  const BOSS_EMAIL = "congapro60@gmail.com";
  
  try {
    const usersSnapshot = await db.collection("users").get();
    let updatedCount = 0;
    
    const batch = db.batch();
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (userData.email && userData.email.toLowerCase() === BOSS_EMAIL.toLowerCase()) {
        console.log(`Skipping boss account: ${userData.email}`);
        continue;
      }
      
      batch.update(doc.ref, { trustScore: 0 });
      updatedCount++;
    }
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully reset trustScore to 0 for ${updatedCount} users.`);
    } else {
      console.log("No users needed to be updated.");
    }
  } catch (error) {
    console.error("Error resetting scores:", error);
  }
}

resetScores().then(() => process.exit(0));
