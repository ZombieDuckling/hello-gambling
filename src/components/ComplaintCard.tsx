"use client";
import Link from "next/link";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:        { label: "Open",        color: "#991b1b", bg: "#fef2f2" },
  IN_PROGRESS: { label: "In Progress", color: "#92400e", bg: "#fffbeb" },
  RESOLVED:    { label: "Resolved",    color: "#14532d", bg: "#f0fdf4" },
  ESCALATED:   { label: "Escalated",   color: "#4c1d95", bg: "#faf5ff" },
};

const CATEGORY: Record<string, string> = {
  PAYMENT_ISSUES:       "Payment Issues",
  BONUS_DISPUTES:       "Bonus Disputes",
  ACCOUNT_ISSUES:       "Account Issues",
  RESPONSIBLE_GAMBLING: "Responsible Gambling",
  TECHNICAL_ISSUES:     "Technical Issues",
  UNFAIR_TREATMENT:     "Unfair Treatment",
  OTHER:                "Other",
};

interface Props {
  complaint: {
    id: string;
    title: string;
    description: string;
    category: string;
    rating: number;
    status: string;
    createdAt: Date | string;
    user: { name: string };
    operator: { name: string; slug: string };
    responses: { id: string }[];
  };
}

function RatingDots({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: n <= rating ? "#c5623a" : "#e0e0e0",
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );
}

export default function ComplaintCard({ complaint }: Props) {
  const s = STATUS[complaint.status] ?? { label: complaint.status, color: "#555555", bg: "#f5f5f5" };
  const date = new Date(complaint.createdAt).toLocaleDateString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <Link href={`/complaints/${complaint.id}`} style={{ textDecoration: "none" }}>
      <article
        className="fade-in"
        style={{
          background: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          padding: "1.25rem",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "border-color 0.1s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#aaaaaa")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
      >
        <div className="flex items-center justify-between mb-3">
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: s.color,
              background: s.bg,
              padding: "2px 6px",
              borderRadius: "2px",
              letterSpacing: "0.03em",
            }}
          >
            {s.label}
          </span>
          <RatingDots rating={complaint.rating} />
        </div>

        <h3
          className="line-clamp-2 mb-2"
          style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111111", lineHeight: 1.4 }}
        >
          {complaint.title}
        </h3>

        <p
          className="line-clamp-2 flex-1"
          style={{ fontSize: "0.8125rem", color: "#777777", lineHeight: 1.5 }}
        >
          {complaint.description}
        </p>

        <div
          style={{
            borderTop: "1px solid #f0f0f0",
            marginTop: "0.875rem",
            paddingTop: "0.75rem",
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c5623a" }}>
              {complaint.operator.name}
            </span>
            <span style={{ fontSize: "0.6875rem", color: "#999999" }}>
              {CATEGORY[complaint.category] ?? complaint.category}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: "0.6875rem", color: "#bbbbbb" }}>{complaint.user.name}</span>
            <span style={{ fontSize: "0.6875rem", color: "#bbbbbb" }}>
              {complaint.responses.length} response{complaint.responses.length !== 1 ? "s" : ""} &middot; {date}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
