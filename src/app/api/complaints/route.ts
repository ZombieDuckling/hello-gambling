import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const operatorId = searchParams.get("operatorId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (operatorId) where.operatorId = operatorId;

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      operator: { select: { name: true, slug: true } },
      responses: { select: { id: true } },
    },
  });

  return NextResponse.json(complaints);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  try {
    const { title, description, category, rating, operatorId } = await req.json();

    if (!title || !description || !category || !operatorId) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const operator = await prisma.operator.findUnique({ where: { id: operatorId } });
    if (!operator) {
      return NextResponse.json({ error: "Operator not found." }, { status: 404 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        category,
        rating: Math.min(5, Math.max(1, parseInt(rating) || 1)),
        operatorId,
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
