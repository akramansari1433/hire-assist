import { NextRequest, NextResponse } from "next/server";
import { db, resumes, resumeChunks } from "@/lib/db";
import { embed } from "@/lib/embeddings";
import { chunk } from "@/lib/chunk";
import { upsertVectors } from "@/lib/pinecone";

export async function POST(req: NextRequest) {
  const { jobId, candidateName, fullText } = await req.json();
  if (!jobId || !candidateName || !fullText) {
    return NextResponse.json({ error: "jobId, candidateName, fullText required" }, { status: 400 });
  }

  // 1. create resume record
  const [resume] = await db
    .insert(resumes)
    .values({
      jobId: jobId,
      candidateName: candidateName,
      fullText: fullText,
    })
    .returning({ id: resumes.id });

  // 2. chunk & embed
  const pieces = chunk(fullText);
  const vectors = await Promise.all(pieces.map(embed));

  // 3. store chunks in Postgres
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

  // 4. upsert to Pinecone
  await upsertVectors(
    pieces.map((_, i) => ({
      id: `res-${resume.id}-${i}`,
      values: vectors[i],
      metadata: { resumeId: resume.id, jobId },
    })),
    "resumes"
  );

  return NextResponse.json({ id: resume.id });
}
