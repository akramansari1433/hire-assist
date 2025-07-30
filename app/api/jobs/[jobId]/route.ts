import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, resumes, comparisons } from "@/lib/db";
import { deleteJobEmbedding, deleteAllJobResumeEmbeddings } from "@/lib/pinecone";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const jobIdNum = Number(jobId);

  try {
    // check if job exists
    const [job] = await db.select({ id: jobs.id, title: jobs.title }).from(jobs).where(eq(jobs.id, jobIdNum));

    if (!job) {
      console.error(`❌ Job ${jobId} not found`);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // delete all comparisons linked to this job
    const deletedComparisons = await db
      .delete(comparisons)
      .where(eq(comparisons.jobId, jobIdNum))
      .returning({ id: comparisons.id });

    // delete all resume embeddings linked to this job from Pinecone
    await deleteAllJobResumeEmbeddings(jobIdNum);

    // delete all resumes linked to this job from PostgreSQL
    const deletedResumes = await db.delete(resumes).where(eq(resumes.jobId, jobIdNum)).returning({ id: resumes.id });

    // delete job embedding from Pinecone
    await deleteJobEmbedding(jobIdNum);

    // delete job from PostgreSQL
    await db.delete(jobs).where(eq(jobs.id, jobIdNum));

    return NextResponse.json({
      success: true,
      deletedJob: job,
      deletedResumes: deletedResumes.length,
      deletedComparisons: deletedComparisons.length,
    });
  } catch (error) {
    console.error(`Job deletion failed for job ${jobId}:`, error);
    return NextResponse.json(
      {
        error: "Job deletion failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const jobIdNum = Number(jobId);

  try {
    const { title, jdText } = await req.json();

    if (!title?.trim() || !jdText?.trim()) {
      return NextResponse.json({ error: "Title and job description are required" }, { status: 400 });
    }

    // Update the job in the database
    const [updatedJob] = await db
      .update(jobs)
      .set({
        title: title.trim(),
        jdText: jdText.trim(),
      })
      .where(eq(jobs.id, jobIdNum))
      .returning();

    if (!updatedJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
