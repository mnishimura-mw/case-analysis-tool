"use client";

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: "#EFF6FF", text: "#1A56DB", border: "#BFDBFE" },
  purple: { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
  green:  { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  amber:  { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
};

export default function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {children}
    </span>
  );
}
