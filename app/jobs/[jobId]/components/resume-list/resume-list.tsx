import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { ResumeWithStatus, PaginationState } from "../../types";
import { ResumeListItem } from "./resume-list-item";

interface ResumeListProps {
  resumesWithStatus: ResumeWithStatus[];
  pagination: PaginationState;
  hasAnyResumes: boolean;
  allSelected: boolean;
  hasMatchedResumes: boolean;
  onToggleSelectAll: () => void;
  onToggleSelection: (resumeId: number) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onClearFilters: () => void;
  selectedResumes: Set<number>;
}

export function ResumeList({
  resumesWithStatus,
  pagination,
  hasAnyResumes,
  allSelected,
  hasMatchedResumes,
  onToggleSelectAll,
  onToggleSelection,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
  selectedResumes,
}: ResumeListProps) {
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
        <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} />
        <span className="text-sm font-medium text-slate-700">{allSelected ? "Deselect All" : "Select All"}</span>
        {hasMatchedResumes && (
          <Badge variant="outline" className="text-xs ml-auto">
            {resumesWithStatus.filter((r) => r.isMatched).length} analyzed
          </Badge>
        )}
      </div>

      {/* Resume List */}
      {resumesWithStatus.map((resume) => (
        <ResumeListItem
          key={resume.id}
          resume={resume}
          onToggleSelection={onToggleSelection}
          selected={selectedResumes.has(resume.id)}
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
