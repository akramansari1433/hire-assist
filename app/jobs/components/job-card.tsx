import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, CalendarIcon, ArrowRightIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Job {
  id: number;
  title: string;
  jdText: string;
  createdAt: string;
}

interface JobCardProps {
  job: Job;
  onDelete: (job: Job) => void;
  deleting: boolean;
}

export default function JobCard({ job, onDelete, deleting }: JobCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BriefcaseIcon className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-xl">{job.title}</CardTitle>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {formatDate(job.createdAt)}
              </div>
            </div>
            <CardDescription className="line-clamp-2">{job.jdText}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(job)}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Link href={`/jobs/${job.id}`}>
            <Button variant="outline" size="sm">
              <BriefcaseIcon className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Link href={`/jobs/${job.id}/matching`}>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Start Matching
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md rounded-xl bg-white dark:bg-slate-900">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse">
                <div className="h-4 w-4" />
              </div>
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse ml-2" />
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="h-4 w-full max-w-xs bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1" />
            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse ml-2" />
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="mt-8 flex items-center justify-between">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
