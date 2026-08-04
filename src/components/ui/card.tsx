import { cn } from "@/lib/cn";

type CardProps = React.ComponentPropsWithoutRef<"div"> & {
  tone?: "default" | "muted" | "accent" | "sage" | "honey" | "lilac";
  padded?: boolean;
};

const toneClasses: Record<NonNullable<CardProps["tone"]>, string> = {
  default: "bg-surface border-line",
  muted: "bg-surface-muted border-line",
  accent: "bg-accent-soft border-accent-line",
  sage: "bg-sage-soft border-sage-line",
  honey: "bg-honey-soft border-honey-line",
  lilac: "bg-lilac-soft border-lilac-line",
};

export function Card({
  tone = "default",
  padded = true,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-soft",
        toneClasses[tone],
        padded && "p-5 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-start justify-between gap-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  as: Tag = "h2",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"h2"> & {
  as?: "h1" | "h2" | "h3" | "h4";
}) {
  return <Tag className={cn("text-lg sm:text-xl", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn("text-sm leading-relaxed text-ink-soft text-pretty", className)}
      {...props}
    />
  );
}
