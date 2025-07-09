"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  PlusIcon,
  ArrowLeftIcon,
  UserIcon,
  Trash2Icon,
  ArrowUpDownIcon,
  BarChart3Icon,
  ArrowRightIcon,
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  jdText: string;
  createdAt: string;
}

interface Resume {
  id: number;
  candidate: string;
  when: string;
}

interface MatchResult {
  resumeId: number;
  similarity: number;
  fitScore?: number;
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
  createdAt?: string;
}

interface ComparisonFromAPI {
  resumeId: number;
  similarity: number;
  fitScore?: number;
  matchingSkills: string[];
  missingSkills: string[];
  summary: string;
  createdAt: string;
}

interface ResumeWithStatus extends Resume {
  isMatched: boolean;
  matchResult?: MatchResult;
  selected?: boolean;
}

type SortOption =
  | "similarity-desc"
  | "similarity-asc"
  | "fit-desc"
  | "fit-asc"
  | "name-asc"
  | "name-desc"
  | "date-desc"
  | "date-asc";

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesWithStatus, setResumesWithStatus] = useState<ResumeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [newResume, setNewResume] = useState({ candidateName: "", fullText: "" });
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<ResumeWithStatus | null>(null);
  const [bulkDeleteType, setBulkDeleteType] = useState<"selected" | "all">("selected");
  const [sortOption, setSortOption] = useState<SortOption>("fit-desc");
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchResumes();
    }
  }, [jobId]);

  // Fetch existing comparisons and update resume status
  useEffect(() => {
    if (resumes.length > 0) {
      fetchExistingComparisons();
    }
  }, [resumes]);

  const fetchJobDetails = async () => {
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
  };

  const fetchResumes = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/resumes`);
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
    }
  };

  const fetchExistingComparisons = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/comparisons`);
      if (response.ok) {
        const comparisons = await response.json();

        // Create a map of resumeId to comparison
        const comparisonMap = new Map<number, ComparisonFromAPI>(
          comparisons.map((comp: ComparisonFromAPI) => [comp.resumeId, comp])
        );

        // Update resumes with match status
        const resumesWithMatchStatus: ResumeWithStatus[] = resumes.map((resume) => {
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

        setResumesWithStatus(resumesWithMatchStatus);
      }
    } catch (error) {
      console.error("Error fetching existing comparisons:", error);
    }
  };

  const sortResumes = (resumes: ResumeWithStatus[], sortOption: SortOption): ResumeWithStatus[] => {
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

  const handleUploadResume = async () => {
    if (!newResume.candidateName || !newResume.fullText) return;

    setUploading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/resumes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResume),
      });

      if (response.ok) {
        setNewResume({ candidateName: "", fullText: "" });
        setIsUploadDialogOpen(false);
        fetchResumes();
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
        const result = await response.json();
        console.log(`Resume deleted: ${result.deletedResume.candidateName}, ${result.deletedComparisons} comparisons`);
        fetchResumes(); // Refresh the list
      } else {
        const error = await response.json();
        console.error("Delete failed:", error);
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
        const result = await response.json();
        console.log(`Bulk delete completed: ${result.totalDeleted} resumes, ${result.deletedComparisons} comparisons`);
        fetchResumes(); // Refresh the list
      } else {
        const error = await response.json();
        console.error("Bulk delete failed:", error);
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

  const selectedResumes = resumesWithStatus.filter((resume) => resume.selected);
  const hasResumes = resumesWithStatus.length > 0;
  const hasSelectedResumes = selectedResumes.length > 0;
  const allSelected = resumesWithStatus.length > 0 && resumesWithStatus.every((resume) => resume.selected);
  const hasMatchedResumes = resumesWithStatus.some((resume) => resume.isMatched);

  // Apply sorting to resumes
  const sortedResumes = sortResumes(
    resumesWithStatus.length > 0
      ? resumesWithStatus
      : resumes.map((r) => ({ ...r, isMatched: false, matchResult: undefined, selected: false })),
    sortOption
  );

  const runMatching = async (forceRerun = false) => {
    if (!job) return;

    const unmatchedResumes = resumesWithStatus.filter((r) => !r.isMatched);
    const hasUnmatchedResumes = unmatchedResumes.length > 0;

    if (!forceRerun && !hasUnmatchedResumes) {
      // All resumes are already matched
      return;
    }

    setMatching(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-123", topK: 10 }),
      });

      if (response.ok) {
        // Refresh comparisons and resume status
        fetchExistingComparisons();
      }
    } catch (error) {
      console.error("Error running matching:", error);
    } finally {
      setMatching(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  // Quick stats for analytics preview
  const analytics = {
    total: resumesWithStatus.length,
    analyzed: resumesWithStatus.filter((r) => r.isMatched).length,
    excellent: resumesWithStatus.filter(
      (r) => r.matchResult && (r.matchResult.fitScore || r.matchResult.similarity) >= 0.8
    ).length,
    pending: resumesWithStatus.filter((r) => !r.isMatched).length,
  };

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
        {/* Header */}
        <div className="mb-6">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <Link href="/jobs" className="group">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
                Jobs
              </Button>
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-sm font-medium text-slate-700">Job Details</span>
          </div>

          {/* Title Section */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{job.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>Created {formatDate(job.createdAt)}</span>
                {hasResumes && (
                  <>
                    <span>•</span>
                    <span>
                      {analytics.total} candidate{analytics.total !== 1 ? "s" : ""}
                    </span>
                    {analytics.analyzed > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">{analytics.analyzed} analyzed</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialogs */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Resume</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{resumeToDelete?.candidate}&quot;? This will permanently delete:
                <br />
                <br />
                • The resume and all its data
                <br />
                • All AI comparisons for this candidate
                <br />
                • All vector embeddings in Pinecone
                <br />
                <br />
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting !== null}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteResume} disabled={deleting !== null}>
                {deleting === resumeToDelete?.id ? "Deleting..." : "Delete Resume"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{bulkDeleteType === "all" ? "Delete All Resumes" : "Delete Selected Resumes"}</DialogTitle>
              <DialogDescription>
                {bulkDeleteType === "all"
                  ? `Are you sure you want to delete ALL ${resumesWithStatus.length} resumes?`
                  : `Are you sure you want to delete ${selectedResumes.length} selected resume${
                      selectedResumes.length > 1 ? "s" : ""
                    }?`}
                <br />
                <br />
                This will permanently delete:
                <br />
                • All resume data and text
                <br />
                • All AI comparisons and analysis
                <br />
                • All vector embeddings in Pinecone
                <br />
                <br />
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setBulkDeleteConfirmOpen(false)} disabled={bulkDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? "Deleting..." : `Delete ${bulkDeleteType === "all" ? "All" : selectedResumes.length}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{job.jdText}</div>
            </CardContent>
          </Card>

          {/* Candidate Management */}
          <div className="space-y-6">
            {/* Quick Analytics & Analysis Link */}
            {hasResumes && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-blue-900">Analysis Overview</CardTitle>
                      <CardDescription className="text-blue-700">
                        {analytics.analyzed} of {analytics.total} candidates analyzed
                      </CardDescription>
                    </div>
                    <BarChart3Icon className="h-8 w-8 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analytics.excellent}</p>
                      <p className="text-xs text-slate-600">Excellent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{analytics.analyzed}</p>
                      <p className="text-xs text-slate-600">Analyzed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{analytics.pending}</p>
                      <p className="text-xs text-slate-600">Pending</p>
                    </div>
                  </div>
                  <Link href={`/jobs/${jobId}/matching`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <BarChart3Icon className="h-4 w-4 mr-2" />
                      View Detailed Analysis Dashboard
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Candidate Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Candidate Management ({resumes.length})</CardTitle>
                    <CardDescription>Upload, organize, and manage candidate resumes</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {resumes.length > 0 && (
                      <Button
                        onClick={() => runMatching()}
                        disabled={shouldDisableMatching()}
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        {matching ? "Analyzing..." : getMatchingButtonText()}
                      </Button>
                    )}
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Upload Resume
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>Upload Resume</DialogTitle>
                          <DialogDescription>Add a new candidate resume for this job.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
                          <div className="grid gap-2">
                            <Label htmlFor="candidateName">Candidate Name</Label>
                            <Input
                              id="candidateName"
                              placeholder="e.g. John Doe"
                              value={newResume.candidateName}
                              onChange={(e) => setNewResume({ ...newResume, candidateName: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="resumeText">Resume Text</Label>
                            <Textarea
                              id="resumeText"
                              placeholder="Paste the full resume text here..."
                              value={newResume.fullText}
                              onChange={(e) => setNewResume({ ...newResume, fullText: e.target.value })}
                              rows={6}
                              className="max-h-40 resize-none"
                            />
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <Button
                            onClick={handleUploadResume}
                            disabled={uploading || !newResume.candidateName || !newResume.fullText}
                            className="w-full"
                          >
                            {uploading ? "Uploading..." : "Upload Resume"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Management Controls */}
                {hasResumes && (
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
                    {/* Bulk Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkDelete("all")}
                        disabled={bulkDeleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2Icon className="h-4 w-4 mr-1" />
                        Delete All
                      </Button>
                      {hasSelectedResumes && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkDelete("selected")}
                          disabled={bulkDeleting}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2Icon className="h-4 w-4 mr-1" />
                          Delete Selected ({selectedResumes.length})
                        </Button>
                      )}
                    </div>

                    {/* Sort Controls */}
                    <div className="flex items-center gap-2 ml-auto">
                      <ArrowUpDownIcon className="h-4 w-4 text-slate-500" />
                      <Label htmlFor="sort-select" className="text-sm font-medium">
                        Sort:
                      </Label>
                      <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                        <SelectTrigger className="w-48" id="sort-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hasMatchedResumes && (
                            <>
                              <SelectItem value="fit-desc">Fit Score (High to Low)</SelectItem>
                              <SelectItem value="fit-asc">Fit Score (Low to High)</SelectItem>
                              <SelectItem value="similarity-desc">Similarity (High to Low)</SelectItem>
                              <SelectItem value="similarity-asc">Similarity (Low to High)</SelectItem>
                            </>
                          )}
                          <SelectItem value="name-asc">Name (A to Z)</SelectItem>
                          <SelectItem value="name-desc">Name (Z to A)</SelectItem>
                          <SelectItem value="date-desc">Upload Date (Newest First)</SelectItem>
                          <SelectItem value="date-asc">Upload Date (Oldest First)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {resumes.length === 0 ? (
                  <div className="text-center py-12">
                    <UserIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No candidates yet</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Upload your first resume to get started with AI matching
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Select All Control */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {allSelected ? "Deselect All" : "Select All"}
                      </span>
                      {hasMatchedResumes && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {resumesWithStatus.filter((r) => r.isMatched).length} analyzed
                        </Badge>
                      )}
                    </div>

                    {/* Simplified Resume List */}
                    {sortedResumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={resume.selected || false}
                            onChange={() => toggleResumeSelection(resume.id)}
                            className="rounded border-gray-300"
                          />
                          <UserIcon className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900">{resume.candidate}</p>
                            <p className="text-sm text-slate-500">Uploaded {formatDate(resume.when)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Match Status & Quick Scores */}
                          {resume.isMatched && resume.matchResult ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Sim: {(resume.matchResult.similarity * 100).toFixed(1)}%
                              </Badge>
                              <Badge
                                className={getScoreBadgeColor(
                                  resume.matchResult.fitScore !== undefined
                                    ? resume.matchResult.fitScore
                                    : resume.matchResult.similarity
                                )}
                              >
                                Fit:{" "}
                                {(
                                  (resume.matchResult.fitScore !== undefined
                                    ? resume.matchResult.fitScore
                                    : resume.matchResult.similarity) * 100
                                ).toFixed(1)}
                                %
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline" className="border-orange-200 text-orange-700">
                              ⏳ Pending Analysis
                            </Badge>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteResume(resume)}
                            disabled={deleting === resume.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
