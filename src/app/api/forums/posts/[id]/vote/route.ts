import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { value } = await req.json();
  if (value !== 1 && value !== -1) {
    return NextResponse.json({ error: "Invalid vote value." }, { status: 400 });
  }

  const userId = (session.user as any).id;

  const existing = await prisma.forumVote.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    if (existing.value === value) {
      await prisma.forumVote.delete({ where: { userId_postId: { userId, postId } } });
      return NextResponse.json({ voted: false, value: 0 });
    }
    await prisma.forumVote.update({
      where: { userId_postId: { userId, postId } },
      data: { value },
    });
    return NextResponse.json({ voted: true, value });
  }

  await prisma.forumVote.create({ data: { value, userId, postId } });
  return NextResponse.json({ voted: true, value });
}
