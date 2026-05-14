"use client";

import { useCallback, useRef, useState } from "react";
import { File as FileIcon, ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";

export type UploadResult = {
  url: string;
  fileName: string;
  fileSize: number;
};

interface FileUploadProps {
  itemType: "file" | "image";
  uploadResult: UploadResult | null;
  onUpload: (result: UploadResult) => void;
  onClear: () => void;
}

export function FileUpload({ itemType, uploadResult, onUpload, onClear }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept =
    itemType === "image"
      ? ".png,.jpg,.jpeg,.gif,.webp,.svg"
      : ".pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini";

  const upload = useCallback(
    (file: File) => {
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("itemType", itemType);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        setProgress(null);
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText) as UploadResult;
          onUpload(result);
        } else {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          setError(body.error ?? "Upload failed");
        }
      };

      xhr.onerror = () => {
        setProgress(null);
        setError("Upload failed");
      };

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    },
    [itemType, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      e.target.value = "";
    },
    [upload]
  );

  if (uploadResult) {
    return (
      <div className="relative rounded-md border bg-muted/30 p-3">
        {itemType === "image" ? (
          <div className="flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadResult.url}
              alt={uploadResult.fileName}
              className="max-h-48 w-full rounded object-contain"
            />
            <p className="text-xs text-muted-foreground">
              {uploadResult.fileName} · {formatBytes(uploadResult.fileSize)}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{uploadResult.fileName}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(uploadResult.fileSize)}</p>
            </div>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1.5 top-1.5"
          onClick={onClear}
          title="Remove file"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        {progress !== null ? (
          <div className="flex w-full flex-col items-center gap-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
          </div>
        ) : (
          <>
            {itemType === "image" ? (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                Drop {itemType === "image" ? "image" : "file"} here or click to browse
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {itemType === "image"
                  ? "PNG, JPG, GIF, WebP, SVG · Max 5 MB"
                  : "PDF, TXT, MD, JSON, YAML, XML, CSV, TOML · Max 10 MB"}
              </p>
            </div>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  );
}
