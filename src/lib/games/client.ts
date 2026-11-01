import crypto from "crypto";
import {
  GameApiResponse,
  RechargeResultData,
  WithdrawResultData,
  AddUserResultData,
  UserBalanceResultData,
  AgentBalanceResultData,
  UserIDResultData,
  GameProviderCredentials,
} from "./types";
import { getGameStatusDescription } from "./statusCodes";

/**
 * Computes 32-character lowercase MD5 signature:
 * MD5(agent_id : timestamp : secret_key)
 */
export function generateGameApiToken(
  agentId: string | number,
  timestamp: number,
  secretKey: string
): string {
  const raw = `${agentId}:${timestamp}:${secretKey}`;
  return crypto.createHash("md5").update(raw).digest("hex").toLowerCase();
}

/**
 * Checks whether live API credentials are configured for this provider.
 */
export function isLiveProviderConfigured(provider: GameProviderCredentials): boolean {
  return Boolean(
    provider.apiBaseUrl &&
    provider.agentId &&
    provider.secretKey &&
    provider.apiBaseUrl.startsWith("http") &&
    provider.secretKey !== "YOUR_SECRET_KEY"
  );
}

/**
 * Executes a POST request with multipart/form-data as specified in Section 2.1 of the API manual.
 */
async function sendGameApiRequest<T>(
  provider: GameProviderCredentials,
  endpoint: string,
  bodyParams: Record<string, any> = {}
): Promise<GameApiResponse<T>> {
  // If not configured with live credentials, simulate response using official example formats
  if (!isLiveProviderConfigured(provider)) {
    return simulateGameApiResponse<T>(endpoint, bodyParams, provider);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const token = generateGameApiToken(provider.agentId!, timestamp, provider.secretKey!);

  const formData = new FormData();
  // 1. Global Parameters (Section 1.1)
  formData.append("agent_id", String(provider.agentId));
  formData.append("timestamp", String(timestamp));
  formData.append("token", token);

  // 2. Endpoint-specific body parameters
  for (const [key, val] of Object.entries(bodyParams)) {
    if (val !== undefined && val !== null) {
      formData.append(key, String(val));
    }
  }

  const url = `${provider.apiBaseUrl!.replace(/\/$/, "")}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        code: res.status,
        msg: `HTTP Error ${res.status}: ${errText || res.statusText}`,
      };
    }

    const data: GameApiResponse<T> = await res.json();
    return data;
  } catch (err: any) {
    console.error(`[Game API] Network error calling ${endpoint}:`, err);
    return {
      code: 21, // System failed
      msg: err.message || "Network error connecting to game provider API",
    };
  }
}

/**
 * Sandbox Simulator: Mimics the exact JSON payloads from the PDF manual for local testing
 */
function simulateGameApiResponse<T>(
  endpoint: string,
  params: Record<string, any>,
  provider: GameProviderCredentials
): GameApiResponse<T> {
  const simulatedTime = String(Math.floor(Date.now() / 1000));

  if (endpoint.includes("/addUser")) {
    const account = params.account || "player_demo";
    const simUserId = `888${Math.floor(10000 + Math.random() * 90000)}`;
    return {
      code: 0,
      msg: "Success",
      data: {
        account_name: account,
        user_id: simUserId,
      } as any,
      count: 0,
    };
  }

  if (endpoint.includes("/getUserID")) {
    const account = params.account_name || "player_demo";
    return {
      code: 0,
      msg: "Success",
      data: {
        user_id: `8888${account.length}12`,
      } as any,
      count: 0,
    };
  }

  if (endpoint.includes("/recharge")) {
    const amount = String(params.amount || "10");
    const orderId = String(params.order_id || `sim_${Date.now()}`);
    return {
      code: 0,
      msg: "Success",
      data: {
        agent_balance: "36390057",
        amount,
        pay_order_id: `pay:agent:${orderId}`,
        transaction_id: `pay:platform:${orderId}`,
        transaction_time: simulatedTime,
        user_balance: String(150000 + Number(amount)),
      } as any,
      count: 0,
    };
  }

  if (endpoint.includes("/withdraw")) {
    const amount = String(params.amount || "5");
    const orderId = String(params.order_id || `wdw_${Date.now()}`);
    return {
      code: 0,
      msg: "Success",
      data: {
        agent_balance: "36440057",
        amount,
        transaction_id: `wdw:platform:${orderId}`,
        transaction_time: simulatedTime,
        user_balance: "100000",
        wdw_order_id: `wdw:agent:${orderId}`,
      } as any,
      count: 0,
    };
  }

  if (endpoint.includes("/userBalance")) {
    return {
      code: 0,
      msg: "Success",
      data: {
        user_balance: "150000",
      } as any,
      count: 0,
    };
  }

  if (endpoint.includes("/agentBalance")) {
    return {
      code: 0,
      msg: "Success",
      data: {
        agent_balance: "36490057.00",
      } as any,
      count: 0,
    };
  }

  if (endpoint.includes("/resetPassword") || endpoint.includes("/playerOffline")) {
    return {
      code: 0,
      msg: "Success",
      data: null as any,
      count: 0,
    };
  }

  return {
    code: 0,
    msg: "Success",
    count: 0,
  };
}

// ==========================================
// 🚀 High-Level Exported API Operations
// ==========================================

/**
 * 2.1.2 Recharge Points (Section 2.1.2)
 * Loads points into a player's external game account.
 */
export async function rechargePoints(
  provider: GameProviderCredentials,
  params: { userId: string; amount: number | string; orderId: string }
): Promise<GameApiResponse<RechargeResultData>> {
  return sendGameApiRequest<RechargeResultData>(
    provider,
    "/api/external/recharge",
    {
      user_id: params.userId,
      amount: String(params.amount),
      order_id: params.orderId,
    }
  );
}

/**
 * 2.1.3 Withdraw Points (Section 2.1.3)
 * Redeems points from a player's external game account.
 */
export async function withdrawPoints(
  provider: GameProviderCredentials,
  params: { userId: string; amount: number | string; orderId: string }
): Promise<GameApiResponse<WithdrawResultData>> {
  return sendGameApiRequest<WithdrawResultData>(
    provider,
    "/api/external/withdraw",
    {
      user_id: params.userId,
      amount: String(params.amount),
      order_id: params.orderId,
    }
  );
}

/**
 * 2.1.4 Get Player Balance (Section 2.1.4)
 */
export async function getPlayerBalance(
  provider: GameProviderCredentials,
  userId: string
): Promise<GameApiResponse<UserBalanceResultData>> {
  return sendGameApiRequest<UserBalanceResultData>(
    provider,
    "/api/external/userBalance",
    { user_id: userId }
  );
}

/**
 * 2.1.5 Get Agent Balance (Section 2.1.5)
 */
export async function getAgentDistributorBalance(
  provider: GameProviderCredentials
): Promise<GameApiResponse<AgentBalanceResultData>> {
  return sendGameApiRequest<AgentBalanceResultData>(
    provider,
    "/api/external/agentBalance"
  );
}

/**
 * 2.1.6 Login Name to Get Player ID (Section 2.1.6)
 */
export async function getUserIdByLoginName(
  provider: GameProviderCredentials,
  accountName: string
): Promise<GameApiResponse<UserIDResultData>> {
  return sendGameApiRequest<UserIDResultData>(
    provider,
    "/api/external/getUserID",
    { account_name: accountName }
  );
}

/**
 * 2.1.1 Add Player Account (Section 2.1.1)
 */
export async function addPlayerGameAccount(
  provider: GameProviderCredentials,
  params: { account: string; loginPwd: string }
): Promise<GameApiResponse<AddUserResultData>> {
  return sendGameApiRequest<AddUserResultData>(
    provider,
    "/api/external/addUser",
    {
      account: params.account,
      login_pwd: params.loginPwd,
    }
  );
}

/**
 * 2.1.8 Reset Player Password (Section 2.1.8)
 */
export async function resetPlayerGamePassword(
  provider: GameProviderCredentials,
  params: { userId: string; loginPwd: string }
): Promise<GameApiResponse<null>> {
  return sendGameApiRequest<null>(
    provider,
    "/api/external/resetPassword",
    {
      user_id: params.userId,
      login_pwd: params.loginPwd,
    }
  );
}

/**
 * 2.1.9 Force Player Offline (Section 2.1.9)
 */
export async function forcePlayerOffline(
  provider: GameProviderCredentials,
  userId: string
): Promise<GameApiResponse<null>> {
  return sendGameApiRequest<null>(
    provider,
    "/api/external/playerOffline",
    { user_id: userId }
  );
}
