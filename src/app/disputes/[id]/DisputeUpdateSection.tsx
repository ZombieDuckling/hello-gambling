"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = [
  ["SUBMITTED", "Submitted"],
  ["UNDER_REVIEW", "Under Review"],
  ["MEDIATION", "Mediation"],
  ["RESOLVED", "Resolved"],
  ["CLOSED", "Closed"],
];

interface Props {
  disputeId: string;
  currentStage: string;
  isParty: boolean;
  isAdmin: boolean;
}

export default function DisputeUpdateSection({ disputeId, currentStage, isParty, isAdmin }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [stage, setStage] = useState(currentStage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isParty) {
    return (
      <div style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "#777777" }}>
          <a href="/auth/login" style={{ color: "#c5623a", fontWeight: 600, textDecoration: "none" }}>Sign in</a> to add updates to this dispute.
        </p>
      </div>
    );
  }

  if (currentStage === "CLOSED" || currentStage === "RESOLVED") {
    return (
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px", padding: "1rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "#14532d", fontWeight: 600 }}>
          This dispute is {currentStage === "RESOLVED" ? "resolved" : "closed"}.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/disputes/${disputeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, stage }),
    });

    if (res.ok) {
      setContent("");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to add update.");
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.5rem" }}>
      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>
        Add update
      </h3>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 12px", fontSize: "0.8125rem", color: "#991b1b", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {isAdmin && (
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#333333", marginBottom: "0.375rem" }}>
              Update stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                padding: "8px 12px",
                fontSize: "0.875rem",
                color: "#111111",
                background: "#ffffff",
                outline: "none",
              }}
            >
              {STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#333333", marginBottom: "0.375rem" }}>
            Message
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add an update, provide additional evidence, or respond to the other party..."
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
        </div>

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
          {loading ? "Posting..." : "Post update"}
        </button>
      </form>
    </div>
  );
}
