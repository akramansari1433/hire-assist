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
        fitScore: comparisons.fitScore,
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
          fitScore: existing.fitScore !== undefined ? existing.fitScore : existing.similarity, // fallback to similarity if no fitScore
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
      You are a JSON-only response API. Your task is to analyze a job description and resume, then output ONLY valid JSON with no additional text.

      Job Description:
      ${job.text}

      Candidate Résumé:
      ${full[0].text}

      Vector Similarity Score: ${(sim * 100).toFixed(1)}%

      Instructions:
      Analyze the job and resume to determine:
      1) Skills that match between job and resume
      2) Skills missing from the resume 
      3) One-sentence fit summary
      4) Overall fit score (0.0 to 1.0) considering requirements, qualifications, and similarity

      RESPOND WITH ONLY THE FOLLOWING JSON STRUCTURE:
      {
        "matching_skills": ["skill1", "skill2", ...],
        "missing_skills": ["skill1", "skill2", ...],
        "summary": "One sentence summary",
        "fit_score": 0.85
      }`;

      try {
        const { text } = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          prompt: prompt,
          temperature: 0.1, // Lower temperature for more consistent JSON formatting
        });

        // Clean the response to extract JSON content
        let cleanText = text.trim();
        // Remove markdown code block formatting if present
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        // Additional cleaning: remove any text before { and after }
        cleanText = cleanText.substring(cleanText.indexOf("{"), cleanText.lastIndexOf("}") + 1);

        let parsedResponse;
        try {
          parsedResponse = JSON.parse(cleanText);
        } catch (jsonError) {
          console.error(`❌ JSON parsing error for resume ${resumeId}:`, jsonError);
          console.error("Raw response:", text);
          throw new Error("Failed to parse LLM response as JSON");
        }

        const { matching_skills, missing_skills, summary, fit_score } = parsedResponse;

        // Validate the parsed data
        if (
          !Array.isArray(matching_skills) ||
          !Array.isArray(missing_skills) ||
          typeof summary !== "string" ||
          typeof fit_score !== "number"
        ) {
          throw new Error("Invalid response structure from LLM");
        }

        // Ensure fit_score is valid, fallback to similarity if needed
        const fitScore = fit_score >= 0 && fit_score <= 1 ? fit_score : sim;

        // persist
        await db.insert(comparisons).values({
          userId,
          jobId: Number(jobId),
          resumeId,
          similarity: sim,
          fitScore,
          matchingSkills: matching_skills,
          missingSkills: missing_skills,
          summary,
        });

        rows.push({ resumeId, similarity: sim, fitScore, matching_skills, missing_skills, summary });
      } catch (gptError) {
        console.error(`❌ GPT error for resume ${resumeId}:`, gptError);
        // Add a fallback result
        rows.push({
          resumeId,
          similarity: sim,
          fitScore: sim, // fallback to similarity score
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
