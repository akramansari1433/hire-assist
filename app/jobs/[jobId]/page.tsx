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
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
}

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newResume, setNewResume] = useState({ candidateName: "", fullText: "" });
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchResumes();
    }
  }, [jobId]);

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

  const runMatching = async () => {
    if (!job) return;

    setMatching(true);
    setMatchResults([]);

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
    } catch (error) {
      console.error("Error running matching:", error);
      alert(`Matching error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setMatching(false);
    }
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
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Resume</DialogTitle>
                        <DialogDescription>Add a new candidate resume for this job.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
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
                            rows={8}
                          />
                        </div>
                        <Button
                          onClick={handleUploadResume}
                          disabled={uploading || !newResume.candidateName || !newResume.fullText}
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
                    {resumes.map((resume) => (
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
                    <Button onClick={runMatching} disabled={matching} size="sm">
                      {matching ? "Analyzing..." : "Run Matching"}
                    </Button>
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
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">
                              {resumes.find((r) => r.id === result.resumeId)?.candidate || "Unknown"}
                            </h4>
                            <Badge className={getScoreBadgeColor(result.similarity)}>
                              {(result.similarity * 100).toFixed(1)}% Match
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {result.summary || "Analysis completed"}
                          </p>
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
