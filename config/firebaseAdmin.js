import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (err) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
    }
  }

  const customPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const defaultPath = path.resolve(__dirname, "..", "serviceAccountKey.json");
  const finalPath = customPath
    ? path.resolve(customPath)
    : defaultPath;

  if (fs.existsSync(finalPath)) {
    return JSON.parse(fs.readFileSync(finalPath, "utf-8"));
  }

  return null;
};

if (!admin.apps.length) {
  const serviceAccount = parseServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(projectId ? { projectId } : {}),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });
  }
}

export default admin;
