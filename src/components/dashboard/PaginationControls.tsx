import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

export default function PaginationControls({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const href = (page: number) => `${basePath}?page=${page}`;
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-1 pt-6">
      {currentPage <= 1 ? (
        <Button variant="ghost" size="sm" disabled aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
      ) : (
        <Link
          href={href(currentPage - 1)}
          aria-label="Previous page"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : page === currentPage ? (
          <Button key={page} variant="secondary" size="icon" aria-current="page">
            {page}
          </Button>
        ) : (
          <Link
            key={page}
            href={href(page as number)}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            {page}
          </Link>
        )
      )}

      {currentPage >= totalPages ? (
        <Button variant="ghost" size="sm" disabled aria-label="Next page">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Link
          href={href(currentPage + 1)}
          aria-label="Next page"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];

  if (current >= total - 3)
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];

  return [1, "...", current - 1, current, current + 1, "...", total];
}
