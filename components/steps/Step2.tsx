"use client";

import { useState } from "react";
import type { CaseItem, CommonData } from "@/lib/types";
import { ACCENT, ACCENT_DARK, NUMS, WARN } from "@/lib/types";
import { analyzeCommon } from "@/lib/ai";
import Tag from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import StreamingPreview from "@/components/ui/StreamingPreview";

const axes: { key: keyof CommonData; label: string; color: string; desc: string }[] = [
  { key: "issues",    label: "①訴求すべき課題",    color: "purple", desc: "複数の事例に共通する課題 ─ 顧客に「うちもそうだ」と言わせやすいテーマ" },
  { key: "strengths", label: "②製品の強み",         color: "green",  desc: "顧客が自社製品の何に価値を感じて導入したか ─ 競合との差別化ポイント" },
  { key: "values",    label: "③導入の価値（効果）", color: "amber",  desc: "導入効果から ─ 投資対効果として伝えられる成果" },
];

export default function Step2({
  cases,
  commonData,
  setCommonData,
  onNext,
}: {
  cases: CaseItem[];
  commonData: CommonData | null;
  setCommonData: (d: CommonData) => void;
  onNext: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");

  const run = async () => {
    setLoading(true);
    setStreamText("");
    try {
      const analyzed = cases.filter((c) => c.analysis).map((c) => ({
        companyName: c.companyName,
        caseTitle: c.caseTitle,
        analysis: c.analysis!,
      }));
      setCommonData(await analyzeCommon(analyzed, setStreamText));
      setStreamText("");
    } catch (e) {
      toast("比較分析に失敗: " + (e as Error).message);
      setStreamText("");
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0 }}>
          Step 2 ｜ 訴求軸を抽出する
        </h2>
        <p style={{ fontSize: 14, color: "#64748B", marginTop: 6 }}>
          {cases.length}件の事例を横断比較し、訴求に使える3つの軸で共通点・固有点を整理します。
        </p>
      </div>

      <button
        onClick={run}
        disabled={loading}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 800,
          background: loading ? "#CBD5E1" : ACCENT, color: "#fff", border: "none",
          cursor: loading ? "not-allowed" : "pointer", marginBottom: 24,
        }}
      >
        {loading ? "🔄 分析中..." : "✨ AIで訴求軸を抽出する"}
      </button>

      {loading && <StreamingPreview text={streamText} />}

      {commonData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {axes.map((ax) => (
            <div key={ax.key} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                <Tag color={ax.color}>{ax.label}</Tag>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{ax.desc}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Common */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748B", marginBottom: 8, letterSpacing: 1 }}>
                    共 通 点 ─ 訴求の核
                  </div>
                  {(commonData[ax.key]?.common || []).map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex", gap: 6, alignItems: "flex-start",
                        padding: "10px 12px", background: "#F0F9FF", borderRadius: 8,
                        fontSize: 13, color: "#1E293B", marginBottom: 6, borderLeft: `3px solid ${ACCENT}`,
                      }}
                    >
                      <span style={{ fontWeight: 800, color: ACCENT, minWidth: 20, flexShrink: 0 }}>{NUMS[i]}</span>
                      <span style={{ lineHeight: 1.7 }}>{item}</span>
                    </div>
                  ))}
                </div>
                {/* Unique */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748B", marginBottom: 8, letterSpacing: 1 }}>
                    固 有 点
                  </div>
                  {(commonData[ax.key]?.unique || []).map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 14px", background: "#FFFBF0", borderRadius: 8,
                        fontSize: 13, color: "#1E293B", marginBottom: 8,
                        borderLeft: `3px solid ${WARN}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: WARN, borderRadius: 4, padding: "1px 7px" }}>
                          {item.company}
                        </span>
                      </div>
                      <div style={{ lineHeight: 1.75, color: "#374151" }}>{item.point}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={onNext}
            style={{
              alignSelf: "flex-end", padding: "12px 32px", borderRadius: 10, fontSize: 15, fontWeight: 800,
              background: ACCENT_DARK, color: "#fff", border: "none", cursor: "pointer", marginTop: 4,
            }}
          >
            Step 3へ進む →
          </button>
        </div>
      )}
    </div>
  );
}
