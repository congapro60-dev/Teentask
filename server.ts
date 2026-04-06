import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import cron from "node-cron";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
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
  console.warn("FIREBASE_SERVICE_ACCOUNT not found. Firestore admin access may be denied.");
}

initializeApp(adminConfig);

const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseConfig.firestoreDatabaseId)
  : getFirestore();

// Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Automated Email Reminder Logic
const sendParentReminders = async () => {
  console.log("Checking for pending parent approvals...");
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
  const thresholdDate = Timestamp.fromMillis(fortyEightHoursAgo);

  try {
    console.log(`Testing Firestore access for database: ${firebaseConfig.firestoreDatabaseId || '(default)'}...`);
    const testSnapshot = await db.collection("applications").limit(1).get();
    console.log("Firestore access successful. Found", testSnapshot.size, "docs.");
    
    const snapshot = await db.collection("applications")
      .where("parentStatus", "==", "pending")
      .get();

    if (snapshot.empty) {
      console.log("No pending applications older than 48 hours.");
      return;
    }

    for (const doc of snapshot.docs) {
      const app = doc.data();
      const studentId = app.studentId;

      // Fetch student profile to get parent email
      const studentDoc = await db.collection("users").doc(studentId).get();
      if (!studentDoc.exists) continue;

      const studentProfile = studentDoc.data();
      const parentEmail = studentProfile?.parentEmail;

      if (parentEmail) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: parentEmail,
          subject: "Nhắc nhở: Xác minh đơn ứng tuyển của con bạn",
          text: `Chào bạn, đơn ứng tuyển của ${app.studentName} cho công việc "${app.jobTitle || 'TeenTasker'}" vẫn đang chờ bạn xác nhận. Vui lòng đăng nhập vào TeenTasker để xem và duyệt đơn này.`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #4F46E5;">Nhắc nhở xác minh đơn ứng tuyển</h2>
              <p>Chào bạn,</p>
              <p>Đơn ứng tuyển của <strong>${app.studentName}</strong> cho công việc <strong>"${app.jobTitle || 'TeenTasker'}"</strong> vẫn đang chờ bạn xác nhận sau 48 giờ.</p>
              <p>Vui lòng đăng nhập vào ứng dụng TeenTasker để xem chi tiết và duyệt đơn này để con bạn có thể bắt đầu công việc.</p>
              <br/>
              <p>Trân trọng,<br/>Đội ngũ TeenTasker</p>
            </div>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`Reminder sent to ${parentEmail} for application ${doc.id}`);
          
          // Add a notification for the student
          await db.collection("notifications").add({
            userId: studentId,
            title: "Nhắc nhở phụ huynh",
            message: `Hệ thống đã gửi email nhắc nhở đến phụ huynh của bạn cho đơn ứng tuyển "${app.jobTitle || 'công việc'}".`,
            type: "parent_pending",
            applicationId: doc.id,
            createdAt: Date.now(),
            read: false
          });

        } catch (emailError) {
          console.error(`Error sending email to ${parentEmail}:`, emailError);
        }
      }
    }
  } catch (error: any) {
    console.error("Error in sendParentReminders:", error);
    if (error.code) console.error("Error Code:", error.code);
    if (error.details) console.error("Error Details:", error.details);
    if (error.metadata) console.error("Error Metadata:", error.metadata);
  }
};

// Schedule the task to run every hour
cron.schedule("0 * * * *", sendParentReminders);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Manual trigger for testing (optional)
  app.post("/api/admin/trigger-reminders", async (req, res) => {
    await sendParentReminders();
    res.json({ message: "Reminders triggered" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
