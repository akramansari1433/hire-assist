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

  console.log(`📄 Starting resume upload for job ${jobId}, candidate: ${candidateName}`);

  if (!candidateName || !fullText) {
    return NextResponse.json({ error: "candidateName and fullText required" }, { status: 400 });
  }

  try {
    // 1️⃣ write resume row
    console.log("💾 Creating resume record in database...");
    const [resume] = await db
      .insert(resumes)
      .values({ jobId: Number(jobId), candidateName, fullText })
      .returning({ id: resumes.id });

    console.log("✅ Resume created with ID:", resume.id);

    // 2️⃣ chunk + embed
    console.log("🧩 Starting chunking process...");
    const pieces = await chunk(fullText);
    console.log("✅ Chunking complete, created", pieces.length, "chunks");

    if (pieces.length === 0) {
      throw new Error("Chunking failed - no pieces created");
    }

    console.log("🔮 Starting embedding process...");
    const vectors = await Promise.all(
      pieces.map(async (piece, i) => {
        console.log(`  Embedding chunk ${i + 1}/${pieces.length}...`);
        return await embed(piece);
      })
    );
    console.log("✅ Embedding complete, created", vectors.length, "vectors");

    // 3️⃣ store chunks
    console.log("💾 Storing chunks in database...");
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
    console.log("✅ Database chunks stored successfully");

    // 4️⃣ upsert to Pinecone
    console.log("🔍 Preparing vectors for Pinecone...");
    const pineconeVectors = vectors.map((v, i) => ({
      id: `res-${resume.id}-${i}`,
      values: v,
      metadata: { resumeId: resume.id, jobId: Number(jobId) },
    }));

    console.log("📊 Pinecone vectors prepared:", {
      count: pineconeVectors.length,
      sampleMetadata: pineconeVectors[0]?.metadata,
      vectorLength: pineconeVectors[0]?.values?.length,
    });

    await upsertVectors(pineconeVectors, "resumes");
    console.log("✅ Pinecone upsert complete");

    console.log("🎉 Resume upload successful for:", candidateName);
    return NextResponse.json({ id: resume.id });
  } catch (error) {
    console.error("💥 Resume upload failed:", error);
    return NextResponse.json(
      {
        error: "Resume upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
