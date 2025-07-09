"use client";

import { useState, useEffect, use, useCallback } from "react";
import { Header } from "./components/header";
import { JobDescriptionCard } from "./components/job-description-card";
import { AnalysisOverview } from "./components/analysis-overview";
import CandidateManagement from "./components/candidate-management";
import { Job, Resume, ResumeWithStatus, ComparisonFromAPI, SortOption, PaginationState } from "./types";

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  // Core state
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Resume list state
  const [resumesData, setResumesData] = useState<{
    resumes: ResumeWithStatus[];
    pagination: PaginationState;
  }>({
    resumes: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });

  // Analytics state
  const [allComparisons, setAllComparisons] = useState<ComparisonFromAPI[]>([]);

  // Form state
  const [isUpdatingJob, setIsUpdatingJob] = useState(false);

  // Fetch data function
  const fetchAllData = useCallback(
    async (
      page: number = resumesData.pagination.currentPage,
      limit: number = resumesData.pagination.itemsPerPage,
      sort: SortOption = "fit-desc",
      search?: string,
      status?: string
    ) => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sortBy: sort.includes("fit")
            ? "fit"
            : sort.includes("similarity")
            ? "similarity"
            : sort.includes("name")
            ? "candidate"
            : "createdAt",
          sortOrder: sort.includes("desc") ? "desc" : "asc",
          ...(search && { search }),
          ...(status && status !== "all" && { status }),
        });

        // Fetch all data in parallel
        const [resumesResponse, comparisonsResponse] = await Promise.all([
          fetch(`/api/jobs/${jobId}/resumes?${params}`),
          fetch(`/api/jobs/${jobId}/comparisons?limit=1000`),
        ]);

        if (!resumesResponse.ok || !comparisonsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [resumesData, comparisonsData] = await Promise.all([resumesResponse.json(), comparisonsResponse.json()]);

        // Create comparison map
        const comparisons = comparisonsData.data || [];
        const comparisonMap = new Map<number, ComparisonFromAPI>(
          comparisons.map((comp: ComparisonFromAPI) => [comp.resumeId, comp])
        );

        // Merge resumes with comparisons in one operation
        const resumesWithMatchStatus: ResumeWithStatus[] = resumesData.data.map((resume: Resume) => {
          const matchResult = comparisonMap.get(resume.id);
          return {
            ...resume,
            isMatched: !!matchResult,
            selected: false,
            matchResult: matchResult
              ? {
                  resumeId: matchResult.resumeId,
                  similarity: matchResult.similarity,
                  fitScore: matchResult.fitScore,
                  summary: matchResult.summary,
                  matching_skills: matchResult.matchingSkills || [],
                  missing_skills: matchResult.missingSkills || [],
                  createdAt: matchResult.createdAt,
                }
              : undefined,
          };
        });

        // Update all state at once
        setResumesData({
          resumes: resumesWithMatchStatus,
          pagination: resumesData.pagination,
        });
        setAllComparisons(comparisons);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },
    [jobId]
  );

  // Initial load - fetch job details first, then all data
  useEffect(() => {
    if (jobId) {
      const initializeData = async () => {
        try {
          // Fetch job details
          const response = await fetch("/api/jobs");
          const data = await response.json();
          const foundJob = data.find((j: Job) => j.id === parseInt(jobId));
          setJob(foundJob || null);

          // Then fetch all resume/comparison data
          await fetchAllData();
        } catch (error) {
          console.error("Error fetching job details:", error);
        } finally {
          setLoading(false);
        }
      };

      initializeData();
    }
  }, [jobId, fetchAllData]);

  // Business logic handlers
  const handleUpdateJob = async (title: string, jdText: string) => {
    setIsUpdatingJob(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, jdText }),
      });

      if (response.ok) {
        const updatedJob = await response.json();
        setJob(updatedJob);
      } else {
        const error = await response.json();
        alert(`Failed to update job: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating job:", error);
      alert("Failed to update job. Please try again.");
    } finally {
      setIsUpdatingJob(false);
    }
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-pulse">Loading job details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Header
          job={job}
          totalResumesCount={resumesData.pagination.totalItems}
          allComparisons={allComparisons.length}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Job Description */}
          <JobDescriptionCard job={job} onUpdate={handleUpdateJob} isUpdating={isUpdatingJob} />

          {/* Right Column */}
          <div className="space-y-6">
            {/* Analysis Overview */}
            <AnalysisOverview jobId={jobId} allComparisons={allComparisons} loading={loading} />

            {/* Candidate Management */}
            <CandidateManagement
              jobId={jobId}
              resumes={resumesData.resumes}
              pagination={resumesData.pagination}
              onDataChange={fetchAllData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
