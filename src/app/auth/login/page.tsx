"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#f5f5f5" }}
    >
      <div className="w-full max-w-sm fade-in">
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#111111",
            letterSpacing: "-0.02em",
            marginBottom: "0.375rem",
            textAlign: "center",
          }}
        >
          Sign in
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#777777", textAlign: "center", marginBottom: "2rem" }}>
          Hello, Gambling account
        </p>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            padding: "1.75rem",
          }}
        >
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "4px",
                padding: "10px 12px",
                fontSize: "0.8125rem",
                color: "#991b1b",
                marginBottom: "1.25rem",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#333333", marginBottom: "0.375rem" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#c5623a")}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#333333", marginBottom: "0.375rem" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={inputStyle}
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
                fontSize: "0.875rem",
                padding: "10px",
                borderRadius: "4px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "0.25rem",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p style={{ fontSize: "0.8125rem", color: "#777777", textAlign: "center", marginTop: "1.25rem" }}>
            No account?{" "}
            <Link href="/auth/register" style={{ color: "#c5623a", fontWeight: 600, textDecoration: "none" }}>
              Register
            </Link>
          </p>
        </div>

        <div
          style={{
            marginTop: "1rem",
            border: "1px dashed #cccccc",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#f0f0f0",
              padding: "6px 12px",
              borderBottom: "1px dashed #cccccc",
            }}
          >
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#555555", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Demo accounts
            </p>
          </div>
          {[
            { role: "Consumer", email: "consumer@test.com", pass: "consumer123" },
            { role: "Operator", email: "operator@hollywoodbets.com", pass: "operator123" },
            { role: "Admin", email: "admin@hellogambling.co.za", pass: "admin123" },
          ].map(({ role, email, pass }) => (
            <div
              key={role}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "7px 12px",
                borderBottom: "1px solid #f0f0f0",
                background: "#ffffff",
              }}
            >
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#c5623a", width: "4.5rem", flexShrink: 0 }}>
                {role}
              </span>
              <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "#444444", flex: 1 }}>{email}</span>
              <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "#888888" }}>{pass}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
