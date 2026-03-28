/**
 * Global Usage Quota System (anonymous, no per-user tracking)
 *
 * - Global monthly limit (configurable via app_settings)
 * - Global daily limit
 * - usage_logs tracks all requests anonymously
 */

import { createAdminClient } from "./supabase-server";

async function getSetting(key: string, fallback: number): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data ? parseInt(data.value, 10) : fallback;
}

export interface QuotaResult {
  allowed: boolean;
  monthlyUsed: number;
  monthlyLimit: number;
  dailyUsed: number;
  dailyLimit: number;
  reason?: string;
}

export async function checkGlobalQuota(): Promise<QuotaResult> {
  const admin = createAdminClient();

  const monthlyLimit = await getSetting("global_monthly_limit", 500);
  const dailyLimit = await getSetting("daily_limit", 100);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Monthly count
  const { count: monthlyCount, error: mErr } = await admin
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", monthStart);

  if (mErr) {
    console.error("monthly quota check error:", mErr.message);
    return { allowed: true, monthlyUsed: 0, monthlyLimit, dailyUsed: 0, dailyLimit };
  }

  const monthlyUsed = monthlyCount ?? 0;

  // Daily count
  const { count: dailyCount, error: dErr } = await admin
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", dayStart);

  if (dErr) {
    console.error("daily quota check error:", dErr.message);
    return { allowed: true, monthlyUsed, monthlyLimit, dailyUsed: 0, dailyLimit };
  }

  const dailyUsed = dailyCount ?? 0;

  if (monthlyUsed >= monthlyLimit) {
    return {
      allowed: false,
      monthlyUsed, monthlyLimit, dailyUsed, dailyLimit,
      reason: `今月のリクエスト上限（${monthlyLimit}回）に達しました。来月までお待ちください。`,
    };
  }

  if (dailyUsed >= dailyLimit) {
    return {
      allowed: false,
      monthlyUsed, monthlyLimit, dailyUsed, dailyLimit,
      reason: `本日のリクエスト上限（${dailyLimit}回）に達しました。明日以降にお試しください。`,
    };
  }

  return { allowed: true, monthlyUsed, monthlyLimit, dailyUsed, dailyLimit };
}

/**
 * Log an API usage (anonymous - IP only).
 */
export function logUsage(
  ip: string,
  action: string,
  extra?: { input_tokens?: number; output_tokens?: number; model?: string }
) {
  const admin = createAdminClient();
  admin
    .from("usage_logs")
    .insert({
      user_email: ip, // repurpose user_email field for IP
      action,
      input_tokens: extra?.input_tokens ?? 0,
      output_tokens: extra?.output_tokens ?? 0,
      model: extra?.model ?? "unknown",
    })
    .then(({ error }) => {
      if (error) console.error("usage_logs insert error:", error.message);
    });
}

/**
 * Get global usage stats for admin dashboard.
 */
export async function getGlobalUsageStats() {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const monthlyLimit = await getSetting("global_monthly_limit", 500);
  const dailyLimit = await getSetting("daily_limit", 100);

  const { data: monthlyLogs } = await admin
    .from("usage_logs")
    .select("action, input_tokens, output_tokens, created_at")
    .gte("created_at", monthStart)
    .order("created_at", { ascending: false });

  const monthlyUsed = monthlyLogs?.length ?? 0;
  const dailyUsed = (monthlyLogs ?? []).filter((l) => l.created_at >= dayStart).length;
  const totalInputTokens = (monthlyLogs ?? []).reduce((s, l) => s + (l.input_tokens ?? 0), 0);
  const totalOutputTokens = (monthlyLogs ?? []).reduce((s, l) => s + (l.output_tokens ?? 0), 0);

  const byAction: Record<string, number> = {};
  for (const log of monthlyLogs ?? []) {
    byAction[log.action ?? "unknown"] = (byAction[log.action ?? "unknown"] ?? 0) + 1;
  }

  return {
    month: `${now.getFullYear()}年${now.getMonth() + 1}月`,
    monthlyUsed, monthlyLimit, dailyUsed, dailyLimit,
    totalInputTokens, totalOutputTokens, byAction,
  };
}
