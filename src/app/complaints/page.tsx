import { prisma } from "@/lib/db";
import ComplaintCard from "@/components/ComplaintCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  ["", "All categories"],
  ["PAYMENT_ISSUES", "Payment Issues"],
  ["BONUS_DISPUTES", "Bonus Disputes"],
  ["ACCOUNT_ISSUES", "Account Issues"],
  ["RESPONSIBLE_GAMBLING", "Responsible Gambling"],
  ["TECHNICAL_ISSUES", "Technical Issues"],
  ["UNFAIR_TREATMENT", "Unfair Treatment"],
  ["OTHER", "Other"],
];

const STATUSES = [
  ["", "All statuses"],
  ["OPEN", "Open"],
  ["IN_PROGRESS", "In Progress"],
  ["RESOLVED", "Resolved"],
  ["ESCALATED", "Escalated"],
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

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; category?: string };
}) {
  const where: Record<string, unknown> = {};
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q, mode: "insensitive" } },
      { description: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.category) where.category = searchParams.category;

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        operator: { select: { name: true, slug: true } },
        responses: { select: { id: true } },
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  const hasFilters = !!(searchParams.q || searchParams.status || searchParams.category);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
            Complaints
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#999999", marginTop: "0.2rem" }}>
            {total} complaint{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/complaints/new"
          style={{
            background: "#c5623a",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.8125rem",
            padding: "8px 16px",
            borderRadius: "4px",
            textDecoration: "none",
          }}
        >
          File complaint
        </Link>
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
          placeholder="Search complaints..."
          style={{ ...selectStyle, flex: 1, minWidth: "180px" }}
        />
        <select name="status" defaultValue={searchParams.status ?? ""} style={selectStyle}>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="category" defaultValue={searchParams.category ?? ""} style={selectStyle}>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
            href="/complaints"
            style={{
              fontSize: "0.8125rem",
              color: "#777777",
              textDecoration: "none",
              padding: "7px 12px",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
            }}
          >
            Clear
          </a>
        )}
      </form>

      {complaints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complaints.map((c) => <ComplaintCard key={c.id} complaint={c as any} />)}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "#999999" }}>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "#555555", marginBottom: "0.5rem" }}>
            No complaints found
          </p>
          <p style={{ fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            {hasFilters ? "Try adjusting your filters." : "Be the first to file a complaint."}
          </p>
          <Link
            href="/complaints/new"
            style={{
              background: "#c5623a",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.875rem",
              padding: "9px 20px",
              borderRadius: "4px",
              textDecoration: "none",
            }}
          >
            File a complaint
          </Link>
        </div>
      )}
    </div>
  );
}
