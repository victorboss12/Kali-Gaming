import prisma from "../backend/lib/prisma";

async function purgeAllPlayers() {
  console.log("Starting player database purge...");

  // Find all player users
  const playerUsers = await prisma.user.findMany({
    where: {
      role: { not: "ADMIN" },
    },
    select: {
      id: true,
      username: true,
      phoneNumber: true,
      email: true,
      displayName: true,
    },
  });

  console.log(`Found ${playerUsers.length} player account(s) to remove:`);
  for (const p of playerUsers) {
    console.log(` - ID: ${p.id} | @${p.username} | ${p.displayName} | Phone: ${p.phoneNumber || "None"} | Email: ${p.email || "None"}`);
  }

  const playerIds = playerUsers.map((p: any) => p.id);

  if (playerIds.length === 0) {
    console.log("No player accounts found in database. Database is already clean!");
    return;
  }

  // 1. Delete user spins & rewards
  const spins = await prisma.rewardSpin.deleteMany({
    where: { userId: { in: playerIds } },
  });
  console.log(`Deleted ${spins.count} reward spin(s).`);

  const rewards = await prisma.userReward.deleteMany({
    where: { userId: { in: playerIds } },
  });
  console.log(`Deleted ${rewards.count} user reward(s).`);

  // 2. Delete message reactions & reports
  const reactions = await prisma.messageReaction.deleteMany({
    where: { userId: { in: playerIds } },
  });
  console.log(`Deleted ${reactions.count} message reaction(s).`);

  const reports = await prisma.userReport.deleteMany({
    where: {
      OR: [
        { reporterId: { in: playerIds } },
        { reportedUserId: { in: playerIds } },
      ],
    },
  });
  console.log(`Deleted ${reports.count} user report(s).`);

  // 3. Delete friendships
  const friendships = await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: { in: playerIds } },
        { addresseeId: { in: playerIds } },
      ],
    },
  });
  console.log(`Deleted ${friendships.count} friendship(s).`);

  // 4. Delete payment transactions
  const txs = await prisma.paymentTransaction.deleteMany({
    where: { userId: { in: playerIds } },
  });
  console.log(`Deleted ${txs.count} payment transaction(s).`);

  // 5. Find all conversations involving these players
  const playerConvMembers = await prisma.conversationMember.findMany({
    where: { userId: { in: playerIds } },
    select: { conversationId: true },
  });
  const conversationIds = Array.from(new Set(playerConvMembers.map((m: any) => m.conversationId)));

  // Delete messages in those conversations
  if (conversationIds.length > 0) {
    const messages = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: playerIds } },
          { conversationId: { in: conversationIds } },
        ],
      },
    });
    console.log(`Deleted ${messages.count} message(s).`);

    // Delete members in those conversations
    const members = await prisma.conversationMember.deleteMany({
      where: { conversationId: { in: conversationIds } },
    });
    console.log(`Deleted ${members.count} conversation member association(s).`);

    // Delete conversations
    const convs = await prisma.conversation.deleteMany({
      where: { id: { in: conversationIds } },
    });
    console.log(`Deleted ${convs.count} conversation(s).`);
  }

  // 6. Delete all player users
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: playerIds } },
  });
  console.log(`Successfully deleted ${deletedUsers.count} player account(s) from database!`);

  // Verify remaining accounts in database
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, displayName: true },
  });
  console.log("\n--- Remaining Accounts in Database (Admins & Staff Only) ---");
  for (const u of remainingUsers) {
    console.log(` ✔ [${u.role}] @${u.username} (${u.displayName}) - ${u.email}`);
  }
}

purgeAllPlayers()
  .catch((err) => {
    console.error("Purge Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
