// /app/api/jobs/[jobId]/resumes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes, resumeChunks } from "@/lib/db";
import { chunk } from "@/lib/chunk";
import { embed } from "@/lib/embeddings";
import { upsertVectors } from "@/lib/pinecone";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const list = await db
    .select({
      id: resumes.id,
      candidate: resumes.candidateName,
      when: resumes.createdAt,
    })
    .from(resumes)
    .where(eq(resumes.jobId, Number(jobId)))
    .orderBy(desc(resumes.createdAt));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { candidateName, fullText } = await req.json();
  if (!candidateName || !fullText) {
    return NextResponse.json({ error: "candidateName and fullText required" }, { status: 400 });
  }

  // 1️⃣ write resume row
  const [resume] = await db
    .insert(resumes)
    .values({ jobId: Number(jobId), candidateName, fullText })
    .returning({ id: resumes.id });

  // 2️⃣ chunk + embed
  const pieces = await chunk(fullText);
  const vectors = await Promise.all(pieces.map(embed));

  // 3️⃣ store chunks
  await db.transaction(async (tx) => {
    for (let i = 0; i < pieces.length; i++) {
      await tx.insert(resumeChunks).values({
        resumeId: resume.id,
        chunkIndex: i,
        chunkText: pieces[i],
        embedding: vectors[i],
      });
    }
  });

  // 4️⃣ upsert to Pinecone
  await upsertVectors(
    vectors.map((v, i) => ({
      id: `res-${resume.id}-${i}`,
      values: v,
      metadata: { resumeId: resume.id, jobId: Number(jobId) },
    })),
    "resumes"
  );

  return NextResponse.json({ id: resume.id });
}
