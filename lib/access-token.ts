import { cookies } from "next/headers";
import { createAdminClient } from "./supabase-server";

const COOKIE_NAME = "sa_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/**
 * Validate an access token against the database.
 */
export async function validateToken(token: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("access_tokens")
    .select("id")
    .eq("token", token)
    .eq("is_active", true)
    .single();
  return !!data;
}

/**
 * Check if the current request has a valid access token (from cookie).
 */
export async function hasValidAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return validateToken(token);
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
