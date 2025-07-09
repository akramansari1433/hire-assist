import { ArrowUpDownIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortOption } from "../../types";

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
      <ArrowUpDownIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
      <Label htmlFor="sort-select" className="text-sm font-medium flex-shrink-0">
        Sort:
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1 min-w-0" id="sort-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fit-desc">Fit Score (High to Low)</SelectItem>
          <SelectItem value="fit-asc">Fit Score (Low to High)</SelectItem>
          <SelectItem value="similarity-desc">Similarity (High to Low)</SelectItem>
          <SelectItem value="similarity-asc">Similarity (Low to High)</SelectItem>
          <SelectItem value="name-asc">Name (A to Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z to A)</SelectItem>
          <SelectItem value="date-desc">Upload Date (Newest First)</SelectItem>
          <SelectItem value="date-asc">Upload Date (Oldest First)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
