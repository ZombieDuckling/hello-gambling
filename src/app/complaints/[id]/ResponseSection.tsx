"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  complaintId: string;
  canRespond: boolean;
  isOperator: boolean;
  isResolved: boolean;
}

export default function ResponseSection({ complaintId, canRespond, isOperator, isResolved }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isResolved) {
    return (
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px", padding: "1rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "#14532d", fontWeight: 600 }}>This complaint has been resolved.</p>
      </div>
    );
  }

  if (!canRespond) {
    return (
      <div style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "#777777" }}>
          <a href="/auth/login" style={{ color: "#c5623a", fontWeight: 600, textDecoration: "none" }}>Sign in</a> to respond to this complaint.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/complaints/${complaintId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      setContent("");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to post response.");
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.5rem" }}>
      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>
        {isOperator ? "Post official response" : "Add a comment"}
      </h3>

      {isOperator && (
        <div style={{ background: "#111111", color: "#cccccc", borderRadius: "4px", padding: "10px 14px", marginBottom: "1rem", fontSize: "0.8125rem" }}>
          Your response will be marked as an official operator response.
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 12px", fontSize: "0.8125rem", color: "#991b1b", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isOperator ? "Provide your official response..." : "Add a comment or update..."}
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
          {loading ? "Posting..." : isOperator ? "Post official response" : "Post comment"}
        </button>
      </form>
    </div>
  );
}
