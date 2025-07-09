import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResumeWithStatus } from "../../types";

interface DeleteResumeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resume: ResumeWithStatus | null;
  deleting: boolean;
  onConfirm: () => Promise<void>;
}

export function DeleteResumeDialog({ isOpen, onOpenChange, resume, deleting, onConfirm }: DeleteResumeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Resume</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{resume?.candidate}&quot;? This will permanently delete:
            <br />
            <br />
            • The resume and all its data
            <br />
            • All AI comparisons for this candidate
            <br />
            • All vector embeddings in Pinecone
            <br />
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Resume"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
