import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: {
      complaint: { include: { operator: true } },
      user: { select: { name: true } },
      updates: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!dispute) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(dispute);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { content, stage } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const operatorId = (session.user as any).operatorId;

  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: { complaint: true },
  });

  if (!dispute) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isOwner = dispute.userId === userId;
  const isOperator = role === "OPERATOR" && operatorId === dispute.complaint.operatorId;
  const isAdmin = role === "ADMIN";

  if (!isOwner && !isOperator && !isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const newStage = (isAdmin && stage) ? stage : dispute.stage;

  const [update] = await prisma.$transaction([
    prisma.disputeUpdate.create({
      data: {
        content: content.trim(),
        stage: newStage,
        userId,
        disputeId: params.id,
      },
    }),
    prisma.dispute.update({
      where: { id: params.id },
      data: { stage: newStage, updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json(update, { status: 201 });
}
