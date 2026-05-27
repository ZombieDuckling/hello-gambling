import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const adminId = (session.user as any).id;
  const dispute = await prisma.dispute.findUnique({ where: { id }, select: { assignedAdminId: true } });
  if (!dispute) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (dispute.assignedAdminId) return NextResponse.json({ error: "Already claimed." }, { status: 409 });

  const updated = await prisma.dispute.update({
    where: { id },
    data: { assignedAdminId: adminId },
  });

  return NextResponse.json(updated);
}
