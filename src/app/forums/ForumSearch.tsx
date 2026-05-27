"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";

export default function ForumSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(raw: string) {
    const q = raw.trim();
    const next = new URLSearchParams(params.toString());
    if (q) {
      next.set("q", q);
    } else {
      next.delete("q");
    }
    setLoading(true);
    router.push(`/forums?${next.toString()}`);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit(value);
  }

  function clear() {
    setValue("");
    const next = new URLSearchParams(params.toString());
    next.delete("q");
    router.push(`/forums?${next.toString()}`);
    inputRef.current?.focus();
  }

  return (
    <div style={{ position: "relative", marginBottom: "1.25rem", display: "flex", gap: "0.5rem" }}>
      <div style={{ position: "relative", flex: 1 }}>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={loading ? "#c5623a" : "#aaaaaa"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setLoading(false); }}
          onKeyDown={handleKey}
          placeholder="Search by topic, question, or keyword…"
          style={{
            width: "100%", padding: "9px 36px 9px 34px", fontSize: "0.875rem",
            color: "#111111", background: "#ffffff", border: "1px solid #e0e0e0",
            borderRadius: "4px", outline: "none", boxSizing: "border-box",
          }}
        />
        {value && (
          <button
            onClick={clear}
            style={{
              position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#aaaaaa",
              fontSize: "1rem", lineHeight: 1, padding: "2px",
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <button
        onClick={() => submit(value)}
        disabled={loading}
        style={{
          padding: "9px 18px", fontSize: "0.875rem", fontWeight: 600,
          background: loading ? "#e0e0e0" : "#111111", color: loading ? "#999999" : "#ffffff",
          border: "none", borderRadius: "4px", cursor: loading ? "default" : "pointer",
          whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </div>
  );
}
