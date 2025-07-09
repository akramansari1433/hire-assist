"use client";

import { useState, useEffect, use } from "react";
import { Header } from "./components/header";
import { JobDescriptionCard } from "./components/job-description-card";
import { AnalysisOverview } from "./components/analysis-overview";
import { CandidateManagement } from "./components/candidate-management";
import { DeleteResumeDialog } from "./components/dialogs/delete-resume-dialog";
import { BulkDeleteDialog } from "./components/dialogs/bulk-delete-dialog";
import { Job, Resume, ResumeWithStatus, ComparisonFromAPI, SortOption, PaginationState } from "./types";

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  // Core state
  const [job, setJob] = useState<Job | null>(null);
  const [resumesWithStatus, setResumesWithStatus] = useState<ResumeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [matching, setMatching] = useState(false);
  const [isUpdatingJob, setIsUpdatingJob] = useState(false);

  // Dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<ResumeWithStatus | null>(null);
  const [bulkDeleteType, setBulkDeleteType] = useState<"selected" | "all">("selected");

  // Filter and pagination state
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "matched" | "unmatched">("all");
  const [sortOption, setSortOption] = useState<SortOption>("fit-desc");
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Analytics state
  const [hasAnyResumes, setHasAnyResumes] = useState(false);
  const [allComparisons, setAllComparisons] = useState<ComparisonFromAPI[]>([]);
  const [totalResumesCount, setTotalResumesCount] = useState(0);

  // Combined data fetching function
  const fetchAllData = async (
    page: number = currentPage,
    limit: number = pageSize,
    sort: SortOption = sortOption,
    searchTerm: string = search,
    status: string = statusFilter
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
        ...(searchTerm && { search: searchTerm }),
        ...(status !== "all" && { status }),
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
      setResumesWithStatus(resumesWithMatchStatus);
      setPagination(resumesData.pagination);

      // Update analytics data (only when no filters for accurate totals)
      if (!searchTerm && status === "all") {
        setAllComparisons(comparisons);
        setTotalResumesCount(resumesData.pagination.totalItems);
        setHasAnyResumes(resumesData.pagination.totalItems > 0);
      } else if (resumesData.pagination.totalItems > 0) {
        setHasAnyResumes(true);
      } else if ((searchTerm || status !== "all") && resumesData.pagination.totalItems === 0) {
        // Check unfiltered count
        const unfiltered = await fetch(`/api/jobs/${jobId}/resumes?limit=1`);
        if (unfiltered.ok) {
          const unfilteredData = await unfiltered.json();
          setHasAnyResumes(unfilteredData.pagination.totalItems > 0);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

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
  }, [jobId]);

  // Handle parameter changes (but not initial load)
  useEffect(() => {
    if (jobId && !loading) {
      fetchAllData();
    }
  }, [currentPage, pageSize, sortOption, search, statusFilter]);

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Utility functions
  const sortResumes = (resumes: ResumeWithStatus[]): ResumeWithStatus[] => {
    return [...resumes].sort((a, b) => {
      switch (sortOption) {
        case "similarity-desc":
          const aSimScore = a.matchResult?.similarity || 0;
          const bSimScore = b.matchResult?.similarity || 0;
          return bSimScore - aSimScore;

        case "similarity-asc":
          const aSimScoreAsc = a.matchResult?.similarity || 0;
          const bSimScoreAsc = b.matchResult?.similarity || 0;
          return aSimScoreAsc - bSimScoreAsc;

        case "fit-desc":
          const aFitScore =
            a.matchResult?.fitScore !== undefined ? a.matchResult.fitScore : a.matchResult?.similarity || 0;
          const bFitScore =
            b.matchResult?.fitScore !== undefined ? b.matchResult.fitScore : b.matchResult?.similarity || 0;
          return bFitScore - aFitScore;

        case "fit-asc":
          const aFitScoreAsc =
            a.matchResult?.fitScore !== undefined ? a.matchResult.fitScore : a.matchResult?.similarity || 0;
          const bFitScoreAsc =
            b.matchResult?.fitScore !== undefined ? b.matchResult.fitScore : b.matchResult?.similarity || 0;
          return aFitScoreAsc - bFitScoreAsc;

        case "name-asc":
          return a.candidate.localeCompare(b.candidate);

        case "name-desc":
          return b.candidate.localeCompare(a.candidate);

        case "date-desc":
          return new Date(b.when).getTime() - new Date(a.when).getTime();

        case "date-asc":
          return new Date(a.when).getTime() - new Date(b.when).getTime();

        default:
          return 0;
      }
    });
  };

  // Business logic handlers
  const handleUploadResume = async (candidateName: string, fullText: string) => {
    setUploading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/resumes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateName, fullText }),
      });

      if (response.ok) {
        await fetchAllData();
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = (resume: ResumeWithStatus) => {
    setResumeToDelete(resume);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteResume = async () => {
    if (!resumeToDelete) return;

    setDeleting(resumeToDelete.id);
    try {
      const response = await fetch(`/api/jobs/${jobId}/resumes/${resumeToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAllData();
      } else {
        const error = await response.json();
        alert(`Failed to delete resume: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume. Please try again.");
    } finally {
      setDeleting(null);
      setDeleteConfirmOpen(false);
      setResumeToDelete(null);
    }
  };

  const handleBulkDelete = (type: "selected" | "all") => {
    setBulkDeleteType(type);
    setBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const payload = bulkDeleteType === "all" ? { deleteAll: true } : { resumeIds: selectedResumes.map((r) => r.id) };

      const response = await fetch(`/api/jobs/${jobId}/resumes/bulk-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchAllData();
      } else {
        const error = await response.json();
        alert(`Failed to delete resumes: ${error.error}`);
      }
    } catch (error) {
      console.error("Error with bulk delete:", error);
      alert("Failed to delete resumes. Please try again.");
    } finally {
      setBulkDeleting(false);
      setBulkDeleteConfirmOpen(false);
    }
  };

  const toggleResumeSelection = (resumeId: number) => {
    setResumesWithStatus((prev) =>
      prev.map((resume) => (resume.id === resumeId ? { ...resume, selected: !resume.selected } : resume))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = resumesWithStatus.every((resume) => resume.selected);
    setResumesWithStatus((prev) => prev.map((resume) => ({ ...resume, selected: !allSelected })));
  };

  const runMatching = async () => {
    setMatching(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-123", topK: 10 }),
      });

      if (response.ok) {
        await fetchAllData();
      }
    } catch (error) {
      console.error("Error running matching:", error);
    } finally {
      setMatching(false);
    }
  };

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

  const getMatchingButtonText = () => {
    const unmatchedCount = resumesWithStatus.filter((r) => !r.isMatched).length;
    if (unmatchedCount === 0) {
      return "All Matched";
    }
    return `Match ${unmatchedCount} Resume${unmatchedCount > 1 ? "s" : ""}`;
  };

  const shouldDisableMatching = () => {
    return matching || resumesWithStatus.filter((r) => !r.isMatched).length === 0;
  };

  // Computed values
  const selectedResumes = resumesWithStatus.filter((resume) => resume.selected);
  const hasSelectedResumes = selectedResumes.length > 0;
  const allSelected = resumesWithStatus.length > 0 && resumesWithStatus.every((resume) => resume.selected);
  const hasMatchedResumes = resumesWithStatus.some((resume) => resume.isMatched);

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
        <Header job={job} totalResumesCount={totalResumesCount} allComparisons={allComparisons.length} />

        {/* Delete Confirmation Dialogs */}
        <DeleteResumeDialog
          isOpen={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          resume={resumeToDelete}
          deleting={deleting === resumeToDelete?.id}
          onConfirm={confirmDeleteResume}
        />

        <BulkDeleteDialog
          isOpen={bulkDeleteConfirmOpen}
          onOpenChange={setBulkDeleteConfirmOpen}
          deleteType={bulkDeleteType}
          totalResumes={resumesWithStatus.length}
          selectedCount={selectedResumes.length}
          bulkDeleting={bulkDeleting}
          onConfirm={confirmBulkDelete}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Job Description */}
          <JobDescriptionCard job={job} onUpdate={handleUpdateJob} isUpdating={isUpdatingJob} />

          {/* Right Column */}
          <div className="space-y-6">
            {/* Analysis Overview */}
            <AnalysisOverview
              jobId={jobId}
              allComparisons={allComparisons}
              loading={loading}
              matching={matching}
              onStartAnalysis={resumesWithStatus.length > 0 ? runMatching : undefined}
            />

            {/* Candidate Management */}
            <CandidateManagement
              resumesWithStatus={resumesWithStatus}
              pagination={pagination}
              uploading={uploading}
              bulkDeleting={bulkDeleting}
              hasAnyResumes={hasAnyResumes}
              hasMatchedResumes={hasMatchedResumes}
              allSelected={allSelected}
              hasSelectedResumes={hasSelectedResumes}
              selectedResumes={selectedResumes}
              deleting={deleting}
              search={search}
              statusFilter={statusFilter}
              sortOption={sortOption}
              matching={matching}
              onSearchChange={setSearch}
              onStatusFilterChange={setStatusFilter}
              onSortOptionChange={setSortOption}
              onToggleSelectAll={toggleSelectAll}
              onToggleSelection={toggleResumeSelection}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onDelete={handleDeleteResume}
              onBulkDelete={handleBulkDelete}
              onUploadResume={handleUploadResume}
              onRunMatching={runMatching}
              getMatchingButtonText={getMatchingButtonText}
              shouldDisableMatching={shouldDisableMatching}
              sortResumes={sortResumes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
