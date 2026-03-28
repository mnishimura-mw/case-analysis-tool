"use client";

import { useState, useEffect, useCallback } from "react";

const TYPES = [
  { value: "feedback", label: "💬 フィードバック", color: "#1A56DB" },
  { value: "bug",      label: "🐛 不具合報告",     color: "#DC2626" },
  { value: "request",  label: "✨ 機能リクエスト",  color: "#7C3AED" },
];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("feedback");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorQueue, setErrorQueue] = useState<string[]>([]);

  // Capture unhandled errors for auto-reporting
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      setErrorQueue((prev) => [
        ...prev.slice(-4), // keep last 5
        `${e.message} (${e.filename}:${e.lineno})`,
      ]);
    };
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || String(e.reason);
      setErrorQueue((prev) => [...prev.slice(-4), msg]);
    };
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", rejectionHandler);
    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  const send = useCallback(async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          page: window.location.pathname,
          error_detail: errorQueue.length > 0 ? errorQueue.join("\n") : null,
          user_agent: navigator.userAgent,
        }),
      });
      setSent(true);
      setMessage("");
      setErrorQueue([]);
      setTimeout(() => { setSent(false); setOpen(false); }, 2000);
    } catch {
      // silently fail
    }
    setSending(false);
  }, [type, message, errorQueue]);

  const selectedType = TYPES.find((t) => t.value === type)!;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="no-print"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 52, height: 52, borderRadius: "50%",
          background: errorQueue.length > 0 ? "#DC2626" : "#1A56DB",
          color: "#fff", border: "none", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s",
          transform: open ? "rotate(45deg)" : "none",
        }}
        title="フィードバックを送る"
      >
        {errorQueue.length > 0 ? "⚠" : "💬"}
      </button>

      {/* Error badge */}
      {errorQueue.length > 0 && !open && (
        <div
          className="no-print"
          style={{
            position: "fixed", bottom: 68, right: 20, zIndex: 9999,
            background: "#DC2626", color: "#fff", borderRadius: 12,
            padding: "2px 8px", fontSize: 11, fontWeight: 700,
          }}
        >
          {errorQueue.length}件のエラー
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          className="no-print"
          style={{
            position: "fixed", bottom: 88, right: 24, zIndex: 9998,
            width: 340, background: "#fff", borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1.5px solid #E2E8F0",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B" }}>フィードバック</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>ご意見・不具合報告をお寄せください</div>
          </div>

          <div style={{ padding: "16px 20px" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>送信しました！</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>ご協力ありがとうございます</div>
              </div>
            ) : (
              <>
                {/* Type selector */}
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      style={{
                        flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                        background: type === t.value ? t.color : "#F8FAFC",
                        color: type === t.value ? "#fff" : "#64748B",
                        border: `1.5px solid ${type === t.value ? t.color : "#E2E8F0"}`,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Error auto-detected notice */}
                {errorQueue.length > 0 && (
                  <div style={{
                    background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                    padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#DC2626",
                  }}>
                    ⚠ {errorQueue.length}件のエラーが検出されています。送信すると自動的に添付されます。
                  </div>
                )}

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === "bug"
                      ? "どのような操作をした時に問題が発生しましたか？"
                      : type === "request"
                        ? "どのような機能があると便利ですか？"
                        : "ご意見・ご感想をお聞かせください"
                  }
                  style={{
                    width: "100%", minHeight: 100, padding: "10px 12px",
                    border: `1.5px solid ${selectedType.color}33`,
                    borderRadius: 10, fontSize: 13, color: "#1E293B",
                    outline: "none", resize: "vertical", boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />

                {/* Send */}
                <button
                  onClick={send}
                  disabled={sending || !message.trim()}
                  style={{
                    width: "100%", marginTop: 10, padding: "10px", borderRadius: 10,
                    fontSize: 14, fontWeight: 700,
                    background: sending || !message.trim() ? "#CBD5E1" : selectedType.color,
                    color: "#fff", border: "none",
                    cursor: sending || !message.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {sending ? "送信中..." : "送信する"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
