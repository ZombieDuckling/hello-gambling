import { prisma } from "@/lib/db";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import ForumSearch from "./ForumSearch";
import { expandQuery } from "@/lib/expandQuery";

export const dynamic = "force-dynamic";

const CATEGORIES: { value: string; label: string; desc: string }[] = [
  { value: "GENERAL",            label: "General Discussion",   desc: "Anything SA gambling related" },
  { value: "OPERATOR_REVIEWS",   label: "Operator Reviews",     desc: "Share your experiences with specific operators" },
  { value: "TIPS_AND_STRATEGY",  label: "Tips & Strategy",      desc: "Betting tips, odds, and strategy" },
  { value: "DISPUTES_AND_ISSUES",label: "Disputes & Issues",    desc: "Seek community advice on complaints" },
  { value: "REGULATORY",         label: "Regulatory & Legal",   desc: "NGB, provincial boards, FICA, POPIA" },
];

const CAT_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export default async function ForumsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams;
  const session = await getServerSession(authOptions);
  const activeCategory = category ?? null;
  const query = q?.trim() ?? "";
  const keywords = query ? await expandQuery(query) : [];

  const [threads, categoryCounts] = await Promise.all([
    prisma.forumThread.findMany({
      where: {
        ...(activeCategory ? { category: activeCategory as any } : {}),
        ...(keywords.length > 0 ? {
          OR: keywords.flatMap((kw) => [
            { title: { contains: kw, mode: "insensitive" } },
            { content: { contains: kw, mode: "insensitive" } },
          ]),
        } : {}),
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      include: {
        user: { select: { name: true } },
        _count: { select: { posts: true } },
      },
    }),
    prisma.forumThread.groupBy({ by: ["category"], _count: { id: true } }),
  ]);

  const countMap = Object.fromEntries(categoryCounts.map((c) => [c.category, c._count.id]));
  const totalThreads = Object.values(countMap).reduce((a, b) => a + b, 0);

  function catHref(cat: string | null) {
    const p = new URLSearchParams();
    if (cat) p.set("category", cat);
    if (query) p.set("q", query);
    const qs = p.toString();
    return `/forums${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
            Community Forums
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#999999", marginTop: "0.2rem" }}>
            Discuss SA gambling, share experiences, get advice.
          </p>
        </div>
        {session?.user && (
          <Link
            href="/forums/new"
            style={{ background: "#c5623a", color: "#ffffff", fontWeight: 600, fontSize: "0.8125rem", padding: "8px 16px", borderRadius: "4px", textDecoration: "none" }}
          >
            New thread
          </Link>
        )}
      </div>

      <Suspense fallback={null}>
        <ForumSearch defaultValue={query} />
      </Suspense>

      {query && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "#777777" }}>
            {threads.length === 0
              ? `No threads found for "${query}"`
              : `${threads.length} thread${threads.length !== 1 ? "s" : ""} for "${query}"`}
            {" · "}
            <Link
              href={catHref(null).replace(`q=${encodeURIComponent(query)}`, "").replace("?&", "?").replace(/[?&]$/, "")}
              style={{ color: "#c5623a", textDecoration: "none", fontWeight: 600 }}
            >
              Clear
            </Link>
          </p>
          {keywords.length > 0 && (
            <p style={{ fontSize: "0.75rem", color: "#aaaaaa", marginTop: "0.25rem" }}>
              Searched:{" "}
              {keywords.map((kw, i) => (
                <span key={kw}>
                  <span style={{ background: "#f0f0f0", padding: "1px 5px", borderRadius: "2px", fontFamily: "monospace", fontSize: "0.6875rem" }}>{kw}</span>
                  {i < keywords.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <aside className="md:col-span-1">
          <nav style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
            <Link
              href={catHref(null)}
              style={{
                display: "block", padding: "0.75rem 1rem", fontSize: "0.8125rem",
                fontWeight: !activeCategory ? 700 : 500,
                color: !activeCategory ? "#c5623a" : "#555555",
                textDecoration: "none", borderBottom: "1px solid #f0f0f0",
                background: !activeCategory ? "#fff8f6" : "transparent",
              }}
            >
              All threads
              <span style={{ float: "right", fontSize: "0.6875rem", color: "#999999" }}>{totalThreads || ""}</span>
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={catHref(activeCategory === cat.value ? null : cat.value)}
                style={{
                  display: "block", padding: "0.75rem 1rem", fontSize: "0.8125rem",
                  fontWeight: activeCategory === cat.value ? 700 : 400,
                  color: activeCategory === cat.value ? "#c5623a" : "#555555",
                  textDecoration: "none", borderBottom: "1px solid #f0f0f0",
                  background: activeCategory === cat.value ? "#fff8f6" : "transparent",
                }}
              >
                {cat.label}
                <span style={{ float: "right", fontSize: "0.6875rem", color: "#999999" }}>{countMap[cat.value] ?? 0}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="md:col-span-4">
          {threads.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "4rem", textAlign: "center" }}>
              <p style={{ fontWeight: 600, color: "#555555", marginBottom: "0.5rem" }}>
                {query ? `No results for "${query}"` : "No threads yet."}
              </p>
              {!query && (session?.user ? (
                <Link href="/forums/new" style={{ fontSize: "0.875rem", color: "#c5623a", textDecoration: "none", fontWeight: 600 }}>Start the first one.</Link>
              ) : (
                <Link href="/auth/login" style={{ fontSize: "0.875rem", color: "#c5623a", textDecoration: "none", fontWeight: 600 }}>Sign in to post.</Link>
              ))}
            </div>
          ) : (
            <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
              {threads.map((t, i) => (
                <Link key={t.id} href={`/forums/${t.id}`} style={{ textDecoration: "none" }}>
                  <div
                    className="hover-border"
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom: i < threads.length - 1 ? "1px solid #f0f0f0" : "none",
                      display: "flex", alignItems: "flex-start", gap: "1rem",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {t.pinned && (
                          <span style={{ fontSize: "0.625rem", fontWeight: 700, background: "#c5623a", color: "#ffffff", padding: "1px 5px", borderRadius: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Pinned
                          </span>
                        )}
                        <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "#c4821a", background: "#fef9ee", padding: "1px 6px", borderRadius: "2px" }}>
                          {CAT_LABEL[t.category] ?? t.category}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111111", lineHeight: 1.3, marginBottom: "0.25rem" }}>
                        {query ? <HighlightMatch text={t.title} query={query} /> : t.title}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#999999" }}>
                        by <strong style={{ color: "#555555" }}>{t.user.name}</strong>
                        {" · "}{new Date(t.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "1rem", fontWeight: 700, color: "#111111", lineHeight: 1 }}>{t._count.posts}</p>
                      <p style={{ fontSize: "0.625rem", color: "#999999", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>replies</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#fef9c3", color: "inherit", borderRadius: "2px", padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
