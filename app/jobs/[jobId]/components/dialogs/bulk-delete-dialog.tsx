import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deleteType?: "selected" | "all";
  totalResumes: number;
  selectedCount: number;
  bulkDeleting: boolean;
  onConfirm: () => Promise<void>;
}

export function BulkDeleteDialog({
  isOpen,
  onOpenChange,
  deleteType = "selected",
  totalResumes,
  selectedCount,
  bulkDeleting,
  onConfirm,
}: BulkDeleteDialogProps) {
  const count = deleteType === "all" ? totalResumes : selectedCount;
  const title = deleteType === "all" ? "Delete All Resumes" : "Delete Selected Resumes";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {deleteType === "all"
              ? `Are you sure you want to delete ALL ${totalResumes} resumes?`
              : `Are you sure you want to delete ${selectedCount} selected resume${selectedCount > 1 ? "s" : ""}?`}
            <br />
            <br />
            This will permanently delete:
            <br />
            • All resume data and text
            <br />
            • All AI comparisons and analysis
            <br />
            • All vector embeddings in Pinecone
            <br />
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={bulkDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={bulkDeleting}>
            {bulkDeleting ? "Deleting..." : `Delete ${deleteType === "all" ? "All" : count}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
