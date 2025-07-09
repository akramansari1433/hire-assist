"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  UserIcon,
  ArrowUpDownIcon,
  BarChart3Icon,
  TableIcon,
  GridIcon,
  TrendingUpIcon,
  TargetIcon,
  DownloadIcon,
  FileTextIcon,
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

type SortOption = "fit-desc" | "fit-asc" | "similarity-desc" | "similarity-asc" | "name-asc" | "name-desc";

type ViewMode = "table" | "cards";

type FilterOption = "all" | "excellent" | "good" | "fair" | "poor";

export default function MatchingPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatching, setExpandedMatching] = useState<{ [key: number]: boolean }>({});
  const [expandedMissing, setExpandedMissing] = useState<{ [key: number]: boolean }>({});
  const [sortOption, setSortOption] = useState<SortOption>("fit-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");

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

  const sortResults = (results: MatchResult[], option: SortOption): MatchResult[] => {
    return [...results].sort((a, b) => {
      switch (option) {
        case "fit-desc":
          const aFit = a.fitScore !== undefined ? a.fitScore : a.similarity;
          const bFit = b.fitScore !== undefined ? b.fitScore : b.similarity;
          return bFit - aFit;
        case "fit-asc":
          const aFitAsc = a.fitScore !== undefined ? a.fitScore : a.similarity;
          const bFitAsc = b.fitScore !== undefined ? b.fitScore : b.similarity;
          return aFitAsc - bFitAsc;
        case "similarity-desc":
          return b.similarity - a.similarity;
        case "similarity-asc":
          return a.similarity - b.similarity;
        case "name-asc":
          return (a.candidateName || "").localeCompare(b.candidateName || "");
        case "name-desc":
          return (b.candidateName || "").localeCompare(a.candidateName || "");
        default:
          return 0;
      }
    });
  };

  const filterResults = (results: MatchResult[], filter: FilterOption): MatchResult[] => {
    if (filter === "all") return results;

    return results.filter((result) => {
      const score = result.fitScore !== undefined ? result.fitScore : result.similarity;
      switch (filter) {
        case "excellent":
          return score >= 0.8;
        case "good":
          return score >= 0.6 && score < 0.8;
        case "fair":
          return score >= 0.4 && score < 0.6;
        case "poor":
          return score < 0.4;
        default:
          return true;
      }
    });
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Good";
    if (score >= 0.4) return "Fair";
    return "Poor";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (score >= 0.4) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const toggleMatchingSkills = (resumeId: number) => {
    setExpandedMatching((prev) => ({ ...prev, [resumeId]: !prev[resumeId] }));
  };

  const toggleMissingSkills = (resumeId: number) => {
    setExpandedMissing((prev) => ({ ...prev, [resumeId]: !prev[resumeId] }));
  };

  // Export functions
  const exportToCSV = () => {
    const headers = [
      "Rank",
      "Candidate",
      "Fit Score (%)",
      "Similarity (%)",
      "Grade",
      "Matching Skills",
      "Missing Skills",
      "Summary",
    ];
    const csvData = sortedAndFilteredResults.map((result, index) => {
      const fitScore = result.fitScore !== undefined ? result.fitScore : result.similarity;
      return [
        index + 1,
        `"${result.candidateName}"`,
        (fitScore * 100).toFixed(1),
        (result.similarity * 100).toFixed(1),
        getScoreLabel(fitScore),
        `"${result.matching_skills.join(", ")}"`,
        `"${result.missing_skills.join(", ")}"`,
        `"${result.summary.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${job?.title || "job"}-analysis-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDFReport = () => {
    // Create a printable HTML report
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analysis Report - ${job?.title || "Job"}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          h2 { color: #475569; margin-top: 30px; }
          .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .analytics { display: flex; gap: 20px; margin: 20px 0; }
          .metric { background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #1e293b; }
          .metric-label { font-size: 12px; color: #64748b; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-weight: 600; }
          .grade-excellent { color: #16a34a; font-weight: bold; }
          .grade-good { color: #ca8a04; font-weight: bold; }
          .grade-fair { color: #ea580c; font-weight: bold; }
          .grade-poor { color: #dc2626; font-weight: bold; }
          .skills { font-size: 12px; }
          .generated { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Candidate Analysis Report</h1>
        <div class="summary">
          <h2>Job: ${job?.title || "Unknown"}</h2>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p><strong>Total Candidates Analyzed:</strong> ${analytics.total}</p>
          <p><strong>Average Score:</strong> ${(analytics.averageScore * 100).toFixed(1)}%</p>
        </div>

        <h2>Performance Summary</h2>
        <div class="analytics">
          <div class="metric">
            <div class="metric-value" style="color: #16a34a;">${analytics.excellent}</div>
            <div class="metric-label">Excellent (80%+)</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #ca8a04;">${analytics.good}</div>
            <div class="metric-label">Good (60-79%)</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #ea580c;">${analytics.fair}</div>
            <div class="metric-label">Fair (40-59%)</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #dc2626;">${analytics.poor}</div>
            <div class="metric-label">Poor (<40%)</div>
          </div>
        </div>

        <h2>Detailed Results</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Candidate</th>
              <th>Fit Score</th>
              <th>Grade</th>
              <th>Key Matching Skills</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            ${sortedAndFilteredResults
              .map((result, index) => {
                const fitScore = result.fitScore !== undefined ? result.fitScore : result.similarity;
                const grade = getScoreLabel(fitScore);
                const gradeClass =
                  fitScore >= 0.8
                    ? "grade-excellent"
                    : fitScore >= 0.6
                    ? "grade-good"
                    : fitScore >= 0.4
                    ? "grade-fair"
                    : "grade-poor";
                return `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${result.candidateName}</strong></td>
                  <td>${(fitScore * 100).toFixed(1)}%</td>
                  <td class="${gradeClass}">${grade}</td>
                  <td class="skills">${result.matching_skills.slice(0, 5).join(", ")}</td>
                  <td class="skills">${result.summary}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>

        <div class="generated">
          Report generated by Hire Assist • ${new Date().toISOString()}
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Analytics calculations
  const analytics = {
    total: matchResults.length,
    excellent: matchResults.filter((r) => (r.fitScore || r.similarity) >= 0.8).length,
    good: matchResults.filter((r) => (r.fitScore || r.similarity) >= 0.6 && (r.fitScore || r.similarity) < 0.8).length,
    fair: matchResults.filter((r) => (r.fitScore || r.similarity) >= 0.4 && (r.fitScore || r.similarity) < 0.6).length,
    poor: matchResults.filter((r) => (r.fitScore || r.similarity) < 0.4).length,
    averageScore:
      matchResults.length > 0
        ? matchResults.reduce((sum, r) => sum + (r.fitScore || r.similarity), 0) / matchResults.length
        : 0,
  };

  const sortedAndFilteredResults = filterResults(sortResults(matchResults, sortOption), filterOption);

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
            <Link href={`/jobs/${jobId}`} className="group">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
              >
                Job Details
              </Button>
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-sm font-medium text-slate-700">Analysis Dashboard</span>
          </div>

          {/* Title Section */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Analysis Dashboard</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">{job.title}</span>
                {matchResults.length > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      {analytics.total} candidate{analytics.total !== 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">{analytics.excellent} excellent</span>
                    {analytics.averageScore > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">
                          {(analytics.averageScore * 100).toFixed(1)}% avg
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            {resumes.length > 0 && (
              <Button onClick={runMatching} disabled={matching} className="bg-green-600 hover:bg-green-700">
                {matching ? "Analyzing..." : "Run New Analysis"}
              </Button>
            )}
          </div>
        </div>

        {/* Analytics Overview */}
        {matchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{analytics.total}</p>
                    <p className="text-xs text-slate-600">Total Analyzed</p>
                  </div>
                  <TargetIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{analytics.excellent}</p>
                    <p className="text-xs text-slate-600">Excellent (80%+)</p>
                  </div>
                  <TrendingUpIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{analytics.good}</p>
                    <p className="text-xs text-slate-600">Good (60-79%)</p>
                  </div>
                  <BarChart3Icon className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{analytics.fair}</p>
                    <p className="text-xs text-slate-600">Fair (40-59%)</p>
                  </div>
                  <BarChart3Icon className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{(analytics.averageScore * 100).toFixed(1)}%</p>
                    <p className="text-xs text-slate-600">Average Score</p>
                  </div>
                  <TargetIcon className="h-8 w-8 text-slate-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls & Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Candidate Analysis Results</CardTitle>
                <CardDescription>Advanced sorting, filtering, and comparison tools</CardDescription>
              </div>
              {matchResults.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Showing {sortedAndFilteredResults.length} of {matchResults.length} candidates
                </Badge>
              )}
            </div>

            {/* Advanced Controls */}
            {matchResults.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDownIcon className="h-4 w-4 text-slate-500" />
                  <Label className="text-sm font-medium">Sort:</Label>
                  <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit-desc">Fit Score (High to Low)</SelectItem>
                      <SelectItem value="fit-asc">Fit Score (Low to High)</SelectItem>
                      <SelectItem value="similarity-desc">Similarity (High to Low)</SelectItem>
                      <SelectItem value="similarity-asc">Similarity (Low to High)</SelectItem>
                      <SelectItem value="name-asc">Name (A to Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z to A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Filter:</Label>
                  <Select value={filterOption} onValueChange={(value: FilterOption) => setFilterOption(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="excellent">Excellent (80%+)</SelectItem>
                      <SelectItem value="good">Good (60-79%)</SelectItem>
                      <SelectItem value="fair">Fair (40-59%)</SelectItem>
                      <SelectItem value="poor">Poor (&lt;40%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode */}
                <div className="flex items-center gap-2 ml-auto">
                  <Label className="text-sm font-medium">View:</Label>
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="rounded-r-none"
                    >
                      <TableIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "cards" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                      className="rounded-l-none"
                    >
                      <GridIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Export Options */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Export:</Label>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="text-xs">
                      <DownloadIcon className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={generatePDFReport} className="text-xs">
                      <FileTextIcon className="h-3 w-3 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
              <div>
                {viewMode === "table" ? (
                  /* Table View */
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Rank</th>
                          <th className="text-left p-3 font-medium">Candidate</th>
                          <th className="text-left p-3 font-medium">Fit Score</th>
                          <th className="text-left p-3 font-medium">Similarity</th>
                          <th className="text-left p-3 font-medium">Grade</th>
                          <th className="text-left p-3 font-medium">Matching Skills</th>
                          <th className="text-left p-3 font-medium">Missing Skills</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAndFilteredResults.map((result, index) => {
                          const fitScore = result.fitScore !== undefined ? result.fitScore : result.similarity;
                          return (
                            <tr key={result.resumeId} className="border-b hover:bg-slate-50">
                              <td className="p-3">
                                <Badge variant="outline" className="font-mono">
                                  #{index + 1}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="font-medium">{result.candidateName}</div>
                                <div className="text-sm text-slate-500 max-w-xs truncate">{result.summary}</div>
                              </td>
                              <td className="p-3">
                                <Badge className={getScoreBadgeColor(fitScore)}>{(fitScore * 100).toFixed(1)}%</Badge>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{(result.similarity * 100).toFixed(1)}%</Badge>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`font-medium ${
                                    fitScore >= 0.8
                                      ? "text-green-600"
                                      : fitScore >= 0.6
                                      ? "text-yellow-600"
                                      : fitScore >= 0.4
                                      ? "text-orange-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {getScoreLabel(fitScore)}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {result.matching_skills.slice(0, 3).map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {result.matching_skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{result.matching_skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {result.missing_skills.slice(0, 3).map((skill, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="bg-orange-100 text-orange-800 text-xs"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                  {result.missing_skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{result.missing_skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Card View */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">Showing {sortedAndFilteredResults.length} results</span>
                    </div>
                    {sortedAndFilteredResults.map((result, index) => {
                      const matchingExpanded = expandedMatching[result.resumeId];
                      const missingExpanded = expandedMissing[result.resumeId];
                      const fitScore = result.fitScore !== undefined ? result.fitScore : result.similarity;

                      return (
                        <div key={result.resumeId} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                #{index + 1}
                              </Badge>
                              <h4 className="font-medium">{result.candidateName}</h4>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                Sim: {(result.similarity * 100).toFixed(1)}%
                              </Badge>
                              <Badge className={getScoreBadgeColor(fitScore)}>
                                Fit: {(fitScore * 100).toFixed(1)}%
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  fitScore >= 0.8
                                    ? "border-green-200 text-green-700"
                                    : fitScore >= 0.6
                                    ? "border-yellow-200 text-yellow-700"
                                    : fitScore >= 0.4
                                    ? "border-orange-200 text-orange-700"
                                    : "border-red-200 text-red-700"
                                }`}
                              >
                                {getScoreLabel(fitScore)}
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
                                {(matchingExpanded ? result.matching_skills : result.matching_skills.slice(0, 6)).map(
                                  (skill, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="bg-green-100 text-green-800 text-xs"
                                    >
                                      {skill}
                                    </Badge>
                                  )
                                )}
                                {result.matching_skills.length > 6 && (
                                  <button
                                    onClick={() => toggleMatchingSkills(result.resumeId)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors"
                                  >
                                    {matchingExpanded ? "Show less" : `+${result.matching_skills.length - 6} more`}
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
                                {(missingExpanded ? result.missing_skills : result.missing_skills.slice(0, 6)).map(
                                  (skill, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="bg-orange-100 text-orange-800 text-xs"
                                    >
                                      {skill}
                                    </Badge>
                                  )
                                )}
                                {result.missing_skills.length > 6 && (
                                  <button
                                    onClick={() => toggleMissingSkills(result.resumeId)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 border border-orange-200 rounded-md hover:bg-orange-200 transition-colors"
                                  >
                                    {missingExpanded ? "Show less" : `+${result.missing_skills.length - 6} more`}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
