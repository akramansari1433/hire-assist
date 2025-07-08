// /app/api/jobs/[jobId]/match/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, comparisons, resumes } from "@/lib/db";
import { index } from "@/lib/pinecone";
import OpenAI from "openai";
import { eq } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { userId, topK = 10 } = await req.json();

  console.log(`🎯 Match API called for job ${jobId}, userId: ${userId}, topK: ${topK}`);

  if (!userId) {
    console.error("❌ Missing userId");
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    // fetch JD embedding
    console.log("📋 Fetching job details and embedding...");
    const [job] = await db
      .select({ emb: jobs.jdEmbedding, text: jobs.jdText })
      .from(jobs)
      .where(eq(jobs.id, Number(jobId)));

    if (!job?.emb) {
      console.error("❌ Job not found or no embedding");
      return NextResponse.json({ error: "Job not found or no embedding" }, { status: 404 });
    }

    console.log("✅ Job found, embedding length:", job.emb.length);

    // Check if we have resumes for this job
    const resumeCount = await db
      .select({ count: resumes.id })
      .from(resumes)
      .where(eq(resumes.jobId, Number(jobId)));

    console.log("📄 Resumes found for this job:", resumeCount.length);

    if (resumeCount.length === 0) {
      console.log("⚠️ No resumes found for this job");
      return NextResponse.json({ error: "No resumes found for this job" }, { status: 404 });
    }

    // vector query
    console.log("🔍 Querying Pinecone for similar resumes...");
    const resp = await index.namespace("resumes").query({
      vector: job.emb,
      topK,
      filter: { jobId: Number(jobId) },
      includeMetadata: true,
    });

    console.log("📊 Pinecone response:", {
      matchCount: resp.matches?.length || 0,
      matches: resp.matches?.map((m) => ({ id: m.id, score: m.score })),
    });

    // aggregate best per resume
    const best: Record<number, number> = {};
    resp.matches?.forEach((m) => {
      console.log("🔍 Processing match:", { id: m.id, score: m.score, metadata: m.metadata });

      if (!m.metadata) {
        console.warn("⚠️ Match has no metadata:", m.id);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = m.metadata as any;

      if (!metadata.resumeId) {
        console.warn("⚠️ Match metadata missing resumeId:", metadata);
        return;
      }

      const rid = metadata.resumeId as number;
      best[rid] = Math.max(best[rid] ?? 0, m.score!);
    });

    console.log("🏆 Best matches per resume:", best);

    if (Object.keys(best).length === 0) {
      console.log("⚠️ No matches found in Pinecone");
      return NextResponse.json({ error: "No matches found" }, { status: 404 });
    }

    // enrich with LLM
    console.log("🤖 Starting LLM analysis...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = [];

    for (const [rid, sim] of Object.entries(best)) {
      console.log(`📝 Processing resume ${rid} with similarity ${sim}`);

      const full = await db
        .select({ text: resumes.fullText })
        .from(resumes)
        .where(eq(resumes.id, Number(rid)));

      if (!full[0]) {
        console.error(`❌ Resume ${rid} not found in database`);
        continue;
      }

      const prompt = `
      Job Description:
      ${job.text}

      Candidate Résumé:
      ${full[0].text}

      1) List skills in both.
      2) List skills missing from the CV.
      3) One-sentence fit summary.

      Respond JSON: { "matching_skills":[], "missing_skills":[], "summary":"" }
      `;

      try {
        console.log(`🤖 Calling GPT for resume ${rid}...`);
        const chat = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        });

        const content = chat.choices[0].message.content ?? "{}";
        console.log(`🤖 GPT response for resume ${rid}:`, content.substring(0, 100) + "...");

        const { matching_skills, missing_skills, summary } = JSON.parse(content);

        // persist
        await db.insert(comparisons).values({
          userId,
          jobId: Number(jobId),
          resumeId: Number(rid),
          similarity: sim,
          matchingSkills: matching_skills,
          missingSkills: missing_skills,
          summary,
        });

        rows.push({ resumeId: Number(rid), similarity: sim, matching_skills, missing_skills, summary });
      } catch (gptError) {
        console.error(`❌ GPT error for resume ${rid}:`, gptError);
        // Add a fallback result
        rows.push({
          resumeId: Number(rid),
          similarity: sim,
          matching_skills: [],
          missing_skills: [],
          summary: "Analysis failed, but candidate shows good similarity score.",
        });
      }
    }

    console.log("✅ Final results:", rows.length, "processed");

    // return sorted
    const sortedResults = rows.sort((a, b) => b.similarity - a.similarity);
    return NextResponse.json(sortedResults);
  } catch (error) {
    console.error("💥 Match API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
