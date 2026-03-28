import { NextRequest, NextResponse } from "next/server";
import { hasValidAccess } from "@/lib/access-token";
import { checkRateLimit, releaseRequest, getClientIP } from "@/lib/rate-limit";
import { checkGlobalQuota, logUsage } from "@/lib/quota";

export async function POST(req: NextRequest) {
  // 1. トークン認証
  if (!(await hasValidAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIP(req.headers);

  // 2. IP単位レート制限
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: limit.reason },
      { status: 429, headers: limit.retryAfterMs ? { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } : undefined }
    );
  }

  // 3. グローバルクォータ
  const quota = await checkGlobalQuota();
  if (!quota.allowed) {
    releaseRequest(ip);
    return NextResponse.json({ error: quota.reason }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action, ...claudeBody } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(claudeBody),
    });

    const data = await response.json();

    // 4. 利用ログ記録
    if (response.ok) {
      logUsage(ip, action ?? "unknown", {
        input_tokens: data.usage?.input_tokens,
        output_tokens: data.usage?.output_tokens,
        model: claudeBody.model,
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    releaseRequest(ip);
  }
}
