import { prisma } from "@/lib/db";
import DisputeCard from "@/components/DisputeCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STAGES = [
  ["", "All stages"],
  ["SUBMITTED", "Submitted"],
  ["UNDER_REVIEW", "Under Review"],
  ["MEDIATION", "Mediation"],
  ["RESOLVED", "Resolved"],
  ["CLOSED", "Closed"],
];

const selectStyle: React.CSSProperties = {
  border: "1px solid #e0e0e0",
  borderRadius: "4px",
  padding: "7px 10px",
  fontSize: "0.8125rem",
  color: "#333333",
  background: "#ffffff",
  outline: "none",
};

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: { stage?: string; q?: string };
}) {
  const where: Record<string, unknown> = {};
  if (searchParams.stage) where.stage = searchParams.stage;
  if (searchParams.q) {
    where.OR = [
      { referenceNumber: { contains: searchParams.q, mode: "insensitive" } },
      { summary: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        complaint: { include: { operator: { select: { name: true } } } },
        user: { select: { name: true } },
        updates: { select: { id: true } },
      },
    }),
    prisma.dispute.count({ where }),
  ]);

  const hasFilters = !!(searchParams.stage || searchParams.q);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
            Disputes
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#999999", marginTop: "0.2rem" }}>
            {total} dispute{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#f5f5f5",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#333333", marginBottom: "0.375rem" }}>
          About dispute resolution
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "#777777", lineHeight: 1.6 }}>
          Disputes are formal escalations of unresolved complaints. Each dispute receives a unique
          reference number (HG-YYYY-XXXX). Our mediation team works with both parties to reach
          a fair outcome under the National Gambling Act's consumer protection provisions.
        </p>
      </div>

      <form
        method="GET"
        style={{
          background: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          padding: "1rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.625rem",
          alignItems: "center",
        }}
      >
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search by reference or description..."
          style={{ ...selectStyle, flex: 1, minWidth: "180px" }}
        />
        <select name="stage" defaultValue={searchParams.stage ?? ""} style={selectStyle}>
          {STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button
          type="submit"
          style={{
            background: "#c5623a",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.8125rem",
            padding: "7px 16px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Search
        </button>
        {hasFilters && (
          <a
            href="/disputes"
            style={{ fontSize: "0.8125rem", color: "#777777", textDecoration: "none", padding: "7px 12px", border: "1px solid #e0e0e0", borderRadius: "4px" }}
          >
            Clear
          </a>
        )}
      </form>

      {disputes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {disputes.map((d) => <DisputeCard key={d.id} dispute={d as any} />)}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "#999999" }}>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "#555555", marginBottom: "0.5rem" }}>No disputes found</p>
          <p style={{ fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            To open a dispute, first file a complaint then escalate it.
          </p>
          <Link
            href="/complaints/new"
            style={{ background: "#c5623a", color: "#ffffff", fontWeight: 600, fontSize: "0.875rem", padding: "9px 20px", borderRadius: "4px", textDecoration: "none" }}
          >
            File a complaint
          </Link>
        </div>
      )}
    </div>
  );
}
