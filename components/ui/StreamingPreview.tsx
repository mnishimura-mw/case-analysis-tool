"use client";

import { useEffect, useRef } from "react";
import { ACCENT } from "@/lib/types";

export default function StreamingPreview({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [text]);

  if (!text) return null;

  return (
    <div
      style={{
        marginTop: 12,
        background: "#F8FAFF",
        border: `1.5px solid #BFDBFE`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 14px",
          background: "#EFF6FF",
          borderBottom: "1px solid #BFDBFE",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: ACCENT,
            animation: "pulse 1s infinite",
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>
          AI生成中...
        </span>
      </div>
      <div
        ref={ref}
        style={{
          padding: "12px 14px",
          fontSize: 12,
          color: "#475569",
          lineHeight: 1.7,
          maxHeight: 200,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
        }}
      >
        {text}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
