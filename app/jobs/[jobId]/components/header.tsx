import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { Job } from "../types";

interface HeaderProps {
  job: Job;
  totalResumesCount: number;
  allComparisons: number;
  formatDate: (dateString: string) => string;
}

export function Header({ job, totalResumesCount, allComparisons, formatDate }: HeaderProps) {
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
        <span className="text-sm font-medium text-slate-700">Job Details</span>
      </div>

      {/* Title Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{job.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span>Created {formatDate(job.createdAt)}</span>
            {totalResumesCount > 0 && (
              <>
                <span>•</span>
                <span>
                  {totalResumesCount} candidate{totalResumesCount !== 1 ? "s" : ""}
                </span>
                {allComparisons > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">{allComparisons} analyzed</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
