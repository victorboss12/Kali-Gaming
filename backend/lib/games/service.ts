import prisma from "@/lib/prisma";
import {
  rechargePoints,
  withdrawPoints,
  getPlayerBalance,
  getAgentDistributorBalance,
  getUserIdByLoginName,
  addPlayerGameAccount,
} from "./client";
import { getGameStatusDescription } from "./statusCodes";

export interface DefaultGameItem {
  gameKey: string;
  displayName: string;
  category: string;
  imageUrl: string;
  playUrl: string;
  downloadUrl: string;
  scheme: string;
  androidPackage?: string;
  popular?: boolean;
}

export const DEFAULT_GAMES: DefaultGameItem[] = [
  {
    gameKey: "gamevault",
    displayName: "Gamevault",
    category: "Arcade Slots",
    imageUrl: "https://imgs.search.brave.com/X1FgkIEQjsjkqz8rg76li3YPN8VpctWu7STXGD3Gz_8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Z2FtZXZhdWx0LTk5/OS5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDkvZ2Ft/ZXZhdWx0LTk5OS5j/b21fLnBuZw",
    scheme: "gamevault://",
    androidPackage: "com.gamevault999",
    downloadUrl: "http://download.gamevault999.com",
    playUrl: "http://download.gamevault999.com",
    popular: true,
  },
  {
    gameKey: "milkyway",
    displayName: "Milkyway",
    category: "Galaxy Slots & Sweeps",
    imageUrl: "https://imgs.search.brave.com/Tlzn3aZeJ6EDvNRZ2zUB2cMwydj0T9vFsEI_913rej0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9taWxr/eXdheWFwcC5uZXQv/d3AtY29udGVudC91/cGxvYWRzLzIwMjQv/MTAvTWlsa3l3YXkt/Nzc3LTItMTAyNHg1/MTIud2VicA",
    scheme: "milkyway://",
    androidPackage: "com.milkywayapp",
    downloadUrl: "http://milkywayapp.xyz",
    playUrl: "http://milkywayapp.xyz",
    popular: true,
  },
  {
    gameKey: "juwa777",
    displayName: "Juwa 777",
    category: "Classic Sweepstakes",
    imageUrl: "https://imgs.search.brave.com/tXwpIxfEr6s25ESoFJ9tBoNcqa9ppSbyXdm3W6-H8Do/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9qdXdh/Nzc3Lm5ldC93cC1j/b250ZW50L3VwbG9h/ZHMvMjAyNC8wNS9q/dXdhLTc3Ny1mZWF0/dXJlZC1pbWcud2Vi/cA",
    scheme: "juwa://",
    androidPackage: "com.juwa777.app",
    downloadUrl: "https://dl.juwa777.com",
    playUrl: "https://m.juwa777.com",
    popular: true,
  },
  {
    gameKey: "firekirin",
    displayName: "Firekirin",
    category: "Fish Tables & Action",
    imageUrl: "https://imgs.search.brave.com/LT0vo5AqqrrMoIsHvvibj_VNF8IsCqPqcjnRJ1Z4yXc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hdHMu/aW8vd3AtY29udGVudC91/cGxvYWRzLzIwMjQv/MDgvRmlyZS1L/aXJpbi0xMDI0eDM0/MS5wbmc",
    scheme: "firekirin://",
    androidPackage: "com.firekirin",
    downloadUrl: "https://firekirin.online",
    playUrl: "https://firekirin.online",
    popular: true,
  },
  {
    gameKey: "orionstars",
    displayName: "Orion Stars",
    category: "Galaxy Action",
    imageUrl: "https://imgs.search.brave.com/oJzz1KjSkS4O5r3h5gNR2EQmLu-iIyPUlZSwSD896-M/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGF5/b3Jpb25zdGFyc29u/bGluZS5jb20vd3At/Y29udGVudC91cGxv/YWRzLzIwMjMvMDEv/TG9hZC1Pcmlvbi1T/dGFycy1hY2NvdW50/LmpwZw",
    scheme: "orionstars://",
    androidPackage: "com.orionstars.slots",
    downloadUrl: "https://orionstarsonline.com",
    playUrl: "https://playorionstarsonline.com",
    popular: true,
  },
  {
    gameKey: "vblink",
    displayName: "Vb Link",
    category: "Slots & Sweeps",
    imageUrl: "https://imgs.search.brave.com/0w3SQ1tg4-BUQZ0upOFhnV2Y5bPpgyc1OjK8tOhTQ8E/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly92Ymxp/bmsuaW8vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjMvMDIvVmJs/aW5rNzc3LTQwMHg0/MDAtMS0zMDB4MzAw/LmpwZw",
    scheme: "vblink://",
    androidPackage: "com.vblink777.club",
    downloadUrl: "http://www.vblink777.club",
    playUrl: "http://www.vblink777.club",
  },
  {
    gameKey: "ultrapanda",
    displayName: "Ultra Panda",
    category: "Animal Slots",
    imageUrl: "https://imgs.search.brave.com/BnanF6ACwnLawzPBQ5jJLm-9pCHa38-fC6NiwhjgOiw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91bHRy/YXBhbmRhNzc3Lm9u/bGluZS93cC1jb250/ZW50L3VwbG9hZHMv/MjAyMy8wOS9VbHRy/YS1QYW5kYS03Nzct/b25saW5lLWNhc2lu/by53ZWJw",
    scheme: "ultrapanda://",
    androidPackage: "com.ultrapanda.mobi",
    downloadUrl: "http://www.ultrapanda.mobi",
    playUrl: "http://www.ultrapanda.mobi",
  },
  {
    gameKey: "pandamaster",
    displayName: "Panda Master",
    category: "Panda Arcade",
    imageUrl: "https://imgs.search.brave.com/OpwLw15wcLlbodP_8aKJBqjoBj79oOR5TGnkAkzZHfo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wYW5k/YW1hc3Rlcjc3Ny5w/cm8vd3AtY29udGVudC91/cGxvYWRzLzIwMjQv/MDYvUGFuZGFN/YXN0ZXI3NzcucHJv/LTItMS0xMDI0eDU3/Ni53ZWJw",
    scheme: "pandamaster://",
    androidPackage: "com.pandamaster.vip",
    downloadUrl: "https://pandamaster.vip:8888",
    playUrl: "https://pandamaster.vip:8888",
  },
  {
    gameKey: "cashfrenzy",
    displayName: "Cash Frenzy",
    category: "High Roller Sweeps",
    imageUrl: "https://imgs.search.brave.com/13ORlt3BjnBzJVi35UoHUljUcGDogn0jNWX52Wp2Wc4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/ODExN1loRkxxUkwu/cG5n",
    scheme: "cashfrenzy://",
    androidPackage: "com.cashfrenzy777",
    downloadUrl: "https://www.cashfrenzy777.com",
    playUrl: "https://www.cashfrenzy777.com",
  },
  {
    gameKey: "highroller",
    displayName: "High Roller",
    category: "VIP Tables",
    imageUrl: "https://imgs.search.brave.com/cNARK3qPS48XG_IzILVW_hDMydY0CdGWRcmlIHRAXh8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tb2Rl/ZGl0b3IubmV0L3dw/LWNvbnRlbnQvdXBs/b2Fkcy8yMDI0LzEx/L0hpZ2gtUm9sbGVy/LTc3Ny5qcGc",
    scheme: "highstakes://",
    androidPackage: "com.highstakesweeps",
    downloadUrl: "https://dl.highstakesweeps.com",
    playUrl: "https://dl.highstakesweeps.com",
  },
  {
    gameKey: "vegassweeps",
    displayName: "Vegas Sweeps",
    category: "Vegas Classic",
    imageUrl: "https://imgs.search.brave.com/-uWOPAQnKMXpdB6gSwJIOQK09vSL48Kkqy_9uo3kUP4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly92ZWdh/c3N3ZWVwLm5ldC93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyNC8w/Ny9WZWdhcy1Td2Vl/cC1Mb2dpbi53ZWJw",
    scheme: "vegassweeps://",
    androidPackage: "com.lasvegassweeps",
    downloadUrl: "https://m.lasvegassweeps.com",
    playUrl: "https://m.lasvegassweeps.com",
  },
  {
    gameKey: "cashmachine",
    displayName: "Cash Machine",
    category: "Reels & Bars",
    imageUrl: "https://imgs.search.brave.com/TuXSyHIED_gDY16_kXdLQyDJdPPXzl28hxJFtppfbek/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jYXNo/bWFjaGluZTc3N2Fw/ay51cy93cC1jb250/ZW50L3VwbG9hZHMv/MjAyNC8wNS9jYXNo/LW1hY2hpbmUtNzc3/LWFway53ZWJw",
    scheme: "cashmachine://",
    androidPackage: "com.cashmachine777",
    downloadUrl: "https://www.cashmachine777.com/m",
    playUrl: "https://www.cashmachine777.com/m",
  },
  {
    gameKey: "riversweeps",
    displayName: "River Sweeps",
    category: "River Gold",
    imageUrl: "https://imgs.search.brave.com/0nK7m3QIe_Jt5ePplqUjMQKhEhz_AdnamOPQIzf6LbA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tb2Rl/ZGl0b3IubmV0L3dw/LWNvbnRlbnQvdXBs/b2Fkcy8yMDI0LzA0/L1JpdmVyU3dlZXBz/LTc3Ny0xMDI0eDEw/MjQuanBn",
    scheme: "riversweeps://",
    androidPackage: "com.river777",
    downloadUrl: "https://river777.com/",
    playUrl: "https://river777.com/",
  },
  {
    gameKey: "yolo",
    displayName: "Yolo",
    category: "Fast Sweeps",
    imageUrl: "https://imgs.search.brave.com/4UGeXAjM2C115p1XlfQGPJmnk4I4WWCBcukvSlRoHvo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly95b2xv/Nzc3LmlvL3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDI0LzA2L1lv/bG8tNzc3LUdhbWUt/UGxheS0xMDI0eDQ2/Mi5wbmc",
    scheme: "yolo777://",
    androidPackage: "com.yolo777.game",
    downloadUrl: "https://yolo777.game",
    playUrl: "https://yolo777.game",
  },
  {
    gameKey: "mafia",
    displayName: "Mafia",
    category: "Underworld Crime",
    imageUrl: "https://imgs.search.brave.com/yjlwfNMenfuViRWZhc7-xE0suFYVZiGhLZcxmRqYIqU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9iaXRw/bGF5LmFnL19uZXh0/L2ltYWdlP3VybD1o/dHRwczovL2JpdHBs/YXktbmV3LmFtczMu/ZGlnaXRhbG9jZWFu/c3BhY2VzLmNvbS9Q/Uk9EL3VwbG9hZHMv/bWFmaWFfbXZpVFRx/eS53ZWJwJnc9ODI4/JnE9NzU",
    scheme: "mafia777://",
    androidPackage: "com.mafia77777",
    downloadUrl: "https://www.mafia77777.com/m",
    playUrl: "https://www.mafia77777.com/m",
  },
];

/**
 * Ensures all default game providers are seeded into database with rich link metadata.
 */
export async function ensureDefaultGameProviders() {
  let order = 0;
  for (const game of DEFAULT_GAMES) {
    order++;
    const existing = await prisma.gameProviderConfig.findUnique({
      where: { gameKey: game.gameKey },
    });

    if (!existing) {
      await prisma.gameProviderConfig.create({
        data: {
          gameKey: game.gameKey,
          displayName: game.displayName,
          category: game.category,
          imageUrl: game.imageUrl,
          playUrl: game.playUrl,
          downloadUrl: game.downloadUrl,
          scheme: game.scheme,
          androidPackage: game.androidPackage,
          isPopular: !!game.popular,
          sortOrder: order,
          rateMultiplier: 1.0,
          isEnabled: true,
        },
      });
    } else if (!existing.imageUrl || !existing.downloadUrl || !existing.playUrl) {
      // Update missing link & image metadata on existing record
      await prisma.gameProviderConfig.update({
        where: { id: existing.id },
        data: {
          imageUrl: existing.imageUrl || game.imageUrl,
          playUrl: existing.playUrl || game.playUrl,
          downloadUrl: existing.downloadUrl || game.downloadUrl,
          scheme: existing.scheme || game.scheme,
          androidPackage: existing.androidPackage || game.androidPackage,
          isPopular: existing.isPopular ?? !!game.popular,
          sortOrder: existing.sortOrder ?? order,
        },
      });
    }
  }
}

/**
 * Service to execute points recharge with database auditing and 1-on-1 staff chat notification.
 */
export async function executeRecharge({
  kaliUserId,
  gameKey,
  gameUsername,
  points,
  adminId,
}: {
  kaliUserId: string;
  gameKey: string;
  gameUsername: string;
  points: number;
  adminId?: string;
}) {
  await ensureDefaultGameProviders();

  const provider = await prisma.gameProviderConfig.findUnique({
    where: { gameKey },
  });

  if (!provider) {
    throw new Error(`Game provider '${gameKey}' is not supported.`);
  }

  if (!provider.isEnabled) {
    throw new Error(`Game provider '${provider.displayName}' is currently disabled.`);
  }

  // 1. Get or find linked PlayerGameAccount
  let gameAccount = await prisma.playerGameAccount.findUnique({
    where: {
      userId_gameKey: {
        userId: kaliUserId,
        gameKey,
      },
    },
  });

  let gameUserId = gameAccount?.gameUserId || null;

  // 2. Resolve external numeric gameUserId via getUserID API if missing, mock, or username changed
  const needsLookup =
    !gameUserId ||
    gameUserId.startsWith("888") ||
    (gameAccount && gameAccount.gameUsername !== gameUsername);

  if (needsLookup) {
    const lookupRes = await getUserIdByLoginName(provider, gameUsername);
    if (lookupRes.code === 0 && lookupRes.data?.user_id) {
      gameUserId = lookupRes.data.user_id;
    } else {
      // If user doesn't exist on provider, attempt auto-creation
      const addRes = await addPlayerGameAccount(provider, {
        account: gameUsername,
        loginPwd: "Kali" + Math.floor(100000 + Math.random() * 900000),
      });
      if (addRes.code === 0 && addRes.data?.user_id) {
        gameUserId = addRes.data.user_id;
      } else {
        // Fallback to numeric hash if provider offline
        gameUserId = `888${Math.floor(10000 + Math.random() * 90000)}`;
      }
    }

    if (!gameAccount) {
      gameAccount = await prisma.playerGameAccount.create({
        data: {
          userId: kaliUserId,
          gameKey,
          gameUsername,
          gameUserId,
        },
      });
    } else {
      gameAccount = await prisma.playerGameAccount.update({
        where: { id: gameAccount.id },
        data: { gameUserId, gameUsername },
      });
    }
  }

  if (!gameAccount) {
    gameAccount = await prisma.playerGameAccount.create({
      data: {
        userId: kaliUserId,
        gameKey,
        gameUsername,
        gameUserId,
      },
    });
  }

  // 3. Generate unique order ID
  const orderId = `pay:${Date.now()}:${Math.floor(1000 + Math.random() * 9000)}`;

  // 4. Create pending transaction log
  const tx = await prisma.gamePointsTransaction.create({
    data: {
      userId: kaliUserId,
      gameKey,
      gameUsername,
      gameUserId,
      type: "RECHARGE",
      amount: points,
      orderId,
      status: "PENDING",
      adminId,
    },
  });

  // 5. Call external game API
  const apiRes = await rechargePoints(provider, {
    userId: gameUserId || "",
    amount: points,
    orderId,
  });

  const isSuccess = apiRes.code === 0;
  const statusMsg = apiRes.msg || getGameStatusDescription(apiRes.code);

  // 6. Update transaction record
  const updatedTx = await prisma.gamePointsTransaction.update({
    where: { id: tx.id },
    data: {
      status: isSuccess ? "SUCCESS" : "FAILED",
      apiCode: apiRes.code,
      apiMessage: statusMsg,
      externalTxId: apiRes.data?.transaction_id || apiRes.data?.pay_order_id || null,
      rawResponse: JSON.stringify(apiRes),
    },
  });

  // 7. If success, update balances
  if (isSuccess) {
    const newBal = apiRes.data?.user_balance ? parseFloat(apiRes.data.user_balance) : undefined;
    await prisma.playerGameAccount.update({
      where: { id: gameAccount.id },
      data: {
        totalPointsLoaded: { increment: points },
        lastKnownBalance: newBal !== undefined ? newBal : { increment: points },
      },
    });

    if (apiRes.data?.agent_balance) {
      await prisma.gameProviderConfig.update({
        where: { id: provider.id },
        data: { lastAgentBalance: parseFloat(apiRes.data.agent_balance) },
      });
    }

    // 8. Auto-dispatch confirmation receipt in player's direct 1-on-1 Admin conversation
    const directConv = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        members: { some: { userId: kaliUserId } },
      },
    });

    if (directConv && adminId) {
      await prisma.message.create({
        data: {
          conversationId: directConv.id,
          senderId: adminId,
          content: `🎮 Points Loaded! Successfully transferred **${points} game points** to your **${provider.displayName}** account (\`${gameUsername}\`). Reference: \`${orderId}\`. Good luck!`,
        },
      }).catch(() => {});
    }
  }

  return {
    success: isSuccess,
    transaction: updatedTx,
    apiResponse: apiRes,
    message: statusMsg,
  };
}

/**
 * Service to execute points withdrawal / cashout.
 */
export async function executeWithdraw({
  kaliUserId,
  gameKey,
  gameUsername,
  points,
  adminId,
}: {
  kaliUserId: string;
  gameKey: string;
  gameUsername: string;
  points: number;
  adminId?: string;
}) {
  await ensureDefaultGameProviders();

  const provider = await prisma.gameProviderConfig.findUnique({
    where: { gameKey },
  });

  if (!provider) {
    throw new Error(`Game provider '${gameKey}' is not supported.`);
  }

  const gameAccount = await prisma.playerGameAccount.findUnique({
    where: {
      userId_gameKey: {
        userId: kaliUserId,
        gameKey,
      },
    },
  });

  const gameUserId = gameAccount?.gameUserId || `888${Math.floor(10000 + Math.random() * 90000)}`;
  const orderId = `wdw:${Date.now()}:${Math.floor(1000 + Math.random() * 9000)}`;

  const tx = await prisma.gamePointsTransaction.create({
    data: {
      userId: kaliUserId,
      gameKey,
      gameUsername,
      gameUserId,
      type: "WITHDRAW",
      amount: points,
      orderId,
      status: "PENDING",
      adminId,
    },
  });

  const apiRes = await withdrawPoints(provider, {
    userId: gameUserId,
    amount: points,
    orderId,
  });

  const isSuccess = apiRes.code === 0;
  const statusMsg = apiRes.msg || getGameStatusDescription(apiRes.code);

  const updatedTx = await prisma.gamePointsTransaction.update({
    where: { id: tx.id },
    data: {
      status: isSuccess ? "SUCCESS" : "FAILED",
      apiCode: apiRes.code,
      apiMessage: statusMsg,
      externalTxId: apiRes.data?.transaction_id || apiRes.data?.wdw_order_id || null,
      rawResponse: JSON.stringify(apiRes),
    },
  });

  if (isSuccess && gameAccount) {
    const newBal = apiRes.data?.user_balance ? parseFloat(apiRes.data.user_balance) : undefined;
    await prisma.playerGameAccount.update({
      where: { id: gameAccount.id },
      data: {
        totalPointsWithdrawn: { increment: points },
        lastKnownBalance: newBal !== undefined ? newBal : Math.max(0, gameAccount.lastKnownBalance - points),
      },
    });
  }

  return {
    success: isSuccess,
    transaction: updatedTx,
    apiResponse: apiRes,
    message: statusMsg,
  };
}
