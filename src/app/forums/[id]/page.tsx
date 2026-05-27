import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import ForumReplySection from "./ForumReplySection";
import ForumPostCard from "./ForumPostCard";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = {
  GENERAL:             "General Discussion",
  OPERATOR_REVIEWS:    "Operator Reviews",
  TIPS_AND_STRATEGY:   "Tips & Strategy",
  DISPUTES_AND_ISSUES: "Disputes & Issues",
  REGULATORY:          "Regulatory & Legal",
};

export default async function ForumThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [thread, session] = await Promise.all([
    prisma.forumThread.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, role: true } },
        posts: {
          include: {
            user: { select: { name: true, role: true } },
            votes: true,
          },
        },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!thread) notFound();

  const userId = (session?.user as any)?.id ?? null;

  const sortedPosts = thread.posts
    .map((post) => ({
      ...post,
      score: post.votes.reduce((sum, v) => sum + v.value, 0),
      userVote: userId ? (post.votes.find((v) => v.userId === userId)?.value ?? 0) : 0,
    }))
    .sort((a, b) => b.score - a.score);

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <nav style={{ fontSize: "0.8125rem", color: "#999999", marginBottom: "1.5rem" }}>
        <Link href="/forums" style={{ color: "#999999", textDecoration: "none" }}>Forums</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span style={{ color: "#555555" }}>{CAT_LABEL[thread.category] ?? thread.category}</span>
      </nav>

      <article
        className="fade-in"
        style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1.75rem", marginBottom: "1rem" }}
      >
        <div style={{ marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "#c4821a", background: "#fef9ee", padding: "2px 6px", borderRadius: "2px" }}>
            {CAT_LABEL[thread.category] ?? thread.category}
          </span>
          {thread.pinned && (
            <span style={{ marginLeft: "0.5rem", fontSize: "0.625rem", fontWeight: 700, background: "#c5623a", color: "#ffffff", padding: "2px 6px", borderRadius: "2px", textTransform: "uppercase" }}>
              Pinned
            </span>
          )}
        </div>

        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em", marginBottom: "0.75rem", lineHeight: 1.3 }}>
          {thread.title}
        </h1>

        <div style={{ fontSize: "0.75rem", color: "#999999", marginBottom: "1.25rem" }}>
          Posted by <strong style={{ color: "#555555" }}>{thread.user.name}</strong>
          {thread.user.role === "ADMIN" && (
            <span style={{ marginLeft: "0.375rem", fontSize: "0.625rem", fontWeight: 700, background: "#111111", color: "#ffffff", padding: "1px 5px", borderRadius: "2px" }}>MOD</span>
          )}
          {" · "}{fmt(thread.createdAt)}
        </div>

        <p style={{ fontSize: "0.9375rem", color: "#333333", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          {thread.content}
        </p>
      </article>

      <section>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>
          {thread.posts.length} {thread.posts.length === 1 ? "reply" : "replies"}
        </h2>

        <div className="space-y-3 mb-4">
          {sortedPosts.map((post, idx) => (
            <ForumPostCard
              key={post.id}
              post={post}
              index={idx}
              totalPosts={sortedPosts.length}
              initialScore={post.score}
              initialUserVote={post.userVote}
              isLoggedIn={!!session?.user}
            />
          ))}
        </div>

        <ForumReplySection threadId={thread.id} isLoggedIn={!!session?.user} />
      </section>
    </div>
  );
}
