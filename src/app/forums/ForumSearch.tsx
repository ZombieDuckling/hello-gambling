"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export default function ForumSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value.trim();
      const next = new URLSearchParams(params.toString());
      if (q) {
        next.set("q", q);
      } else {
        next.delete("q");
      }
      next.delete("page");
      startTransition(() => {
        router.replace(`/forums?${next.toString()}`);
      });
    },
    [router, params],
  );

  return (
    <div style={{ position: "relative", marginBottom: "1.25rem" }}>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#aaaaaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Search threads…"
        style={{
          width: "100%",
          padding: "9px 12px 9px 34px",
          fontSize: "0.875rem",
          color: "#111111",
          background: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
