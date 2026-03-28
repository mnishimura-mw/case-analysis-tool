"use client";

import type { Analysis } from "@/lib/types";
import { ACCENT, NUMS } from "@/lib/types";
import Tag from "./Tag";

const sections: { key: keyof Analysis; label: string; color: string }[] = [
  { key: "background", label: "①検討の背景", color: "blue" },
  { key: "challenges", label: "②当時の課題", color: "purple" },
  { key: "reasons",    label: "③選定の理由", color: "green" },
  { key: "effects",    label: "④導入効果",   color: "amber" },
];

export default function AnalysisCard({ analysis }: { analysis: Analysis }) {
  return (
    <div style={{ marginTop: 16 }}>
      {analysis.companySize && (
        <div
          style={{
            fontSize: 13,
            color: "#64748B",
            fontWeight: 600,
            marginBottom: 12,
            padding: "6px 12px",
            background: "#F1F5F9",
            borderRadius: 8,
            display: "inline-block",
          }}
        >
          従業員規模：{analysis.companySize}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {sections.map((sec) => (
          <div
            key={sec.key}
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "14px 16px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <Tag color={sec.color}>{sec.label}</Tag>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {((analysis[sec.key] as string[]) || []).map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: ACCENT, minWidth: 20, flexShrink: 0 }}>
                    {NUMS[i]}
                  </span>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
