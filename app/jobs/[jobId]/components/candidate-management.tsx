// components/CandidateManagement.tsx
import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadResumeDialog } from "./dialogs/upload-resume-dialog";
import { ResumeWithStatus, PaginationState, SortOption } from "../types";
import { Button } from "@/components/ui/button";
import { ResumeList } from "./resume-list/resume-list";
import { BulkDeleteDialog } from "./dialogs/bulk-delete-dialog";
import { SearchInput } from "./filters/search-input";
import { StatusFilter } from "./filters/status-filter";
import { SortSelect } from "./filters/sort-select";

interface CandidateManagementProps {
  jobId: string;
  resumes: ResumeWithStatus[];
  pagination: PaginationState;
  onDataChange: (page?: number, limit?: number, sort?: SortOption, search?: string, status?: string) => Promise<void>;
}

export default function CandidateManagement({ jobId, resumes, pagination, onDataChange }: CandidateManagementProps) {
  // Local state
  const [filters, setFilters] = useState<{
    search: string;
    status: "all" | "matched" | "unmatched";
    sort: SortOption;
  }>({ search: "", status: "all", sort: "fit-desc" });
  const [state, setState] = useState<{
    loading: boolean;
    uploading: boolean;
    bulkDeleting: boolean;
    matching: boolean;
    selected: Set<number>;
  }>({
    loading: false,
    uploading: false,
    bulkDeleting: false,
    matching: false,
    selected: new Set(),
  });

  // Dialog state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteType, setBulkDeleteType] = useState<"selected" | "all">("selected");

  // Handlers for filter changes
  const onSearchChange = (search: string) => {
    setFilters((f) => ({ ...f, search }));
    onDataChange(1, pagination.itemsPerPage, filters.sort, search, filters.status);
  };

  const onStatusChange = (status: "all" | "matched" | "unmatched") => {
    setFilters((f) => ({ ...f, status }));
    onDataChange(1, pagination.itemsPerPage, filters.sort, filters.search, status);
  };

  const onPageChange = (page: number) => {
    onDataChange(page, pagination.itemsPerPage, filters.sort, filters.search, filters.status);
  };

  const onPageSizeChange = (size: number) => {
    onDataChange(1, size, filters.sort, filters.search, filters.status);
  };

  // Selection handlers
  const onToggleSelectAll = () => {
    setState((s) => {
      const allSelected = resumes.length > 0 && resumes.every((r) => s.selected.has(r.id));
      const newSelected = allSelected ? new Set<number>() : new Set(resumes.map((r) => r.id));
      return { ...s, selected: newSelected };
    });
  };

  const onToggleSelection = (resumeId: number) => {
    setState((s) => {
      const newSelected = new Set(s.selected);
      if (newSelected.has(resumeId)) {
        newSelected.delete(resumeId);
      } else {
        newSelected.add(resumeId);
      }
      return { ...s, selected: newSelected };
    });
  };

  // Data modification handlers
  const onUpload = async (files: File[]) => {
    setState((s) => ({ ...s, uploading: true }));
    try {
      const formData = new FormData();

      // Append all files to FormData
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/jobs/${jobId}/resumes`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      // Show success/error message
      if (result.errors && result.errors.length > 0) {
        console.warn("Some files failed to process:", result.errors);
        // You could show a toast notification here for partial failures
      }

      onDataChange(1, pagination.itemsPerPage, filters.sort, filters.search, filters.status);
    } catch (error) {
      console.error("Error uploading resumes:", error);
      throw error; // Re-throw so the dialog can handle the error
    } finally {
      setState((s) => ({ ...s, uploading: false }));
    }
  };

  const onRunMatching = async () => {
    setState((s) => ({ ...s, matching: true }));
    try {
      await fetch(`/api/jobs/${jobId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-123", topK: 10 }),
      });
      onDataChange(pagination.currentPage, pagination.itemsPerPage, filters.sort, filters.search, filters.status);
    } catch (error) {
      console.error("Error running matching:", error);
    } finally {
      setState((s) => ({ ...s, matching: false }));
    }
  };

  const confirmBulkDelete = async () => {
    setState((s) => ({ ...s, bulkDeleting: true }));
    try {
      const payload = bulkDeleteType === "all" ? { deleteAll: true } : { resumeIds: Array.from(state.selected) };
      await fetch(`/api/jobs/${jobId}/resumes/bulk-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setState((s) => ({ ...s, selected: new Set<number>(), bulkDeleting: false }));
      closeBulkDeleteDialog();
      onDataChange(1, pagination.itemsPerPage, filters.sort, filters.search, filters.status);
    } catch (error) {
      setState((s) => ({ ...s, bulkDeleting: false }));
      console.error("Error bulk deleting resumes:", error);
    }
  };

  const openBulkDeleteDialog = (type: "selected" | "all") => {
    setBulkDeleteType(type);
    setBulkDeleteDialogOpen(true);
  };

  const closeBulkDeleteDialog = () => {
    setBulkDeleteDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Candidate Management ({pagination.totalItems})</CardTitle>
            <CardDescription>Upload, organize, and manage candidate resumes</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={onRunMatching} disabled={state.matching || resumes.every((r) => r.isMatched)}>
              {state.matching ? "Analyzing..." : `Match ${resumes.filter((r) => !r.isMatched).length}`}
            </Button>
            <UploadResumeDialog uploading={state.uploading} onUpload={onUpload} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {state.selected.size > 0 && state.selected.size < resumes.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openBulkDeleteDialog("selected")}
              disabled={state.bulkDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              Delete Selected ({state.selected.size})
            </Button>
          )}
          {resumes.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openBulkDeleteDialog("all")}
              disabled={state.bulkDeleting}
            >
              Delete All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SearchInput value={filters.search} onChange={onSearchChange} />
            <StatusFilter value={filters.status} onChange={onStatusChange} />
            <SortSelect
              value={filters.sort}
              onChange={(sort) => {
                setFilters((f) => ({ ...f, sort }));
                onDataChange(1, pagination.itemsPerPage, sort, filters.search, filters.status);
              }}
            />
          </div>
          <ResumeList
            resumesWithStatus={resumes}
            pagination={pagination}
            hasAnyResumes={pagination.totalItems > 0}
            allSelected={resumes.length > 0 && resumes.every((r) => state.selected.has(r.id))}
            hasMatchedResumes={resumes.some((r) => r.isMatched)}
            onToggleSelectAll={onToggleSelectAll}
            onToggleSelection={onToggleSelection}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onClearFilters={() => {
              onSearchChange("");
              onStatusChange("all");
            }}
            selectedResumes={state.selected}
          />
        </div>
        {/* Dialogs */}
        <BulkDeleteDialog
          isOpen={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          deleteType={bulkDeleteType}
          totalResumes={resumes.length}
          selectedCount={state.selected.size}
          bulkDeleting={state.bulkDeleting}
          onConfirm={confirmBulkDelete}
        />
      </CardContent>
    </Card>
  );
}
