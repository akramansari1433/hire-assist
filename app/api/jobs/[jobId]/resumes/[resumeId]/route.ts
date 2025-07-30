import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes, comparisons } from "@/lib/db";
import { deleteResumeEmbeddings } from "@/lib/pinecone";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ jobId: string; resumeId: string }> }) {
  const { jobId, resumeId } = await params;
  const jobIdNum = Number(jobId);
  const resumeIdNum = Number(resumeId);

  try {
    // check if resume exists and belongs to the specified job
    const [resume] = await db
      .select({ id: resumes.id, candidateName: resumes.candidateName, jobId: resumes.jobId })
      .from(resumes)
      .where(and(eq(resumes.id, resumeIdNum), eq(resumes.jobId, jobIdNum)));

    if (!resume) {
      console.error(`❌ Resume ${resumeId} not found in job ${jobId}`);
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // delete all comparisons related to this resume
    const deletedComparisons = await db
      .delete(comparisons)
      .where(eq(comparisons.resumeId, resumeIdNum))
      .returning({ id: comparisons.id });

    // delete resume embeddings from Pinecone
    await deleteResumeEmbeddings(resumeIdNum);

    // delete resume from PostgreSQL
    await db.delete(resumes).where(eq(resumes.id, resumeIdNum));

    return NextResponse.json({
      success: true,
      deletedResume: resume,
      deletedComparisons: deletedComparisons.length,
    });
  } catch (error) {
    console.error(`Resume deletion failed for resume ${resumeId}:`, error);
    return NextResponse.json(
      {
        error: "Resume deletion failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
