// /app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db";
import { embed } from "@/lib/embeddings";
import { upsertVectors } from "@/lib/pinecone";
import { desc } from "drizzle-orm";

export async function GET() {
  const all = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const { title, jdText } = await req.json();

  if (!title || !jdText) {
    return NextResponse.json({ error: "title and jdText required" }, { status: 400 });
  }

  try {
    // embed JD
    const vector = await embed(jdText);

    // insert into Postgres
    console.log("💾 Storing job in database...");
    const [job] = await db
      .insert(jobs)
      .values({
        title,
        jdText,
      })
      .returning({ id: jobs.id });
    console.log("✅ Job stored with ID:", job.id);

    // upsert into Pinecone
    await upsertVectors(
      [
        {
          id: `job-${job.id}`,
          values: vector,
          metadata: { jobId: job.id },
        },
      ],
      "jobs"
    );

    return NextResponse.json({ id: job.id });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Job creation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
