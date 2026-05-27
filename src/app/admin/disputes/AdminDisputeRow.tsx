"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STAGE_META: Record<string, { label: string; color: string; bg: string }> = {
  SUBMITTED:    { label: "Submitted",    color: "#1e40af", bg: "#eff6ff" },
  UNDER_REVIEW: { label: "Under Review", color: "#92400e", bg: "#fffbeb" },
  MEDIATION:    { label: "Mediation",    color: "#9a3412", bg: "#fff7ed" },
  RESOLVED:     { label: "Resolved",     color: "#14532d", bg: "#f0fdf4" },
  CLOSED:       { label: "Closed",       color: "#374151", bg: "#f9fafb" },
};

const NEXT_STAGE: Record<string, string> = {
  SUBMITTED:    "UNDER_REVIEW",
  UNDER_REVIEW: "MEDIATION",
  MEDIATION:    "RESOLVED",
  RESOLVED:     "CLOSED",
};

const DEFAULT_NOTE: Record<string, string> = {
  SUBMITTED:    "Dispute received and reviewed. Moving to formal investigation. Operator has been notified and given 5 business days to respond.",
  UNDER_REVIEW: "Investigation complete. Both parties have been contacted. Proceeding to structured mediation.",
  MEDIATION:    "Mediation successful. Parties have reached agreement. Operator has committed to actioning the resolution within 5 business days.",
  RESOLVED:     "Dispute closed. All parties satisfied with the outcome. No further action required.",
};

interface DisputeData {
  id: string;
  referenceNumber: string;
  stage: string;
  createdAt: string;
  complaintId: string;
  complaintTitle: string;
  operatorName: string;
  operatorSlug: string;
  consumerName: string;
  assignedAdminName: string | null;
  assignedAdminId: string | null;
  updateCount: number;
}

export default function AdminDisputeRow({
  dispute, currentAdminId, isLast,
}: {
  dispute: DisputeData;
  currentAdminId: string;
  isLast: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"claim" | "advance" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");

  const sm = STAGE_META[dispute.stage] ?? { label: dispute.stage, color: "#555", bg: "#f5f5f5" };
  const nextStage = NEXT_STAGE[dispute.stage];
  const nextMeta = nextStage ? STAGE_META[nextStage] : null;
  const daysOpen = Math.floor((Date.now() - new Date(dispute.createdAt).getTime()) / 86400000);
  const isMine = dispute.assignedAdminId === currentAdminId;
  const isClosed = dispute.stage === "CLOSED" || dispute.stage === "RESOLVED";

  async function claim() {
    setLoading("claim");
    const res = await fetch(`/api/admin/disputes/${dispute.id}/claim`, { method: "PATCH" });
    if (res.ok) router.refresh();
    setLoading(null);
  }

  async function advance() {
    if (!nextStage) return;
    setLoading("advance");
    const content = note.trim() || DEFAULT_NOTE[dispute.stage] || "Stage advanced by admin.";
    const res = await fetch(`/api/disputes/${dispute.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, stage: nextStage }),
    });
    if (res.ok) {
      setNote("");
      setExpanded(false);
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 120px 50px 130px 200px",
          gap: "1rem",
          padding: "0.875rem 1.25rem",
          borderBottom: isLast && !expanded ? "none" : "1px solid #f0f0f0",
          alignItems: "center",
          background: isMine ? "#fffdf5" : "#ffffff",
        }}
      >
        {/* Ref + title */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
            <Link
              href={`/disputes/${dispute.id}`}
              style={{ fontFamily: "monospace", fontSize: "0.8125rem", fontWeight: 700, color: "#c5623a", textDecoration: "none" }}
            >
              {dispute.referenceNumber}
            </Link>
            <span style={{ fontSize: "0.625rem", color: "#bbbbbb" }}>{dispute.updateCount} updates</span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "#333333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {dispute.complaintTitle}
          </p>
        </div>

        {/* Consumer / Operator */}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "0.8125rem", color: "#333333", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {dispute.consumerName}
          </p>
          <Link
            href={`/operators/${dispute.operatorSlug}`}
            style={{ fontSize: "0.75rem", color: "#999999", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
          >
            {dispute.operatorName}
          </Link>
        </div>

        {/* Stage */}
        <span style={{
          fontSize: "0.625rem", fontWeight: 700, color: sm.color, background: sm.bg,
          padding: "3px 8px", borderRadius: "2px", whiteSpace: "nowrap", display: "inline-block",
        }}>
          {sm.label}
        </span>

        {/* Age */}
        <span style={{
          fontSize: "0.8125rem",
          color: daysOpen > 14 ? "#991b1b" : daysOpen > 7 ? "#92400e" : "#777777",
          fontWeight: daysOpen > 7 ? 700 : 400,
        }}>
          {daysOpen}d
        </span>

        {/* Assigned */}
        <span style={{ fontSize: "0.75rem", color: dispute.assignedAdminId ? (isMine ? "#c5623a" : "#555555") : "#cccccc" }}>
          {isMine ? "You" : (dispute.assignedAdminName ?? "—")}
        </span>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
          {!dispute.assignedAdminId && !isClosed && (
            <button
              onClick={claim}
              disabled={loading === "claim"}
              style={{
                fontSize: "0.75rem", fontWeight: 600, color: "#c5623a",
                background: "transparent", border: "1px solid #c5623a",
                borderRadius: "3px", padding: "4px 10px", cursor: "pointer",
                opacity: loading === "claim" ? 0.5 : 1,
              }}
            >
              {loading === "claim" ? "…" : "Claim"}
            </button>
          )}
          {nextStage && !isClosed && (
            <button
              onClick={() => setExpanded(!expanded)}
              disabled={!!loading}
              style={{
                fontSize: "0.75rem", fontWeight: 600, color: "#ffffff",
                background: expanded ? "#666666" : "#111111",
                border: "none", borderRadius: "3px",
                padding: "4px 10px", cursor: "pointer",
              }}
            >
              {expanded ? "Cancel" : `→ ${nextMeta?.label}`}
            </button>
          )}
          <Link
            href={`/disputes/${dispute.id}`}
            style={{ fontSize: "0.75rem", color: "#999999", textDecoration: "none", padding: "4px 8px" }}
          >
            View
          </Link>
        </div>
      </div>

      {/* Advance panel */}
      {expanded && nextStage && nextMeta && (
        <div style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid #e0e0e0",
          background: "#f9f9f9",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#333333", marginBottom: "0.5rem" }}>
              Advance <span style={{ fontFamily: "monospace" }}>{dispute.referenceNumber}</span> →{" "}
              <span style={{ color: nextMeta.color, fontWeight: 700 }}>{nextMeta.label}</span>
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={DEFAULT_NOTE[dispute.stage]}
              rows={3}
              style={{
                width: "100%", border: "1px solid #e0e0e0", borderRadius: "4px",
                padding: "8px 12px", fontSize: "0.8125rem", color: "#111111",
                background: "#ffffff", resize: "vertical", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={advance}
            disabled={loading === "advance"}
            style={{
              fontSize: "0.8125rem", fontWeight: 600, color: "#ffffff",
              background: loading === "advance" ? "#cccccc" : "#c5623a",
              border: "none", borderRadius: "4px",
              padding: "8px 16px", cursor: "pointer",
              whiteSpace: "nowrap", marginTop: "1.5rem",
            }}
          >
            {loading === "advance" ? "Advancing…" : `Confirm →`}
          </button>
        </div>
      )}
    </>
  );
}
