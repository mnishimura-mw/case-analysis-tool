import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Google OAuth コードをセッションに交換
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        // Service Role Key で allowed_users テーブルを照合（RLS バイパス）
        const admin = createAdminClient();
        const { data: allowedUser } = await admin
          .from("allowed_users")
          .select("email")
          .eq("email", user.email)
          .single();

        if (allowedUser) {
          // 許可リストに存在 → ツールへリダイレクト（管理画面へはヘッダーから遷移可能）
          return NextResponse.redirect(`${origin}/tool`);
        }

        // 許可リストにない → サインアウトしてエラー表示
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/?error=unauthorized`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/?error=unauthorized`);
}
