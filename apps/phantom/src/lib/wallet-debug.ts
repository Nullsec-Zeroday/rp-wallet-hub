const DEBUG_LOG_KEY = "phantom_wallet_debug_log";
const DEBUG_LOG_LIMIT = 80;

type WalletDebugEntry = {
  at: string;
  event: string;
  detail?: Record<string, unknown>;
};

export function logWalletDebug(event: string, detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  try {
    const existing = window.localStorage.getItem(DEBUG_LOG_KEY);
    const parsed = existing ? (JSON.parse(existing) as WalletDebugEntry[]) : [];
    const next: WalletDebugEntry[] = [
      {
        at: new Date().toISOString(),
        event,
        detail,
      },
      ...parsed,
    ].slice(0, DEBUG_LOG_LIMIT);
    window.localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Unable to write Ph4ntom debug log", error);
  }
}

