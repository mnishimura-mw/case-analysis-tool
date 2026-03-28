import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { randomBytes } from "crypto";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const { createServerClient } = await import("@supabase/ssr");
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const admin = createAdminClient();
  const { data } = await admin.from("allowed_users").select("is_admin").eq("email", user.email).single();
  return !!data?.is_admin;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data } = await admin.from("access_tokens").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { label } = await req.json();
  const token = randomBytes(16).toString("hex");
  const admin = createAdminClient();
  const { error } = await admin.from("access_tokens").insert({ token, label: label || "新規トークン" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, is_active } = await req.json();
  const admin = createAdminClient();
  const { error } = await admin.from("access_tokens").update({ is_active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
