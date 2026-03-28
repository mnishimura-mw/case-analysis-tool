import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "./supabase-server";

const COOKIE_NAME = "sa_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/**
 * Validate an access token against the database.
 */
export async function validateToken(token: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("access_tokens")
    .select("id")
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("Token validation query failed:", error.message);
    return false; // fail closed
  }
  return !!data;
}

/**
 * Check if the current request has valid access:
 * 1. Valid access token in cookie, OR
 * 2. Authenticated admin/allowed user session (supervisor mode)
 */
export async function hasValidAccess(): Promise<boolean> {
  const cookieStore = await cookies();

  // 1. トークン認証
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const valid = await validateToken(token);
    if (valid) return true;
  }

  // 2. 管理者/許可ユーザーのセッション認証
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("allowed_users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    if (data) return true;
  }

  return false;
}

/**
 * Set the access token cookie.
 */
export async function setTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export { COOKIE_NAME };
