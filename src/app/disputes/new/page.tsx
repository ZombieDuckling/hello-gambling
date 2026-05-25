"use client";
import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function NewDisputeForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintId = searchParams.get("complaintId");

  const [complaint, setComplaint] = useState<{
    title: string;
    operator: { name: string };
  } | null>(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (complaintId) {
      fetch(`/api/complaints/${complaintId}`)
        .then((r) => r.json())
        .then(setComplaint)
        .catch(() => {});
    }
  }, [complaintId]);

  if (status === "loading") return null;

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#c5623a] mb-3">Open a Dispute</h1>
        <p className="text-gray-500 mb-6">You need to be logged in to open a dispute.</p>
        <Link
          href="/auth/login"
          className="bg-[#c5623a] text-white px-6 py-3 rounded-lg font-medium"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!complaintId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#c5623a] mb-3">Open a Dispute</h1>
        <p className="text-gray-500 mb-6">
          A dispute must be linked to an existing complaint. Please file a complaint first,
          then escalate it to a dispute if it remains unresolved.
        </p>
        <Link
          href="/complaints/new"
          className="bg-[#c5623a] text-white px-6 py-3 rounded-lg font-medium"
        >
          File a Complaint
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId, summary }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/disputes/${data.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to open dispute.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#c5623a] mb-2">Open a Formal Dispute</h1>
      <p className="text-gray-500 text-sm mb-6">
        A dispute is a formal escalation. Our team will mediate between you and the operator.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
        <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
          <li>Your dispute receives a unique reference number (HG-YYYY-XXXX)</li>
          <li>Our team reviews your complaint and operator responses</li>
          <li>We contact the operator for their formal position</li>
          <li>Mediation is facilitated if parties cannot agree</li>
          <li>A formal outcome is recorded on the platform</li>
        </ol>
      </div>

      {complaint && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400 mb-1">Linked complaint</p>
          <p className="font-medium text-gray-800">{complaint.title}</p>
          <p className="text-sm text-[#c5623a]">{complaint.operator?.name}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-7 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Dispute Summary *
          </label>
          <textarea
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Explain why the complaint was not resolved and what outcome you are seeking. Include any additional context not in the original complaint."
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5623a] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !summary.trim()}
          className="w-full bg-[#c5623a] text-white py-3.5 rounded-xl font-semibold hover:bg-[#0f2d1a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Opening dispute..." : "Open Formal Dispute"}
        </button>
      </form>
    </div>
  );
}

export default function NewDisputePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-10 text-center text-gray-400">Loading...</div>}>
      <NewDisputeForm />
    </Suspense>
  );
}
