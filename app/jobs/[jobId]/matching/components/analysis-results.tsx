import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "./controls/search-input";
import { SortSelect } from "./controls/sort-select";
import { FilterSelect } from "./controls/filter-select";
import { ViewModeToggle } from "./controls/view-mode-toggle";
import { ExportActions } from "./controls/export-actions";
import { ResultsTable, ResultsTableSkeleton } from "./results/results-table";
import { ResultsCards, ResultsCardsSkeleton } from "./results/results-cards";
import { MatchResult, SortOption, ViewMode, FilterOption, PaginationState, Analytics } from "../types";

interface AnalysisResultsProps {
  matchResults: MatchResult[];
  matching: boolean;
  hasAnyResults: boolean;
  analytics: Analytics;
  search: string;
  sortOption: SortOption;
  filterOption: FilterOption;
  viewMode: ViewMode;
  expandedMatching: { [key: number]: boolean };
  expandedMissing: { [key: number]: boolean };
  pagination: PaginationState;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onFilterChange: (value: FilterOption) => void;
  onViewModeChange: (value: ViewMode) => void;
  onToggleMatchingSkills: (resumeId: number) => void;
  onToggleMissingSkills: (resumeId: number) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onExportCSV: () => void;
  onGeneratePDF: () => void;
  loading: boolean;
}

export function AnalysisResults({
  matchResults,
  matching,
  hasAnyResults,
  analytics,
  search,
  sortOption,
  filterOption,
  viewMode,
  expandedMatching,
  expandedMissing,
  pagination,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onViewModeChange,
  onToggleMatchingSkills,
  onToggleMissingSkills,
  onPageChange,
  onPageSizeChange,
  onExportCSV,
  onGeneratePDF,
  loading,
}: AnalysisResultsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Candidate Analysis Results</CardTitle>
            <CardDescription>Advanced sorting, filtering, and comparison tools</CardDescription>
          </div>
          <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
          <SearchInput value={search} onChange={onSearchChange} />
          <SortSelect value={sortOption} onChange={onSortChange} />
          <FilterSelect value={filterOption} onChange={onFilterChange} />
          <div className="ml-auto">
            <ExportActions
              onExportCSV={onExportCSV}
              onGeneratePDF={onGeneratePDF}
              disabled={matchResults.length === 0}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          viewMode === "table" ? (
            <ResultsTableSkeleton />
          ) : (
            <ResultsCardsSkeleton />
          )
        ) : !hasAnyResults && pagination.totalItems === 0 ? (
          <>
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400 mb-4">No candidates found matching your criteria.</p>
              <Button
                onClick={() => {
                  onSearchChange("");
                  onFilterChange("all");
                }}
              >
                Show All ({analytics.total})
              </Button>
            </div>
          </>
        ) : matching ? (
          <div className="text-center py-8">
            <div className="animate-pulse">Analyzing candidates...</div>
          </div>
        ) : matchResults.length > 0 ? (
          <div>
            {viewMode === "table" ? (
              <ResultsTable matchResults={matchResults} />
            ) : (
              <ResultsCards
                matchResults={matchResults}
                expandedMatching={expandedMatching}
                expandedMissing={expandedMissing}
                onToggleMatchingSkills={onToggleMatchingSkills}
                onToggleMissingSkills={onToggleMissingSkills}
              />
            )}

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
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">
              Click &quot;Run New Analysis&quot; to analyze candidates using AI
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
