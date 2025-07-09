import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes, comparisons } from "@/lib/db";
import { deleteBulkResumeEmbeddings, deleteAllJobResumeEmbeddings } from "@/lib/pinecone";
import { eq, inArray, and } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const jobIdNum = Number(jobId);
  const { resumeIds, deleteAll } = await req.json();

  console.log(`🗑️ Starting bulk resume deletion for job ${jobId}`);
  console.log(`📋 Delete all: ${deleteAll}, Resume IDs: ${resumeIds?.join(", ") || "none"}`);

  try {
    let targetResumeIds: number[] = [];

    if (deleteAll) {
      // Get all resume IDs for this job
      const allResumes = await db.select({ id: resumes.id }).from(resumes).where(eq(resumes.jobId, jobIdNum));

      targetResumeIds = allResumes.map((r) => r.id);
      console.log(`📄 Found ${targetResumeIds.length} resumes to delete (all)`);
    } else if (resumeIds && Array.isArray(resumeIds) && resumeIds.length > 0) {
      // Validate that all provided resume IDs belong to this job
      const validResumes = await db
        .select({ id: resumes.id })
        .from(resumes)
        .where(and(eq(resumes.jobId, jobIdNum), inArray(resumes.id, resumeIds.map(Number))));

      targetResumeIds = validResumes.map((r) => r.id);
      console.log(`📄 Found ${targetResumeIds.length} valid resumes to delete (selected)`);

      if (targetResumeIds.length !== resumeIds.length) {
        console.warn(`⚠️ Some resume IDs were invalid or don't belong to job ${jobId}`);
      }
    } else {
      return NextResponse.json(
        { error: "Must specify either deleteAll=true or provide resumeIds array" },
        { status: 400 }
      );
    }

    if (targetResumeIds.length === 0) {
      return NextResponse.json({ message: "No resumes to delete", deletedCount: 0 });
    }

    // Get resume details for logging
    const resumeDetails = await db
      .select({ id: resumes.id, candidateName: resumes.candidateName })
      .from(resumes)
      .where(inArray(resumes.id, targetResumeIds));

    console.log(
      `📄 Resumes to delete:`,
      resumeDetails.map((r) => `${r.id}: ${r.candidateName}`)
    );

    // 1. Delete all comparisons related to these resumes
    const deletedComparisons = await db
      .delete(comparisons)
      .where(inArray(comparisons.resumeId, targetResumeIds))
      .returning({ id: comparisons.id });

    console.log(`🔗 Deleted ${deletedComparisons.length} comparisons`);

    // 2. Delete resume embeddings from Pinecone
    if (deleteAll) {
      // If deleting all, use the optimized function that filters by jobId
      await deleteAllJobResumeEmbeddings(jobIdNum);
    } else {
      // If deleting specific resumes, delete each one individually
      await deleteBulkResumeEmbeddings(targetResumeIds);
    }

    // 3. Delete resumes from PostgreSQL
    const deletedResumes = await db
      .delete(resumes)
      .where(inArray(resumes.id, targetResumeIds))
      .returning({ id: resumes.id, candidateName: resumes.candidateName });

    console.log(`📄 Deleted ${deletedResumes.length} resumes from database`);

    console.log(`🎉 Bulk resume deletion completed for job ${jobId}`);

    return NextResponse.json({
      success: true,
      deletedResumes: deletedResumes,
      deletedComparisons: deletedComparisons.length,
      totalDeleted: deletedResumes.length,
    });
  } catch (error) {
    console.error(`💥 Bulk resume deletion failed for job ${jobId}:`, error);
    return NextResponse.json(
      {
        error: "Bulk resume deletion failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
