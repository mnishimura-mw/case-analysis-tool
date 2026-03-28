"use client";

import { useState, useRef } from "react";
import type { CommonData, ProductInfo, Scenario, Requirements } from "@/lib/types";
import { ACCENT, ACCENT_LIGHT, SUCCESS } from "@/lib/types";
import { analyzeScenario } from "@/lib/ai";
import { printElement } from "@/lib/print";
import { useToast } from "@/components/ui/Toast";
import StreamingPreview from "@/components/ui/StreamingPreview";

const colors = [
  { bg: "#EFF6FF", border: "#1A56DB", num: "#1A56DB" },
  { bg: "#F5F3FF", border: "#7C3AED", num: "#7C3AED" },
  { bg: "#ECFDF5", border: "#059669", num: "#059669" },
];

const labels: { key: keyof Scenario; icon: string; label: string; desc: string }[] = [
  { key: "issue",         icon: "①", label: "訴求すべき課題",           desc: "背景・課題から抽出" },
  { key: "externalTrend", icon: "②", label: "課題を裏付ける外部動向",   desc: "権威機関の調査・発表を引用" },
  { key: "value",         icon: "③", label: "検討する価値",             desc: "導入効果から抽出" },
  { key: "strength",      icon: "④", label: "訴求すべき自社製品の強み", desc: "選定理由から抽出" },
];

const reqCategories: { key: keyof Requirements; label: string; desc: string; color: string; bg: string }[] = [
  { key: "functional",    label: "機能要件",   desc: "何をするか",               color: "#1A56DB", bg: "#EFF6FF" },
  { key: "nonFunctional", label: "非機能要件", desc: "どのように動作するか",     color: "#7C3AED", bg: "#F5F3FF" },
  { key: "operational",   label: "運用要件",   desc: "どのように運用されるか",   color: "#059669", bg: "#ECFDF5" },
  { key: "environmental", label: "環境要件",   desc: "どのような環境で動作するか", color: "#D97706", bg: "#FFFBEB" },
];

export default function Step3({
  commonData,
  productInfo,
}: {
  commonData: CommonData;
  productInfo: ProductInfo;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
  const [streamText, setStreamText] = useState("");
  const allScenariosRef = useRef<HTMLDivElement>(null);
  const scenarioRefs = useRef<(HTMLDivElement | null)[]>([]);

  const run = async () => {
    setLoading(true);
    setStreamText("");
    try {
      const ctx = [productInfo.fetched, productInfo.note].filter(Boolean).join("\n");
      setScenarios(
        await analyzeScenario(
          commonData,
          ctx,
          [productInfo.companyName, productInfo.name].filter(Boolean).join(" / "),
          setStreamText
        )
      );
      setStreamText("");
    } catch (e) {
      toast("シナリオ生成に失敗: " + (e as Error).message);
      setStreamText("");
    }
    setLoading(false);
  };

  const printAll = () => {
    if (!allScenariosRef.current) return;
    const productLabel = [productInfo.companyName, productInfo.name].filter(Boolean).join("_");
    printElement(allScenariosRef.current, `啓蒙シナリオ_${productLabel || "全体"}`);
  };

  const printSingle = (index: number) => {
    const el = scenarioRefs.current[index];
    if (!el) return;
    const sc = scenarios?.[index];
    const title = sc?.title || `シナリオ${index + 1}`;
    const productLabel = [productInfo.companyName, productInfo.name].filter(Boolean).join("_");
    printElement(el, `${title}_${productLabel}`);
  };

  const productLabel = [productInfo.companyName, productInfo.name].filter(Boolean).join(" / ");

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0 }}>
          Step 3 ｜ 啓蒙シナリオを組み立てる
        </h2>
        <p style={{ fontSize: 14, color: "#64748B", marginTop: 6 }}>
          Step 2で抽出した訴求軸をもとに、顧客への課題啓蒙シナリオを3パターン生成します。
        </p>
        {productInfo.name && (
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10,
              padding: "8px 14px", background: ACCENT_LIGHT, borderRadius: 8, border: "1px solid #BFDBFE",
            }}
          >
            <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>
              📦 対象製品：{productLabel}
            </span>
          </div>
        )}
      </div>

      {/* Structure guide */}
      <div style={{ background: "#F8FAFF", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: ACCENT, marginBottom: 10 }}>シナリオの構成</div>
        <div data-role="scenario-structure" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {labels.map((lab) => (
            <div key={lab.key} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", border: "1px solid #BFDBFE" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: ACCENT }}>{lab.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", marginTop: 2 }}>{lab.label}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{lab.desc}</div>
            </div>
          ))}
        </div>
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
        {loading ? "🔄 シナリオ生成中..." : "✨ AIで啓蒙シナリオを生成する"}
      </button>

      {loading && <StreamingPreview text={streamText} />}

      {scenarios && (
        <div ref={allScenariosRef} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 全体保存ボタン */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={printAll}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: "#fff", color: ACCENT, border: `1.5px solid ${ACCENT}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              🖨️ 全シナリオをPDF保存
            </button>
          </div>

          {scenarios.map((sc, i) => {
            const c = colors[i % colors.length];
            return (
              <div
                key={i}
                ref={(el) => { scenarioRefs.current[i] = el; }}
                style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: 14, padding: 24 }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: "50%", background: c.num,
                        color: "#fff", fontWeight: 900, fontSize: 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
                        課題啓蒙シナリオ {i + 1}
                      </div>
                      {sc.title && (
                        <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                          {sc.title}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => printSingle(i)}
                    className="no-print"
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: "#fff", color: c.num, border: `1.5px solid ${c.border}`,
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    🖨️ この シナリオを保存
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {labels.map((lab) => (
                    <div key={lab.key} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: c.num }}>{lab.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#1E293B" }}>{lab.label}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: 4 }}>— {lab.desc}</span>
                      </div>
                      <div style={{ fontSize: 14, color: "#1E293B", lineHeight: 1.8 }}>
                        {sc[lab.key] as string}
                      </div>
                      {lab.key === "strength" && sc.requirements && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E2E8F0" }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 10, letterSpacing: 1 }}>
                            この課題に対応できる理由
                          </div>
                          <div data-role="requirements-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {reqCategories.map((cat) => (
                              <div
                                key={cat.key}
                                style={{
                                  background: cat.bg, borderRadius: 8, padding: "10px 12px",
                                  border: `1px solid ${cat.color}22`,
                                }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 800, color: cat.color, marginBottom: 6 }}>
                                  {cat.label}{" "}
                                  <span style={{ fontWeight: 400, color: "#94A3B8" }}>— {cat.desc}</span>
                                </div>
                                {(sc.requirements[cat.key] || []).map((pt, pi) => (
                                  <div key={pi} style={{ display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 4 }}>
                                    <span style={{ color: cat.color, fontWeight: 800, fontSize: 11, marginTop: 1, flexShrink: 0 }}>・</span>
                                    <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{pt}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div
            style={{
              background: "#F8FAFF", border: "1.5px solid #BFDBFE", borderRadius: 12,
              padding: 16, fontSize: 13, color: "#1e3a8a",
            }}
          >
            <strong>💡 活用ヒント：</strong>
            各シナリオの①〜④の流れで顧客に語りかけることで、課題への気づきを促し、自社製品の検討につなげることができます。
          </div>
        </div>
      )}
    </div>
  );
}
