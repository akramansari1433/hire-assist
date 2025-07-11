import { Button } from "@/components/ui/button";
import { TableIcon, GridIcon } from "lucide-react";
import { ViewMode } from "../../types";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex gap-1 border rounded-md p-1">
      <Button
        variant={value === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("table")}
        className="px-2 py-1 h-7"
      >
        <TableIcon className="h-4 w-4" />
      </Button>
      <Button
        variant={value === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("cards")}
        className="px-2 py-1 h-7"
      >
        <GridIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
