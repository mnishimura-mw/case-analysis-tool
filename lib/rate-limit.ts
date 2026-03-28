/**
 * Rate Limiting & Concurrent Request Control (IP-based)
 *
 * - Per-IP rate limiting (requests per minute)
 * - Per-IP concurrent request cap
 * - Global daily/monthly limits via Supabase
 */

interface RateState {
  timestamps: number[];
  inflight: number;
}

const states = new Map<string, RateState>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;
const MAX_CONCURRENT_REQUESTS = 3;

function getState(key: string): RateState {
  let state = states.get(key);
  if (!state) {
    state = { timestamps: [], inflight: 0 };
    states.set(key, state);
  }
  return state;
}

function pruneOldTimestamps(state: RateState) {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  state.timestamps = state.timestamps.filter((t) => t > cutoff);
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

/**
 * Check rate limit by key (IP address or any identifier).
 */
export function checkRateLimit(key: string): RateLimitResult {
  maybeCleanup();
  const state = getState(key);
  pruneOldTimestamps(state);

  if (state.inflight >= MAX_CONCURRENT_REQUESTS) {
    return {
      allowed: false,
      reason: `同時リクエスト数の上限（${MAX_CONCURRENT_REQUESTS}件）に達しています。現在の処理が完了するまでお待ちください。`,
    };
  }

  if (state.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterMs = state.timestamps[0] + RATE_LIMIT_WINDOW_MS - Date.now();
    return {
      allowed: false,
      reason: `リクエスト数の上限（${MAX_REQUESTS_PER_WINDOW}回/分）に達しました。しばらくお待ちください。`,
      retryAfterMs: Math.max(retryAfterMs, 1000),
    };
  }

  state.timestamps.push(Date.now());
  state.inflight += 1;
  return { allowed: true };
}

/**
 * Release an in-flight request slot.
 */
export function releaseRequest(key: string) {
  const state = states.get(key);
  if (state && state.inflight > 0) {
    state.inflight -= 1;
  }
}

/**
 * Extract client IP from request headers.
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

// Inline cleanup on every checkRateLimit call (serverless-safe, no setInterval)
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return; // max once per minute
  lastCleanup = now;
  const cutoff = now - RATE_LIMIT_WINDOW_MS * 2;
  for (const [key, state] of states) {
    pruneOldTimestamps(state);
    if (state.timestamps.length === 0 && state.inflight === 0) {
      states.delete(key);
    }
    // Reset stuck inflight counters
    const latest = state.timestamps[state.timestamps.length - 1];
    if (state.inflight > 0 && (!latest || latest < cutoff)) {
      state.inflight = 0;
    }
  }
}
