import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      operator: { select: { name: true, slug: true } },
      responses: { select: { id: true } },
    },
  });

  if (!complaint) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(complaint);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { status } = await req.json();
  const userId = (session.user as any).id;

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (complaint.userId !== userId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
