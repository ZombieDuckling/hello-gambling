import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Response content is required." }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const operatorId = (session.user as any).operatorId;

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return NextResponse.json({ error: "Complaint not found." }, { status: 404 });

  const isOwner = complaint.userId === userId;
  const isOperator = role === "OPERATOR" && operatorId === complaint.operatorId;
  const isAdmin = role === "ADMIN";

  if (!isOwner && !isOperator && !isAdmin) {
    return NextResponse.json({ error: "You are not authorised to respond to this complaint." }, { status: 403 });
  }

  const isOfficial = isOperator || isAdmin;

  const response = await prisma.response.create({
    data: {
      content: content.trim(),
      userId,
      complaintId: id,
      isOfficial,
    },
  });

  if (isOfficial && complaint.status === "OPEN") {
    await prisma.complaint.update({
      where: { id: id },
      data: { status: "IN_PROGRESS" },
    });
  }

  return NextResponse.json(response, { status: 201 });
}
