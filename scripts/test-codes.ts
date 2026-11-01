async function main() {
  console.log("--- Testing Verification Code Strictness ---");

  // 1. Wrong code on register
  const regWrong = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: "Probe Test",
      phoneNumber: "+15550001122",
      password: "password123",
      verificationCode: "999999", // WRONG CODE
    }),
  });
  const regWrongData = await regWrong.json();
  console.log("1. Register with wrong code 999999 -> Status:", regWrong.status, regWrongData);

  // 2. Random code 000000 on phone login
  const phoneWrong = await fetch("http://localhost:3000/api/auth/phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber: "+15550001122",
      verificationCode: "000000", // WRONG CODE
      mode: "login",
    }),
  });
  const phoneWrongData = await phoneWrong.json();
  console.log("2. Phone login with wrong code 000000 -> Status:", phoneWrong.status, phoneWrongData);

  // 3. Correct code 123456 on register
  const regCorrect = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: "Probe Test",
      phoneNumber: "+15550001122",
      password: "password123",
      verificationCode: "123456", // CORRECT CODE
    }),
  });
  const regCorrectData = await regCorrect.json();
  console.log("3. Register with correct code 123456 -> Status:", regCorrect.status, regCorrectData?.message || regCorrectData?.error);

  // 4. Wrong code on phone login for the registered user
  const phoneWrongReg = await fetch("http://localhost:3000/api/auth/phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber: "+15550001122",
      verificationCode: "777777", // WRONG CODE
      mode: "login",
    }),
  });
  const phoneWrongRegData = await phoneWrongReg.json();
  console.log("4. Phone login with wrong code 777777 -> Status:", phoneWrongReg.status, phoneWrongRegData);

  // 5. Correct code on phone login for the registered user
  const phoneCorrectReg = await fetch("http://localhost:3000/api/auth/phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber: "+15550001122",
      verificationCode: "123456", // CORRECT CODE
      mode: "login",
    }),
  });
  const phoneCorrectRegData = await phoneCorrectReg.json();
  console.log("5. Phone login with correct code 123456 -> Status:", phoneCorrectReg.status, phoneCorrectRegData?.message || phoneCorrectRegData?.error);
}

main().catch(console.error);
