import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2Icon } from "lucide-react";
import { ResumeWithStatus, PaginationState, SortOption } from "../types";
import { SearchInput } from "./filters/search-input";
import { StatusFilter } from "./filters/status-filter";
import { SortSelect } from "./filters/sort-select";
import { ResumeList } from "./resume-list/resume-list";
import { UploadResumeDialog } from "./dialogs/upload-resume-dialog";

interface CandidateManagementProps {
  resumesWithStatus: ResumeWithStatus[];
  pagination: PaginationState;
  uploading: boolean;
  bulkDeleting: boolean;
  hasAnyResumes: boolean;
  hasMatchedResumes: boolean;
  allSelected: boolean;
  hasSelectedResumes: boolean;
  selectedResumes: ResumeWithStatus[];
  deleting: number | null;
  search: string;
  statusFilter: "all" | "matched" | "unmatched";
  sortOption: SortOption;
  matching: boolean;

  // Handlers
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "matched" | "unmatched") => void;
  onSortOptionChange: (value: SortOption) => void;
  onToggleSelectAll: () => void;
  onToggleSelection: (resumeId: number) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDelete: (resume: ResumeWithStatus) => void;
  onBulkDelete: (type: "selected" | "all") => void;
  onUploadResume: (candidateName: string, fullText: string) => Promise<void>;
  onRunMatching: () => void;
  getMatchingButtonText: () => string;
  shouldDisableMatching: () => boolean;
  sortResumes: (resumes: ResumeWithStatus[]) => ResumeWithStatus[];
}

export function CandidateManagement({
  resumesWithStatus,
  pagination,
  uploading,
  bulkDeleting,
  hasAnyResumes,
  hasMatchedResumes,
  allSelected,
  hasSelectedResumes,
  selectedResumes,
  deleting,
  search,
  statusFilter,
  sortOption,
  matching,
  onSearchChange,
  onStatusFilterChange,
  onSortOptionChange,
  onToggleSelectAll,
  onToggleSelection,
  onPageChange,
  onPageSizeChange,
  onDelete,
  onBulkDelete,
  onUploadResume,
  onRunMatching,
  getMatchingButtonText,
  shouldDisableMatching,
  sortResumes,
}: CandidateManagementProps) {
  const handleClearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Candidate Management ({pagination.totalItems})</CardTitle>
            <CardDescription>Upload, organize, and manage candidate resumes</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {resumesWithStatus.length > 0 && (
              <Button
                onClick={onRunMatching}
                disabled={shouldDisableMatching()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {matching ? "Analyzing..." : getMatchingButtonText()}
              </Button>
            )}
            <UploadResumeDialog uploading={uploading} onUpload={onUploadResume} />
          </div>
        </div>

        {/* Management Controls */}
        {hasAnyResumes && (
          <div className="space-y-4 pt-4 border-t">
            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <SearchInput value={search} onChange={onSearchChange} />

              {/* Status Filter */}
              <StatusFilter value={statusFilter} onChange={onStatusFilterChange} />

              {/* Sort Controls */}
              <SortSelect value={sortOption} onChange={onSortOptionChange} />
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkDelete("all")}
                disabled={bulkDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2Icon className="h-4 w-4 mr-1" />
                Delete All
              </Button>
              {hasSelectedResumes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkDelete("selected")}
                  disabled={bulkDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2Icon className="h-4 w-4 mr-1" />
                  Delete Selected ({selectedResumes.length})
                </Button>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ResumeList
          resumesWithStatus={resumesWithStatus}
          pagination={pagination}
          hasAnyResumes={hasAnyResumes}
          allSelected={allSelected}
          hasMatchedResumes={hasMatchedResumes}
          deleting={deleting}
          onToggleSelectAll={onToggleSelectAll}
          onToggleSelection={onToggleSelection}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onDelete={onDelete}
          onClearFilters={handleClearFilters}
          sortResumes={sortResumes}
        />
      </CardContent>
    </Card>
  );
}
