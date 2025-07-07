"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SearchIcon,
  BriefcaseIcon,
  UserIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  PlayIcon,
  CalendarIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  jdText: string;
  createdAt: string;
}

interface MatchResult {
  resumeId: number;
  similarity: number;
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
}

export default function MatchingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const runMatching = async (jobId: number) => {
    setLoading(true);
    setMatchResults([]);

    try {
      const response = await fetch(`/api/jobs/${jobId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123", // In a real app, this would come from auth
          topK: 20,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatchResults(data);
      }
    } catch (error) {
      console.error("Error running matching:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => job.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Smart Matching</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              AI-powered candidate matching with detailed analysis and similarity scoring
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <TrendingUpIcon className="h-3 w-3 mr-1" />
              Vector Search
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              GPT-4 Analysis
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="select" className="w-full">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="select">Select Job</TabsTrigger>
            <TabsTrigger value="results">Match Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-6 mt-6">
            {/* Job Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SearchIcon className="h-6 w-6 text-purple-500" />
                  Choose Job for Matching
                </CardTitle>
                <CardDescription>Select a job posting to find and analyze the best matching candidates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid gap-4">
                  {filteredJobs.map((job) => (
                    <Card
                      key={job.id}
                      className={`group hover:shadow-lg transition-all duration-300 cursor-pointer ${
                        selectedJob?.id === job.id ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20" : ""
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <BriefcaseIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{job.title}</CardTitle>
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                                <CalendarIcon className="h-4 w-4" />
                                {formatDate(job.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedJob(job)}>
                              Select
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedJob(job);
                                runMatching(job.id);
                              }}
                              disabled={loading}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              <PlayIcon className="h-4 w-4 mr-2" />
                              Run Matching
                            </Button>
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2 mt-2">{job.jdText}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6 mt-6">
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold mb-2">Analyzing Candidates...</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Running AI-powered matching analysis with GPT-4
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : matchResults.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <SearchIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Select a job from the &ldquo;Select Job&rdquo; tab and run matching to see results
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Match Results</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedJob?.title} • {matchResults.length} candidates analyzed
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{matchResults.length} Matches Found</Badge>
                </div>

                {matchResults.map((result, index) => (
                  <Card key={result.resumeId} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <UserIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              Candidate #{result.resumeId}
                              <Badge className={`text-xs ${getScoreBadgeColor(result.similarity)}`}>
                                {Math.round(result.similarity * 100)}% Match
                              </Badge>
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <StarIcon className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-slate-600 dark:text-slate-400">Rank #{index + 1}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(result.similarity)}`}>
                            {Math.round(result.similarity * 100)}%
                          </div>
                          <Progress value={result.similarity * 100} className="w-20 mt-1" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Summary */}
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <AlertCircleIcon className="h-4 w-4 text-blue-500" />
                            AI Analysis Summary
                          </h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            {result.summary}
                          </p>
                        </div>

                        {/* Skills Match */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              Matching Skills ({result.matching_skills?.length || 0})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {result.matching_skills?.map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <AlertCircleIcon className="h-4 w-4 text-orange-500" />
                              Missing Skills ({result.missing_skills?.length || 0})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {result.missing_skills?.map((skill, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>Resume ID: {result.resumeId}</span>
                          </div>
                          <Button variant="outline" size="sm">
                            View Full Resume
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{matchResults.length}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Matches</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {matchResults.filter((r) => r.similarity >= 0.8).length}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">High Matches (80%+)</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {matchResults.length > 0
                        ? Math.round(
                            (matchResults.reduce((acc, r) => acc + r.similarity, 0) / matchResults.length) * 100
                          )
                        : 0}
                      %
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Average Score</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Matching Overview</CardTitle>
                <CardDescription>Performance metrics and insights from the AI matching process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Detailed analytics will appear here after running matches
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
