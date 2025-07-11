import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface Job {
  id: number;
  title: string;
  jdText: string;
  createdAt: string;
}

interface DeleteJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobToDelete: Job | null;
  deleting: boolean;
  onConfirm: () => void;
}

export default function DeleteJobDialog({
  open,
  onOpenChange,
  jobToDelete,
  deleting,
  onConfirm,
}: DeleteJobDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Job</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{jobToDelete?.title}&quot;? This will permanently delete:
            <br />
            <br />
            • The job posting
            <br />
            • All uploaded resumes for this job
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Job"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
