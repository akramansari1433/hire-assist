import { SearchIcon } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search candidates..." }: SearchInputProps) {
  return (
    <div className="flex items-center gap-2">
      <SearchIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1 border rounded-md text-sm flex-1 min-w-0"
      />
    </div>
  );
}
