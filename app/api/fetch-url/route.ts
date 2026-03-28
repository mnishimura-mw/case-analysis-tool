import { NextRequest, NextResponse } from "next/server";
import { hasValidAccess } from "@/lib/access-token";
import { checkRateLimit, releaseRequest, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!(await hasValidAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIP(req.headers);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 429 });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Only http/https URLs are allowed" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `URLの取得に失敗しました (HTTP ${response.status})` }, { status: 400 });
    }

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    let text: string;
    if (contentType.includes("text/html") || contentType.includes("xhtml")) {
      text = rawText
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&[a-zA-Z0-9#]+;/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    } else {
      text = rawText;
    }

    if (text.length > 20000) {
      text = text.substring(0, 20000) + "\n\n...(以下省略)";
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "URLからテキストを抽出できませんでした" }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("fetch-url error:", error);
    const msg = (error as Error).message || "Unknown error";
    return NextResponse.json({ error: `URLの取得に失敗しました: ${msg}` }, { status: 500 });
  } finally {
    releaseRequest(ip);
  }
}
