import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_ENABLED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url_here";

const TOKEN_COOKIE = "sa_token";

export async function middleware(request: NextRequest) {
  if (!SUPABASE_ENABLED) return NextResponse.next();

  const pathname = request.nextUrl.pathname;

  // ── ツール系: トークン認証 or 管理者認証 ──
  if (pathname.startsWith("/tool")) {
    // URLにtoken付き → Cookieに保存してリダイレクト
    const tokenParam = request.nextUrl.searchParams.get("token");
    if (tokenParam) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("token");
      const response = NextResponse.redirect(url);
      response.cookies.set(TOKEN_COOKIE, tokenParam, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90, // 90 days
        path: "/",
      });
      return response;
    }

    // CookieにトークンがあればOK
    const token = request.cookies.get(TOKEN_COOKIE)?.value;
    if (token) {
      return NextResponse.next();
    }

    // トークンなし → 管理者セッションがあるか確認（スーパーバイザーモード）
    let supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      // ログイン済み → allowed_usersにいればアクセス許可
      return supabaseResponse;
    }

    // どちらもなし → トップページへ
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ── 管理画面: Google認証を維持 ──
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    let supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ── ログインページ: ログイン済みなら /admin へ ──
  if (pathname === "/") {
    // ツール用トークンがあれば /tool へ
    const token = request.cookies.get(TOKEN_COOKIE)?.value;
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = "/tool";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
