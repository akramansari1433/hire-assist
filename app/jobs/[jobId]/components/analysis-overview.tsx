import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3Icon, ArrowRightIcon } from "lucide-react";
import { ComparisonFromAPI } from "../types";

interface AnalysisOverviewProps {
  jobId: string;
  allComparisons: ComparisonFromAPI[];
  loading: boolean;
  matching: boolean;
  onStartAnalysis?: () => void;
}

export function AnalysisOverview({ jobId, allComparisons, loading, matching, onStartAnalysis }: AnalysisOverviewProps) {
  // Analytics calculations based on ALL comparisons, not just current page
  const avgScore =
    allComparisons.length > 0
      ? allComparisons.reduce((sum, comp) => {
          const score = comp.fitScore ?? comp.similarity ?? 0;
          return sum + score;
        }, 0) / allComparisons.length
      : 0;

  const excellentCount = allComparisons.filter((comp) => {
    const score = comp.fitScore ?? comp.similarity ?? 0;
    return score >= 0.8;
  }).length;

  const goodCount = allComparisons.filter((comp) => {
    const score = comp.fitScore ?? comp.similarity ?? 0;
    return score >= 0.6 && score < 0.8;
  }).length;

  const fairCount = allComparisons.filter((comp) => {
    const score = comp.fitScore ?? comp.similarity ?? 0;
    return score >= 0.4 && score < 0.6;
  }).length;

  const poorCount = allComparisons.filter((comp) => {
    const score = comp.fitScore ?? comp.similarity ?? 0;
    return score < 0.4;
  }).length;

  const topCandidate =
    allComparisons.length > 0
      ? allComparisons.reduce((top, current) => {
          const currentScore = current.fitScore ?? current.similarity ?? 0;
          const topScore = top.fitScore ?? top.similarity ?? 0;
          return currentScore > topScore ? current : top;
        })
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Overview</CardTitle>
        <CardDescription>Quick insights and candidate summary</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || matching ? (
          <div className="text-center py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        ) : allComparisons.length > 0 ? (
          <div className="space-y-4">
            {/* Main Statistics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">{allComparisons.length}</div>
                <div className="text-sm text-blue-600 dark:text-blue-300">Candidates Analyzed</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-200">
                  {(avgScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-green-600 dark:text-green-300">Average Fit Score</div>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Performance Breakdown</h4>
              <div className="space-y-2">
                {[
                  {
                    label: "Excellent",
                    count: excellentCount,
                    color: "bg-green-500",
                    percentage: allComparisons.length > 0 ? (excellentCount / allComparisons.length) * 100 : 0,
                  },
                  {
                    label: "Good",
                    count: goodCount,
                    color: "bg-yellow-500",
                    percentage: allComparisons.length > 0 ? (goodCount / allComparisons.length) * 100 : 0,
                  },
                  {
                    label: "Fair",
                    count: fairCount,
                    color: "bg-orange-500",
                    percentage: allComparisons.length > 0 ? (fairCount / allComparisons.length) * 100 : 0,
                  },
                  {
                    label: "Poor",
                    count: poorCount,
                    color: "bg-red-500",
                    percentage: allComparisons.length > 0 ? (poorCount / allComparisons.length) * 100 : 0,
                  },
                ].map(({ label, count, color, percentage }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-slate-500">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Candidate */}
            {topCandidate && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Top Candidate</h4>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{topCandidate.candidateName}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {((topCandidate.fitScore ?? topCandidate.similarity ?? 0) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {topCandidate.summary || "No summary available"}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation to Full Analysis */}
            <div className="pt-4 border-t">
              <Link href={`/jobs/${jobId}/matching`}>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <BarChart3Icon className="h-4 w-4 mr-2" />
                  View Detailed Analysis Dashboard
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3Icon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">No analysis data available yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
              Upload resumes and run matching to see insights
            </p>
            {onStartAnalysis && (
              <Button onClick={onStartAnalysis} disabled={matching} className="bg-blue-600 hover:bg-blue-700">
                {matching ? "Analyzing..." : "Start Analysis"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
