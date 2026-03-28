const ACCENT_DARK = "#1e3a8a";

export default function TopPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)",
      fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic Pro',sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ background: ACCENT_DARK, padding: "18px 32px" }}>
        <div style={{ color: "#93C5FD", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>SALES SCHOOL</div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginTop: 2 }}>事例分析ツール</div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "40px 48px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1.5px solid #E2E8F0",
          width: "100%",
          maxWidth: 440,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 8px" }}>事例分析ツール</h1>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 28, lineHeight: 1.7 }}>
            Sales Schoolメンバーシップ会員専用ツールです。<br />
            Noteの限定記事内のリンクからアクセスしてください。
          </p>

          <div style={{
            background: "#F8FAFC",
            border: "1.5px solid #E2E8F0",
            borderRadius: 10,
            padding: "16px",
            fontSize: 13,
            color: "#475569",
            lineHeight: 1.8,
            textAlign: "left",
          }}>
            <strong>使い方</strong><br />
            1. Noteメンバーシップに登録<br />
            2. 限定記事内の専用リンクをクリック<br />
            3. ツールが利用可能になります
          </div>

          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 20, lineHeight: 1.6 }}>
            ※ 管理者の方は <a href="/login" style={{ color: "#1A56DB" }}>管理画面ログイン</a> へ
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#94A3B8" }}>
        <div style={{ marginBottom: 6, display: "flex", justifyContent: "center", gap: 16 }}>
          <a href="/terms" style={{ color: "#94A3B8", textDecoration: "underline" }}>利用規約</a>
          <a href="/privacy" style={{ color: "#94A3B8", textDecoration: "underline" }}>プライバシーポリシー</a>
        </div>
        © {new Date().getFullYear()} Sales School. All rights reserved.
      </div>
    </div>
  );
}
