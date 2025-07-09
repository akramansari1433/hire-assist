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

  console.log(`📋 Creating new job: "${title}"`);

  if (!title || !jdText) {
    console.error("❌ Missing required fields:", { title: !!title, jdText: !!jdText });
    return NextResponse.json({ error: "title and jdText required" }, { status: 400 });
  }

  try {
    // embed JD
    console.log("🔮 Creating embedding for job description...");
    const vector = await embed(jdText);
    console.log("✅ Job embedding created, length:", vector.length);

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
    console.log("🔍 Storing job embedding in Pinecone...");
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
    console.log("✅ Job embedding stored in Pinecone");

    console.log("🎉 Job creation successful:", title);
    return NextResponse.json({ id: job.id });
  } catch (error) {
    console.error("💥 Job creation failed:", error);
    return NextResponse.json(
      {
        error: "Job creation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
