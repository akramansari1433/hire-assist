import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparisons } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  try {
    const existingComparisons = await db
      .select({
        resumeId: comparisons.resumeId,
        similarity: comparisons.similarity,
        fitScore: comparisons.fitScore,
        matchingSkills: comparisons.matchingSkills,
        missingSkills: comparisons.missingSkills,
        summary: comparisons.summary,
        createdAt: comparisons.createdAt,
      })
      .from(comparisons)
      .where(eq(comparisons.jobId, Number(jobId)));

    return NextResponse.json(existingComparisons);
  } catch (error) {
    console.error("Error fetching comparisons:", error);
    return NextResponse.json({ error: "Failed to fetch comparisons" }, { status: 500 });
  }
}
