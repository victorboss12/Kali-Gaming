async function testUserCredentials() {
  console.log("=== Testing Configured Test Phone 650-420-6842 with Code 543216 ===");

  const phone = "+16504206842";
  const validCode = "543216";
  const wrongCode = "999999";

  // 1. Try registering with wrong code 999999
  console.log("\n[1] Register with wrong code 999999:");
  const regWrong = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: "Victor Kali Player",
      phoneNumber: phone,
      password: "TestPassword123!",
      verificationCode: wrongCode,
    }),
  });
  const regWrongData = await regWrong.json();
  console.log("Status:", regWrong.status, regWrongData);

  // 2. Register with correct test code 543216
  console.log("\n[2] Register with correct test code 543216:");
  const regCorrect = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: "Victor Kali Player",
      phoneNumber: phone,
      password: "TestPassword123!",
      verificationCode: validCode,
    }),
  });
  const regCorrectData = await regCorrect.json();
  console.log("Status:", regCorrect.status, regCorrectData?.message || regCorrectData?.error);
  console.log("User Created:", regCorrectData?.user?.displayName, regCorrectData?.user?.phoneNumber);

  // 3. Login with wrong code 999999
  console.log("\n[3] Login with wrong code 999999:");
  const loginWrong = await fetch("http://localhost:3000/api/auth/phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber: phone,
      verificationCode: wrongCode,
      mode: "login",
    }),
  });
  const loginWrongData = await loginWrong.json();
  console.log("Status:", loginWrong.status, loginWrongData);

  // 4. Login with correct code 543216
  console.log("\n[4] Login with correct code 543216:");
  const loginCorrect = await fetch("http://localhost:3000/api/auth/phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber: phone,
      verificationCode: validCode,
      mode: "login",
    }),
  });
  const loginCorrectData = await loginCorrect.json();
  console.log("Status:", loginCorrect.status, loginCorrectData?.message || loginCorrectData?.error);
  console.log("User Logged In:", loginCorrectData?.user?.displayName, loginCorrectData?.user?.phoneNumber);
}

testUserCredentials().catch(console.error);
