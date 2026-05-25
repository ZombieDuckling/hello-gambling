import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import DisputeUpdateSection from "./DisputeUpdateSection";

const STAGE_STEPS = ["SUBMITTED", "UNDER_REVIEW", "MEDIATION", "RESOLVED", "CLOSED"] as const;

const STAGE: Record<string, { label: string; color: string; bg: string }> = {
  SUBMITTED:    { label: "Submitted",    color: "#1e40af", bg: "#eff6ff" },
  UNDER_REVIEW: { label: "Under Review", color: "#92400e", bg: "#fffbeb" },
  MEDIATION:    { label: "Mediation",    color: "#9a3412", bg: "#fff7ed" },
  RESOLVED:     { label: "Resolved",     color: "#14532d", bg: "#f0fdf4" },
  CLOSED:       { label: "Closed",       color: "#374151", bg: "#f9fafb" },
};

export default async function DisputePage({ params }: { params: { id: string } }) {
  const [dispute, session] = await Promise.all([
    prisma.dispute.findUnique({
      where: { id: params.id },
      include: {
        complaint: { include: { operator: true, user: { select: { name: true } } } },
        user: { select: { id: true, name: true } },
        updates: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!dispute) notFound();

  const currentStageIndex = STAGE_STEPS.indexOf(dispute.stage as any);
  const s = STAGE[dispute.stage] ?? { label: dispute.stage, color: "#555", bg: "#f5f5f5" };

  const isParty =
    session?.user &&
    ((session.user as any).id === dispute.userId ||
      (session.user as any).operatorId === dispute.complaint.operatorId ||
      (session.user as any).role === "ADMIN");

  return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <nav style={{ fontSize: "0.8125rem", color: "#999999", marginBottom: "1.5rem" }}>
        <Link href="/disputes" style={{ color: "#999999", textDecoration: "none" }}>Disputes</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span style={{ color: "#555555", fontFamily: "monospace" }}>{dispute.referenceNumber}</span>
      </nav>

      <article
        className="fade-in"
        style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.75rem", marginBottom: "1rem" }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span style={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 600, color: "#555555", background: "#f0f0f0", padding: "3px 8px", borderRadius: "2px" }}>
            {dispute.referenceNumber}
          </span>
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: s.color, background: s.bg, padding: "2px 7px", borderRadius: "2px" }}>
            {s.label}
          </span>
        </div>

        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em", marginBottom: "0.875rem", lineHeight: 1.3 }}>
          {dispute.complaint.title}
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.8125rem", color: "#777777", marginBottom: "1.5rem" }}>
          <span>Consumer: <strong style={{ color: "#333333" }}>{dispute.user.name}</strong></span>
          <span>Operator: <Link href={`/operators/${dispute.complaint.operator.slug}`} style={{ fontWeight: 700, color: "#c5623a", textDecoration: "none" }}>{dispute.complaint.operator.name}</Link></span>
          <span>Opened: {new Date(dispute.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {STAGE_STEPS.map((stageName, i) => {
              const done = i <= currentStageIndex;
              return (
                <div key={stageName} style={{ display: "flex", alignItems: "center", flex: i < STAGE_STEPS.length - 1 ? 1 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: done ? "#c5623a" : "#e0e0e0",
                        color: done ? "#ffffff" : "#aaaaaa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {i < currentStageIndex ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: "0.5625rem", color: done ? "#333333" : "#aaaaaa", marginTop: "4px", textAlign: "center", fontWeight: done ? 600 : 400, whiteSpace: "nowrap" }}>
                      {STAGE[stageName]?.label ?? stageName}
                    </span>
                  </div>
                  {i < STAGE_STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < currentStageIndex ? "#c5623a" : "#e0e0e0", margin: "0 4px", marginBottom: "1rem" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#f9f9f9", border: "1px solid #eeeeee", borderRadius: "4px", padding: "1rem 1.25rem" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#999999", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>Summary</p>
          <p style={{ fontSize: "0.875rem", color: "#333333", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{dispute.summary}</p>
        </div>

        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f0f0f0" }}>
          <Link href={`/complaints/${dispute.complaint.id}`} style={{ fontSize: "0.8125rem", color: "#c5623a", textDecoration: "none", fontWeight: 500 }}>
            &larr; View original complaint
          </Link>
        </div>
      </article>

      <section style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>
          Timeline ({dispute.updates.length} update{dispute.updates.length !== 1 ? "s" : ""})
        </h2>

        {dispute.updates.length === 0 && (
          <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "2rem", textAlign: "center", color: "#999999", fontSize: "0.875rem", marginBottom: "1rem" }}>
            No updates yet.
          </div>
        )}

        <div className="space-y-3 mb-4">
          {dispute.updates.map((u, idx) => {
            const us = STAGE[u.stage] ?? { label: u.stage, color: "#555", bg: "#f5f5f5" };
            return (
              <div key={u.id} style={{ display: "flex", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "4px", background: "#c5623a", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  {idx < dispute.updates.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: "#e0e0e0", margin: "4px 0" }} />
                  )}
                </div>
                <div style={{ flex: 1, background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1rem", marginBottom: "0.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#111111" }}>{u.user.name}</span>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: us.color, background: us.bg, padding: "1px 6px", borderRadius: "2px" }}>{us.label}</span>
                    <span style={{ fontSize: "0.75rem", color: "#bbbbbb", marginLeft: "auto" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#333333", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{u.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        <DisputeUpdateSection
          disputeId={dispute.id}
          currentStage={dispute.stage}
          isParty={!!isParty}
          isAdmin={(session?.user as any)?.role === "ADMIN"}
        />
      </section>
    </div>
  );
}
