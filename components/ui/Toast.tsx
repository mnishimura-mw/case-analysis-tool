"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "error") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const colors: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
    success: { bg: "#F0FDF4", border: "#A7F3D0", text: "#065F46", icon: "✓" },
    error:   { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626", icon: "⚠️" },
    info:    { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", icon: "ℹ️" },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxWidth: 420,
          }}
        >
          {toasts.map((t) => {
            const c = colors[t.type];
            return (
              <div
                key={t.id}
                onClick={() => remove(t.id)}
                style={{
                  background: c.bg,
                  border: `1.5px solid ${c.border}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: c.text,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  cursor: "pointer",
                  animation: "slideIn 0.2s ease-out",
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                }}
              >
                {c.icon} {t.message}
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
