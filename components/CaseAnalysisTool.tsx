"use client";

import { useState, useEffect, useRef } from "react";
import type { CaseItem, ProductInfo, CommonData } from "@/lib/types";
import { ACCENT, ACCENT_DARK, ACCENT_LIGHT, SUCCESS, EMPTY_CASE } from "@/lib/types";
import { loadPptxGenJS } from "@/lib/slide";
import { ToastProvider } from "@/components/ui/Toast";
import Step0 from "@/components/steps/Step0";
import Step1 from "@/components/steps/Step1";
import Step2 from "@/components/steps/Step2";
import Step3 from "@/components/steps/Step3";

/** Generate a random session ID for anonymous analysis tracking */
function generateSessionId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Send analysis history log (fire and forget) */
function logAnalysisHistory(data: {
  session_id: string;
  step: string;
  product_company?: string;
  product_name?: string;
  case_company?: string;
  case_title?: string;
  analysis_data?: unknown;
}) {
  fetch("/api/analysis-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {}); // fire and forget
}

function CaseAnalysisToolInner() {
  const [activeTab, setActiveTab] = useState(0);
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    companyName: "", name: "", url: "", note: "", fetched: "",
  });
  const [cases, setCases] = useState<CaseItem[]>([{ ...EMPTY_CASE }]);
  const [commonData, setCommonData] = useState<CommonData | null>(null);

  const sessionIdRef = useRef(generateSessionId());

  useEffect(() => { loadPptxGenJS().catch(() => {}); }, []);

  const doneCases = cases.filter((c) => c.analysis);

  // Log when product info is set (Step 0 → Step 1)
  const handleStep0Next = () => {
    logAnalysisHistory({
      session_id: sessionIdRef.current,
      step: "step0_product",
      product_company: productInfo.companyName,
      product_name: productInfo.name,
      analysis_data: { url: productInfo.url, note: productInfo.note },
    });
    setActiveTab(1);
  };

  // Log when case analysis completes (Step 1 → Step 2)
  const handleStep1Next = () => {
    for (const c of doneCases) {
      logAnalysisHistory({
        session_id: sessionIdRef.current,
        step: "step1_case",
        product_company: productInfo.companyName,
        product_name: productInfo.name,
        case_company: c.companyName,
        case_title: c.caseTitle,
        analysis_data: c.analysis,
      });
    }
    setActiveTab(2);
  };

  // Log common analysis (Step 2 → Step 3)
  const handleStep2Next = () => {
    if (commonData) {
      logAnalysisHistory({
        session_id: sessionIdRef.current,
        step: "step2_common",
        product_company: productInfo.companyName,
        product_name: productInfo.name,
        analysis_data: commonData,
      });
    }
    setActiveTab(3);
  };

  const tabs = [
    { label: "Step 0", sub: "製品設定",   icon: "📦", locked: false },
    { label: "Step 1", sub: "事例分析",   icon: "📊", locked: false },
    { label: "Step 2", sub: "訴求軸抽出", icon: "🔍", locked: doneCases.length < 2 },
    { label: "Step 3", sub: "シナリオ",   icon: "🚀", locked: !commonData },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)",
        fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic Pro',sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ background: ACCENT_DARK, padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#93C5FD", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>SALES SCHOOL</div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginTop: 2 }}>事例分析ツール</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "#93C5FD", fontSize: 13 }}>課題啓蒙型営業 / 要件啓蒙 シナリオ構築</div>
        </div>
      </div>

      {/* Tab bar */}
      <div data-role="tab-bar" style={{ background: "#fff", borderBottom: "2px solid #E2E8F0", display: "flex", padding: "0 32px" }}>
        {tabs.map((t, i) => {
          const isActive = activeTab === i;
          return (
            <button
              key={i}
              onClick={() => !t.locked && setActiveTab(i)}
              style={{
                padding: "16px 22px", border: "none", background: "none",
                cursor: t.locked ? "not-allowed" : "pointer",
                borderBottom: isActive ? `3px solid ${ACCENT}` : "3px solid transparent",
                marginBottom: -2, transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? ACCENT : t.locked ? "#CBD5E1" : "#64748B" }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 11, color: isActive ? ACCENT : t.locked ? "#CBD5E1" : "#94A3B8" }}>
                    {t.sub}
                  </div>
                </div>
                {t.locked && <span style={{ fontSize: 11, color: "#CBD5E1" }}>🔒</span>}
              </div>
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, padding: "0 8px" }}>
          {(productInfo.companyName || productInfo.name) && (
            <span style={{ background: ACCENT_LIGHT, color: ACCENT, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
              📦 {[productInfo.companyName, productInfo.name].filter(Boolean).join(" / ")}
            </span>
          )}
          {doneCases.length > 0 && (
            <span style={{ background: "#F0FDF4", color: SUCCESS, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
              {doneCases.length}件分析済み
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "28px 24px" }}>
        {activeTab === 0 && (
          <Step0 productInfo={productInfo} setProductInfo={setProductInfo} onNext={handleStep0Next} />
        )}
        {activeTab === 1 && (
          <Step1 cases={cases} setCases={setCases} productInfo={productInfo} onNext={handleStep1Next} />
        )}
        {activeTab === 2 && (
          <Step2 cases={doneCases} commonData={commonData} setCommonData={setCommonData} onNext={handleStep2Next} />
        )}
        {activeTab === 3 && commonData && (
          <Step3 commonData={commonData} productInfo={productInfo} />
        )}
      </div>
    </div>
  );
}

export default function CaseAnalysisTool() {
  return (
    <ToastProvider>
      <CaseAnalysisToolInner />
    </ToastProvider>
  );
}
