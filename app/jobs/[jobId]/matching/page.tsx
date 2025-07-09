"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, CheckCircleIcon, UserIcon } from "lucide-react";

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
  candidateName?: string;
}

interface ComparisonFromAPI {
  resumeId: number;
  similarity: number;
  fitScore?: number;
  matchingSkills: string[];
  missingSkills: string[];
  summary: string;
}

export default function MatchingPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchResumes();
    }
  }, [jobId]);

  // Fetch comparisons after resumes are loaded
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
    if (resumes.length === 0) {
      console.log("No resumes loaded yet, skipping comparisons fetch");
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/comparisons`);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched comparisons:", data.length);
        console.log("Available resumes:", resumes.length);

        const enrichedResults = data.map((result: ComparisonFromAPI) => {
          const resume = resumes.find((r) => r.id === result.resumeId);
          console.log(`Mapping resume ${result.resumeId} to candidate: ${resume?.candidate}`);
          return {
            resumeId: result.resumeId,
            similarity: result.similarity,
            fitScore: result.fitScore !== undefined ? result.fitScore : result.similarity,
            matching_skills: result.matchingSkills || [],
            missing_skills: result.missingSkills || [],
            summary: result.summary || "Previously analyzed candidate",
            candidateName: resume?.candidate || "Unknown Candidate",
          };
        });
        setMatchResults(enrichedResults);
      }
    } catch (error) {
      console.error("Error fetching existing comparisons:", error);
    }
  };

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
            <div className="animate-pulse">Loading...</div>
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/jobs/${jobId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Job Details
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">AI Matching</h1>
            <p className="text-slate-600 dark:text-slate-400">{job.title}</p>
          </div>
        </div>

        {/* Job Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Job Title</h3>
                <p className="text-slate-600 dark:text-slate-400">{job.title}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Candidates</h3>
                <p className="text-slate-600 dark:text-slate-400">{resumes.length} resumes uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matching Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Matching Results</CardTitle>
              <Button onClick={runMatching} disabled={matching || resumes.length === 0}>
                {matching ? "Analyzing..." : "Run New Analysis"}
              </Button>
            </div>
            <CardDescription>AI-powered analysis of how well candidates match this job</CardDescription>
          </CardHeader>
          <CardContent>
            {resumes.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">No resumes uploaded for this job yet</p>
                <Link href={`/jobs/${jobId}`}>
                  <Button className="mt-4">Upload Resumes</Button>
                </Link>
              </div>
            ) : matching ? (
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
                      <h4 className="font-medium">{result.candidateName}</h4>
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
                          {((result.fitScore !== undefined ? result.fitScore : result.similarity) * 100).toFixed(1)}%
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
                          {result.matching_skills.slice(0, 6).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {result.matching_skills.length > 6 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              +{result.matching_skills.length - 6} more
                            </Badge>
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
                          {result.missing_skills.slice(0, 6).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {result.missing_skills.length > 6 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                              +{result.missing_skills.length - 6} more
                            </Badge>
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
                  Click &quot;Run New Analysis&quot; to analyze candidates using AI
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
