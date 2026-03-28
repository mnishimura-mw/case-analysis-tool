"use client";

import { useState, useRef } from "react";
import { ACCENT } from "@/lib/types";

export default function InputArea({
  value,
  onChange,
  inputType,
  onTypeChange,
}: {
  value: string;
  onChange: (v: string) => void;
  inputType: string;
  onTypeChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const processFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    if (file.type === "application/pdf") {
      reader.onload = (ev) => {
        const arrayBuffer = ev.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        const chunkSize = 8192;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          const chunk = bytes.subarray(offset, offset + chunkSize);
          binary += String.fromCharCode(...chunk);
        }
        const base64 = btoa(binary);
        onChange(`data:application/pdf;base64,${base64}`);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => onChange(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) =>
    processFile(e.target.files?.[0]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const typeOptions = [
    { v: "text", label: "📝 テキスト" },
    { v: "url", label: "🔗 URL" },
    { v: "file", label: "📄 ファイル" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {typeOptions.map((opt) => (
          <button
            key={opt.v}
            onClick={() => onTypeChange(opt.v)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: inputType === opt.v ? ACCENT : "#F1F5F9",
              color: inputType === opt.v ? "#fff" : "#475569",
              border: inputType === opt.v ? `2px solid ${ACCENT}` : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {inputType === "file" ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? "#1A56DB" : "#CBD5E1"}`,
            borderRadius: 10,
            padding: "36px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "#EFF6FF" : "#F8FAFF",
            color: "#64748B",
            fontSize: 14,
            transition: "all 0.15s",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {fileName ? "✅" : "📄"}
          </div>
          {fileName ? (
            <>
              <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>{fileName}</div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>クリックまたはドロップで変更</div>
            </>
          ) : (
            <>
              <div>クリックまたはここにファイルをドロップ</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                PDF・テキスト・Markdownファイル対応
              </div>
            </>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md" hidden onChange={handleFile} />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            inputType === "url"
              ? "事例記事のURLを入力してください（例: https://...）"
              : "事例のインタビュー記事や事例リーフレットのテキストを貼り付けてください..."
          }
          style={{
            width: "100%",
            minHeight: inputType === "url" ? 80 : 160,
            padding: "12px 14px",
            border: "1.5px solid #CBD5E1",
            borderRadius: 10,
            fontSize: 14,
            color: "#1E293B",
            background: "#fff",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: 1.6,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}
