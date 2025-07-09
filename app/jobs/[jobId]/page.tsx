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
import { Label } from "@/components/ui/label";
import { PlusIcon, ArrowLeftIcon, UserIcon, CheckCircleIcon } from "lucide-react";

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
}

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesWithStatus, setResumesWithStatus] = useState<ResumeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newResume, setNewResume] = useState({ candidateName: "", fullText: "" });
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [expandedMatching, setExpandedMatching] = useState<{ [key: number]: boolean }>({});
  const [expandedMissing, setExpandedMissing] = useState<{ [key: number]: boolean }>({});

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

        // Set existing match results for display
        if (comparisons.length > 0) {
          const enrichedResults = comparisons.map((comp: ComparisonFromAPI) => {
            const resume = resumes.find((r) => r.id === comp.resumeId);
            return {
              resumeId: comp.resumeId,
              similarity: comp.similarity,
              fitScore: comp.fitScore,
              summary: comp.summary,
              matching_skills: comp.matchingSkills || [],
              missing_skills: comp.missingSkills || [],
              candidateName: resume?.candidate || "Unknown Candidate",
              createdAt: comp.createdAt,
            };
          });
          setMatchResults(enrichedResults);
        }
      }
    } catch (error) {
      console.error("Error fetching existing comparisons:", error);
    }
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
        body: JSON.stringify({
          userId: "user-123",
          topK: 20,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(`Matching failed: ${response.status} - ${errorText}`);
        return;
      }

      const results = await response.json();

      // Enrich results with candidate names
      const enrichedResults = results.map((result: MatchResult) => {
        const resume = resumes.find((r) => r.id === result.resumeId);
        return {
          ...result,
          candidateName: resume?.candidate || "Unknown Candidate",
        };
      });

      setMatchResults(enrichedResults);

      // Refresh the comparisons to update the UI
      await fetchExistingComparisons();
    } catch (error) {
      console.error("Error running matching:", error);
      alert(`Matching error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setMatching(false);
    }
  };

  const getMatchingButtonText = () => {
    const unmatchedCount = resumesWithStatus.filter((r) => !r.isMatched).length;
    const totalCount = resumesWithStatus.length;

    if (totalCount === 0) return "Run Matching";
    if (unmatchedCount === 0) return "All Matched";
    if (unmatchedCount === totalCount) return "Run Matching";
    return `Match ${unmatchedCount} New`;
  };

  const shouldDisableMatching = () => {
    const unmatchedCount = resumesWithStatus.filter((r) => !r.isMatched).length;
    return matching || unmatchedCount === 0;
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

  const toggleMatchingSkills = (resumeId: number) => {
    setExpandedMatching((prev) => ({ ...prev, [resumeId]: !prev[resumeId] }));
  };

  const toggleMissingSkills = (resumeId: number) => {
    setExpandedMissing((prev) => ({ ...prev, [resumeId]: !prev[resumeId] }));
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
        <div className="flex items-center gap-4 mb-6">
          <Link href="/jobs">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{job.title}</h1>
            <p className="text-slate-600 dark:text-slate-400">Created {formatDate(job.createdAt)}</p>
          </div>
        </div>

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

          {/* Resume Management */}
          <div className="space-y-6">
            {/* Upload Resume */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resumes ({resumes.length})</CardTitle>
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
              </CardHeader>
              <CardContent>
                {resumes.length === 0 ? (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">No resumes uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(resumesWithStatus.length > 0
                      ? resumesWithStatus
                      : resumes.map((r) => ({ ...r, isMatched: false, matchResult: undefined }))
                    ).map((resume) => (
                      <div
                        key={resume.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <UserIcon className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium">{resume.candidate}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Uploaded {formatDate(resume.when)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {resume.isMatched ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">✅ Matched</Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-200 text-orange-700">
                              ⏳ Pending
                            </Badge>
                          )}
                          {resume.isMatched && resume.matchResult && (
                            <div className="flex gap-1">
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
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Matching */}
            {resumes.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>AI Matching</CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={() => runMatching()} disabled={shouldDisableMatching()} size="sm">
                        {matching ? "Analyzing..." : getMatchingButtonText()}
                      </Button>
                      {matchResults.length > 0 && (
                        <Button onClick={() => runMatching(true)} disabled={matching} variant="outline" size="sm">
                          Re-analyze All
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription>Analyze how well candidates match this job using AI</CardDescription>
                </CardHeader>
                <CardContent>
                  {matching ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse">Analyzing candidates...</div>
                    </div>
                  ) : matchResults.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium">Found {matchResults.length} matches</span>
                      </div>
                      {matchResults.map((result) => (
                        <div key={result.resumeId} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">
                              {resumes.find((r) => r.id === result.resumeId)?.candidate || "Unknown"}
                            </h4>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                Sim: {(result.similarity * 100).toFixed(1)}%
                              </Badge>
                              <Badge
                                className={getScoreBadgeColor(
                                  result.fitScore !== undefined ? result.fitScore : result.similarity
                                )}
                              >
                                Fit:{" "}
                                {((result.fitScore !== undefined ? result.fitScore : result.similarity) * 100).toFixed(
                                  1
                                )}
                                %
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {result.summary || "Analysis completed"}
                          </p>

                          {/* Matching Skills */}
                          {result.matching_skills && result.matching_skills.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                                ✅ Matching Skills ({result.matching_skills.length})
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {(expandedMatching[result.resumeId]
                                  ? result.matching_skills
                                  : result.matching_skills.slice(0, 6)
                                ).map((skill, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="bg-green-100 text-green-800 text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {result.matching_skills.length > 6 && (
                                  <button
                                    onClick={() => toggleMatchingSkills(result.resumeId)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors"
                                  >
                                    {expandedMatching[result.resumeId]
                                      ? "Show less"
                                      : `+${result.matching_skills.length - 6} more`}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Missing Skills */}
                          {result.missing_skills && result.missing_skills.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                                ⚠️ Missing Skills ({result.missing_skills.length})
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {(expandedMissing[result.resumeId]
                                  ? result.missing_skills
                                  : result.missing_skills.slice(0, 6)
                                ).map((skill, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-800 text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {result.missing_skills.length > 6 && (
                                  <button
                                    onClick={() => toggleMissingSkills(result.resumeId)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 border border-orange-200 rounded-md hover:bg-orange-200 transition-colors"
                                  >
                                    {expandedMissing[result.resumeId]
                                      ? "Show less"
                                      : `+${result.missing_skills.length - 6} more`}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-600 dark:text-slate-400">
                        Click &quot;Run Matching&quot; to analyze candidates
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
