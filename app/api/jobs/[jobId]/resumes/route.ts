// /app/api/jobs/[jobId]/resumes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes, comparisons } from "@/lib/db";
import { chunk } from "@/lib/chunk";
import { embed } from "@/lib/embeddings";
import { upsertVectors } from "@/lib/pinecone";
import { desc, eq, asc, and, ilike, count, inArray } from "drizzle-orm";
import { extractTextFromPDF, extractCandidateName } from "@/lib/pdf-utils";

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

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "At least one PDF file is required" }, { status: 400 });
    }

    // Validate all files before processing
    for (const file of files) {
      // Validate file type - only PDF
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: `"${file.name}" is not a PDF file. Only PDF files are accepted.` },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `"${file.name}" is too large. File size must be less than 10MB.` },
          { status: 400 }
        );
      }
    }

    const results = [];
    const errors = [];

    // Process files in parallel for better performance
    const filePromises = files.map(async (file) => {
      try {
        // Extract text from PDF
        const buffer = await file.arrayBuffer();
        const fullText = await extractTextFromPDF(buffer);

        if (!fullText.trim()) {
          throw new Error(`No text could be extracted from "${file.name}"`);
        }

        // Extract candidate name using AI
        const candidateName = await extractCandidateName(fullText);

        if (!candidateName) {
          throw new Error(`Could not identify candidate name from "${file.name}"`);
        }

        // Add resume to db
        const [resume] = await db
          .insert(resumes)
          .values({ jobId: Number(jobId), candidateName, fullText })
          .returning({ id: resumes.id });

        // Chunk + embed
        const pieces = chunk(fullText);

        if (pieces.length === 0) {
          throw new Error(`Chunking failed for "${file.name}" - no pieces created`);
        }

        const vectors = await Promise.all(
          pieces.map(async (piece) => {
            return await embed(piece);
          })
        );

        // Upsert to Pinecone
        const pineconeVectors = vectors.map((v, i) => ({
          id: `res-${resume.id}-${i}`,
          values: v,
          metadata: { resumeId: resume.id, jobId: Number(jobId) },
        }));

        await upsertVectors(pineconeVectors, "resumes");

        return {
          fileName: file.name,
          resumeId: resume.id,
          candidateName,
          success: true,
        };
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error);
        return {
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    // Wait for all files to be processed
    const processedResults = await Promise.all(filePromises);

    // Separate successful and failed results
    for (const result of processedResults) {
      if (result.success && result.resumeId && result.candidateName) {
        results.push({
          fileName: result.fileName,
          resumeId: result.resumeId,
          candidateName: result.candidateName,
        });
      } else {
        errors.push({
          fileName: result.fileName,
          error: result.error || "Unknown error occurred",
        });
      }
    }

    // Return results
    const response: {
      success: boolean;
      processed: number;
      total: number;
      results: Array<{ fileName: string; resumeId: number; candidateName: string }>;
      errors?: Array<{ fileName: string; error: string }>;
      message?: string;
    } = {
      success: true,
      processed: results.length,
      total: files.length,
      results,
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.message = `${results.length} of ${files.length} resumes processed successfully. ${errors.length} failed.`;
    } else {
      response.message = `All ${files.length} resumes uploaded and processed successfully`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Bulk resume upload error:", error);
    return NextResponse.json(
      {
        error: "Bulk resume upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
