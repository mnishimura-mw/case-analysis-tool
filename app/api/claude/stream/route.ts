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
  let rateLimited = false;

  try {
    // 2. IP単位レート制限
    const limit = checkRateLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.reason },
        { status: 429, headers: limit.retryAfterMs ? { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } : undefined }
      );
    }
    rateLimited = true;

    // 3. グローバルクォータ
    const quota = await checkGlobalQuota();
    if (!quota.allowed) {
      releaseRequest(ip);
      rateLimited = false;
      return NextResponse.json({ error: quota.reason }, { status: 429 });
    }

    const body = await req.json();
    const { action, ...claudeBody } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      releaseRequest(ip);
      rateLimited = false;
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ ...claudeBody, stream: true }),
    });

    if (!response.ok) {
      releaseRequest(ip);
      rateLimited = false;
      const errText = await response.text();
      return new Response(errText, { status: response.status });
    }

    // 4. 利用ログ記録
    logUsage(ip, action ?? "unknown", { model: claudeBody.model });

    // 5. ストリームをパススルー、完了時にレート制限解放
    const upstreamBody = response.body;
    if (!upstreamBody) {
      releaseRequest(ip);
      return NextResponse.json({ error: "No response body" }, { status: 500 });
    }

    const transform = new TransformStream({
      transform(chunk, controller) { controller.enqueue(chunk); },
      flush() { releaseRequest(ip); },
    });

    rateLimited = false; // flush() will handle release
    return new Response(upstreamBody.pipeThrough(transform), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (rateLimited) releaseRequest(ip);
    console.error("Claude API stream error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
