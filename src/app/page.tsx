import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import ComplaintCard from "@/components/ComplaintCard";
import DisputeCard from "@/components/DisputeCard";

export const dynamic = "force-dynamic";

const STAT_LABEL: React.CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#999999",
  marginTop: "0.25rem",
};

export default async function HomePage() {
  const [recentComplaints, recentDisputes, operators, counts] = await Promise.all([
    prisma.complaint.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        operator: { select: { name: true, slug: true } },
        responses: { select: { id: true } },
      },
    }),
    prisma.dispute.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        complaint: { include: { operator: { select: { name: true } } } },
        user: { select: { name: true } },
        updates: { select: { id: true } },
      },
    }),
    prisma.operator.findMany({
      take: 8,
      orderBy: { name: "asc" },
      include: { _count: { select: { complaints: true } } },
    }),
    Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: "RESOLVED" } }),
      prisma.operator.count(),
      prisma.dispute.count(),
    ]),
  ]);

  const [total, resolved, totalOps, totalDisputes] = counts;
  const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <>
      <section style={{ position: "relative", color: "#ffffff", overflow: "hidden", minHeight: 420 }}>
        <Image
          src="/assets/hero.png"
          alt=""
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div className="max-w-7xl mx-auto px-6 py-24 fade-in" style={{ position: "relative" }}>
          <div style={{
            display: "inline-block",
            background: "#002040",
            padding: "2rem 2.5rem",
            borderRadius: "4px",
            maxWidth: 560,
          }}>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: "0.75rem",
                color: "#c5623a",
              }}
            >
              Your voice in SA gambling.
            </h1>
            <p
              style={{
                fontSize: "1rem",
                color: "#e8dece",
                marginBottom: "1.75rem",
                lineHeight: 1.6,
              }}
            >
              South Africa's independent platform for gambling complaints, operator
              accountability, and formal dispute resolution.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/complaints/new"
                style={{
                  background: "#c5623a",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  textDecoration: "none",
                }}
              >
                File a complaint
              </Link>
              <Link
                href="/complaints"
                style={{
                  background: "transparent",
                  color: "#e8dece",
                  fontWeight: 500,
                  fontSize: "0.9375rem",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  border: "1px solid rgba(232,222,206,0.3)",
                }}
              >
                Browse complaints
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: total, label: "Complaints filed" },
              { value: `${resolveRate}%`, label: "Resolution rate" },
              { value: totalOps, label: "Operators listed" },
              { value: totalDisputes, label: "Active disputes" },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#c5623a", lineHeight: 1 }}>
                  {s.value}
                </p>
                <p style={STAT_LABEL}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h2
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#999999",
              marginBottom: "2.5rem",
            }}
          >
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                n: "01",
                title: "File a complaint",
                desc: "Submit a detailed complaint about any NGB-licensed SA operator. Include dates, ZAR amounts, and reference numbers.",
              },
              {
                n: "02",
                title: "Operator responds",
                desc: "The operator is notified and can respond publicly. Most issues are resolved at this stage.",
              },
              {
                n: "03",
                title: "Escalate if needed",
                desc: "If unresolved, escalate to a formal dispute. A mediator works toward a fair outcome.",
              },
            ].map((item) => (
              <div key={item.n}>
                <p style={{ fontSize: "2rem", fontWeight: 700, color: "#c4821a", marginBottom: "0.75rem", lineHeight: 1 }}>
                  {item.n}
                </p>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111111", marginBottom: "0.5rem" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#777777", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex justify-between items-baseline mb-8">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111111" }}>Recent complaints</h2>
            <Link href="/complaints" style={{ fontSize: "0.8125rem", color: "#c5623a", textDecoration: "none", fontWeight: 500 }}>
              View all
            </Link>
          </div>
          {recentComplaints.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentComplaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c as any} />
              ))}
            </div>
          ) : (
            <div style={{ padding: "3rem 0", textAlign: "center", color: "#999999", fontSize: "0.875rem" }}>
              No complaints yet.{" "}
              <Link href="/complaints/new" style={{ color: "#c5623a" }}>File the first one.</Link>
            </div>
          )}
        </div>
      </section>

      {recentDisputes.length > 0 && (
        <section style={{ background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
          <div className="max-w-7xl mx-auto px-6 py-14">
            <div className="flex justify-between items-baseline mb-8">
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111111" }}>Active disputes</h2>
              <Link href="/disputes" style={{ fontSize: "0.8125rem", color: "#c5623a", textDecoration: "none", fontWeight: 500 }}>
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentDisputes.map((d) => (
                <DisputeCard key={d.id} dispute={d as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section style={{ background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex justify-between items-baseline mb-8">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111111" }}>Operators</h2>
            <Link href="/operators" style={{ fontSize: "0.8125rem", color: "#c5623a", textDecoration: "none", fontWeight: 500 }}>
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {operators.map((op) => (
              <Link
                key={op.id}
                href={`/operators/${op.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="hover-border"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    padding: "0.875rem 0.75rem",
                    textAlign: "center",
                  }}
                >
                  {op.logoUrl ? (
                    <div style={{ width: 40, height: 40, margin: "0 auto 0.5rem", background: ["sunbet","tsogo-sun","sun-international"].includes(op.slug) ? "#111111" : "#f0f0f0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", padding: "5px" }}>
                      <img src={op.logoUrl} alt={op.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: "#111111",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 0.5rem",
                        color: "#ffffff",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                      }}
                    >
                      {op.name.charAt(0)}
                    </div>
                  )}
                  <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#111111", lineHeight: 1.3 }}>
                    {op.name}
                  </p>
                  <p style={{ fontSize: "0.625rem", color: "#999999", marginTop: "0.2rem" }}>
                    {op._count.complaints}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#111111", color: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-6 py-5 text-center">
          <p style={{ fontSize: "0.8125rem", color: "#999999" }}>
            <strong style={{ color: "#c5623a" }}>Gamble responsibly.</strong>{" "}
            National Problem Gambling Helpline:{" "}
            <strong style={{ color: "#ffffff" }}>0800 006 008</strong> — free, confidential, 24/7.
          </p>
        </div>
      </section>
    </>
  );
}
