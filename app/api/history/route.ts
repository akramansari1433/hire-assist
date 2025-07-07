// /app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparisons, jobs, resumes } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "x-user-id required" }, { status: 400 });
  }

  const rows = await db
    .select({
      when: comparisons.createdAt,
      job: jobs.title,
      candidate: resumes.candidateName,
      fitScore: comparisons.similarity,
      matching: comparisons.matchingSkills,
      missing: comparisons.missingSkills,
      verdict: comparisons.summary,
    })
    .from(comparisons)
    .leftJoin(jobs, eq(jobs.id, comparisons.jobId))
    .leftJoin(resumes, eq(resumes.id, comparisons.resumeId))
    .where(eq(comparisons.userId, userId))
    .orderBy(desc(comparisons.createdAt));

  return NextResponse.json(rows);
}
