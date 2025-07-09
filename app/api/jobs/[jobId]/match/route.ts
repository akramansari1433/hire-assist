// /app/api/jobs/[jobId]/match/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, comparisons, resumes } from "@/lib/db";
import { index } from "@/lib/pinecone";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { eq } from "drizzle-orm";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { userId, topK = 10 } = await req.json();

  if (!userId) {
    console.error("❌ Missing userId");
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    // fetch job text and embedding from Pinecone
    const [job] = await db
      .select({ text: jobs.jdText })
      .from(jobs)
      .where(eq(jobs.id, Number(jobId)));

    if (!job) {
      console.error("❌ Job not found");
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // fetch job embedding from Pinecone
    const jobEmbeddingResp = await index.namespace("jobs").fetch([`job-${jobId}`]);
    const jobVector = jobEmbeddingResp.records[`job-${jobId}`]?.values;

    if (!jobVector) {
      console.error("❌ Job embedding not found in Pinecone");
      return NextResponse.json({ error: "Job embedding not found" }, { status: 404 });
    }

    // Check if we have resumes for this job
    const resumeCount = await db
      .select({ count: resumes.id })
      .from(resumes)
      .where(eq(resumes.jobId, Number(jobId)));

    if (resumeCount.length === 0) {
      return NextResponse.json({ error: "No resumes found for this job" }, { status: 404 });
    }

    // vector query
    const resp = await index.namespace("resumes").query({
      vector: jobVector,
      topK,
      filter: { jobId: Number(jobId) },
      includeMetadata: true,
    });

    // aggregate best per resume
    const best: Record<number, number> = {};
    resp.matches?.forEach((m) => {
      if (!m.metadata) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = m.metadata as any;

      if (!metadata.resumeId) {
        return;
      }

      const rid = metadata.resumeId as number;
      best[rid] = Math.max(best[rid] ?? 0, m.score!);
    });

    if (Object.keys(best).length === 0) {
      return NextResponse.json({ error: "No matches found" }, { status: 404 });
    }

    // Check for existing comparisons to avoid re-processing
    const existingComparisons = await db
      .select({
        resumeId: comparisons.resumeId,
        similarity: comparisons.similarity,
        matchingSkills: comparisons.matchingSkills,
        missingSkills: comparisons.missingSkills,
        summary: comparisons.summary,
      })
      .from(comparisons)
      .where(eq(comparisons.jobId, Number(jobId)));

    // Create a map of existing comparisons by resumeId
    const existingMap = new Map(existingComparisons.map((comp) => [comp.resumeId, comp]));

    // enrich with LLM (only for new resumes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = [];

    for (const [rid, sim] of Object.entries(best)) {
      const resumeId = Number(rid);

      // Check if we already have a comparison for this resume
      if (existingMap.has(resumeId)) {
        const existing = existingMap.get(resumeId)!;
        rows.push({
          resumeId,
          similarity: existing.similarity,
          matching_skills: existing.matchingSkills || [],
          missing_skills: existing.missingSkills || [],
          summary: existing.summary || "Previously analyzed candidate",
        });
        continue;
      }
      const full = await db.select({ text: resumes.fullText }).from(resumes).where(eq(resumes.id, resumeId));

      if (!full[0]) {
        console.error(`❌ Resume ${resumeId} not found in database`);
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
        const { text } = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          prompt: prompt,
        });

        // Clean the response to extract JSON content
        let cleanText = text.trim();
        // Remove markdown code block formatting if present
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const { matching_skills, missing_skills, summary } = JSON.parse(cleanText);

        // persist
        await db.insert(comparisons).values({
          userId,
          jobId: Number(jobId),
          resumeId,
          similarity: sim,
          matchingSkills: matching_skills,
          missingSkills: missing_skills,
          summary,
        });

        rows.push({ resumeId, similarity: sim, matching_skills, missing_skills, summary });
      } catch (gptError) {
        console.error(`❌ GPT error for resume ${resumeId}:`, gptError);
        // Add a fallback result
        rows.push({
          resumeId,
          similarity: sim,
          matching_skills: [],
          missing_skills: [],
          summary: "Analysis failed, but candidate shows good similarity score.",
        });
      }
    }

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
