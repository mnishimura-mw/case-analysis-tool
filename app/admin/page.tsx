"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT_DARK = "#1e3a8a";
const ACCENT = "#1A56DB";
const ACCENT_LIGHT = "#EFF6FF";
const SUCCESS = "#059669";

interface AllowedUser {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.status === 403) { setForbidden(true); setLoading(false); return; }
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    setErrorMsg("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim(), is_admin: newIsAdmin }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "追加に失敗しました");
    } else {
      setNewEmail("");
      setNewIsAdmin(false);
      showSuccess(`${data.email} を追加しました`);
      await fetchUsers();
    }
    setAdding(false);
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`${email} のアクセスを削除しますか？`)) return;
    setDeletingEmail(email);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "削除に失敗しました");
    } else {
      showSuccess(`${email} を削除しました`);
      await fetchUsers();
    }
    setDeletingEmail(null);
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
        <button onClick={() => router.push("/tool")} style={{ padding: "10px 24px", borderRadius: 10, background: ACCENT, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>ツールに戻る</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)", fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic Pro',sans-serif" }}>

      {/* ヘッダー */}
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

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>

        {/* 通知 */}
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

        {/* ユーザー追加フォーム */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1.5px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: "0 0 16px" }}>
            ＋ 新規ユーザーを追加
          </h2>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="メールアドレスを入力"
              style={{ flex: 1, minWidth: 240, padding: "10px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10, fontSize: 14, color: "#1E293B", outline: "none" }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={e => setNewIsAdmin(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: ACCENT }}
              />
              管理者権限
            </label>
            <button
              onClick={handleAdd}
              disabled={adding || !newEmail.trim()}
              style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: adding || !newEmail.trim() ? "#CBD5E1" : ACCENT, color: "#fff", border: "none", cursor: adding || !newEmail.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
            >
              {adding ? "追加中..." : "追加する"}
            </button>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: 0 }}>
              アクセス許可ユーザー
            </h2>
            <span style={{ background: ACCENT_LIGHT, color: ACCENT, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
              {users.length}名
            </span>
          </div>

          {users.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
              ユーザーがいません
            </div>
          ) : (
            <div>
              {/* ヘッダー行 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, padding: "10px 24px", background: "#F8FAFF", borderBottom: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 0.5 }}>メールアドレス</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 0.5 }}>権限</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 0.5 }}>操作</div>
              </div>

              {users.map((u, i) => (
                <div
                  key={u.id}
                  style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, padding: "14px 24px", borderBottom: i < users.length - 1 ? "1px solid #F1F5F9" : "none", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontSize: 14, color: "#1E293B", fontWeight: 600 }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                      追加日: {new Date(u.created_at).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                  <div>
                    {u.is_admin ? (
                      <span style={{ background: "#EFF6FF", color: ACCENT, border: `1px solid #BFDBFE`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                        管理者
                      </span>
                    ) : (
                      <span style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                        一般
                      </span>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => handleDelete(u.email)}
                      disabled={deletingEmail === u.email}
                      style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: deletingEmail === u.email ? "not-allowed" : "pointer", opacity: deletingEmail === u.email ? 0.6 : 1 }}
                    >
                      {deletingEmail === u.email ? "削除中..." : "削除"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 16, lineHeight: 1.6 }}>
          ※ 削除したユーザーは即座にアクセス不可になります。<br />
          ※ 自分自身（管理者）は削除できません。
        </p>
      </div>
    </div>
  );
}
