import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server";

const SUPABASE_ENABLED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url_here";

export async function POST(req: NextRequest) {
  let userEmail: string | null = null;

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
      userEmail = user.email ?? null;
    }

    const body = await req.json();
    const { action, ...claudeBody } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
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

    // 利用ログを記録（成功時のみ・非同期で行いレスポンスをブロックしない）
    if (SUPABASE_ENABLED && userEmail && response.ok) {
      const admin = createAdminClient();
      admin
        .from("usage_logs")
        .insert({ user_email: userEmail, action: action ?? "unknown" })
        .then(({ error }) => {
          if (error) console.error("usage_logs insert error:", error.message);
        });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
