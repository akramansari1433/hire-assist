import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparisons, resumes } from "@/lib/db";
import { eq, desc, asc, and, ilike, sql, count, gte, lt } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { searchParams } = new URL(req.url);

  // Pagination parameters
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  // Sorting parameters
  const sortBy = searchParams.get("sortBy") || "fit";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // Filtering parameters
  const search = searchParams.get("search");
  const scoreFilter = searchParams.get("scoreFilter"); // 'excellent', 'good', 'fair', 'poor', 'all'

  try {
    const jobIdNum = Number(jobId);

    // Build base query with joins
    let whereConditions = eq(comparisons.jobId, jobIdNum);

    // Add search filter (search in candidate names)
    if (search) {
      whereConditions = and(whereConditions, ilike(resumes.candidateName, `%${search}%`))!;
    }

    // Add score filter
    if (scoreFilter && scoreFilter !== "all") {
      const scoreConditions = (() => {
        switch (scoreFilter) {
          case "excellent":
            return gte(sql`COALESCE(${comparisons.fitScore}, ${comparisons.similarity})`, 0.8);
          case "good":
            return and(
              gte(sql`COALESCE(${comparisons.fitScore}, ${comparisons.similarity})`, 0.6),
              lt(sql`COALESCE(${comparisons.fitScore}, ${comparisons.similarity})`, 0.8)
            );
          case "fair":
            return and(
              gte(sql`COALESCE(${comparisons.fitScore}, ${comparisons.similarity})`, 0.4),
              lt(sql`COALESCE(${comparisons.fitScore}, ${comparisons.similarity})`, 0.6)
            );
          case "poor":
            return lt(sql`COALESCE(${comparisons.fitScore}, ${comparisons.similarity})`, 0.4);
          default:
            return undefined;
        }
      })();

      if (scoreConditions) {
        whereConditions = and(whereConditions, scoreConditions)!;
      }
    }

    // Define sort clause
    let orderByClause;
    switch (sortBy) {
      case "fit":
        orderByClause =
          sortOrder === "asc"
            ? asc(sql`COALESCE(${comparisons.fitScore}, ${comparisons.similarity})`)
            : desc(sql`COALESCE(${comparisons.fitScore}, ${comparisons.similarity})`);
        break;
      case "similarity":
        orderByClause = sortOrder === "asc" ? asc(comparisons.similarity) : desc(comparisons.similarity);
        break;
      case "candidate":
      case "candidateName":
        orderByClause = sortOrder === "asc" ? asc(resumes.candidateName) : desc(resumes.candidateName);
        break;
      case "createdAt":
      case "date":
        orderByClause = sortOrder === "asc" ? asc(comparisons.createdAt) : desc(comparisons.createdAt);
        break;
      default:
        orderByClause = desc(sql`COALESCE(${comparisons.fitScore}, ${comparisons.similarity})`);
    }

    // Get total count for pagination metadata
    const totalResult = await db
      .select({ count: count() })
      .from(comparisons)
      .innerJoin(resumes, eq(resumes.id, comparisons.resumeId))
      .where(whereConditions);
    const total = totalResult[0]?.count || 0;

    // Main query with pagination and joins
    const comparisonList = await db
      .select({
        resumeId: comparisons.resumeId,
        similarity: comparisons.similarity,
        fitScore: comparisons.fitScore,
        matchingSkills: comparisons.matchingSkills,
        missingSkills: comparisons.missingSkills,
        summary: comparisons.summary,
        createdAt: comparisons.createdAt,
        candidateName: resumes.candidateName,
      })
      .from(comparisons)
      .innerJoin(resumes, eq(resumes.id, comparisons.resumeId))
      .where(whereConditions)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Transform to expected format
    const enrichedComparisons = comparisonList.map((comparison) => ({
      resumeId: comparison.resumeId,
      similarity: comparison.similarity,
      fitScore: comparison.fitScore,
      matching_skills: comparison.matchingSkills || [],
      missing_skills: comparison.missingSkills || [],
      summary: comparison.summary,
      candidateName: comparison.candidateName,
      createdAt: comparison.createdAt,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Calculate analytics for the current page
    const analytics = {
      total: comparisonList.length,
      excellent: comparisonList.filter((c) => {
        const score = c.fitScore ?? c.similarity ?? 0;
        return score >= 0.8;
      }).length,
      good: comparisonList.filter((c) => {
        const score = c.fitScore ?? c.similarity ?? 0;
        return score >= 0.6 && score < 0.8;
      }).length,
      fair: comparisonList.filter((c) => {
        const score = c.fitScore ?? c.similarity ?? 0;
        return score >= 0.4 && score < 0.6;
      }).length,
      poor: comparisonList.filter((c) => {
        const score = c.fitScore ?? c.similarity ?? 0;
        return score < 0.4;
      }).length,
      averageScore:
        comparisonList.length > 0
          ? comparisonList.reduce((sum, c) => {
              const score = c.fitScore ?? c.similarity ?? 0;
              return sum + score;
            }, 0) / comparisonList.length
          : 0,
    };

    return NextResponse.json({
      data: enrichedComparisons,
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
        scoreFilter: scoreFilter || "all",
        sortBy,
        sortOrder,
      },
      analytics,
    });
  } catch (error) {
    console.error("Error fetching comparisons:", error);
    return NextResponse.json({ error: "Failed to fetch comparisons" }, { status: 500 });
  }
}
