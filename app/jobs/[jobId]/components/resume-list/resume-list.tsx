import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { ResumeWithStatus, PaginationState } from "../../types";
import { ResumeListItem } from "./resume-list-item";

interface ResumeListProps {
  resumesWithStatus: ResumeWithStatus[];
  pagination: PaginationState;
  hasAnyResumes: boolean;
  allSelected: boolean;
  hasMatchedResumes: boolean;
  deleting: number | null;
  onToggleSelectAll: () => void;
  onToggleSelection: (resumeId: number) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDelete: (resume: ResumeWithStatus) => void;
  onClearFilters: () => void;
  sortResumes: (resumes: ResumeWithStatus[]) => ResumeWithStatus[];
}

export function ResumeList({
  resumesWithStatus,
  pagination,
  hasAnyResumes,
  allSelected,
  hasMatchedResumes,
  deleting,
  onToggleSelectAll,
  onToggleSelection,
  onPageChange,
  onPageSizeChange,
  onDelete,
  onClearFilters,
  sortResumes,
}: ResumeListProps) {
  const sortedResumes = sortResumes(resumesWithStatus);

  if (pagination.totalItems === 0) {
    return (
      <div className="text-center py-12">
        <UserIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        {!hasAnyResumes ? (
          <>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No candidates yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Upload your first resume to get started with AI matching
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No candidates found matching the current filters
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Try adjusting your search or filter settings</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={onClearFilters}>
                Clear Filters
              </Button>
              <Button variant="outline" onClick={() => onClearFilters()}>
                Show All
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Select All Control */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} className="rounded border-gray-300" />
        <span className="text-sm font-medium text-slate-700">{allSelected ? "Deselect All" : "Select All"}</span>
        {hasMatchedResumes && (
          <Badge variant="outline" className="text-xs ml-auto">
            {resumesWithStatus.filter((r) => r.isMatched).length} analyzed
          </Badge>
        )}
      </div>

      {/* Resume List */}
      {sortedResumes.map((resume) => (
        <ResumeListItem
          key={resume.id}
          resume={resume}
          onToggleSelection={onToggleSelection}
          onDelete={onDelete}
          deleting={deleting}
        />
      ))}

      {/* Pagination */}
      <div className="mt-6 pt-4 border-t">
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          showPageSizeSelector={true}
        />
      </div>
    </div>
  );
}
