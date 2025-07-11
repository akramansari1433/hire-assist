// /app/api/jobs/[jobId]/resumes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes, comparisons } from "@/lib/db";
import { chunk } from "@/lib/chunk";
import { embed } from "@/lib/embeddings";
import { upsertVectors } from "@/lib/pinecone";
import { desc, eq, asc, and, ilike, count, inArray } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { searchParams } = new URL(req.url);

  // Pagination parameters
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  // Sorting parameters
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // Filtering parameters
  const search = searchParams.get("search");
  const status = searchParams.get("status"); // 'matched', 'unmatched', 'all'

  try {
    // Build base query
    const jobIdNum = Number(jobId);
    let whereConditions = eq(resumes.jobId, jobIdNum);

    // Add search filter
    if (search) {
      whereConditions = and(whereConditions, ilike(resumes.candidateName, `%${search}%`))!;
    }

    // Define sort column and direction
    let orderByClause;
    switch (sortBy) {
      case "candidate":
      case "candidateName":
        orderByClause = sortOrder === "asc" ? asc(resumes.candidateName) : desc(resumes.candidateName);
        break;
      case "createdAt":
      case "date":
        orderByClause = sortOrder === "asc" ? asc(resumes.createdAt) : desc(resumes.createdAt);
        break;
      case "similarity":
      case "fit":
        // For these, we'll need to join with comparisons and sort by those values
        orderByClause = sortOrder === "asc" ? asc(resumes.createdAt) : desc(resumes.createdAt);
        break;
      default:
        orderByClause = desc(resumes.createdAt);
    }

    // Get total count for pagination metadata
    const totalResult = await db.select({ count: count() }).from(resumes).where(whereConditions);
    const total = totalResult[0]?.count || 0;

    // Main query with pagination
    const resumeQuery = db
      .select({
        id: resumes.id,
        candidate: resumes.candidateName,
        when: resumes.createdAt,
        fullText: resumes.fullText,
      })
      .from(resumes)
      .where(whereConditions)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const resumeList = await resumeQuery;

    // Get comparison data for the fetched resumes
    const resumeIds = resumeList.map((r) => r.id);

    interface ComparisonData {
      resumeId: number | null;
      similarity: number | null;
      fitScore: number | null;
      matchingSkills: string[] | null;
      missingSkills: string[] | null;
      summary: string | null;
      createdAt: Date | null;
    }

    let comparisonData: ComparisonData[] = [];

    if (resumeIds.length > 0) {
      comparisonData = await db
        .select({
          resumeId: comparisons.resumeId,
          similarity: comparisons.similarity,
          fitScore: comparisons.fitScore,
          matchingSkills: comparisons.matchingSkills,
          missingSkills: comparisons.missingSkills,
          summary: comparisons.summary,
          createdAt: comparisons.createdAt,
        })
        .from(comparisons)
        .where(and(eq(comparisons.jobId, jobIdNum), inArray(comparisons.resumeId, resumeIds)));
    }

    // Apply status filter after fetching comparison data
    let filteredResumes = resumeList;
    if (status && status !== "all") {
      const comparisonMap = new Map(comparisonData.map((c) => [c.resumeId, c]));

      if (status === "matched") {
        filteredResumes = resumeList.filter((resume) => comparisonMap.has(resume.id));
      } else if (status === "unmatched") {
        filteredResumes = resumeList.filter((resume) => !comparisonMap.has(resume.id));
      }
    }

    // Apply sorting for comparison-based fields
    if (sortBy === "similarity" || sortBy === "fit") {
      const comparisonMap = new Map(comparisonData.map((c) => [c.resumeId, c]));

      filteredResumes.sort((a, b) => {
        const aComparison = comparisonMap.get(a.id);
        const bComparison = comparisonMap.get(b.id);

        let aValue = 0;
        let bValue = 0;

        if (sortBy === "similarity") {
          aValue = aComparison?.similarity || 0;
          bValue = bComparison?.similarity || 0;
        } else if (sortBy === "fit") {
          aValue = aComparison?.fitScore ?? aComparison?.similarity ?? 0;
          bValue = bComparison?.fitScore ?? bComparison?.similarity ?? 0;
        }

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });
    }

    // Create enriched response with comparison data
    const enrichedResumes = filteredResumes.map((resume) => {
      const comparison = comparisonData.find((c) => c.resumeId === resume.id);
      return {
        ...resume,
        isMatched: !!comparison,
        matchResult: comparison
          ? {
              resumeId: comparison.resumeId,
              similarity: comparison.similarity,
              fitScore: comparison.fitScore,
              matching_skills: comparison.matchingSkills || [],
              missing_skills: comparison.missingSkills || [],
              summary: comparison.summary,
              createdAt: comparison.createdAt,
            }
          : undefined,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      data: enrichedResumes,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        search: search || null,
        status: status || "all",
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
  }
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

    // 3️⃣ upsert to Pinecone
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
