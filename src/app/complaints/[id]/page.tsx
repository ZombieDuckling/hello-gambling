import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import ResponseSection from "./ResponseSection";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:        { label: "Open",        color: "#991b1b", bg: "#fef2f2" },
  IN_PROGRESS: { label: "In Progress", color: "#92400e", bg: "#fffbeb" },
  RESOLVED:    { label: "Resolved",    color: "#14532d", bg: "#f0fdf4" },
  ESCALATED:   { label: "Escalated",   color: "#4c1d95", bg: "#faf5ff" },
};

const CATEGORY: Record<string, string> = {
  PAYMENT_ISSUES: "Payment Issues",
  BONUS_DISPUTES: "Bonus Disputes",
  ACCOUNT_ISSUES: "Account Issues",
  RESPONSIBLE_GAMBLING: "Responsible Gambling",
  TECHNICAL_ISSUES: "Technical Issues",
  UNFAIR_TREATMENT: "Unfair Treatment",
  OTHER: "Other",
};

export default async function ComplaintPage({ params }: { params: { id: string } }) {
  const [complaint, session] = await Promise.all([
    prisma.complaint.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true } },
        operator: true,
        responses: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        dispute: true,
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!complaint) notFound();

  const s = STATUS[complaint.status] ?? { label: complaint.status, color: "#555555", bg: "#f5f5f5" };
  const isOwner = session?.user && (session.user as any).id === complaint.userId;
  const isOperator =
    session?.user &&
    (session.user as any).role === "OPERATOR" &&
    (session.user as any).operatorId === complaint.operatorId;
  const canRespond = isOwner || isOperator;

  return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <nav style={{ fontSize: "0.8125rem", color: "#999999", marginBottom: "1.5rem" }}>
        <Link href="/complaints" style={{ color: "#999999", textDecoration: "none" }}>Complaints</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <Link href={`/operators/${complaint.operator.slug}`} style={{ color: "#999999", textDecoration: "none" }}>
          {complaint.operator.name}
        </Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span style={{ color: "#555555", fontFamily: "monospace" }}>
          #{complaint.id.slice(-6).toUpperCase()}
        </span>
      </nav>

      <article
        className="fade-in"
        style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.75rem", marginBottom: "1rem" }}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: s.color, background: s.bg, padding: "2px 7px", borderRadius: "2px" }}>
            {s.label}
          </span>
          <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: "#555555", background: "#f0f0f0", padding: "2px 7px", borderRadius: "2px" }}>
            {CATEGORY[complaint.category] ?? complaint.category}
          </span>
          <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "#777777", background: "#f5f5f5", padding: "2px 7px", borderRadius: "2px" }}>
            #{complaint.id.slice(-6).toUpperCase()}
          </span>
        </div>

        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em", marginBottom: "1rem", lineHeight: 1.3 }}>
          {complaint.title}
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "1.25rem", fontSize: "0.8125rem", color: "#777777" }}>
          <span>
            Filed by <strong style={{ color: "#333333" }}>{complaint.user.name}</strong>
          </span>
          <span>against</span>
          <Link href={`/operators/${complaint.operator.slug}`} style={{ fontWeight: 700, color: "#c5623a", textDecoration: "none" }}>
            {complaint.operator.name}
          </Link>
          <div className="flex gap-1 ml-auto" aria-label={`Rating ${complaint.rating} of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: n <= complaint.rating ? "#c5623a" : "#e0e0e0",
                  display: "inline-block",
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#f9f9f9",
            border: "1px solid #eeeeee",
            borderRadius: "4px",
            padding: "1.25rem",
            fontSize: "0.875rem",
            color: "#333333",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          {complaint.description}
        </div>

        <p style={{ fontSize: "0.75rem", color: "#bbbbbb", marginTop: "1rem" }}>
          Submitted{" "}
          {new Date(complaint.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </article>

      {isOwner && complaint.status === "OPEN" && !complaint.dispute && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "4px",
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <p style={{ fontSize: "0.8125rem", color: "#78350f", flex: 1 }}>
            Not resolved? Escalate this complaint to a formal dispute.
          </p>
          <Link
            href={`/disputes/new?complaintId=${complaint.id}`}
            style={{ background: "#c5623a", color: "#ffffff", fontWeight: 600, fontSize: "0.8125rem", padding: "7px 14px", borderRadius: "4px", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Escalate to dispute
          </Link>
        </div>
      )}

      {complaint.dispute && (
        <div
          style={{
            background: "#faf5ff",
            border: "1px solid #e9d5ff",
            borderRadius: "4px",
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <p style={{ fontSize: "0.8125rem", color: "#4c1d95" }}>
            This complaint has been escalated to a formal dispute.
          </p>
          <Link
            href={`/disputes/${complaint.dispute.id}`}
            style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#4c1d95", textDecoration: "none" }}
          >
            {complaint.dispute.referenceNumber} &rarr;
          </Link>
        </div>
      )}

      <section>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>
          Responses ({complaint.responses.length})
        </h2>

        {complaint.responses.length === 0 && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              padding: "2.5rem",
              textAlign: "center",
              color: "#999999",
              fontSize: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            No responses yet.
          </div>
        )}

        <div className="space-y-3 mb-4">
          {complaint.responses.map((r) => (
            <div
              key={r.id}
              style={{
                background: r.isOfficial ? "#111111" : "#ffffff",
                border: "1px solid",
                borderColor: r.isOfficial ? "#111111" : "#e0e0e0",
                borderRadius: "4px",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "4px",
                    background: r.isOfficial ? "#c5623a" : "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: r.isOfficial ? "#ffffff" : "#555555",
                  }}
                >
                  {r.user.name.charAt(0)}
                </div>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: r.isOfficial ? "#ffffff" : "#111111" }}>
                  {r.user.name}
                </span>
                {r.isOfficial && (
                  <span style={{ fontSize: "0.625rem", fontWeight: 700, background: "#c5623a", color: "#ffffff", padding: "2px 6px", borderRadius: "2px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Official
                  </span>
                )}
                <span style={{ fontSize: "0.75rem", color: r.isOfficial ? "#777777" : "#bbbbbb", marginLeft: "auto" }}>
                  {new Date(r.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", color: r.isOfficial ? "#cccccc" : "#333333", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {r.content}
              </p>
            </div>
          ))}
        </div>

        <ResponseSection
          complaintId={complaint.id}
          canRespond={!!canRespond}
          isOperator={!!isOperator}
          isResolved={complaint.status === "RESOLVED"}
        />
      </section>
    </div>
  );
}
