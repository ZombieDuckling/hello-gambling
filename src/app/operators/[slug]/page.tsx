import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ComplaintCard from "@/components/ComplaintCard";

export default async function OperatorPage({ params }: { params: { slug: string } }) {
  const operator = await prisma.operator.findUnique({
    where: { slug: params.slug },
    include: {
      complaints: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          operator: { select: { name: true, slug: true } },
          responses: { select: { id: true } },
        },
      },
    },
  });

  if (!operator) notFound();

  const total = operator.complaints.length;
  const resolved = operator.complaints.filter((c) => c.status === "RESOLVED").length;
  const open = operator.complaints.filter((c) => c.status === "OPEN").length;
  const avgRating = total > 0 ? operator.complaints.reduce((s, c) => s + c.rating, 0) / total : 0;
  const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const responded = operator.complaints.filter((c) => c.responses.length > 0).length;
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <nav style={{ fontSize: "0.8125rem", color: "#999999", marginBottom: "1.5rem" }}>
        <Link href="/operators" style={{ color: "#999999", textDecoration: "none" }}>Operators</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span style={{ color: "#555555" }}>{operator.name}</span>
      </nav>

      <div
        className="fade-in"
        style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.75rem", marginBottom: "1.5rem" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {operator.logoUrl ? (
            <div style={{ width: 56, height: 56, flexShrink: 0, background: ["sunbet","tsogo-sun","sun-international"].includes(operator.slug) ? "#111111" : "#f0f0f0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", padding: "7px" }}>
              <img src={operator.logoUrl} alt={operator.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                background: "#111111",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "1.125rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {operator.name.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
              {operator.name}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.25rem", fontSize: "0.8125rem", color: "#777777" }}>
              {operator.province && <span>{operator.province}</span>}
              {operator.licenseNumber && <span style={{ fontFamily: "monospace" }}>{operator.licenseNumber}</span>}
              {operator.website && (
                <a href={operator.website} target="_blank" rel="noopener noreferrer" style={{ color: "#c5623a", textDecoration: "none" }}>
                  Website &rarr;
                </a>
              )}
            </div>
          </div>
          <Link
            href={`/complaints/new`}
            style={{ background: "#c5623a", color: "#ffffff", fontWeight: 600, fontSize: "0.8125rem", padding: "8px 16px", borderRadius: "4px", textDecoration: "none", flexShrink: 0 }}
          >
            File complaint
          </Link>
        </div>

        {operator.description && (
          <p style={{ fontSize: "0.875rem", color: "#555555", lineHeight: 1.6, marginBottom: "1.25rem" }}>
            {operator.description}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "0.5rem",
            borderTop: "1px solid #f0f0f0",
            paddingTop: "1.25rem",
          }}
          className="grid-cols-2 sm:grid-cols-5"
        >
          {[
            { value: total, label: "Complaints" },
            { value: open, label: "Open" },
            { value: `${resolveRate}%`, label: "Resolved" },
            { value: `${responseRate}%`, label: "Response rate" },
            { value: avgRating > 0 ? avgRating.toFixed(1) : "—", label: "Avg rating" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "0.5rem" }}>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111111" }}>{s.value}</p>
              <p style={{ fontSize: "0.625rem", fontWeight: 600, color: "#999999", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.2rem" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <section>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>
          Complaints ({total})
        </h2>
        {operator.complaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operator.complaints.map((c) => <ComplaintCard key={c.id} complaint={c as any} />)}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#999999", background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
            <p style={{ fontWeight: 600, color: "#555555" }}>No complaints on record.</p>
          </div>
        )}
      </section>
    </div>
  );
}
