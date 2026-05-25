import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const operators = await prisma.operator.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, province: true },
  });
  return NextResponse.json(operators);
}
