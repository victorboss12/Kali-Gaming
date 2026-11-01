import fs from "fs";
import path from "path";

async function testFormats() {
  const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
  const match = envContent.match(/NEXT_PUBLIC_FIREBASE_API_KEY="([^"]+)"/);
  const apiKey = match ? match[1] : null;

  const formats = [
    "+16504206842",
    "6504206842",
    "+1 650-420-6842",
    "+1-650-420-6842",
  ];

  for (const phone of formats) {
    console.log(`\nTesting format: "${phone}"`);
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
}

testFormats().catch(console.error);
