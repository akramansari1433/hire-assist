import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";

interface UploadResumeDialogProps {
  uploading: boolean;
  onUpload: (candidateName: string, fullText: string) => Promise<void>;
}

export function UploadResumeDialog({ uploading, onUpload }: UploadResumeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [fullText, setFullText] = useState("");

  const handleUpload = async () => {
    if (!candidateName || !fullText) return;

    await onUpload(candidateName, fullText);
    setCandidateName("");
    setFullText("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Upload Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload Resume</DialogTitle>
          <DialogDescription>Add a new candidate resume for this job.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
          <div className="grid gap-2">
            <Label htmlFor="candidateName">Candidate Name</Label>
            <Input
              id="candidateName"
              placeholder="e.g. John Doe"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="resumeText">Resume Text</Label>
            <Textarea
              id="resumeText"
              placeholder="Paste the full resume text here..."
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              rows={6}
              className="max-h-40 resize-none"
            />
          </div>
        </div>
        <div className="border-t pt-4">
          <Button onClick={handleUpload} disabled={uploading || !candidateName || !fullText} className="w-full">
            {uploading ? "Uploading..." : "Upload Resume"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
