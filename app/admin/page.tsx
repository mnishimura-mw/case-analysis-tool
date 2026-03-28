"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT_DARK = "#1e3a8a";
const ACCENT = "#1A56DB";
const ACCENT_LIGHT = "#EFF6FF";
const SUCCESS = "#059669";
const WARN = "#D97706";

interface AllowedUser {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface AccessToken {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

interface GlobalUsage {
  month: string;
  monthlyUsed: number;
  monthlyLimit: number;
  dailyUsed: number;
  dailyLimit: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byAction: Record<string, number>;
}

interface AnalysisRecord {
  id: string;
  session_id: string;
  step: string;
  product_company: string | null;
  product_name: string | null;
  case_company: string | null;
  case_title: string | null;
  analysis_data: unknown;
  created_at: string;
}

type Section = "tokens" | "usage" | "history" | "admins";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("usage");

  // Admin users
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);

  // Access tokens
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [addingToken, setAddingToken] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Global usage
  const [usage, setUsage] = useState<GlobalUsage | null>(null);

  // Analysis history
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.status === 403) { setForbidden(true); setLoading(false); return; }
    setUsers(await res.json());
    setLoading(false);
  };

  const fetchTokens = async () => {
    const res = await fetch("/api/admin/tokens");
    if (res.ok) setTokens(await res.json());
  };

  const fetchUsage = async () => {
    const res = await fetch("/api/admin/global-usage");
    if (res.ok) setUsage(await res.json());
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const res = await fetch("/api/admin/analysis-history");
    if (res.ok) setHistory(await res.json());
    setHistoryLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchTokens();
    fetchUsage();
  }, []);

  useEffect(() => {
    if (activeSection === "history" && history.length === 0) fetchHistory();
  }, [activeSection]);

  // ── Handlers ──

  const handleAddUser = async () => {
    if (!newEmail.trim()) return;
    setAdding(true); setErrorMsg("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim(), is_admin: newIsAdmin }),
    });
    const data = await res.json();
    if (!res.ok) { setErrorMsg(data.error || "追加に失敗しました"); }
    else { setNewEmail(""); setNewIsAdmin(false); showSuccess(`${data.email} を追加しました`); await fetchUsers(); }
    setAdding(false);
  };

  const handleDeleteUser = async (email: string) => {
    setDeletingEmail(email); setConfirmDeleteEmail(null);
    const res = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (!res.ok) { setErrorMsg(data.error || "削除に失敗しました"); }
    else { showSuccess(`${email} を削除しました`); await fetchUsers(); }
    setDeletingEmail(null);
  };

  const handleAddToken = async () => {
    setAddingToken(true); setErrorMsg("");
    const res = await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim() || "新規トークン" }),
    });
    if (res.ok) { setNewLabel(""); showSuccess("トークンを追加しました"); await fetchTokens(); }
    else { setErrorMsg("トークン追加に失敗しました"); }
    setAddingToken(false);
  };

  const handleToggleToken = async (id: string, is_active: boolean) => {
    await fetch("/api/admin/tokens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !is_active }),
    });
    await fetchTokens();
  };

  const handleCopyLink = (token: string, id: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/tool?token=${token}`);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)" }}>
        <div style={{ color: "#64748B", fontSize: 15 }}>読み込み中...</div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 40 }}>🚫</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B" }}>管理者権限がありません</div>
        <button onClick={() => router.push("/")} style={{ padding: "10px 24px", borderRadius: 10, background: ACCENT, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>トップに戻る</button>
      </div>
    );
  }

  const tabs: { key: Section; label: string; icon: string }[] = [
    { key: "usage",   label: "利用状況",   icon: "📊" },
    { key: "tokens",  label: "トークン管理", icon: "🔑" },
    { key: "history", label: "分析履歴",   icon: "📋" },
    { key: "admins",  label: "管理者",     icon: "👥" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)", fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic Pro',sans-serif" }}>

      {/* Header */}
      <div style={{ background: ACCENT_DARK, padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#93C5FD", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>SALES SCHOOL</div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginTop: 2 }}>管理画面</div>
        </div>
        <button
          onClick={() => router.push("/tool")}
          style={{ padding: "8px 20px", borderRadius: 8, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >
          ← ツールに戻る
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: activeSection === tab.key ? ACCENT : "#fff",
                color: activeSection === tab.key ? "#fff" : "#475569",
                border: `1.5px solid ${activeSection === tab.key ? ACCENT : "#E2E8F0"}`,
                cursor: "pointer",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        {successMsg && (
          <div style={{ background: "#F0FDF4", border: "1.5px solid #A7F3D0", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: SUCCESS, fontWeight: 700 }}>
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#DC2626", fontWeight: 700 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ══════ Global Usage ══════ */}
        {activeSection === "usage" && usage && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "月間リクエスト", value: `${usage.monthlyUsed} / ${usage.monthlyLimit}`, color: ACCENT },
                { label: "本日リクエスト", value: `${usage.dailyUsed} / ${usage.dailyLimit}`, color: "#7C3AED" },
                { label: "入力トークン", value: usage.totalInputTokens.toLocaleString(), color: SUCCESS },
                { label: "出力トークン", value: usage.totalOutputTokens.toLocaleString(), color: WARN },
              ].map((card) => (
                <div key={card.label} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1.5px solid #E2E8F0", textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>{card.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Usage bar */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1.5px solid #E2E8F0", marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", margin: "0 0 12px" }}>月間利用率</h3>
              <div style={{ height: 12, background: "#F1F5F9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, (usage.monthlyUsed / usage.monthlyLimit) * 100)}%`,
                  background: usage.monthlyUsed >= usage.monthlyLimit ? "#DC2626" : usage.monthlyUsed >= usage.monthlyLimit * 0.8 ? WARN : ACCENT,
                  borderRadius: 6, transition: "width 0.3s",
                }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748B" }}>
                残り {usage.monthlyLimit - usage.monthlyUsed} リクエスト
              </div>
            </div>

            {/* By action breakdown */}
            {Object.keys(usage.byAction).length > 0 && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1.5px solid #E2E8F0" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", margin: "0 0 12px" }}>アクション別内訳</h3>
                {Object.entries(usage.byAction).sort((a, b) => b[1] - a[1]).map(([action, count]) => (
                  <div key={action} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                    <span style={{ fontSize: 13, color: "#475569" }}>{action}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{count}回</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════ Token Management ══════ */}
        {activeSection === "tokens" && (
          <>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1.5px solid #E2E8F0", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: "0 0 16px" }}>＋ 新規トークン発行</h2>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddToken()}
                  placeholder="ラベル（例: Note 3月号）"
                  style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
                <button onClick={handleAddToken} disabled={addingToken}
                  style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: addingToken ? "#CBD5E1" : ACCENT, color: "#fff", border: "none", cursor: addingToken ? "not-allowed" : "pointer" }}>
                  {addingToken ? "発行中..." : "発行する"}
                </button>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: 0 }}>アクセストークン一覧</h2>
              </div>
              {tokens.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "#94A3B8" }}>トークンがありません</div>
              ) : tokens.map((t, i) => (
                <div key={t.id} style={{ padding: "16px 24px", borderBottom: i < tokens.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{t.label}</span>
                      <span style={{
                        marginLeft: 10, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "2px 10px",
                        background: t.is_active ? "#F0FDF4" : "#FEF2F2",
                        color: t.is_active ? SUCCESS : "#DC2626",
                      }}>
                        {t.is_active ? "有効" : "無効"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleCopyLink(t.token, t.id)}
                        style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: copiedTokenId === t.id ? "#F0FDF4" : ACCENT_LIGHT, color: copiedTokenId === t.id ? SUCCESS : ACCENT, border: `1px solid ${copiedTokenId === t.id ? "#A7F3D0" : "#BFDBFE"}`, cursor: "pointer" }}>
                        {copiedTokenId === t.id ? "✓ コピー済み" : "リンクをコピー"}
                      </button>
                      <button onClick={() => handleToggleToken(t.id, t.is_active)}
                        style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: t.is_active ? "#FEF2F2" : "#F0FDF4", color: t.is_active ? "#DC2626" : SUCCESS, border: `1px solid ${t.is_active ? "#FECACA" : "#A7F3D0"}`, cursor: "pointer" }}>
                        {t.is_active ? "無効にする" : "有効にする"}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>
                    トークン: <code style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4 }}>{t.token.slice(0, 8)}...{t.token.slice(-4)}</code>
                    <span style={{ marginLeft: 12 }}>作成日: {new Date(t.created_at).toLocaleDateString("ja-JP")}</span>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 16, lineHeight: 1.8 }}>
              ※ Noteの限定記事に「リンクをコピー」で取得したURLを貼り付けてください。<br />
              ※ トークンを無効にすると、そのリンクからのアクセスが即座にブロックされます。<br />
              ※ 漏洩した場合は無効にして新規発行してください。
            </p>
          </>
        )}

        {/* ══════ Analysis History ══════ */}
        {activeSection === "history" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: 0 }}>分析履歴（匿名）</h2>
              <button onClick={fetchHistory} disabled={historyLoading}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#fff", color: ACCENT, border: `1.5px solid ${ACCENT}`, cursor: historyLoading ? "not-allowed" : "pointer" }}>
                {historyLoading ? "読み込み中..." : "更新"}
              </button>
            </div>

            {history.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 32, border: "1.5px solid #E2E8F0", textAlign: "center", color: "#94A3B8" }}>
                {historyLoading ? "読み込み中..." : "分析履歴がまだありません"}
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
                {history.map((h, i) => {
                  const stepLabel: Record<string, string> = {
                    step0_product: "📦 製品設定",
                    step1_case: "📊 事例分析",
                    step2_common: "🔍 訴求軸抽出",
                    step3_scenario: "🚀 シナリオ",
                  };
                  return (
                    <div key={h.id} style={{ padding: "14px 24px", borderBottom: i < history.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ background: ACCENT_LIGHT, color: ACCENT, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                            {stepLabel[h.step] || h.step}
                          </span>
                          {h.product_company && (
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>
                              {h.product_company}{h.product_name ? ` / ${h.product_name}` : ""}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>
                          {new Date(h.created_at).toLocaleString("ja-JP")}
                        </span>
                      </div>
                      {h.case_company && (
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                          事例: {h.case_company}{h.case_title ? ` - ${h.case_title}` : ""}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 2 }}>
                        Session: {h.session_id.slice(0, 8)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════ Admin Users ══════ */}
        {activeSection === "admins" && (
          <>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1.5px solid #E2E8F0", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: "0 0 16px" }}>＋ 管理者を追加</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddUser()}
                  placeholder="メールアドレスを入力"
                  style={{ flex: 1, minWidth: 240, padding: "10px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} style={{ width: 16, height: 16, accentColor: ACCENT }} />
                  管理者権限
                </label>
                <button onClick={handleAddUser} disabled={adding || !newEmail.trim()}
                  style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: adding || !newEmail.trim() ? "#CBD5E1" : ACCENT, color: "#fff", border: "none", cursor: adding || !newEmail.trim() ? "not-allowed" : "pointer" }}>
                  {adding ? "追加中..." : "追加する"}
                </button>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: 0 }}>管理者一覧</h2>
                <span style={{ background: ACCENT_LIGHT, color: ACCENT, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>{users.length}名</span>
              </div>
              {users.map((u, i) => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: i < users.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                      {u.is_admin ? "管理者" : "一般"} · {new Date(u.created_at).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {confirmDeleteEmail === u.email ? (
                      <>
                        <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 700 }}>本当に削除？</span>
                        <button onClick={() => handleDeleteUser(u.email)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#DC2626", color: "#fff", border: "none", cursor: "pointer" }}>
                          {deletingEmail === u.email ? "削除中..." : "はい"}
                        </button>
                        <button onClick={() => setConfirmDeleteEmail(null)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0", cursor: "pointer" }}>
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDeleteEmail(u.email)}
                        style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
