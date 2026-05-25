"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  ["/complaints", "Complaints"],
  ["/disputes", "Disputes"],
  ["/operators", "Operators"],
  ["/forums", "Forums"],
] as const;

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header style={{ background: "#ffffff", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 50 }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:outline-none"
            style={{ textDecoration: "none" }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#111111", letterSpacing: "-0.02em" }}>
              Hello,{" "}
              <span style={{ color: "#c5623a" }}>Gambling</span>
            </span>
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                background: "#c5623a",
                color: "#ffffff",
                padding: "1px 5px",
                borderRadius: "2px",
                letterSpacing: "0.05em",
              }}
            >
              SA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
            {NAV_LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                style={{ fontSize: "0.875rem", color: "#555555", textDecoration: "none" }}
                className="hover:text-black transition-colors"
              >
                {label}
              </Link>
            ))}

            {session ? (
              <>
                <Link
                  href="/complaints/new"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    background: "#c5623a",
                    color: "#ffffff",
                    padding: "6px 14px",
                    borderRadius: "4px",
                    textDecoration: "none",
                  }}
                  className="hover:bg-[#a84e2e] transition-colors focus-visible:outline-[#c5623a]"
                >
                  File Complaint
                </Link>
                <Link
                  href="/dashboard"
                  style={{ fontSize: "0.875rem", color: "#555555", textDecoration: "none" }}
                  className="hover:text-black transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  style={{
                    fontSize: "0.875rem",
                    color: "#999999",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  className="hover:text-black transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  style={{ fontSize: "0.875rem", color: "#555555", textDecoration: "none" }}
                  className="hover:text-black transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    background: "#c5623a",
                    color: "#ffffff",
                    padding: "6px 14px",
                    borderRadius: "4px",
                    textDecoration: "none",
                  }}
                  className="hover:bg-[#a84e2e] transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </nav>

          <button
            className="md:hidden p-1"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#111111" }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav
            className="md:hidden pb-4 fade-in"
            style={{ borderTop: "1px solid #e0e0e0", paddingTop: "0.75rem" }}
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="block py-2 text-sm"
                style={{ color: "#555555", textDecoration: "none" }}
              >
                {label}
              </Link>
            ))}
            {session ? (
              <>
                <Link href="/complaints/new" className="block py-2 text-sm font-semibold" style={{ color: "#c5623a", textDecoration: "none" }}>
                  File Complaint
                </Link>
                <Link href="/dashboard" className="block py-2 text-sm" style={{ color: "#555555", textDecoration: "none" }}>
                  Dashboard
                </Link>
                <button onClick={() => signOut()} className="block py-2 text-sm" style={{ color: "#999999", background: "none", border: "none", cursor: "pointer", padding: "0.5rem 0" }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block py-2 text-sm" style={{ color: "#555555", textDecoration: "none" }}>Sign in</Link>
                <Link href="/auth/register" className="block py-2 text-sm font-semibold" style={{ color: "#c5623a", textDecoration: "none" }}>Register</Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
