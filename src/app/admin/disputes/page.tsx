import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import AdminDisputeRow from "./AdminDisputeRow";
import HowItWorks from "./HowItWorks";

export const dynamic = "force-dynamic";

const STAGES = ["SUBMITTED", "UNDER_REVIEW", "MEDIATION", "RESOLVED", "CLOSED"] as const;

const STAGE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SUBMITTED:    { label: "Submitted",    color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
  UNDER_REVIEW: { label: "Under Review", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  MEDIATION:    { label: "Mediation",    color: "#9a3412", bg: "#fff7ed", border: "#fed7aa" },
  RESOLVED:     { label: "Resolved",     color: "#14532d", bg: "#f0fdf4", border: "#bbf7d0" },
  CLOSED:       { label: "Closed",       color: "#374151", bg: "#f9fafb", border: "#e5e7eb" },
};

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; mine?: string }>;
}) {
  const sp = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") redirect("/");

  const adminId = (session.user as any).id;
  const adminName = (session.user as any).name ?? "Admin";
  const activeStage = sp.stage ?? null;
  const mineOnly = sp.mine === "1";

  const [stageCounts, myCount, disputes] = await Promise.all([
    prisma.dispute.groupBy({ by: ["stage"], _count: { id: true } }),
    prisma.dispute.count({ where: { assignedAdminId: adminId } }),
    prisma.dispute.findMany({
      where: {
        ...(activeStage ? { stage: activeStage as any } : {}),
        ...(mineOnly ? { assignedAdminId: adminId } : {}),
      },
      orderBy: [{ stage: "asc" }, { createdAt: "asc" }],
      include: {
        complaint: { include: { operator: { select: { name: true, slug: true } } } },
        user: { select: { name: true } },
        assignedAdmin: { select: { name: true } },
        _count: { select: { updates: true } },
      },
    }),
  ]);

  const countMap = Object.fromEntries(stageCounts.map((s) => [s.stage, s._count.id]));
  const total = STAGES.reduce((sum, s) => sum + (countMap[s] ?? 0), 0);
  const activeCount = (countMap["SUBMITTED"] ?? 0) + (countMap["UNDER_REVIEW"] ?? 0) + (countMap["MEDIATION"] ?? 0);

  function stageHref(s: string) {
    const params = new URLSearchParams();
    if (s !== "ALL") params.set("stage", s);
    if (mineOnly) params.set("mine", "1");
    const qs = params.toString();
    return `/admin/disputes${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
            Dispute Queue
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#999999", marginTop: "0.2rem" }}>
            {activeCount} active · {total} total · {adminName}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link
            href={mineOnly ? stageHref(activeStage ?? "ALL").replace("mine=1", "").replace("?&", "?").replace(/[?&]$/, "") : `${stageHref(activeStage ?? "ALL")}${stageHref(activeStage ?? "ALL").includes("?") ? "&" : "?"}mine=1`}
            style={{
              fontSize: "0.8125rem", fontWeight: 600, padding: "7px 14px",
              borderRadius: "4px", border: "1px solid #e0e0e0", textDecoration: "none",
              background: mineOnly ? "#111111" : "#ffffff", color: mineOnly ? "#ffffff" : "#333333",
            }}
          >
            {mineOnly ? `All disputes` : `My queue (${myCount})`}
          </Link>
        </div>
      </div>

      <HowItWorks />

      {/* Stage pipeline cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "0.625rem", marginBottom: "1.5rem" }}>
        {STAGES.map((s) => {
          const m = STAGE_META[s];
          const count = countMap[s] ?? 0;
          const active = activeStage === s;
          return (
            <Link
              key={s}
              href={stageHref(active ? "ALL" : s)}
              style={{
                display: "block", textDecoration: "none", padding: "1rem", borderRadius: "4px",
                border: `1px solid ${active ? m.color : m.border}`,
                background: active ? m.bg : "#ffffff",
                boxShadow: active ? `inset 0 0 0 1px ${m.color}` : "none",
              }}
            >
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color, lineHeight: 1 }}>{count}</p>
              <p style={{ fontSize: "0.625rem", fontWeight: 700, color: active ? m.color : "#999999", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.375rem" }}>
                {m.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Disputes table */}
      <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
        <div
          style={{
            display: "grid", gridTemplateColumns: "2fr 1.5fr 120px 50px 130px 200px",
            gap: "1rem", padding: "0.625rem 1.25rem",
            background: "#f9f9f9", borderBottom: "1px solid #e0e0e0",
            fontSize: "0.625rem", fontWeight: 700, color: "#999999",
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}
        >
          <span>Dispute</span>
          <span>Consumer / Operator</span>
          <span>Stage</span>
          <span>Age</span>
          <span>Assigned</span>
          <span>Actions</span>
        </div>

        {disputes.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "#999999", fontSize: "0.875rem" }}>
            {mineOnly ? "No disputes claimed yet." : "No disputes found."}
          </div>
        )}

        {disputes.map((d, i) => (
          <AdminDisputeRow
            key={d.id}
            dispute={{
              id: d.id,
              referenceNumber: d.referenceNumber,
              stage: d.stage,
              createdAt: d.createdAt.toISOString(),
              complaintId: d.complaint.id,
              complaintTitle: d.complaint.title,
              operatorName: d.complaint.operator.name,
              operatorSlug: d.complaint.operator.slug,
              consumerName: d.user.name,
              assignedAdminName: d.assignedAdmin?.name ?? null,
              assignedAdminId: d.assignedAdminId ?? null,
              updateCount: d._count.updates,
            }}
            currentAdminId={adminId}
            isLast={i === disputes.length - 1}
          />
        ))}
      </div>

      <p style={{ fontSize: "0.75rem", color: "#bbbbbb", marginTop: "1rem", textAlign: "right" }}>
        {disputes.length} disputes shown
      </p>
    </div>
  );
}
