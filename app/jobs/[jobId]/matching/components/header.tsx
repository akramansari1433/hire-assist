import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { Job, Analytics } from "../types";

interface HeaderProps {
  job: Job;
  analytics: Analytics;
  matching: boolean;
  onRunMatching: () => void;
}

export function Header({ job, analytics, matching, onRunMatching }: HeaderProps) {
  return (
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
        <Link href={`/jobs/${job.id}`} className="group">
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
            <span>•</span>
            <span>
              {analytics.total} candidate{analytics.total !== 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span className="text-green-600 font-medium">{analytics.excellent} excellent</span>
            {analytics.averageScore > 0 && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium">{(analytics.averageScore * 100).toFixed(1)}% avg</span>
              </>
            )}
          </div>
        </div>
        <Button onClick={onRunMatching} disabled={matching} className="bg-blue-600 hover:bg-blue-700">
          {matching ? "Analyzing..." : "Run New Analysis"}
        </Button>
      </div>
    </div>
  );
}
