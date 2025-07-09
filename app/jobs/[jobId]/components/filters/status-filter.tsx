import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusFilterProps {
  value: "all" | "matched" | "unmatched";
  onChange: (value: "all" | "matched" | "unmatched") => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600 flex-shrink-0">Status:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1 min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="matched">Matched</SelectItem>
          <SelectItem value="unmatched">Unmatched</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
