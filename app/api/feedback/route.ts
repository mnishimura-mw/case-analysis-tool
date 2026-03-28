import { NextRequest, NextResponse } from "next/server";
import { hasValidAccess } from "@/lib/access-token";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  if (!(await hasValidAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, message, page, error_detail, user_agent } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("feedback").insert({
      type: type || "feedback",
      message: message.trim(),
      page: page || null,
      error_detail: error_detail || null,
      user_agent: user_agent || null,
    });

    if (error) {
      console.error("feedback insert error:", error.message);
      return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
