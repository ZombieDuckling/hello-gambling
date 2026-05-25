import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OperatorsPage() {
  const operators = await prisma.operator.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { complaints: true } },
      complaints: { select: { rating: true, status: true } },
    },
  });

  const withStats = operators.map((op) => {
    const total = op._count.complaints;
    const resolved = op.complaints.filter((c) => c.status === "RESOLVED").length;
    const avgRating = total > 0 ? op.complaints.reduce((s, c) => s + c.rating, 0) / total : 0;
    const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { ...op, total, avgRating, resolveRate };
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
          Operators
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "#999999", marginTop: "0.2rem" }}>
          {operators.length} NGB-licensed operators listed
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {withStats.map((op) => (
          <Link key={op.id} href={`/operators/${op.slug}`} style={{ textDecoration: "none" }}>
            <article
              className="fade-in hover-border"
              style={{
                background: "#ffffff",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                padding: "1.25rem",
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                {op.logoUrl ? (
                  <div style={{ width: 44, height: 44, flexShrink: 0, background: ["sunbet","tsogo-sun","sun-international"].includes(op.slug) ? "#111111" : "#f0f0f0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}>
                    <img src={op.logoUrl} alt={op.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: "#111111",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {op.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111111" }}>{op.name}</h2>
                  <p style={{ fontSize: "0.75rem", color: "#999999" }}>
                    {op.province && `${op.province} · `}{op.licenseNumber}
                  </p>
                </div>
              </div>

              {op.description && (
                <p style={{ fontSize: "0.8125rem", color: "#777777", lineHeight: 1.5, marginBottom: "1rem" }}
                   className="line-clamp-2">
                  {op.description}
                </p>
              )}

              <div
                style={{
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: "0.875rem",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  textAlign: "center",
                  gap: "0.5rem",
                }}
              >
                {[
                  { value: op.total, label: "Complaints" },
                  { value: `${op.resolveRate}%`, label: "Resolved" },
                  { value: op.avgRating > 0 ? op.avgRating.toFixed(1) : "—", label: "Avg rating" },
                ].map((s) => (
                  <div key={s.label}>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#111111" }}>{s.value}</p>
                    <p style={{ fontSize: "0.625rem", fontWeight: 600, color: "#999999", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
