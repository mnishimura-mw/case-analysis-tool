"use client";

import { useState } from "react";
import type { ProductInfo } from "@/lib/types";
import { ACCENT, ACCENT_DARK, ACCENT_LIGHT, SUCCESS } from "@/lib/types";
import { fetchProductInfo } from "@/lib/ai";
import { useToast } from "@/components/ui/Toast";
import StreamingPreview from "@/components/ui/StreamingPreview";

export default function Step0({
  productInfo,
  setProductInfo,
  onNext,
}: {
  productInfo: ProductInfo;
  setProductInfo: (p: ProductInfo) => void;
  onNext: () => void;
}) {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState(productInfo.companyName || "");
  const [name, setName] = useState(productInfo.name || "");
  const [url, setUrl] = useState(productInfo.url || "");
  const [note, setNote] = useState(productInfo.note || "");
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(!!productInfo.fetched);
  const [streamText, setStreamText] = useState("");

  const fullName = [companyName, name].filter(Boolean).join(" / ");

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setStreamText("");
    try {
      const result = await fetchProductInfo(companyName, name, url, setStreamText);
      setProductInfo({ companyName, name, url, note, fetched: result });
      setFetched(true);
      setStreamText("");
    } catch (e) {
      toast("取得失敗: " + (e as Error).message);
      setStreamText("");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if ((companyName.trim() || name.trim()) && !productInfo.fetched) {
      setLoading(true);
      setStreamText("");
      try {
        const result = await fetchProductInfo(companyName, name, url, setStreamText);
        setProductInfo({ companyName, name, url, note, fetched: result });
        setFetched(true);
        setStreamText("");
      } catch {
        /* 取得失敗しても進む */
        setStreamText("");
      }
      setLoading(false);
    } else {
      setProductInfo({
        companyName,
        name,
        url,
        note,
        fetched: productInfo.fetched || "",
      });
    }
    onNext();
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0 }}>
          Step 0 ｜ 製品情報を設定する
        </h2>
        <p style={{ fontSize: 14, color: "#64748B", marginTop: 6 }}>
          分析対象の自社製品を登録します。ここで登録した製品情報は、Step 1〜3のAI分析すべてに文脈として渡されます。
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Company + Product name row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              社名 <span style={{ color: "#94A3B8", fontWeight: 400, fontSize: 12 }}>（入力すると分析精度が上がります）</span>
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="例：Salesforce、HubSpot、Microsoft..."
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10, fontSize: 14, color: "#1E293B", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              製品名 <span style={{ color: "#94A3B8", fontWeight: 400, fontSize: 12 }}>（入力すると分析精度が上がります）</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：Sales Cloud、HubSpot CRM、Dynamics 365 Sales..."
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10, fontSize: 14, color: "#1E293B", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Preview */}
        {fullName && (
          <div style={{ padding: "8px 14px", background: ACCENT_LIGHT, borderRadius: 8, border: "1px solid #BFDBFE", fontSize: 13, color: ACCENT, fontWeight: 600 }}>
            📦 登録名：{fullName}
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
            製品ドキュメントURL <span style={{ color: "#94A3B8", fontWeight: 400 }}>（任意）</span>
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={url}
              onChange={(e) => { setUrl(e.target.value); setFetched(false); }}
              placeholder="https://..."
              style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10, fontSize: 14, color: "#1E293B", outline: "none" }}
            />
            <button
              onClick={handleFetch}
              disabled={loading || !url.trim()}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: loading || !url.trim() ? "#CBD5E1" : ACCENT,
                color: "#fff", border: "none",
                cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "🔄 取得中..." : "🌐 URLから取得"}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
            URLを入力すると製品情報の補足として取り込まれます（任意）
          </p>
        </div>

        {loading && <StreamingPreview text={streamText} />}

        {fetched && productInfo.fetched && (
          <div style={{ background: "#F0FDF4", border: "1.5px solid #A7F3D0", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: SUCCESS, marginBottom: 8 }}>
              ✓ 製品情報を取得しました
            </div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, maxHeight: 120, overflow: "auto", whiteSpace: "pre-wrap" }}>
              {productInfo.fetched.slice(0, 600)}
              {productInfo.fetched.length > 600 ? "..." : ""}
            </div>
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
            製品の補足メモ <span style={{ color: "#94A3B8", fontWeight: 400 }}>（任意）</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="製品の特徴・強み・競合との差別化ポイントなど、AIに伝えておきたい情報を自由に記入してください..."
            style={{
              width: "100%", minHeight: 100, padding: "12px 14px",
              border: "1.5px solid #CBD5E1", borderRadius: 10, fontSize: 14,
              color: "#1E293B", background: "#fff", resize: "vertical",
              fontFamily: "inherit", lineHeight: 1.6, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: "12px 36px", borderRadius: 10, fontSize: 15, fontWeight: 800,
            background: loading ? "#CBD5E1" : ACCENT_DARK,
            color: "#fff", border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "🔄 製品情報を取得中..." : "Step 1へ進む →"}
        </button>
      </div>
    </div>
  );
}
