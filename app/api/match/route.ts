import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, comparisons } from "@/lib/db";
import { index } from "@/lib/pinecone";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { jobId, topK = 10, userId } = await req.json();
  if (!jobId || !userId) {
    return NextResponse.json({ error: "jobId and userId required" }, { status: 400 });
  }

  // 1. fetch JD embedding
  const [job] = await db.select({ emb: jobs.jdEmbedding }).from(jobs).where(eq(jobs.id, jobId));

  if (!job?.emb) {
    return NextResponse.json({ error: "Job not found or no embedding" }, { status: 404 });
  }

  // 2. Pinecone query
  const resp = await index.namespace("resumes").query({ vector: job.emb, topK, filter: { jobId } });

  // 3. aggregate best per resume
  const best: Record<number, number> = {};
  resp.matches?.forEach((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rid = (m.metadata as any).resumeId as number;
    best[rid] = Math.max(best[rid] ?? 0, m.score!);
  });

  // 4. persist comparisons
  await db.transaction(async (tx) => {
    for (const [resumeId, similarity] of Object.entries(best)) {
      await tx.insert(comparisons).values({
        userId: userId,
        jobId: jobId,
        resumeId: Number(resumeId),
        similarity,
      });
    }
  });

  // 5. respond sorted
  const results = Object.entries(best)
    .sort((a, b) => b[1] - a[1])
    .map(([rid, sim]) => ({ resumeId: Number(rid), similarity: sim.toFixed(3) }));

  return NextResponse.json(results);
}
