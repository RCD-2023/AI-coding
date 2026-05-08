import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string | null | undefined;
  image: string | null | undefined;
  className?: string;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  const base = cn(
    "h-8 w-8 shrink-0 rounded-full",
    className
  );

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? "User"}
        className={cn(base, "object-cover")}
      />
    );
  }

  return (
    <div
      className={cn(
        base,
        "flex items-center justify-center bg-primary text-primary-foreground text-sm font-medium"
      )}
    >
      {getInitials(name)}
    </div>
  );
}
