"use client";
import { useState } from "react";

const STEPS = [
  {
    step: "1",
    title: "Claim a dispute",
    body: "Click Claim on any unassigned dispute to take ownership. Once claimed, the dispute shows your name and moves into your personal queue. Only one admin can claim a dispute — first-come, first-served.",
  },
  {
    step: "2",
    title: "Review and investigate",
    body: "Click the reference number or View to read the full complaint, the consumer's evidence, and any prior operator responses. Use this to build a picture before contacting either party.",
  },
  {
    step: "3",
    title: "Advance through stages",
    body: "Use the → Next Stage button on the row to move the dispute forward. Each stage has a pre-filled note you can edit before confirming. The note is logged to the dispute timeline and is visible to the consumer.",
  },
  {
    step: "4",
    title: "Pipeline stages",
    body: null,
    stages: [
      { label: "Submitted", color: "#1e40af", desc: "Newly filed. Review the complaint and notify the operator. Target: acknowledge within 2 business days." },
      { label: "Under Review", color: "#92400e", desc: "Active investigation. Contact both parties, gather evidence. Target: complete within 5 business days." },
      { label: "Mediation", color: "#9a3412", desc: "Both parties engaged. Facilitate agreement. Operator commits to actioning the resolution within 5 business days." },
      { label: "Resolved", color: "#14532d", desc: "Agreement reached and actioned. Confirm outcome with the consumer before closing." },
      { label: "Closed", color: "#374151", desc: "All parties satisfied. No further action required." },
    ],
  },
  {
    step: "5",
    title: "Filtering and prioritisation",
    body: "Click a stage card to filter the queue to that stage. Use My queue to focus on disputes you've claimed. Age column turns amber after 7 days and red after 14 — prioritise those first.",
  },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: "1.5rem", border: "1px solid #e0e0e0", borderRadius: "4px", background: "#ffffff", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.875rem 1.25rem", background: "none", border: "none", cursor: "pointer",
          fontSize: "0.8125rem", fontWeight: 600, color: "#333333", textAlign: "left",
        }}
      >
        <span>How to use the dispute queue</span>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "#999999" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 4l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid #f0f0f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            {STEPS.map((s) => (
              <div
                key={s.step}
                style={{ padding: "1rem", background: "#f9f9f9", borderRadius: "4px", border: "1px solid #f0f0f0" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{
                    fontSize: "0.625rem", fontWeight: 700, background: "#111111", color: "#ffffff",
                    width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    {s.step}
                  </span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#111111" }}>{s.title}</span>
                </div>

                {s.body && (
                  <p style={{ fontSize: "0.75rem", color: "#555555", lineHeight: 1.6 }}>{s.body}</p>
                )}

                {s.stages && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {s.stages.map((st) => (
                      <div key={st.label} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                        <span style={{
                          fontSize: "0.5625rem", fontWeight: 700, color: st.color,
                          whiteSpace: "nowrap", marginTop: "1px", minWidth: "80px",
                        }}>
                          {st.label.toUpperCase()}
                        </span>
                        <p style={{ fontSize: "0.6875rem", color: "#777777", lineHeight: 1.5 }}>{st.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p style={{ fontSize: "0.6875rem", color: "#aaaaaa", marginTop: "1rem" }}>
            All stage transitions are logged to the dispute timeline and visible to the consumer at{" "}
            <span style={{ fontFamily: "monospace" }}>/disputes/[id]</span>.
            Notes are sent as-is — edit the default text before confirming if the situation warrants it.
          </p>
        </div>
      )}
    </div>
  );
}
