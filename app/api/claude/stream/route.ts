import { NextRequest, NextResponse } from "next/server";
import { hasValidAccess } from "@/lib/access-token";
import { checkRateLimit, releaseRequest, getClientIP } from "@/lib/rate-limit";
import { checkGlobalQuota, logUsage } from "@/lib/quota";

export async function POST(req: NextRequest) {
  if (!(await hasValidAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIP(req.headers);

  // IP単位レート制限
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: limit.reason },
      { status: 429, headers: limit.retryAfterMs ? { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } : undefined }
    );
  }

  // ここからはreleaseRequest()を必ず呼ぶ必要がある
  try {
    // グローバルクォータ
    const quota = await checkGlobalQuota();
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 429 });
    }

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
      body: JSON.stringify({ ...claudeBody, stream: true }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(errText, { status: response.status });
    }

    logUsage(ip, action ?? "unknown", { model: claudeBody.model });

    const upstreamBody = response.body;
    if (!upstreamBody) {
      return NextResponse.json({ error: "No response body" }, { status: 500 });
    }

    // ストリーム完了時にreleaseRequest()を呼ぶ
    const transform = new TransformStream({
      transform(chunk, controller) { controller.enqueue(chunk); },
      flush() { releaseRequest(ip); },
    });

    return new Response(upstreamBody.pipeThrough(transform), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Claude API stream error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    // ストリーミングレスポンスを返した場合はflush/cancelで解放されるが、
    // それ以前にエラーで抜けた場合はここで解放
    // 二重解放されてもreleaseRequestはinflight<0にならないよう安全
    releaseRequest(ip);
  }
}
