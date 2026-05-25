import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      complaint: { include: { operator: { select: { name: true } } } },
      user: { select: { name: true } },
      updates: { select: { id: true } },
    },
  });
  return NextResponse.json(disputes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { complaintId, summary } = await req.json();
  if (!complaintId || !summary?.trim()) {
    return NextResponse.json({ error: "Complaint ID and summary are required." }, { status: 400 });
  }

  const userId = (session.user as any).id;

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { dispute: true },
  });

  if (!complaint) return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
  if (complaint.userId !== userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (complaint.dispute) return NextResponse.json({ error: "This complaint already has a dispute." }, { status: 409 });

  const year = new Date().getFullYear();
  const count = await prisma.dispute.count();
  const refNum = `HG-${year}-${String(count + 1).padStart(4, "0")}`;

  const [dispute] = await prisma.$transaction([
    prisma.dispute.create({
      data: {
        referenceNumber: refNum,
        summary: summary.trim(),
        complaintId,
        userId,
      },
    }),
    prisma.complaint.update({
      where: { id: complaintId },
      data: { status: "ESCALATED" },
    }),
  ]);

  await prisma.disputeUpdate.create({
    data: {
      content: `Dispute ${refNum} opened. Our mediation team has been notified and will review your case. The operator has been informed and given 5 business days to respond.`,
      stage: "SUBMITTED",
      userId,
      disputeId: dispute.id,
    },
  });

  return NextResponse.json(dispute, { status: 201 });
}
