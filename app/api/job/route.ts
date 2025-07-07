import { NextRequest, NextResponse } from "next/server";
import { db, jobs } from "@/lib/db";
import { embed } from "@/lib/embeddings";
import { upsertVectors } from "@/lib/pinecone";

export async function POST(req: NextRequest) {
  const { title, jdText } = await req.json();
  if (!title || !jdText) {
    return NextResponse.json({ error: "title and jdText required" }, { status: 400 });
  }

  // 1. embed JD
  const vector = await embed(jdText);

  // 2. insert into Postgres
  const [job] = await db
    .insert(jobs)
    .values({
      title,
      jdText: jdText,
      jdEmbedding: vector,
    })
    .returning({ id: jobs.id });

  // 3. upsert to Pinecone
  await upsertVectors([{ id: `job-${job.id}`, values: vector, metadata: { jobId: job.id } }], "jobs");

  return NextResponse.json({ id: job.id });
}
