import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import ComplaintCard from "@/components/ComplaintCard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const operatorId = (session.user as any).operatorId;

  if (role === "OPERATOR" && operatorId) {
    const [operator, complaints] = await Promise.all([
      prisma.operator.findUnique({ where: { id: operatorId } }),
      prisma.complaint.findMany({
        where: { operatorId },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          operator: { select: { name: true, slug: true } },
          responses: { select: { id: true } },
        },
      }),
    ]);

    const open = complaints.filter((c) => c.status === "OPEN").length;
    const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS").length;
    const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
    const unresponded = complaints.filter((c) => c.responses.length === 0).length;

    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
            Operator dashboard
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#777777", marginTop: "0.25rem" }}>
            {operator?.name}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Open", value: open, color: "#991b1b" },
            { label: "In Progress", value: inProgress, color: "#92400e" },
            { label: "Resolved", value: resolved, color: "#14532d" },
            { label: "Need response", value: unresponded, color: "#c5623a" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.25rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#999999", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.25rem" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {unresponded > 0 && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "4px", padding: "1rem 1.25rem", marginBottom: "1.5rem", fontSize: "0.875rem", color: "#78350f" }}>
            <strong>{unresponded} complaint{unresponded !== 1 ? "s" : ""}</strong> awaiting a response.
            Responding promptly improves your resolution rate.
          </div>
        )}

        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>
          All complaints — {operator?.name}
        </h2>
        {complaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map((c) => <ComplaintCard key={c.id} complaint={c as any} />)}
          </div>
        ) : (
          <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "4rem", textAlign: "center", color: "#999999" }}>
            <p style={{ fontWeight: 600, color: "#555555" }}>No complaints on record.</p>
          </div>
        )}
      </div>
    );
  }

  const [complaints, disputes] = await Promise.all([
    prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        operator: { select: { name: true, slug: true } },
        responses: { select: { id: true } },
      },
    }),
    prisma.dispute.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        complaint: { include: { operator: { select: { name: true } } } },
        updates: { select: { id: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#777777", marginTop: "0.25rem" }}>
            {session.user.name}
          </p>
        </div>
        <Link
          href="/complaints/new"
          style={{ background: "#c5623a", color: "#ffffff", fontWeight: 600, fontSize: "0.8125rem", padding: "8px 16px", borderRadius: "4px", textDecoration: "none" }}
        >
          New complaint
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { label: "Total", value: complaints.length, color: "#111111" },
          { label: "Open", value: complaints.filter((c) => c.status === "OPEN").length, color: "#991b1b" },
          { label: "Resolved", value: complaints.filter((c) => c.status === "RESOLVED").length, color: "#14532d" },
          { label: "Disputes", value: disputes.length, color: "#4c1d95" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#999999", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.25rem" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>My complaints</h2>
        {complaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map((c) => <ComplaintCard key={c.id} complaint={c as any} />)}
          </div>
        ) : (
          <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "3rem", textAlign: "center", color: "#999999", fontSize: "0.875rem" }}>
            No complaints yet.{" "}
            <Link href="/complaints/new" style={{ color: "#c5623a", fontWeight: 600, textDecoration: "none" }}>File one now.</Link>
          </div>
        )}
      </section>

      {disputes.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>My disputes</h2>
          <div className="space-y-2">
            {disputes.map((d) => (
              <Link key={d.id} href={`/disputes/${d.id}`} style={{ textDecoration: "none" }}>
                <div
                  className="hover-border"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "#777777", marginRight: "0.75rem" }}>
                      {d.referenceNumber}
                    </span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111111" }}>{d.complaint.title}</span>
                    <p style={{ fontSize: "0.75rem", color: "#999999", marginTop: "0.2rem" }}>{d.complaint.operator.name}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#555555", background: "#f0f0f0", padding: "2px 6px", borderRadius: "2px" }}>
                      {d.stage.replace("_", " ")}
                    </span>
                    <p style={{ fontSize: "0.6875rem", color: "#bbbbbb", marginTop: "0.25rem" }}>
                      {d.updates.length} update{d.updates.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
