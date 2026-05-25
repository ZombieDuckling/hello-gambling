import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  const thread = await prisma.forumThread.findUnique({ where: { id: params.id } });
  if (!thread) return NextResponse.json({ error: "Thread not found." }, { status: 404 });

  const [post] = await prisma.$transaction([
    prisma.forumPost.create({
      data: {
        content: content.trim(),
        userId: (session.user as any).id,
        threadId: params.id,
      },
    }),
    prisma.forumThread.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json(post, { status: 201 });
}
