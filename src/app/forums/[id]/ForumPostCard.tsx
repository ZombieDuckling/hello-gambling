"use client";
import { useState } from "react";

interface Props {
  post: {
    id: string;
    content: string;
    createdAt: Date | string;
    user: { name: string; role: string };
  };
  index: number;
  totalPosts: number;
  initialScore: number;
  initialUserVote: number;
  isLoggedIn: boolean;
}

const fmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

export default function ForumPostCard({ post, index, totalPosts, initialScore, initialUserVote, isLoggedIn }: Props) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (!isLoggedIn || loading) return;
    setLoading(true);

    const prevScore = score;
    const prevVote = userVote;

    if (userVote === value) {
      setScore(score - value);
      setUserVote(0);
    } else {
      setScore(score - userVote + value);
      setUserVote(value);
    }

    const res = await fetch(`/api/forums/posts/${post.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });

    if (!res.ok) {
      setScore(prevScore);
      setUserVote(prevVote);
    }
    setLoading(false);
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: "none",
    border: "none",
    cursor: isLoggedIn ? "pointer" : "default",
    color: active ? "#c5623a" : "#cccccc",
    padding: "2px 4px",
    fontSize: "0.875rem",
    lineHeight: 1,
    transition: "color 0.1s",
  });

  return (
    <div style={{ display: "flex", gap: "0.75rem" }}>
      {/* Vote column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", paddingTop: "1rem", flexShrink: 0 }}>
        <button
          onClick={() => handleVote(1)}
          disabled={!isLoggedIn}
          title={isLoggedIn ? "Upvote" : "Sign in to vote"}
          style={btnStyle(userVote === 1)}
        >
          ▲
        </button>
        <span style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: userVote !== 0 ? "#c5623a" : "#777777",
          minWidth: "20px",
          textAlign: "center",
          lineHeight: 1.4,
        }}>
          {score}
        </span>
        <button
          onClick={() => handleVote(-1)}
          disabled={!isLoggedIn}
          title={isLoggedIn ? "Downvote" : "Sign in to vote"}
          style={btnStyle(userVote === -1)}
        >
          ▼
        </button>
      </div>

      {/* Index + content */}
      <div style={{ display: "flex", gap: "1rem", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "4px", background: "#f0f0f0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#777777", fontSize: "0.75rem", fontWeight: 700,
          }}>
            {index + 1}
          </div>
          {index < totalPosts - 1 && (
            <div style={{ width: 1, flex: 1, background: "#e0e0e0", margin: "4px 0" }} />
          )}
        </div>
        <div style={{ flex: 1, background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1rem", marginBottom: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#111111" }}>{post.user.name}</span>
            {post.user.role === "ADMIN" && (
              <span style={{ fontSize: "0.625rem", fontWeight: 700, background: "#111111", color: "#ffffff", padding: "1px 5px", borderRadius: "2px" }}>MOD</span>
            )}
            <span style={{ fontSize: "0.75rem", color: "#bbbbbb", marginLeft: "auto" }}>{fmt(post.createdAt)}</span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "#333333", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{post.content}</p>
        </div>
      </div>
    </div>
  );
}
