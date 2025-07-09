import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowUpDownIcon } from "lucide-react";
import { SortOption } from "../../types";

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDownIcon className="h-4 w-4 text-slate-500" />
      <Label className="text-sm font-medium">Sort:</Label>
      <Select value={value} onValueChange={(value: SortOption) => onChange(value)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fit-desc">Fit Score (High to Low)</SelectItem>
          <SelectItem value="fit-asc">Fit Score (Low to High)</SelectItem>
          <SelectItem value="similarity-desc">Similarity (High to Low)</SelectItem>
          <SelectItem value="similarity-asc">Similarity (Low to High)</SelectItem>
          <SelectItem value="name-asc">Name (A to Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z to A)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
