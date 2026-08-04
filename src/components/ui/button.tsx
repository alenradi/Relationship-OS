import Link from "next/link";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "soft" | "quiet";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition " +
  "disabled:cursor-not-allowed disabled:opacity-55 " +
  "active:translate-y-px select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-ink-inverse shadow-soft hover:bg-accent-hover disabled:hover:bg-accent",
  secondary:
    "bg-surface text-ink border border-line-strong shadow-soft hover:bg-surface-muted",
  soft: "bg-accent-soft text-accent-ink border border-accent-line hover:bg-accent-line/60",
  ghost: "text-ink-soft hover:bg-surface-muted hover:text-ink",
  quiet: "text-accent-ink underline decoration-accent-line underline-offset-4 hover:decoration-accent",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

function classesFor(variant: Variant, size: Size, className?: string) {
  return cn(
    base,
    variants[variant],
    variant === "quiet" ? "px-0 h-auto" : sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      type={props.type ?? "button"}
      className={classesFor(variant, size, className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant;
  size?: Size;
}) {
  return <Link className={classesFor(variant, size, className)} {...props} />;
}
