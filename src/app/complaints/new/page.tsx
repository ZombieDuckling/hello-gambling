"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  ["PAYMENT_ISSUES", "Payment Issues"],
  ["BONUS_DISPUTES", "Bonus Disputes"],
  ["ACCOUNT_ISSUES", "Account Issues"],
  ["RESPONSIBLE_GAMBLING", "Responsible Gambling"],
  ["TECHNICAL_ISSUES", "Technical Issues"],
  ["UNFAIR_TREATMENT", "Unfair Treatment"],
  ["OTHER", "Other"],
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e0e0e0",
  borderRadius: "4px",
  padding: "9px 12px",
  fontSize: "0.875rem",
  color: "#111111",
  outline: "none",
  background: "#ffffff",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "#333333",
  marginBottom: "0.375rem",
};

interface Operator { id: string; name: string }

export default function NewComplaintPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "PAYMENT_ISSUES", rating: 1, operatorId: "" });

  useEffect(() => {
    fetch("/api/operators").then((r) => r.json()).then(setOperators);
  }, []);

  if (status === "loading") return null;

  if (!session) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", marginBottom: "0.75rem" }}>
          File a complaint
        </h1>
        <p style={{ color: "#777777", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          You need to be signed in to file a complaint.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/login" style={{ background: "#c5623a", color: "#ffffff", fontWeight: 600, padding: "9px 20px", borderRadius: "4px", textDecoration: "none", fontSize: "0.875rem" }}>
            Sign in
          </Link>
          <Link href="/auth/register" style={{ border: "1px solid #e0e0e0", color: "#333333", fontWeight: 500, padding: "9px 20px", borderRadius: "4px", textDecoration: "none", fontSize: "0.875rem" }}>
            Register
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.operatorId) { setError("Please select an operator."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/complaints/${data.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to submit complaint.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>
        File a complaint
      </h1>
      <p style={{ fontSize: "0.875rem", color: "#777777", marginBottom: "1.75rem" }}>
        Your complaint will be publicly visible. Ensure all information is accurate and factual.
      </p>

      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "4px", padding: "12px 14px", marginBottom: "1.5rem", fontSize: "0.8125rem", color: "#78350f", lineHeight: 1.5 }}>
        False complaints may be removed and can result in account suspension. This platform operates under POPIA and the National Gambling Act.
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.75rem" }}
        className="space-y-5"
      >
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 12px", fontSize: "0.8125rem", color: "#991b1b" }}>
            {error}
          </div>
        )}

        <div>
          <label htmlFor="operator" style={labelStyle}>Gambling operator</label>
          <select
            id="operator"
            required
            value={form.operatorId}
            onChange={(e) => setForm((f) => ({ ...f, operatorId: e.target.value }))}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#c5623a")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          >
            <option value="">Select operator...</option>
            {operators.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="category" style={labelStyle}>Category</label>
          <select
            id="category"
            required
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#c5623a")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          >
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Rating</label>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: star }))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "4px",
                    border: "1px solid",
                    borderColor: star <= form.rating ? "#c5623a" : "#e0e0e0",
                    background: star <= form.rating ? "#c5623a" : "#ffffff",
                    color: star <= form.rating ? "#ffffff" : "#cccccc",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {star}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "0.8125rem", color: "#777777" }}>
              {["", "Very poor", "Poor", "Average", "Good", "Excellent"][form.rating]}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="title" style={labelStyle}>Complaint title</label>
          <input
            id="title"
            required
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Brief summary of your complaint"
            maxLength={200}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#c5623a")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          />
        </div>

        <div>
          <label htmlFor="description" style={labelStyle}>Detailed description</label>
          <textarea
            id="description"
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe your issue in detail. Include dates, ZAR amounts, and reference numbers."
            rows={6}
            style={{ ...inputStyle, resize: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#c5623a")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#cccccc" : "#c5623a",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.9375rem",
            padding: "11px",
            borderRadius: "4px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit complaint"}
        </button>
      </form>
    </div>
  );
}
