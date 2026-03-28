export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)",
      fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic Pro',sans-serif",
    }}>
      <div style={{ background: "#1e3a8a", padding: "18px 32px" }}>
        <div style={{ color: "#93C5FD", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>SALES SCHOOL</div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginTop: 2 }}>プライバシーポリシー</div>
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "32px", border: "1.5px solid #E2E8F0", lineHeight: 2, fontSize: 14, color: "#374151" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", marginTop: 0 }}>プライバシーポリシー</h2>

          <h3>1. 収集する情報</h3>
          <p>本サービスでは、以下の情報を収集します。</p>
          <ul>
            <li><strong>分析データ：</strong>ツールに入力された製品情報・事例情報・分析結果（匿名、個人を特定する情報は含みません）</li>
            <li><strong>利用ログ：</strong>IPアドレス（レート制限目的のみ、短期間で破棄）、リクエスト日時、利用機能</li>
          </ul>
          <p>本サービスでは、氏名・メールアドレス等の個人情報は収集しません。</p>

          <h3>2. 情報の利用目的</h3>
          <ul>
            <li>サービスの改善・機能開発のための分析</li>
            <li>不正利用の防止（レート制限）</li>
            <li>サービスの安定運用</li>
          </ul>

          <h3>3. 第三者提供</h3>
          <p>収集した情報を第三者に提供することはありません。ただし、分析テキストはAI処理のためAnthropic社のAPIに送信されます。Anthropic社のプライバシーポリシーについては同社のサイトをご参照ください。</p>

          <h3>4. データの保持期間</h3>
          <p>分析履歴データは、サービス改善のため最大12ヶ月間保持し、その後削除します。IPアドレスに基づくレート制限データは、リクエスト後数分で自動的に破棄されます。</p>

          <h3>5. お問い合わせ</h3>
          <p>本ポリシーに関するお問い合わせは、Noteメンバーシップのメッセージ機能よりご連絡ください。</p>

          <p style={{ marginTop: 32, fontSize: 12, color: "#94A3B8" }}>制定日: 2026年3月28日</p>
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a href="/" style={{ color: "#1A56DB", fontSize: 13 }}>← トップに戻る</a>
        </div>
      </div>
    </div>
  );
}
