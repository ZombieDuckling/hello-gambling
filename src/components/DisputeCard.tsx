"use client";
import Link from "next/link";

const STAGE: Record<string, { label: string; color: string; bg: string }> = {
  SUBMITTED:    { label: "Submitted",    color: "#1e40af", bg: "#eff6ff" },
  UNDER_REVIEW: { label: "Under Review", color: "#92400e", bg: "#fffbeb" },
  MEDIATION:    { label: "Mediation",    color: "#9a3412", bg: "#fff7ed" },
  RESOLVED:     { label: "Resolved",     color: "#14532d", bg: "#f0fdf4" },
  CLOSED:       { label: "Closed",       color: "#374151", bg: "#f9fafb" },
};

interface Props {
  dispute: {
    id: string;
    referenceNumber: string;
    stage: string;
    summary: string;
    createdAt: Date | string;
    complaint: {
      title: string;
      operator: { name: string };
    };
    user: { name: string };
    updates: { id: string }[];
  };
}

export default function DisputeCard({ dispute }: Props) {
  const s = STAGE[dispute.stage] ?? { label: dispute.stage, color: "#555555", bg: "#f5f5f5" };
  const date = new Date(dispute.createdAt).toLocaleDateString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <Link href={`/disputes/${dispute.id}`} style={{ textDecoration: "none" }}>
      <article
        className="fade-in"
        style={{
          background: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          padding: "1.25rem",
          transition: "border-color 0.1s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#aaaaaa")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
      >
        <div className="flex items-center justify-between mb-3">
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#555555",
              background: "#f0f0f0",
              padding: "2px 6px",
              borderRadius: "2px",
            }}
          >
            {dispute.referenceNumber}
          </span>
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: s.color,
              background: s.bg,
              padding: "2px 6px",
              borderRadius: "2px",
            }}
          >
            {s.label}
          </span>
        </div>

        <h3
          className="line-clamp-2 mb-2"
          style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111111", lineHeight: 1.4 }}
        >
          {dispute.complaint.title}
        </h3>

        <p
          className="line-clamp-2"
          style={{ fontSize: "0.8125rem", color: "#777777", lineHeight: 1.5 }}
        >
          {dispute.summary}
        </p>

        <div
          style={{
            borderTop: "1px solid #f0f0f0",
            marginTop: "0.875rem",
            paddingTop: "0.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c5623a" }}>
            {dispute.complaint.operator.name}
          </span>
          <span style={{ fontSize: "0.6875rem", color: "#bbbbbb" }}>
            {dispute.updates.length} update{dispute.updates.length !== 1 ? "s" : ""} &middot; {date}
          </span>
        </div>
      </article>
    </Link>
  );
}
