export default function TermsPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)",
      fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic Pro',sans-serif",
    }}>
      <div style={{ background: "#1e3a8a", padding: "18px 32px" }}>
        <div style={{ color: "#93C5FD", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>SALES SCHOOL</div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginTop: 2 }}>利用規約</div>
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "32px", border: "1.5px solid #E2E8F0", lineHeight: 2, fontSize: 14, color: "#374151" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", marginTop: 0 }}>利用規約</h2>

          <h3>第1条（適用）</h3>
          <p>本規約は、Sales School（以下「当方」）が提供する「事例分析ツール」（以下「本サービス」）の利用に関する条件を定めるものです。</p>

          <h3>第2条（利用資格）</h3>
          <p>本サービスは、Noteメンバーシップ会員のみが利用できます。アクセスURLの第三者への共有は禁止します。</p>

          <h3>第3条（禁止事項）</h3>
          <p>以下の行為を禁止します。</p>
          <ul>
            <li>アクセスURLの不正な共有・転載</li>
            <li>自動化ツール等による大量リクエスト</li>
            <li>本サービスの逆アセンブル、リバースエンジニアリング</li>
            <li>その他、当方が不適切と判断する行為</li>
          </ul>

          <h3>第4条（免責事項）</h3>
          <p>本サービスはAIによる分析結果を提供するものであり、その正確性・完全性を保証するものではありません。本サービスの利用により生じた損害について、当方は一切の責任を負いません。</p>

          <h3>第5条（サービスの変更・停止）</h3>
          <p>当方は、事前の通知なく本サービスの内容を変更し、または提供を停止することがあります。</p>

          <h3>第6条（規約の変更）</h3>
          <p>当方は、本規約を変更することがあります。変更後の規約は、本ページに掲載した時点で効力を生じます。</p>

          <p style={{ marginTop: 32, fontSize: 12, color: "#94A3B8" }}>制定日: 2026年3月28日</p>
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a href="/" style={{ color: "#1A56DB", fontSize: 13 }}>← トップに戻る</a>
        </div>
      </div>
    </div>
  );
}
