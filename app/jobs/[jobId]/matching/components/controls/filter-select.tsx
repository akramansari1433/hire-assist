import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FilterIcon } from "lucide-react";
import { FilterOption } from "../../types";

interface FilterSelectProps {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
}

export function FilterSelect({ value, onChange }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <FilterIcon className="h-4 w-4 text-slate-500" />
      <Label className="text-sm font-medium">Filter:</Label>
      <Select value={value} onValueChange={(value: FilterOption) => onChange(value)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Candidates</SelectItem>
          <SelectItem value="excellent">Excellent (80%+)</SelectItem>
          <SelectItem value="good">Good (60-79%)</SelectItem>
          <SelectItem value="fair">Fair (40-59%)</SelectItem>
          <SelectItem value="poor">Poor (&lt;40%)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
