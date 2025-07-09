import { SearchIcon } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="flex items-center gap-2">
      <SearchIcon className="h-4 w-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search candidates..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1 border rounded-md text-sm w-48"
      />
    </div>
  );
}
