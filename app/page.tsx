"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

const ACCENT_DARK = "#1e3a8a";
const ACCENT = "#1A56DB";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
      <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.5 6.3 14.7z"/>
      <path fill="#FBBC05" d="M24 46c5.8 0 10.9-1.9 14.9-5.3l-6.9-5.7C29.9 37.1 27.1 38 24 38c-6.1 0-10.7-3.1-11.8-7.5l-7 5.4C9.1 42.4 16 46 24 46z"/>
      <path fill="#EA4335" d="M43.6 20H24v8.5h11.8c-1.1 3.1-3.3 5.6-6.2 7.2l6.9 5.7c4-3.7 6.5-9.2 6.5-16.4 0-1.3-.2-2.7-.4-4z"/>
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)",
      fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic Pro',sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ヘッダー */}
      <div style={{ background: ACCENT_DARK, padding: "18px 32px" }}>
        <div style={{ color: "#93C5FD", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>SALES SCHOOL</div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginTop: 2 }}>事例分析ツール</div>
      </div>

      {/* ログインカード */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "40px 48px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1.5px solid #E2E8F0",
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 8px" }}>ログイン</h1>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 28, lineHeight: 1.7 }}>
            Sales Schoolメンバーシップ会員専用ツールです。<br />
            Googleアカウントでログインしてください。
          </p>

          {error === "unauthorized" && (
            <div style={{
              background: "#FEF2F2",
              border: "1.5px solid #FECACA",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#DC2626",
              fontWeight: 600,
              textAlign: "left",
            }}>
              ⚠️ アクセス権限がありません<br />
              <span style={{ fontWeight: 400 }}>このアカウントは許可リストに登録されていません。</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "13px 20px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              background: "#fff",
              color: "#1E293B",
              border: "1.5px solid #E2E8F0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <GoogleIcon />
            Googleでログイン
          </button>

          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 20, lineHeight: 1.6 }}>
            ログインすることで、利用規約およびプライバシーポリシーに同意したものとみなされます。
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#94A3B8" }}>
        © {new Date().getFullYear()} Sales School. All rights reserved.
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams は Suspense でラップする必要がある
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748B" }}>読み込み中...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

// 未使用変数の警告を抑制
void ACCENT;
