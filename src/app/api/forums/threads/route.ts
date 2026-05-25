import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;

  const threads = await prisma.forumThread.findMany({
    where: category ? { category: category as any } : undefined,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: {
      user: { select: { name: true } },
      _count: { select: { posts: true } },
    },
  });

  return NextResponse.json(threads);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { title, content, category } = await req.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
  }

  const thread = await prisma.forumThread.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      category: category ?? "GENERAL",
      userId: (session.user as any).id,
    },
  });

  return NextResponse.json(thread, { status: 201 });
}
