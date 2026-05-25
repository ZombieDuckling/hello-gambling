"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  threadId: string;
  isLoggedIn: boolean;
}

export default function ForumReplySection({ threadId, isLoggedIn }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoggedIn) {
    return (
      <div style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "#777777" }}>
          <a href="/auth/login" style={{ color: "#c5623a", fontWeight: 600, textDecoration: "none" }}>Sign in</a> to reply to this thread.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/forums/threads/${threadId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      setContent("");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to post reply.");
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.5rem" }}>
      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>Post a reply</h3>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 12px", fontSize: "0.8125rem", color: "#991b1b", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your reply..."
          rows={4}
          required
          style={{
            width: "100%",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            padding: "9px 12px",
            fontSize: "0.875rem",
            color: "#111111",
            outline: "none",
            resize: "none",
            background: "#ffffff",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#c5623a")}
          onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          style={{
            background: loading || !content.trim() ? "#cccccc" : "#c5623a",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.875rem",
            padding: "8px 18px",
            borderRadius: "4px",
            border: "none",
            cursor: loading || !content.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Posting..." : "Post reply"}
        </button>
      </form>
    </div>
  );
}
