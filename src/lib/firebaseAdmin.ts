import fs from "fs";
import path from "path";

/**
 * Helper to detect and load Firebase service account or project credentials
 */
export function getFirebaseServiceAccount(): any | null {
  // 1. Check if JSON string is provided in environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.warn("Could not parse FIREBASE_SERVICE_ACCOUNT_KEY env var:", e);
    }
  }

  // 2. Check if a local service account file exists in root directory
  const possiblePaths = [
    path.join(process.cwd(), "firebase-service-account.json"),
    path.join(process.cwd(), "serviceAccountKey.json"),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileContent);
      } catch (e) {
        console.warn(`Could not read Firebase credentials file at ${filePath}:`, e);
      }
    }
  }

  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  return getFirebaseServiceAccount() !== null;
}
