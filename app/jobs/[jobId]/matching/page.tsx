"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "./components/header";
import { AnalyticsOverview } from "./components/analytics/analytics-overview";
import { AnalysisResults } from "./components/analysis-results";
import {
  Job,
  MatchResult,
  ComparisonFromAPI,
  SortOption,
  ViewMode,
  FilterOption,
  Analytics,
  PaginationState,
} from "./types";
import { getScoreLabel } from "@/lib/utils";
import { exportToCSV, generatePDFReport } from "./utils";

export default function MatchingPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatching, setExpandedMatching] = useState<{ [key: number]: boolean }>({});
  const [expandedMissing, setExpandedMissing] = useState<{ [key: number]: boolean }>({});
  const [sortOption, setSortOption] = useState<SortOption>("fit-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Add state to track if we have any results at all (before filtering)
  const [hasAnyResults, setHasAnyResults] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics>({
    total: 0,
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
    averageScore: 0,
  });

  const [matchResultsLoading, setMatchResultsLoading] = useState(true);

  // Handle page size changes with better state management
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const fetchJobDetails = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      const foundJob = data.find((j: Job) => j.id === parseInt(jobId));
      setJob(foundJob || null);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const fetchExistingComparisons = useCallback(async () => {
    setMatchResultsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy: sortOption.includes("fit")
          ? "fit"
          : sortOption.includes("similarity")
          ? "similarity"
          : sortOption.includes("name")
          ? "candidate"
          : "createdAt",
        sortOrder: sortOption.includes("desc") ? "desc" : "asc",
        ...(search && { search }),
        ...(filterOption !== "all" && { scoreFilter: filterOption }),
      });

      const response = await fetch(`/api/jobs/${jobId}/comparisons?${params}`);
      if (response.ok) {
        const data = await response.json();
        const enrichedResults = data.data.map((result: ComparisonFromAPI & { candidateName: string }) => ({
          resumeId: result.resumeId,
          similarity: result.similarity,
          fitScore: result.fitScore !== undefined ? result.fitScore : result.similarity,
          matching_skills: result.matching_skills || [],
          missing_skills: result.missing_skills || [],
          summary: result.summary || "Previously analyzed candidate",
          candidateName: result.candidateName || "Unknown Candidate",
        }));

        setMatchResults(enrichedResults);
        setPagination({
          ...data.pagination,
          itemsPerPage: pageSize,
        });
        setAnalytics(data.analytics);
        setHasAnyResults(data.analytics.total > 0);
      } else {
        setMatchResults([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        setAnalytics({ total: 0, excellent: 0, good: 0, fair: 0, poor: 0, averageScore: 0 });
        setHasAnyResults(false);
      }
    } catch (error) {
      console.error("Error fetching existing comparisons:", error);
    } finally {
      setMatchResultsLoading(false);
    }
  }, [jobId, currentPage, pageSize, sortOption, search, filterOption]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, fetchJobDetails]);

  // Fetch comparisons with pagination
  useEffect(() => {
    if (jobId) {
      fetchExistingComparisons();
    }
  }, [jobId, fetchExistingComparisons]);

  const runMatching = async () => {
    setMatching(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          topK: 20,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to run matching");
      }

      const data = await response.json();
      console.log("Matching completed:", data);

      // Refresh the comparisons list
      fetchExistingComparisons();
    } catch (error) {
      console.error("Error running matching:", error);
    } finally {
      setMatching(false);
    }
  };

  const toggleMatchingSkills = (resumeId: number) => {
    setExpandedMatching((prev) => ({ ...prev, [resumeId]: !prev[resumeId] }));
  };

  const toggleMissingSkills = (resumeId: number) => {
    setExpandedMissing((prev) => ({ ...prev, [resumeId]: !prev[resumeId] }));
  };

  if (!loading && !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Job Not Found</h1>
            <Link href="/jobs">
              <Button>Back to Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <Header job={job} analytics={analytics} matching={matching} onRunMatching={runMatching} loading={loading} />

        <AnalyticsOverview analytics={analytics} loading={loading} />

        <AnalysisResults
          matchResults={matchResults}
          matching={matching}
          hasAnyResults={hasAnyResults}
          analytics={analytics}
          search={search}
          sortOption={sortOption}
          filterOption={filterOption}
          viewMode={viewMode}
          expandedMatching={expandedMatching}
          expandedMissing={expandedMissing}
          pagination={pagination}
          onSearchChange={setSearch}
          onSortChange={setSortOption}
          onFilterChange={setFilterOption}
          onViewModeChange={setViewMode}
          onToggleMatchingSkills={toggleMatchingSkills}
          onToggleMissingSkills={toggleMissingSkills}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onExportCSV={() => exportToCSV({ job, matchResults, getScoreLabel })}
          onGeneratePDF={() => generatePDFReport({ job, analytics, matchResults, getScoreLabel })}
          loading={matchResultsLoading || loading}
        />
      </div>
    </div>
  );
}
