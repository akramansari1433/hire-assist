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
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // fetch JD embedding
  const [job] = await db
    .select({ emb: jobs.jdEmbedding, text: jobs.jdText })
    .from(jobs)
    .where(eq(jobs.id, Number(jobId)));
  if (!job?.emb) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // vector query
  const resp = await index.namespace("resumes").query({ vector: job.emb, topK, filter: { jobId } });

  // aggregate best per resume
  const best: Record<number, number> = {};
  resp.matches?.forEach((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rid = (m.metadata as any).resumeId as number;
    best[rid] = Math.max(best[rid] ?? 0, m.score!);
  });

  // enrich with LLM
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  for (const [rid, sim] of Object.entries(best)) {
    const full = await db
      .select({ text: resumes.fullText })
      .from(resumes)
      .where(eq(resumes.id, Number(rid)));
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

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const { matching_skills, missing_skills, summary } = JSON.parse(chat.choices[0].message.content ?? "{}");

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
  }

  // return sorted
  return NextResponse.json(rows.sort((a, b) => b.similarity - a.similarity));
}
