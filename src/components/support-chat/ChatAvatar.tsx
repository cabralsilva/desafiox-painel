import { avatarTone, chatInitials } from "@/lib/supportChat";
import { cn } from "@/lib/utils";

export function ChatAvatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", dim)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-black",
        dim,
        avatarTone(name)
      )}
    >
      {chatInitials(name)}
    </span>
  );
}
