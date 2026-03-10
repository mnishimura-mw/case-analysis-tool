import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server";

// ログイン中ユーザーが管理者かチェック
async function getAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("allowed_users")
    .select("is_admin")
    .eq("email", user.email)
    .single();

  if (!data?.is_admin) return null;
  return user;
}

// GET: ユーザー一覧取得
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("allowed_users")
    .select("id, email, is_admin, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: ユーザー追加
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, is_admin = false } = await req.json();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("allowed_users")
    .insert({ email: email.trim().toLowerCase(), is_admin })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE: ユーザー削除
export async function DELETE(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  // 自分自身は削除不可
  if (email === user.email) {
    return NextResponse.json({ error: "自分自身は削除できません" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("allowed_users")
    .delete()
    .eq("email", email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
