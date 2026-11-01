/**
 * Project Status Code Dictionary from Provider API Specification (Sections 3.1 & Appendices)
 */
export const GAME_API_STATUS_CODES: Record<number, { description: string; isError: boolean }> = {
  0: { description: "Success", isError: false },
  1: { description: "Invalid agent ID", isError: true },
  2: { description: "Invalid request parameters", isError: true },
  3: { description: "Invalid token (signature mismatch)", isError: true },
  4: { description: "Token expired", isError: true },
  5: { description: "Access IP is not whitelisted", isError: true },
  6: { description: "Insufficient agent balance (distributor pool empty)", isError: true },
  7: { description: "Insufficient user balance", isError: true },
  8: { description: "Invalid user ID", isError: true },
  9: { description: "User account frozen", isError: true },
  10: { description: "User is currently in a game", isError: true },
  11: { description: "Invalid amount", isError: true },
  12: { description: "Recharge failed, please try again later", isError: true },
  13: { description: "Recharge permission denied", isError: true },
  14: { description: "Withdrawal failed, please try again later", isError: true },
  15: { description: "Withdrawal amount exceeds daily limit", isError: true },
  16: { description: "Withdrawal under review", isError: true },
  17: { description: "Withdrawal permission denied", isError: true },
  18: { description: "Account name format error (must contain letters, numbers, and underscores)", isError: true },
  19: { description: "Agent does not have register user permission", isError: true },
  20: { description: "Account name already exists", isError: true },
  21: { description: "Game provider system failed", isError: true },
  22: { description: "Number of registered IPs exceeds upper limit", isError: true },
  23: { description: "Password must be 6 to 32 characters", isError: true },
  400: { description: "Parameter error", isError: true },
};

export function getGameStatusDescription(code: number): string {
  if (code in GAME_API_STATUS_CODES) {
    return GAME_API_STATUS_CODES[code].description;
  }
  return `Unknown status code: ${code}`;
}
