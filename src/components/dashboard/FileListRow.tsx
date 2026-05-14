"use client";

import type { ItemForCard } from "@/lib/db/items";
import {
  File,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Download,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getFileIcon(ext: string) {
  if (ext === "pdf") return FileText;
  if (["zip", "rar", "gz", "7z", "tar"].includes(ext)) return FileArchive;
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) return FileImage;
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return FileVideo;
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext)) return FileAudio;
  if (["js", "ts", "jsx", "tsx", "py", "go", "rb", "php", "html", "css", "json", "yaml", "yml", "sh"].includes(ext)) return FileCode;
  return File;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileListRowProps {
  item: ItemForCard;
  onSelect: () => void;
}

export default function FileListRow({ item, onSelect }: FileListRowProps) {
  const ext = (item.fileName ?? item.title).split(".").pop()?.toLowerCase() ?? "";
  const FileIcon = getFileIcon(ext);
  const size = formatFileSize(item.fileSize);
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/api/items/${item.id}/download`;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/5"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      {/* File icon */}
      <FileIcon className="h-8 w-8 shrink-0 text-muted-foreground" />

      {/* Name + mobile meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-medium text-foreground">
            {item.fileName ?? item.title}
          </p>
          {item.isFavorite && (
            <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        <p className="text-xs text-muted-foreground sm:hidden">
          {size} · {date}
        </p>
      </div>

      {/* Size — hidden on mobile */}
      <span className="hidden w-20 shrink-0 text-right text-sm text-muted-foreground sm:block">
        {size}
      </span>

      {/* Date — hidden on mobile */}
      <span className="hidden w-28 shrink-0 text-right text-sm text-muted-foreground sm:block">
        {date}
      </span>

      {/* Download */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleDownload}
        aria-label="Download file"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
