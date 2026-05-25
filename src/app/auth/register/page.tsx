"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "#333333",
  marginBottom: "0.375rem",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#f5f5f5" }}>
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
          Create account
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#777777", textAlign: "center", marginBottom: "2rem" }}>
          Join Hello, Gambling
        </p>

        <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.75rem" }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 12px", fontSize: "0.8125rem", color: "#991b1b", marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: "name", label: "Full name", type: "text", key: "name", placeholder: "Your full name" },
              { id: "email", label: "Email", type: "email", key: "email", placeholder: "you@example.com" },
              { id: "password", label: "Password", type: "password", key: "password", placeholder: "Minimum 8 characters" },
              { id: "confirm", label: "Confirm password", type: "password", key: "confirm", placeholder: "Repeat password" },
            ].map(({ id, label, type, key, placeholder }) => (
              <div key={id}>
                <label htmlFor={id} style={labelStyle}>{label}</label>
                <input
                  id={id}
                  type={type}
                  required
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#c5623a")}
                  onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
                />
              </div>
            ))}

            <p style={{ fontSize: "0.75rem", color: "#999999", lineHeight: 1.5, paddingTop: "0.25rem" }}>
              By registering you agree your data will be processed under POPIA. We will not share your details without consent.
            </p>

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
              }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p style={{ fontSize: "0.8125rem", color: "#777777", textAlign: "center", marginTop: "1.25rem" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "#c5623a", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
