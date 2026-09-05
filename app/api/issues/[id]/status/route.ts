import { NextResponse } from "next/server";
import { IssueStatus } from "@prisma/client";
import { db } from "@/lib/db";

const VALID_STATUSES = Object.values(IssueStatus);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const newStatus = body.status as IssueStatus;

  if (!VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const cluster = await db.issueCluster.findUnique({ where: { id } });
  if (!cluster) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  }

  const [updated] = await db.$transaction([
    db.issueCluster.update({ where: { id }, data: { status: newStatus } }),
    db.statusHistory.create({
      data: { clusterId: id, oldStatus: cluster.status, newStatus },
    }),
    db.report.updateMany({ where: { clusterId: id }, data: { status: newStatus } }),
  ]);

  return NextResponse.json({ issue: updated });
}
