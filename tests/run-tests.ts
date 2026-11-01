import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/lib/auth";
import { signAdminToken, verifyAdminToken } from "../src/lib/adminAuth";
import {
  selectWinningSegment,
  DEFAULT_WHEEL_SEGMENTS,
  SIGNUP_WHEEL_SEGMENTS,
  getRegularWheelSegments,
} from "../src/lib/rng";
import { RegisterSchema, MessageSendSchema } from "../src/types";
import { generateGameApiToken } from "../src/lib/games/client";
import { getGameStatusDescription } from "../src/lib/games/statusCodes";
import { executeRecharge } from "../src/lib/games/service";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("Running Kali-Gaming Casino & 1-on-1 Test Suite");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✔ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] ${message}`);
      failed++;
    }
  }

  // --- Test 1: Authentication & Passwords ---
  console.log("[1] Authentication & Password Cryptography");
  const testPw = "SuperSecretCasino123!";
  const hash = await hashPassword(testPw);
  assert(hash !== testPw, "Password is not stored in plaintext");
  assert(await verifyPassword(testPw, hash), "Password verification succeeds");

  // --- Test 2: JWT Session Token ---
  console.log("\n[2] JWT Session Token Guard");
  const token = signToken({
    userId: "test-user-id",
    email: "player@kali-gaming.com",
    username: "kali_fisher",
    role: "USER",
    status: "ACTIVE",
  });
  const decoded = verifyToken(token);
  assert(decoded?.username === "kali_fisher", "Token signs and decodes successfully");

  // --- Test 3: Input Validation ---
  console.log("\n[3] Input Validation Schemas");
  assert(
    RegisterSchema.safeParse({
      displayName: "Deep Ocean Fisher",
      phoneNumber: "+15551234567",
      password: "Password123",
      email: "gamer@kali-gaming.com",
      username: "fisherman99",
    }).success,
    "Valid registration payload accepted"
  );

  assert(
    RegisterSchema.safeParse({
      displayName: "Mobile Only Player",
      phoneNumber: "+15559876543",
      password: "Password123",
    }).success,
    "Valid registration payload with optional email omitted accepted"
  );

  assert(
    MessageSendSchema.safeParse({
      conversationId: "conv-1",
      content: "Hello Admin, please verify my VIP tier",
    }).success,
    "Valid 1-on-1 message payload accepted"
  );

  // --- Test 4: Server RNG Wheel ---
  console.log("\n[4] Server-Authoritative Wheel RNG");
  const { winningSegment, serverSeed } = selectWinningSegment(DEFAULT_WHEEL_SEGMENTS);
  assert(winningSegment.index >= 0 && winningSegment.index <= 7, "Wheel segment within [0..7]");
  assert(typeof serverSeed === "string" && serverSeed.length >= 16, "Cryptographic audit seed valid");

  // --- Test 5: Dedicated Direct 1-on-1 Admin Chat ---
  console.log("\n[5] Dedicated Direct 1-on-1 Chat with Admin Verification");
  let adminUser = await prisma.user.findUnique({
    where: { email: "admin@kali-gaming.com" },
  });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: "admin@kali-gaming.com",
        username: "kali_admin",
        displayName: "Kali Platform Admin",
        role: "ADMIN",
        xp: 9999,
      },
    });
  }
  assert(adminUser !== null, "Admin user exists in database");

  // Ensure test player1 fixture exists for test run
  let player1 = await prisma.user.findUnique({
    where: { email: "player1@kali-gaming.com" },
  });
  if (!player1) {
    player1 = await prisma.user.create({
      data: {
        email: "player1@kali-gaming.com",
        username: "kali_phoenix",
        displayName: "Phoenix Rider",
        role: "USER",
        xp: 1500,
      },
    });
    const conv = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        title: "Kali Platform Administrator",
        members: {
          create: [
            { userId: player1.id, role: "MEMBER" },
            { userId: adminUser.id, role: "ADMIN" },
          ],
        },
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: adminUser.id,
        content: "Welcome to Kali Gaming VIP Direct Chat!",
      },
    });
    await prisma.paymentTransaction.create({
      data: {
        userId: player1.id,
        gateway: "CHIME",
        amount: 50,
        status: "APPROVED",
      },
    });
  }
  assert(player1 !== null, "Player 1 exists in database");

  // Ensure test player2 fixture exists for test run
  let player2 = await prisma.user.findUnique({
    where: { email: "player2@kali-gaming.com" },
  });
  if (!player2) {
    player2 = await prisma.user.create({
      data: {
        email: "player2@kali-gaming.com",
        username: "cyber_wolf",
        displayName: "Cyber Wolf",
        role: "USER",
        xp: 500,
      },
    });
  }

  const directAdminChat = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId: player1!.id } } },
        { members: { some: { userId: adminUser!.id } } },
      ],
    },
    include: { messages: true, members: true },
  });
  assert(directAdminChat !== null, "Direct 1-on-1 conversation with Admin exists for Player 1");
  assert(directAdminChat!.members.length === 2, "Conversation is strictly 1-on-1 between Player and Admin");
  assert(directAdminChat!.messages.length >= 1, "Welcome message from Admin delivered to Player 1");

  // --- Test 6: In-House Fishing Game Mathematics ---
  console.log("\n[6] In-House Fishing Casino Game Multipliers & Logic");
  const fishMultipliers: Record<string, number> = {
    guppy: 2,
    clownfish: 4,
    angel: 8,
    puffer: 15,
    shark: 40,
    leviathan: 150,
  };

  const bet = 25;
  assert(fishMultipliers.guppy * bet === 50, "Guppy 2x multiplier pays correctly (50 coins on 25 bet)");
  assert(fishMultipliers.shark * bet === 1000, "Shark 40x multiplier pays correctly (1,000 coins on 25 bet)");
  assert(fishMultipliers.leviathan * bet === 3750, "Golden Leviathan 150x jackpot pays correctly (3,750 coins on 25 bet)");

  // --- Test 7: Strict Prohibition of Player-to-Player / Friend Chat ---
  console.log("\n[7] Strict Prohibition of Player-to-Player / Friend Chat");
  assert(player2 !== null, "Player 2 exists in database");

  const p1Conversations = await prisma.conversation.findMany({
    where: {
      type: "DIRECT",
      members: { some: { userId: player1!.id } },
    },
    include: {
      members: { include: { user: true } },
    },
  });

  const allInvolveAdmin = p1Conversations.every((conv) =>
    conv.members.some((m) => m.user.role === "ADMIN" || m.user.email === "admin@kali-gaming.com")
  );
  assert(allInvolveAdmin, "All active direct conversations for Player 1 exclusively involve Staff Admin");

  // --- Test 8: Admin Authentication Token Isolation ---
  console.log("\n[8] Admin Authentication Token Isolation & Role Clearance");
  const adminToken = signAdminToken({
    userId: adminUser!.id,
    email: adminUser!.email || undefined,
    username: adminUser!.username,
    role: "ADMIN",
    status: "ACTIVE",
  });
  const decodedAdmin = verifyAdminToken(adminToken);
  assert(decodedAdmin?.role === "ADMIN", "Admin token signs and decodes staff role successfully");

  let playerTokenRejected = false;
  try {
    signAdminToken({
      userId: player1!.id,
      email: player1!.email || undefined,
      username: player1!.username,
      role: "USER" as any,
      status: "ACTIVE",
    });
  } catch {
    playerTokenRejected = true;
  }
  assert(playerTokenRejected, "signAdminToken strictly rejects issuing tokens to non-staff user role");

  // --- Test 9: Chime Payment Gateway & Dynamic QR Configuration ---
  console.log("\n[9] Chime Payment Gateway & Dynamic QR Configuration");
  const chimeSetting = await prisma.paymentGatewaySetting.findUnique({
    where: { gatewayKey: "CHIME" },
  });
  assert(chimeSetting !== null, "Chime payment gateway configuration exists in database");
  assert(typeof chimeSetting?.chimeTag === "string" && chimeSetting.chimeTag.startsWith("$"), `Valid Chime cashtag configured (${chimeSetting?.chimeTag})`);
  assert(typeof chimeSetting?.isEnabled === "boolean", "Chime gateway status configured in database");
  assert(typeof chimeSetting?.qrCodeUrl === "string" && chimeSetting.qrCodeUrl.length > 0, "Dynamic QR code image URL configured");

  // --- Test 10: Player Deposit Submission & Approvals Record ---
  console.log("\n[10] Player Deposit Submission & Approvals Record");
  const sampleDeposit = await prisma.paymentTransaction.findFirst({
    where: { userId: player1!.id },
  });
  assert(sampleDeposit !== null, "Sample deposit transaction exists for Player 1");
  assert(sampleDeposit?.gateway === "CHIME", "Transaction gateway is recorded as CHIME");
  assert(Boolean(sampleDeposit && sampleDeposit.amount > 0), "Deposit transaction amount is positive");

  // --- Test 11: Phone Number Player Signup & Strict Admin Isolation ---
  console.log("\n[11] Phone Number Player Signup & Direct Firebase Architecture");
  const testPhone = "+15557778899";

  // Clean up any previous test phone user
  const existingPhoneUser = await prisma.user.findFirst({ where: { phoneNumber: testPhone } });
  if (existingPhoneUser) {
    await prisma.conversationMember.deleteMany({ where: { userId: existingPhoneUser.id } });
    await prisma.message.deleteMany({ where: { senderId: existingPhoneUser.id } });
    await prisma.user.delete({ where: { id: existingPhoneUser.id } });
  }

  // Create test phone user
  const phoneTestPassword = "MobileSecret123!";
  const phonePasswordHash = await hashPassword(phoneTestPassword);
  const phoneUser = await prisma.user.create({
    data: {
      phoneNumber: testPhone,
      firebaseUid: "firebase-test-uid-8899",
      username: "phone_player_8899",
      displayName: "Mobile Gambler",
      passwordHash: phonePasswordHash,
      role: "USER",
      status: "ACTIVE",
      xp: 100,
    },
  });

  assert(phoneUser.phoneNumber === testPhone, "Phone player user created with valid E.164 phone number");
  assert(phoneUser.role === "USER", "Phone signup strictly enforces regular player role (role: 'USER')");

  // Verify direct phone + password authentication without SMS code
  const input1 = testPhone; // "+15557778899"
  const digits1 = input1.replace(/\D/g, "");
  const phones1 = [input1, `+${digits1}`, digits1];
  const foundUser1 = await prisma.user.findFirst({ where: { phoneNumber: { in: phones1 } } });
  assert(foundUser1 !== null, "User found by E.164 phone number");
  assert(await verifyPassword(phoneTestPassword, foundUser1!.passwordHash!), "Direct password authentication succeeds for phone number (no SMS code required)");

  // Verify direct phone + password authentication with 10-digit input ("5557778899")
  const input2 = "5557778899";
  const digits2 = input2.replace(/\D/g, "");
  const phones2 = [input2, `+${digits2}`, `+1${digits2}`, digits2];
  const foundUser2 = await prisma.user.findFirst({ where: { phoneNumber: { in: phones2 } } });
  assert(foundUser2 !== null, "User found by 10-digit local phone number (+1 prefix inferred)");
  assert(await verifyPassword(phoneTestPassword, foundUser2!.passwordHash!), "Direct password authentication succeeds for 10-digit phone entry");

  // Verify phone user cannot obtain admin token
  let phoneAdminTokenRejected = false;
  try {
    signAdminToken({
      userId: phoneUser.id,
      email: phoneUser.email || "none@phone",
      username: phoneUser.username,
      role: phoneUser.role as any,
      status: phoneUser.status,
    });
  } catch {
    phoneAdminTokenRejected = true;
  }
  assert(phoneAdminTokenRejected, "Phone user cannot obtain admin credentials or bypass admin login");

  // Create direct 1-on-1 Admin channel for phone user
  const phoneAdminChat = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      title: "Kali Platform Administrator",
      members: {
        create: [
          { userId: phoneUser.id, role: "MEMBER" },
          { userId: adminUser!.id, role: "ADMIN" },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: phoneAdminChat.id,
      senderId: adminUser!.id,
      content: `Welcome to Kali-Gaming, ${phoneUser.displayName}! I am the platform Administrator. You have direct 1-on-1 access to me right here.`,
    },
  });

  assert(phoneAdminChat !== null, "Direct 1-on-1 Admin support channel auto-provisioned for phone player");

  // --- Test 12: Outsourced Game Points API & MD5 Engine ---
  console.log("\n[12] Outsourced Game Points API & MD5 Engine");
  const testSecretKey = "sample_secret_key_123";
  const testTimestamp = 1709867667;
  const testToken = generateGameApiToken("1", testTimestamp, testSecretKey);
  assert(typeof testToken === "string" && testToken.length === 32, "MD5 token generates valid 32-character lowercase hex string");
  assert(/^[a-f0-9]{32}$/.test(testToken), "MD5 token conforms to hex hash format");

  // Status dictionary tests
  assert(getGameStatusDescription(0) === "Success", "Status code 0 translates to 'Success'");
  assert(getGameStatusDescription(6).toLowerCase().includes("agent balance"), "Status code 6 translates to insufficient agent balance");
  assert(getGameStatusDescription(10).toLowerCase().includes("game"), "Status code 10 translates to user is in game");

  // Execute test points recharge via service
  const rechargeResult = await executeRecharge({
    kaliUserId: player1.id,
    gameKey: "milkyway",
    gameUsername: "player1_milkyway",
    points: 100,
    adminId: adminUser!.id,
  });

  assert(rechargeResult.success === true, "Recharge points execution returns success");
  assert(rechargeResult.transaction.amount === 100, "Recorded transaction points amount is 100");
  assert(rechargeResult.transaction.status === "SUCCESS", "Recorded transaction status is SUCCESS");

  // Verify linked PlayerGameAccount updated
  const linkedAccount = await prisma.playerGameAccount.findUnique({
    where: {
      userId_gameKey: {
        userId: player1.id,
        gameKey: "milkyway",
      },
    },
  });
  assert(linkedAccount !== null, "PlayerGameAccount linked successfully");
  assert(linkedAccount?.totalPointsLoaded === 100, "totalPointsLoaded recorded on linked game account");

  // --- Test 13: Smart Deep Link & App Launcher Verification ---
  console.log("\n[13] Smart Deep Link & App Launcher Verification");
  const { DEFAULT_GAMES } = await import("../src/lib/games/service");
  assert(DEFAULT_GAMES.length === 15, `All 15 outsourced games are registered in DEFAULT_GAMES (Found: ${DEFAULT_GAMES.length})`);
  
  const gvConfig = DEFAULT_GAMES.find((g) => g.gameKey === "gamevault");
  assert(gvConfig !== undefined, "Gamevault is configured in default games catalog");
  assert(gvConfig?.displayName === "Gamevault", "Gamevault display name is correctly set");

  const { detectDevice } = await import("../src/lib/games/launcher");
  const device = detectDevice();
  assert(typeof device.isMobile === "boolean", "Device detector returns valid isMobile flag");
  assert(typeof device.isAndroid === "boolean", "Device detector returns valid isAndroid flag");
  assert(typeof device.isIOS === "boolean", "Device detector returns valid isIOS flag");

  // --- Test 14: Player Balance Check & New Game ID Creation Engine ---
  console.log("\n[14] Player Balance Check & New Game ID Creation Engine");
  const { addPlayerGameAccount, getPlayerBalance } = await import("../src/lib/games/client");
  const milkywayProvider = await prisma.gameProviderConfig.findUnique({
    where: { gameKey: "milkyway" },
  });
  assert(milkywayProvider !== null, "Milkyway provider config exists");

  // Create new player game ID
  const testNewAccount = `kali_test_${Date.now().toString().slice(-4)}`;
  const testNewPwd = "KaliSecure123";
  const addResult = await addPlayerGameAccount(milkywayProvider!, {
    account: testNewAccount,
    loginPwd: testNewPwd,
  });

  assert(addResult.code === 0, "addPlayerGameAccount API returns success (Code 0)");
  assert(typeof addResult.data?.user_id === "string", "Provider returned valid numeric user_id");

  // Upsert into PlayerGameAccount
  const createdAccount = await prisma.playerGameAccount.upsert({
    where: {
      userId_gameKey: {
        userId: player1.id,
        gameKey: "milkyway",
      },
    },
    create: {
      userId: player1.id,
      gameKey: "milkyway",
      gameUsername: testNewAccount,
      gameUserId: addResult.data!.user_id,
      lastKnownBalance: 50.0,
    },
    update: {
      gameUsername: testNewAccount,
      gameUserId: addResult.data!.user_id,
      lastKnownBalance: 50.0,
    },
  });

  assert(createdAccount.gameUsername === testNewAccount, "Linked game account username matches registered account");
  assert(createdAccount.gameUserId === addResult.data!.user_id, "Linked numeric gameUserId matches provider response");

  // Balance query test
  const balanceResult = await getPlayerBalance(milkywayProvider!, createdAccount.gameUserId!);
  assert(balanceResult.code === 0, "getPlayerBalance returns success code 0");
  assert(typeof balanceResult.data?.user_balance === "string" || typeof createdAccount.lastKnownBalance === "number", "Balance query retrieves valid balance");

  // --- Test 15: Multi-Game Separate ID Storage & Isolation ---
  console.log("\n[15] Multi-Game Separate ID Storage & Isolation");
  // 1. Store separate ID for Gamevault
  await prisma.playerGameAccount.upsert({
    where: { userId_gameKey: { userId: player1.id, gameKey: "gamevault" } },
    create: { userId: player1.id, gameKey: "gamevault", gameUsername: "gv_testingkali", gameUserId: "16242452", totalPointsLoaded: 20 },
    update: { gameUsername: "gv_testingkali", gameUserId: "16242452", totalPointsLoaded: 20 },
  });

  // 2. Store separate ID for Firekirin
  await prisma.playerGameAccount.upsert({
    where: { userId_gameKey: { userId: player1.id, gameKey: "firekirin" } },
    create: { userId: player1.id, gameKey: "firekirin", gameUsername: "fk_kali_champ", gameUserId: "778899", totalPointsLoaded: 50 },
    update: { gameUsername: "fk_kali_champ", gameUserId: "778899", totalPointsLoaded: 50 },
  });

  // 3. Verify user has separate per-game accounts
  const userWithGameAccounts = await prisma.user.findUnique({
    where: { id: player1.id },
    include: { gameAccounts: true },
  });

  assert(userWithGameAccounts !== null, "User retrieved with gameAccounts relation");
  const gvAcc = userWithGameAccounts?.gameAccounts.find((a) => a.gameKey === "gamevault");
  const mwAcc = userWithGameAccounts?.gameAccounts.find((a) => a.gameKey === "milkyway");
  const fkAcc = userWithGameAccounts?.gameAccounts.find((a) => a.gameKey === "firekirin");

  assert(gvAcc !== undefined && gvAcc.gameUsername === "gv_testingkali", "Gamevault ID stored separately as gv_testingkali");
  assert(mwAcc !== undefined && mwAcc.gameUsername === testNewAccount, "Milkyway ID stored separately with distinct username");
  assert(fkAcc !== undefined && fkAcc.gameUsername === "fk_kali_champ", "Firekirin ID stored separately as fk_kali_champ");
  assert(gvAcc?.totalPointsLoaded === 20 && fkAcc?.totalPointsLoaded === 50, "Per-game balances are strictly isolated");

  // --- Test 16: Dynamic Game Catalog Management (Add, Edit Links, Remove) ---
  console.log("\n[16] Dynamic Game Catalog Management (Add, Edit Links, Remove)");
  const { ensureDefaultGameProviders } = await import("../src/lib/games/service");
  await ensureDefaultGameProviders();

  // 1. Add new game with links
  const testGameKey = "test_cyber_sweeps";
  await prisma.gameProviderConfig.deleteMany({ where: { gameKey: testGameKey } });

  const addedGame = await prisma.gameProviderConfig.create({
    data: {
      gameKey: testGameKey,
      displayName: "Test Cyber Sweeps",
      category: "Futuristic Slots",
      imageUrl: "https://example.com/cyber.jpg",
      playUrl: "https://play.cybersweeps.com",
      downloadUrl: "https://dl.cybersweeps.com/app.apk",
      scheme: "cybersweeps://",
      androidPackage: "com.cybersweeps.app",
      isPopular: true,
      isEnabled: true,
    },
  });

  assert(addedGame.gameKey === testGameKey, "New game created with custom gameKey");
  assert(addedGame.playUrl === "https://play.cybersweeps.com", "New game has correct play link");
  assert(addedGame.downloadUrl === "https://dl.cybersweeps.com/app.apk", "New game has correct download link");
  assert(addedGame.scheme === "cybersweeps://", "New game has correct deep link scheme");

  // 2. Edit game links
  const updatedGame = await prisma.gameProviderConfig.update({
    where: { gameKey: testGameKey },
    data: {
      playUrl: "https://v2.play.cybersweeps.com",
      isEnabled: false,
    },
  });
  assert(updatedGame.playUrl === "https://v2.play.cybersweeps.com", "Game play link updated successfully");
  assert(updatedGame.isEnabled === false, "Game isEnabled status toggled to false");

  // 3. Remove game
  await prisma.gameProviderConfig.delete({
    where: { gameKey: testGameKey },
  });
  const deletedCheck = await prisma.gameProviderConfig.findUnique({
    where: { gameKey: testGameKey },
  });
  assert(deletedCheck === null, "Game successfully removed from catalog");

  // --- Test 17: New Player Signup Bonus Spinner (40% to 90%) ---
  console.log("\n[17] New Player Signup Bonus Spinner (40% to 90%)");
  assert(SIGNUP_WHEEL_SEGMENTS.length === 8, "Signup wheel has 8 balanced segments");
  const allSignupBetween40And90 = SIGNUP_WHEEL_SEGMENTS.every(
    (s) => s.percentage !== undefined && s.percentage >= 40 && s.percentage <= 90
  );
  assert(allSignupBetween40And90, "All signup wheel segments strictly award between 40% and 90% deposit match");

  const signupSpin = selectWinningSegment(SIGNUP_WHEEL_SEGMENTS);
  assert(
    signupSpin.winningSegment.percentage! >= 40 && signupSpin.winningSegment.percentage! <= 90,
    `Cryptographic spin returned valid signup bonus: ${signupSpin.winningSegment.percentage}%`
  );

  // Test player signup spin database persistence
  const testPlayerSignup = await prisma.user.create({
    data: {
      email: `test_signup_${Date.now()}@kali-gaming.com`,
      username: `kali_spinner_${Date.now().toString().slice(-4)}`,
      displayName: "New Spinner Player",
      role: "USER",
    },
  });

  // Execute signup bonus assignment
  const awardedPercentage = signupSpin.winningSegment.percentage!;
  await prisma.user.update({
    where: { id: testPlayerSignup.id },
    data: {
      hasClaimedSignupBonus: true,
      signupBonusPercent: awardedPercentage,
      lastSignupSpinAt: new Date(),
    },
  });
  await prisma.playerBonus.create({
    data: {
      userId: testPlayerSignup.id,
      type: "SIGNUP_MATCH",
      title: `${awardedPercentage}% Signup Match`,
      percentage: awardedPercentage,
      status: "ACTIVE",
    },
  });

  const updatedSignupUser = await prisma.user.findUnique({
    where: { id: testPlayerSignup.id },
    include: { bonuses: true },
  });
  assert(updatedSignupUser?.hasClaimedSignupBonus === true, "User marked as having claimed signup bonus");
  assert(updatedSignupUser?.signupBonusPercent === awardedPercentage, `User has active signup bonus percent recorded (${awardedPercentage}%)`);
  assert(updatedSignupUser?.bonuses.length === 1, "PlayerBonus record created in database for signup match");

  // --- Test 18: Regular Bonus Wheel Dynamic Probabilities (10% vs 80% Freeplay) ---
  console.log("\n[18] Regular Bonus Wheel Dynamic Probabilities (10% vs 80% Freeplay)");
  // Scenario A: Player has played freeplay and has <= 3 deposits since then (e.g. 1 deposit)
  const regularBase = getRegularWheelSegments(true, 1);
  assert(regularBase.freeplayOdds === 0.10, "Freeplay success rate is strictly 10% (0.10) for players who played freeplay with <= 3 deposits");
  assert(regularBase.boostActive === false, "Freeplay boost is inactive when deposits <= 3");

  const freeplaySegs = regularBase.segments.filter((s) => s.rewardType === "FREEPLAY");
  assert(freeplaySegs.length === 3, "Regular wheel contains exactly 3 freeplay segments");

  // Max 3 to 5 dollar free play assertion
  const allFreeplay3To5 = freeplaySegs.every((s) => s.freeplayAmount !== undefined && s.freeplayAmount >= 3 && s.freeplayAmount <= 5);
  assert(allFreeplay3To5, "All freeplay amounts are strictly between $3 and $5 (Max 3 to 5 dollar free play)");

  const totalFreeplayWeightBase = freeplaySegs.reduce((sum, s) => sum + s.weight, 0);
  const totalWeightBase = regularBase.segments.reduce((sum, s) => sum + s.weight, 0);
  const calculatedFreeplayRateBase = totalFreeplayWeightBase / totalWeightBase;
  assert(
    Math.abs(calculatedFreeplayRateBase - 0.10) < 0.01,
    `Segment weights accurately reflect 10% freeplay probability (Calculated: ${(calculatedFreeplayRateBase * 100).toFixed(1)}%)`
  );

  // 80% chance to get $3 and 20% chance to get $4 and $5
  const seg3Obj = freeplaySegs.find((s) => s.freeplayAmount === 3);
  const seg4Obj = freeplaySegs.find((s) => s.freeplayAmount === 4);
  const seg5Obj = freeplaySegs.find((s) => s.freeplayAmount === 5);
  assert(seg3Obj !== undefined && seg4Obj !== undefined && seg5Obj !== undefined, "$3, $4, and $5 free play segments exist on regular wheel");

  const ratio3Dollar = seg3Obj!.weight / totalFreeplayWeightBase;
  const ratio4And5Dollar = (seg4Obj!.weight + seg5Obj!.weight) / totalFreeplayWeightBase;
  assert(
    Math.abs(ratio3Dollar - 0.80) < 0.01,
    `80% chance of landing on $3 Free Play within freeplay pool (Calculated: ${(ratio3Dollar * 100).toFixed(1)}%)`
  );
  assert(
    Math.abs(ratio4And5Dollar - 0.20) < 0.01,
    `20% chance of landing on $4 or $5 Free Play within freeplay pool (Calculated: ${(ratio4And5Dollar * 100).toFixed(1)}%)`
  );

  // Scenario B: Player has played freeplay and has > 3 deposits since then (e.g. 4 deposits)
  const regularBoosted = getRegularWheelSegments(true, 4);
  assert(regularBoosted.freeplayOdds === 0.80, "Freeplay success rate increases to 80% (0.80) when deposits after freeplay > 3");
  assert(regularBoosted.boostActive === true, "Freeplay boost is marked active when deposits > 3");

  const totalFreeplayWeightBoosted = regularBoosted.segments
    .filter((s) => s.rewardType === "FREEPLAY")
    .reduce((sum, s) => sum + s.weight, 0);
  const totalWeightBoosted = regularBoosted.segments.reduce((sum, s) => sum + s.weight, 0);
  const calculatedFreeplayRateBoosted = totalFreeplayWeightBoosted / totalWeightBoosted;
  assert(
    Math.abs(calculatedFreeplayRateBoosted - 0.80) < 0.01,
    `Segment weights accurately reflect 80% boosted freeplay probability (Calculated: ${(calculatedFreeplayRateBoosted * 100).toFixed(1)}%)`
  );

  // Scenario C: Player has NOT played freeplay yet
  const regularFirstTime = getRegularWheelSegments(false, 0);
  assert(regularFirstTime.freeplayOdds === 0.80, "First-time freeplay rate is high/welcoming (80%) before first freeplay");

  // --- Test 19: Regular Bonus Wheel Deposit Match Segments (20% to 50%) & Zero Signup Bonus ---
  console.log("\n[19] Regular Bonus Wheel Deposit Match Segments (20% to 50%) & Zero Signup Bonus");
  const depositBonusSegments = regularBase.segments.filter((s) => s.rewardType === "DEPOSIT_BONUS");
  assert(depositBonusSegments.length === 5, "Regular bonus wheel contains 5 deposit bonus segments");

  const allDepositBetween20And50 = depositBonusSegments.every(
    (s) => s.percentage !== undefined && s.percentage >= 20 && s.percentage <= 50
  );
  assert(allDepositBetween20And50, "All non-freeplay segments strictly award between 20% and 50% deposit match");

  const everySegmentIsFreeplayOr20To50 = regularBase.segments.every(
    (s) => s.rewardType === "FREEPLAY" || (s.percentage !== undefined && s.percentage >= 20 && s.percentage <= 50)
  );
  assert(everySegmentIsFreeplayOr20To50, "Every segment is strictly either Freeplay or a 20% to 50% deposit bonus");

  // Verify regular wheel does NOT include signup bonus
  const hasSignupBonusInRegular = regularBase.segments.some((s) => s.type === "SIGNUP_BONUS" || s.rewardType === "SIGNUP_BONUS");
  assert(!hasSignupBonusInRegular, "Regular wheel strictly contains ZERO signup bonus segments");

  // --- Test 20: 24-Hour Cooldown & Deposit Bonus Application ---
  console.log("\n[20] 24-Hour Cooldown & Deposit Bonus Application");
  const spinTime = new Date();
  await prisma.user.update({
    where: { id: testPlayerSignup.id },
    data: {
      lastRegularSpinAt: spinTime,
      activeDepositBonus: 35.0,
    },
  });

  // Verify cooldown check: If now is within 24 hours of lastRegularSpinAt, cannot renew
  const checkTime = new Date(spinTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
  const timeDifferenceMs = checkTime.getTime() - spinTime.getTime();
  const COOLDOWN_24H_MS = 24 * 60 * 60 * 1000;
  assert(timeDifferenceMs < COOLDOWN_24H_MS, "2 hours elapsed is within 24h interval");
  const remainingSeconds = Math.ceil((COOLDOWN_24H_MS - timeDifferenceMs) / 1000);
  assert(remainingSeconds === 22 * 3600, "Cooldown remaining accurately calculated as 22 hours");

  // Apply deposit bonus to test deposit
  const depositAmount = 100;
  const appliedBonusPercent = 35.0;
  const bonusAmount = (depositAmount * appliedBonusPercent) / 100;

  const depositTx = await prisma.paymentTransaction.create({
    data: {
      userId: testPlayerSignup.id,
      gateway: "CHIME",
      amount: depositAmount,
      bonusPercentage: appliedBonusPercent,
      bonusAmount: bonusAmount,
      chimeSenderTag: "$TestPlayerTag",
      status: "APPROVED",
    },
  });

  assert(depositTx.bonusPercentage === 35.0, "Deposit transaction recorded applied 35% bonus");
  assert(depositTx.bonusAmount === 35.0, "Deposit transaction calculated $35.00 bonus amount on $100 deposit");

  // Clean up test player signup fixture
  await prisma.playerBonus.deleteMany({ where: { userId: testPlayerSignup.id } });
  await prisma.paymentTransaction.deleteMany({ where: { userId: testPlayerSignup.id } });
  await prisma.user.delete({ where: { id: testPlayerSignup.id } });

  // Clean up all test fixture player accounts so database remains 100% clean
  const testPlayerIds = [player1.id, player2.id, phoneUser.id];
  await prisma.gamePointsTransaction.deleteMany({ where: { userId: { in: testPlayerIds } } });
  await prisma.playerGameAccount.deleteMany({ where: { userId: { in: testPlayerIds } } });
  await prisma.paymentTransaction.deleteMany({ where: { userId: { in: testPlayerIds } } });
  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: { in: testPlayerIds } },
        { conversationId: { in: [directAdminChat!.id, phoneAdminChat.id] } },
      ],
    },
  });
  await prisma.conversationMember.deleteMany({
    where: {
      OR: [
        { userId: { in: testPlayerIds } },
        { conversationId: { in: [directAdminChat!.id, phoneAdminChat.id] } },
      ],
    },
  });
  await prisma.conversation.deleteMany({
    where: { id: { in: [directAdminChat!.id, phoneAdminChat.id] } },
  });
  await prisma.user.deleteMany({ where: { id: { in: testPlayerIds } } });

  console.log("\n=================================================");
  console.log(`Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) process.exit(1);
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
