import fs from "fs";
import path from "path";

async function checkFirebase() {
  const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
  const match = envContent.match(/NEXT_PUBLIC_FIREBASE_API_KEY="([^"]+)"/);
  const apiKey = match ? match[1] : null;

  const phone = "+19851130840";
  console.log(`Checking Firebase for phone: ${phone}`);

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone }),
    }
  );
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

checkFirebase().catch(console.error);
