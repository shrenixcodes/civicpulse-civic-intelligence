import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const clusters = await db.issueCluster.findMany({
    orderBy: { priorityScore: "desc" },
  });

  return NextResponse.json({ issues: clusters });
}
