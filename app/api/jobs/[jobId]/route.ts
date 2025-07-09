import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, resumes, comparisons } from "@/lib/db";
import { deleteJobEmbedding, deleteAllJobResumeEmbeddings } from "@/lib/pinecone";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const jobIdNum = Number(jobId);

  console.log(`🗑️ Starting job deletion for job ${jobId}`);

  try {
    // 1. Check if job exists
    const [job] = await db.select({ id: jobs.id, title: jobs.title }).from(jobs).where(eq(jobs.id, jobIdNum));

    if (!job) {
      console.error(`❌ Job ${jobId} not found`);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    console.log(`📋 Found job: "${job.title}"`);

    // 2. Get all resumes linked to this job (for logging)
    const linkedResumes = await db
      .select({ id: resumes.id, candidateName: resumes.candidateName })
      .from(resumes)
      .where(eq(resumes.jobId, jobIdNum));

    console.log(`📄 Found ${linkedResumes.length} linked resumes`);

    // 3. Delete all comparisons linked to this job
    const deletedComparisons = await db
      .delete(comparisons)
      .where(eq(comparisons.jobId, jobIdNum))
      .returning({ id: comparisons.id });

    console.log(`🔗 Deleted ${deletedComparisons.length} comparisons`);

    // 4. Delete all resume embeddings linked to this job from Pinecone
    await deleteAllJobResumeEmbeddings(jobIdNum);

    // 5. Delete all resumes linked to this job from PostgreSQL
    const deletedResumes = await db.delete(resumes).where(eq(resumes.jobId, jobIdNum)).returning({ id: resumes.id });

    console.log(`📄 Deleted ${deletedResumes.length} resumes from database`);

    // 6. Delete job embedding from Pinecone
    await deleteJobEmbedding(jobIdNum);

    // 7. Delete job from PostgreSQL
    await db.delete(jobs).where(eq(jobs.id, jobIdNum));

    console.log(`🎉 Job ${jobId} ("${job.title}") deleted successfully`);

    return NextResponse.json({
      success: true,
      deletedJob: job,
      deletedResumes: deletedResumes.length,
      deletedComparisons: deletedComparisons.length,
    });
  } catch (error) {
    console.error(`💥 Job deletion failed for job ${jobId}:`, error);
    return NextResponse.json(
      {
        error: "Job deletion failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
