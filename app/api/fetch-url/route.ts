import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const SUPABASE_ENABLED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url_here";

export async function POST(req: NextRequest) {
  try {
    // 認証チェック（Supabase が設定されている場合のみ）
    if (SUPABASE_ENABLED) {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // URLのバリデーション
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Only http/https URLs are allowed" },
        { status: 400 }
      );
    }

    // サーバー側でURLをフェッチ
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000), // 15秒タイムアウト
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `URLの取得に失敗しました (HTTP ${response.status})` },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    let text: string;

    if (contentType.includes("text/html") || contentType.includes("xhtml")) {
      // HTMLタグを除去してテキストを抽出
      text = rawText
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")   // script除去
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")     // style除去
        .replace(/<!--[\s\S]*?-->/g, "")                     // コメント除去
        .replace(/<br\s*\/?>/gi, "\n")                       // br→改行
        .replace(/<\/p>/gi, "\n\n")                          // </p>→2改行
        .replace(/<\/div>/gi, "\n")                          // </div>→改行
        .replace(/<\/li>/gi, "\n")                           // </li>→改行
        .replace(/<[^>]+>/g, "")                             // 残りのタグ除去
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&[a-zA-Z0-9#]+;/g, " ")                   // その他のHTMLエンティティ
        .replace(/[ \t]+/g, " ")                             // 横方向の連続空白を1つに
        .replace(/\n{3,}/g, "\n\n")                          // 3行以上の空行を2行に
        .trim();
    } else {
      text = rawText;
    }

    // 長すぎる場合は先頭20000字を使用（Claudeのトークン節約）
    if (text.length > 20000) {
      text = text.substring(0, 20000) + "\n\n...(以下省略)";
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "URLからテキストを抽出できませんでした" },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("fetch-url error:", error);
    const msg = (error as Error).message || "Unknown error";
    return NextResponse.json(
      { error: `URLの取得に失敗しました: ${msg}` },
      { status: 500 }
    );
  }
}
