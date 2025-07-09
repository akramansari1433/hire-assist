import { Button } from "@/components/ui/button";
import { DownloadIcon, FileTextIcon } from "lucide-react";

interface ExportActionsProps {
  onExportCSV: () => void;
  onGeneratePDF: () => void;
  disabled?: boolean;
}

export function ExportActions({ onExportCSV, onGeneratePDF, disabled = false }: ExportActionsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onExportCSV} disabled={disabled} className="text-xs h-8">
        <DownloadIcon className="h-3 w-3 mr-1" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onGeneratePDF} disabled={disabled} className="text-xs h-8">
        <FileTextIcon className="h-3 w-3 mr-1" />
        PDF
      </Button>
    </div>
  );
}
