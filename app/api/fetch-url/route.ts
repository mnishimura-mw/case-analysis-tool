import { NextRequest, NextResponse } from "next/server";
import { hasValidAccess } from "@/lib/access-token";
import { checkRateLimit, releaseRequest, getClientIP } from "@/lib/rate-limit";

// SSRF protection: block internal/private hostnames
const BLOCKED_PATTERNS = [
  /^localhost$/,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^\[::1\]$/,
  /^\[fc/i, /^\[fd/i,
  /\.internal$/, /\.local$/,
];

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(hostname.toLowerCase()));
}

function extractText(contentType: string, rawText: string): string {
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
  return text;
}

async function safeFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      "Accept-Language": "ja,en;q=0.9",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
}

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

    if (isBlockedHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "このURLにはアクセスできません" }, { status: 400 });
    }

    let response = await safeFetch(url);

    // Handle redirects safely (max 3 hops)
    let hops = 0;
    while ([301, 302, 303, 307, 308].includes(response.status) && hops < 3) {
      const location = response.headers.get("location");
      if (!location) break;
      const redir = new URL(location, url);
      if (isBlockedHost(redir.hostname)) {
        return NextResponse.json({ error: "リダイレクト先にアクセスできません" }, { status: 400 });
      }
      response = await safeFetch(redir.toString());
      hops++;
    }

    if (!response.ok) {
      return NextResponse.json({ error: `URLの取得に失敗しました (HTTP ${response.status})` }, { status: 400 });
    }

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();
    const text = extractText(contentType, rawText);

    if (!text.trim()) {
      return NextResponse.json({ error: "URLからテキストを抽出できませんでした" }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("fetch-url error:", error);
    return NextResponse.json({ error: "URLの取得に失敗しました" }, { status: 500 });
  } finally {
    releaseRequest(ip);
  }
}
