"use client";

import { useState, useRef } from "react";
import type { CaseItem, ProductInfo } from "@/lib/types";
import { ACCENT, ACCENT_DARK, ACCENT_LIGHT, SUCCESS, MAX_CASES } from "@/lib/types";
import { analyzeCase, analyzeCasePDF } from "@/lib/ai";
import { downloadSlideFile } from "@/lib/slide";
import { printElement } from "@/lib/print";
import AnalysisCard from "@/components/ui/AnalysisCard";
import InputArea from "@/components/ui/InputArea";
import { useToast } from "@/components/ui/Toast";
import StreamingPreview from "@/components/ui/StreamingPreview";

export default function Step1({
  cases,
  setCases,
  productInfo,
  onNext,
}: {
  cases: CaseItem[];
  setCases: React.Dispatch<React.SetStateAction<CaseItem[]>>;
  productInfo: ProductInfo;
  onNext: () => void;
}) {
  const { toast } = useToast();
  const [streamTexts, setStreamTexts] = useState<Record<number, string>>({});
  const caseRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setStreamText = (i: number, text: string) =>
    setStreamTexts((prev) => ({ ...prev, [i]: text }));

  const updateCase = (i: number, patch: Partial<CaseItem>) =>
    setCases((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const addCase = () => {
    if (cases.length < MAX_CASES) {
      setCases((prev) => [...prev, { companyName: "", caseTitle: "", input: "", inputType: "text", analysis: null, loading: false }]);
    }
  };

  const removeCase = (i: number) =>
    setCases((prev) => prev.filter((_, idx) => idx !== i));

  const runAnalysis = async (i: number) => {
    const c = cases[i];
    updateCase(i, { loading: true });
    setStreamText(i, "");
    const onProgress = (text: string) => setStreamText(i, text);
    try {
      const ctx = [productInfo.fetched, productInfo.note].filter(Boolean).join("\n");

      if (c.inputType === "file" && c.input.startsWith("data:application/pdf;base64,")) {
        const base64 = c.input.replace("data:application/pdf;base64,", "");
        const analysis = await analyzeCasePDF(base64, ctx, onProgress);
        if (!analysis || !analysis.background)
          throw new Error("PDFから事例情報を抽出できませんでした。有効な事例PDFをご確認ください");
        const updates: Partial<CaseItem> = { analysis, loading: false };
        if (!c.companyName && analysis.companyName) updates.companyName = analysis.companyName;
        if (analysis.caseTitle) updates.caseTitle = analysis.caseTitle;
        updateCase(i, updates);
      } else if (c.inputType === "url") {
        const fetchRes = await fetch("/api/fetch-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: c.input.trim() }),
        });
        if (!fetchRes.ok) {
          const errData = await fetchRes.json();
          throw new Error(errData.error || "URLの取得に失敗しました");
        }
        const { text } = await fetchRes.json();
        let analysis;
        try {
          analysis = await analyzeCase(text, ctx, onProgress);
        } catch {
          throw new Error("URLから事例情報を解析できませんでした。\n有効な事例記事URLを入力してください。");
        }
        if (!analysis || !analysis.background)
          throw new Error("URLから事例情報を抽出できませんでした。\n有効な事例記事URLを入力してください。");
        const updates: Partial<CaseItem> = { analysis, loading: false };
        if (!c.companyName && analysis.companyName) updates.companyName = analysis.companyName;
        if (analysis.caseTitle) updates.caseTitle = analysis.caseTitle;
        updateCase(i, updates);
      } else {
        let analysis;
        try {
          analysis = await analyzeCase(c.input, ctx, onProgress);
        } catch {
          throw new Error("事例情報の解析に失敗しました。\n事例インタビューや導入事例のテキストを入力してください。");
        }
        if (!analysis || !analysis.background)
          throw new Error("テキストから事例情報を抽出できませんでした。\n事例インタビューや導入事例のテキストを入力してください。");
        const updates: Partial<CaseItem> = { analysis, loading: false };
        if (!c.companyName && analysis.companyName) updates.companyName = analysis.companyName;
        if (analysis.caseTitle) updates.caseTitle = analysis.caseTitle;
        updateCase(i, updates);
      }
    } catch (e) {
      updateCase(i, { loading: false });
      toast((e as Error).message);
    }
    setStreamText(i, "");
  };

  const downloadSlide = async (i: number) => {
    try {
      await downloadSlideFile(cases[i]);
    } catch (e) {
      toast("PPT出力失敗: " + (e as Error).message);
    }
  };

  const printCase = (i: number) => {
    const el = caseRefs.current[i];
    if (!el) return;
    const c = cases[i];
    printElement(el, `事例分析_${c.companyName || c.caseTitle || `事例${i + 1}`}`);
  };

  const doneCases = cases.filter((c) => c.analysis).length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0 }}>
          Step 1 ｜ 事例を4つの軸で分析する
        </h2>
        <p style={{ fontSize: 14, color: "#64748B", marginTop: 6 }}>
          事例のテキスト・URL・ファイルを投入し、AIが自動分析します。最大{MAX_CASES}件まで登録できます。
        </p>
        <div
          style={{
            marginTop: 10, padding: "10px 14px", background: "#F0FDF4",
            borderRadius: 8, border: "1px solid #A7F3D0", fontSize: 13, color: "#065F46",
          }}
        >
          📥 分析完了後「PPTに出力」ボタンで、分析結果をPowerPointファイルとしてダウンロードできます
        </div>
        {productInfo.name && (
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10,
              padding: "8px 14px", background: ACCENT_LIGHT, borderRadius: 8, border: "1px solid #BFDBFE",
            }}
          >
            <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>
              📦 分析対象製品：{[productInfo.companyName, productInfo.name].filter(Boolean).join(" / ")}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {cases.map((c, i) => (
          <div
            key={i}
            ref={(el) => { caseRefs.current[i] = el; }}
            style={{
              background: "#fff", border: "1.5px solid #E2E8F0",
              borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div data-role="case-header" style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: "50%", background: ACCENT,
                    color: "#fff", fontWeight: 800, fontSize: 14,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <input
                  value={c.companyName}
                  onChange={(e) => updateCase(i, { companyName: e.target.value })}
                  placeholder="企業名（分析後に自動入力）"
                  style={{
                    border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "6px 12px",
                    fontSize: 13, fontWeight: 700, color: "#1E293B", outline: "none", width: 180, flexShrink: 0,
                  }}
                />
                <input
                  value={c.caseTitle}
                  onChange={(e) => updateCase(i, { caseTitle: e.target.value })}
                  placeholder="タイトル（分析後に自動生成）"
                  style={{
                    border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "6px 12px",
                    fontSize: 13, color: "#475569", outline: "none", flex: 1, minWidth: 0,
                  }}
                />
                {c.analysis && (
                  <span style={{ fontSize: 12, color: SUCCESS, fontWeight: 700, flexShrink: 0 }}>
                    ✓ 分析完了
                  </span>
                )}
              </div>
              <div data-role="case-actions" className="no-print" style={{ display: "flex", gap: 8 }}>
                {c.analysis && (
                  <>
                    <button
                      onClick={() => downloadSlide(i)}
                      style={{
                        padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                        background: "#0F9D58", color: "#fff", border: "none", cursor: "pointer",
                      }}
                    >
                      📥 PPTに出力
                    </button>
                    <button
                      onClick={() => printCase(i)}
                      style={{
                        padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                        background: "#fff", color: ACCENT, border: `1.5px solid ${ACCENT}`, cursor: "pointer",
                      }}
                    >
                      🖨️ PDF保存
                    </button>
                  </>
                )}
                {cases.length > 1 && (
                  <button
                    onClick={() => removeCase(i)}
                    style={{
                      padding: "7px 12px", borderRadius: 8, fontSize: 13,
                      background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer",
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
            <InputArea
              value={c.input}
              onChange={(v) => updateCase(i, { input: v })}
              inputType={c.inputType}
              onTypeChange={(v) => updateCase(i, { inputType: v })}
            />
            <button
              onClick={() => runAnalysis(i)}
              disabled={c.loading || !c.input.trim()}
              style={{
                marginTop: 14, padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: c.loading || !c.input.trim() ? "not-allowed" : "pointer",
                background: c.loading || !c.input.trim() ? "#CBD5E1" : ACCENT,
                color: "#fff", border: "none", width: "100%",
              }}
            >
              {c.loading ? "🔄 AI分析中..." : "✨ AIで分析する"}
            </button>
            {c.loading && <StreamingPreview text={streamTexts[i] || ""} />}
            {c.analysis && <AnalysisCard analysis={c.analysis} />}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        {cases.length < MAX_CASES ? (
          <button
            onClick={addCase}
            style={{
              padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: "#F1F5F9", color: "#475569", border: "2px dashed #CBD5E1", cursor: "pointer",
            }}
          >
            + 事例を追加する（最大{MAX_CASES}件）
          </button>
        ) : (
          <div />
        )}
        {doneCases >= 2 && (
          <button
            onClick={onNext}
            style={{
              padding: "12px 32px", borderRadius: 10, fontSize: 15, fontWeight: 800,
              background: ACCENT_DARK, color: "#fff", border: "none", cursor: "pointer",
            }}
          >
            Step 2へ進む →
          </button>
        )}
      </div>
    </div>
  );
}
