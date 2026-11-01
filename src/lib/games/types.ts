export interface GameApiGlobalParams {
  agent_id: string;
  timestamp: number;
  token: string; // MD5(agent_id:timestamp:secret_key)
}

export interface GameApiResponse<T = any> {
  code: number; // 0 = Success
  msg: string;
  data?: T;
  count?: number;
}

export interface RechargeResultData {
  agent_balance?: string;
  amount?: string;
  pay_order_id?: string;
  transaction_id?: string;
  transaction_time?: string;
  user_balance?: string;
}

export interface WithdrawResultData {
  agent_balance?: string;
  amount?: string;
  transaction_id?: string;
  transaction_time?: string;
  user_balance?: string;
  wdw_order_id?: string;
}

export interface AddUserResultData {
  account_name: string;
  user_id: string;
}

export interface UserBalanceResultData {
  user_balance: string;
}

export interface AgentBalanceResultData {
  agent_balance: string;
}

export interface UserIDResultData {
  user_id: string;
}

export interface GameProviderCredentials {
  gameKey: string;
  displayName: string;
  apiBaseUrl?: string | null;
  agentId?: string | null;
  secretKey?: string | null;
  rateMultiplier?: number;
}
