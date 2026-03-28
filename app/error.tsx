"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)",
      fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic Pro',sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "40px 48px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1.5px solid #E2E8F0",
        maxWidth: 440, textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: "0 0 8px" }}>
          エラーが発生しました
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24, lineHeight: 1.7 }}>
          予期しないエラーが発生しました。<br />
          問題が続く場合はフィードバックボタンからご報告ください。
        </p>
        {error.digest && (
          <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>
            エラーID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            padding: "12px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700,
            background: "#1A56DB", color: "#fff", border: "none", cursor: "pointer",
          }}
        >
          再試行する
        </button>
      </div>
    </div>
  );
}
