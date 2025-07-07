"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryIcon, SearchIcon, CalendarIcon, FilterIcon, DownloadIcon, StarIcon, ClockIcon } from "lucide-react";

interface HistoryRecord {
  when: string;
  job: string;
  candidate: string;
  fitScore: number;
  matching: string[];
  missing: string[];
  verdict: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterScore, setFilterScore] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history", {
        headers: {
          "x-user-id": "user-123", // In a real app, this would come from auth
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((record) => {
    const matchesSearch =
      record.job.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.candidate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.verdict.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filterScore === "high") matchesFilter = record.fitScore >= 0.8;
    else if (filterScore === "medium") matchesFilter = record.fitScore >= 0.5 && record.fitScore < 0.8;
    else if (filterScore === "low") matchesFilter = record.fitScore < 0.5;

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 0.5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "High Match";
    if (score >= 0.5) return "Medium Match";
    return "Low Match";
  };

  const totalMatches = history.length;
  const highMatches = history.filter((h) => h.fitScore >= 0.8).length;
  const mediumMatches = history.filter((h) => h.fitScore >= 0.5 && h.fitScore < 0.8).length;
  const lowMatches = history.filter((h) => h.fitScore < 0.5).length;
  const averageScore =
    totalMatches > 0 ? Math.round((history.reduce((acc, h) => acc + h.fitScore, 0) / totalMatches) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Matching History</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Complete audit trail of all matching results and AI decisions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <DownloadIcon className="h-4 w-4" />
              Export Data
            </Button>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <ClockIcon className="h-3 w-3 mr-1" />
              Full Audit Trail
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{totalMatches}</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Matches</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">{highMatches}</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">High Matches</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-1">{mediumMatches}</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Medium Matches</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">{averageScore}%</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilterIcon className="h-5 w-5 text-orange-500" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search jobs, candidates, or verdicts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filterScore === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterScore("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterScore === "high" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterScore("high")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      High (80%+)
                    </Button>
                    <Button
                      variant={filterScore === "medium" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterScore("medium")}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Medium (50-79%)
                    </Button>
                    <Button
                      variant={filterScore === "low" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterScore("low")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Low (&lt;50%)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History Cards */}
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="animate-pulse">Loading history...</div>
                  </div>
                </CardContent>
              </Card>
            ) : filteredHistory.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <HistoryIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No history found</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {searchTerm || filterScore !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "Start running matches to build your history."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((record, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500 rounded-lg">
                            <StarIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {record.candidate}
                              <span className="text-sm font-normal text-slate-500">for</span>
                              {record.job}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {formatDate(record.when)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getScoreBadgeColor(record.fitScore)}>
                            {Math.round(record.fitScore * 100)}% • {getScoreLabel(record.fitScore)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                          {record.verdict}
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 text-sm">
                              Matching Skills ({record.matching?.length || 0})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {record.matching?.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {record.matching?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{record.matching.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 text-sm">Missing Skills ({record.missing?.length || 0})</h4>
                            <div className="flex flex-wrap gap-1">
                              {record.missing?.slice(0, 3).map((skill, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="bg-red-50 text-red-700 border-red-200 text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {record.missing?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{record.missing.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed History Table</CardTitle>
                <CardDescription>Complete tabular view of all matching records</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Verdict</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm">{formatDate(record.when)}</TableCell>
                        <TableCell className="font-medium">{record.job}</TableCell>
                        <TableCell>{record.candidate}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${getScoreColor(record.fitScore)}`}>
                            {Math.round(record.fitScore * 100)}%
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-sm">{record.verdict}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Matches (80%+)</span>
                      <span className="text-sm font-medium text-green-600">{highMatches}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium Matches (50-79%)</span>
                      <span className="text-sm font-medium text-yellow-600">{mediumMatches}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low Matches (&lt;50%)</span>
                      <span className="text-sm font-medium text-red-600">{lowMatches}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Evaluations</span>
                      <span className="text-sm font-medium">{totalMatches}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Score</span>
                      <span className="text-sm font-medium">{averageScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-sm font-medium text-green-600">
                        {totalMatches > 0 ? Math.round(((highMatches + mediumMatches) / totalMatches) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
