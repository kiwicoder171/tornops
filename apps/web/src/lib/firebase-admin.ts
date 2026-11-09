import { initializeApp, getApps, cert, App, ServiceAccount } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let adminApp: App | null = null;
let firestoreDb: Firestore | null = null;

export function getFirebaseAdminApp(): App | null {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // 1. Try FIREBASE_SERVICE_ACCOUNT_KEY (JSON string or Base64 encoded string)
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountRaw) {
    try {
      let parsed: ServiceAccount;
      if (serviceAccountRaw.trim().startsWith("{")) {
        parsed = JSON.parse(serviceAccountRaw);
      } else {
        const decoded = Buffer.from(serviceAccountRaw.trim(), "base64").toString("utf-8");
        parsed = JSON.parse(decoded);
      }
      adminApp = initializeApp({ credential: cert(parsed) });
      return adminApp;
    } catch (e) {
      console.error("[firebase-admin] Failed parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  // 2. Try individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      return adminApp;
    } catch (e) {
      console.error("[firebase-admin] Failed initializing with individual env vars:", e);
    }
  }

  // 3. Try local service-account.json (dev environment fallback)
  try {
    const localPaths = [
      path.resolve(process.cwd(), "service-account.json"),
      path.resolve(process.cwd(), "apps/web/service-account.json"),
      path.resolve(__dirname, "../../service-account.json"),
    ];

    for (const p of localPaths) {
      if (fs.existsSync(p)) {
        const fileContent = fs.readFileSync(p, "utf-8");
        const parsed = JSON.parse(fileContent);
        adminApp = initializeApp({ credential: cert(parsed) });
        return adminApp;
      }
    }
  } catch (e) {
    console.warn("[firebase-admin] Local service account file inspection error:", e);
  }

  // 4. Fallback to default credentials if project ID is provided
  if (projectId) {
    try {
      adminApp = initializeApp({ projectId });
      return adminApp;
    } catch (e) {
      console.error("[firebase-admin] Failed initializing default app:", e);
    }
  }

  return null;
}

export function getFirestoreDb(): Firestore | null {
  if (firestoreDb) return firestoreDb;
  const app = getFirebaseAdminApp();
  if (!app) return null;

  try {
    firestoreDb = getFirestore(app);
    return firestoreDb;
  } catch (e) {
    console.error("[firebase-admin] Failed getting Firestore instance:", e);
    return null;
  }
}
