"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  ["GENERAL",             "General Discussion"],
  ["OPERATOR_REVIEWS",    "Operator Reviews"],
  ["TIPS_AND_STRATEGY",   "Tips & Strategy"],
  ["DISPUTES_AND_ISSUES", "Disputes & Issues"],
  ["REGULATORY",          "Regulatory & Legal"],
];

const INPUT = {
  width: "100%",
  border: "1px solid #e0e0e0",
  borderRadius: "4px",
  padding: "9px 12px",
  fontSize: "0.875rem",
  color: "#111111",
  outline: "none",
  background: "#ffffff",
};

export default function NewThreadPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", content: "", category: "GENERAL" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/forums/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const thread = await res.json();
      router.push(`/forums/${thread.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create thread.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <nav style={{ fontSize: "0.8125rem", color: "#999999", marginBottom: "1.5rem" }}>
        <Link href="/forums" style={{ color: "#999999", textDecoration: "none" }}>Forums</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span style={{ color: "#555555" }}>New thread</span>
      </nav>

      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em", marginBottom: "1.5rem" }}>
        Start a new thread
      </h1>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 12px", fontSize: "0.8125rem", color: "#991b1b", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#333333", marginBottom: "0.375rem" }}>
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{ ...INPUT }}
          >
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#333333", marginBottom: "0.375rem" }}>
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Give your thread a clear, descriptive title"
            required
            style={{ ...INPUT }}
            onFocus={(e) => (e.target.style.borderColor = "#c5623a")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#333333", marginBottom: "0.375rem" }}>
            Content
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write your post here..."
            rows={8}
            required
            style={{ ...INPUT, resize: "vertical" }}
            onFocus={(e) => (e.target.style.borderColor = "#c5623a")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !form.title.trim() || !form.content.trim()}
          style={{
            background: loading || !form.title.trim() || !form.content.trim() ? "#cccccc" : "#c5623a",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.875rem",
            padding: "9px 20px",
            borderRadius: "4px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Posting..." : "Post thread"}
        </button>
      </form>
    </div>
  );
}
