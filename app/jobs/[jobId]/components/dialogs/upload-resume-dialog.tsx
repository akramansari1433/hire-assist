import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon, UploadIcon, FileTextIcon, XIcon, Loader2Icon, CheckCircleIcon } from "lucide-react";

interface FileUploadStatus {
  file: File;
  status: "pending" | "processing" | "success" | "error";
  extractedName?: string;
  errorMessage?: string;
}

interface UploadResumeDialogProps {
  uploading: boolean;
  onUpload: (files: File[]) => Promise<void>;
}

export function UploadResumeDialog({ uploading, onUpload }: UploadResumeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileUploadStatus[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleFileSelect = useCallback((files: File[]) => {
    const validFiles: FileUploadStatus[] = [];
    let hasErrors = false;

    for (const file of files) {
      // Validate file type - only PDF
      if (file.type !== "application/pdf") {
        setErrorMessage(`"${file.name}" is not a PDF file. Only PDF files are accepted.`);
        hasErrors = true;
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" is too large. File size must be less than 10MB.`);
        hasErrors = true;
        continue;
      }

      validFiles.push({
        file,
        status: "pending",
      });
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setUploadStatus("idle");
      if (!hasErrors) {
        setErrorMessage("");
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(Array.from(files));
      }
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploadStatus("processing");
      setErrorMessage("");

      // Extract just the files for upload
      const filesToUpload = selectedFiles.map((fileStatus) => fileStatus.file);

      await onUpload(filesToUpload);

      setUploadStatus("success");

      // Auto-close after success
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setUploadStatus("idle");
    setErrorMessage("");
    setIsOpen(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setErrorMessage("");
    }
  };

  const removeAllFiles = () => {
    setSelectedFiles([]);
    setErrorMessage("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Upload Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload Resumes</DialogTitle>
          <DialogDescription>
            Drag and drop PDF resumes or select multiple files. AI will automatically extract candidate names and
            process the content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          {/* File Upload Section */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
              ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"}
              ${selectedFiles.length > 0 ? "border-green-500 bg-green-50" : ""}
              ${uploadStatus === "error" ? "border-red-500 bg-red-50" : ""}
              ${uploadStatus === "success" ? "border-green-500 bg-green-50" : ""}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadStatus === "success" ? (
              <div className="space-y-2">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
                <div className="text-lg font-medium text-green-800">Upload Successful!</div>
                <div className="text-sm text-green-600">
                  {selectedFiles.length} resume{selectedFiles.length > 1 ? "s" : ""} processed and ready for matching
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    <span className="text-blue-600 cursor-pointer hover:underline">Click to upload</span> or drag and
                    drop
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Select multiple PDF files (max 10MB each)</div>
                </div>

                {uploadStatus === "error" && errorMessage && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded mt-4">{errorMessage}</div>
                )}
              </div>
            )}

            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf"
              multiple
              onChange={handleFileInputChange}
              disabled={uploadStatus === "processing"}
            />
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && uploadStatus !== "success" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
                <Button variant="ghost" size="sm" onClick={removeAllFiles}>
                  Clear All
                </Button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedFiles.map((fileStatus, index) => (
                  <div
                    key={`${fileStatus.file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{fileStatus.file.name}</div>
                        <div className="text-sm text-gray-500">
                          {(fileStatus.file.size / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </div>
                    </div>

                    {uploadStatus !== "processing" && (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="flex-shrink-0">
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Status */}
          {uploadStatus === "processing" && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                Processing {selectedFiles.length} resume{selectedFiles.length > 1 ? "s" : ""}...
              </span>
            </div>
          )}

          {/* Upload Button */}
          {selectedFiles.length > 0 && uploadStatus !== "success" && (
            <Button
              onClick={handleUpload}
              disabled={uploading || uploadStatus === "processing"}
              className="w-full"
              size="lg"
            >
              {uploadStatus === "processing" ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Processing Resumes...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Process & Upload {selectedFiles.length} Resume{selectedFiles.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
