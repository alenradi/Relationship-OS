import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

const controlBase =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-faint shadow-inset transition " +
  "hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  optional,
  className,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  htmlFor?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="flex items-baseline gap-2 text-sm font-medium text-ink"
        >
          <span>{label}</span>
          {optional ? (
            <span className="text-xs font-normal text-ink-faint">
              {copy.app.optional}
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {hint && !error ? (
        <p className="text-xs leading-relaxed text-ink-faint text-pretty">{hint}</p>
      ) : null}

      {error ? (
        <p className="text-xs leading-relaxed text-accent-ink text-pretty" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"input">) {
  return <input className={cn(controlBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      rows={props.rows ?? 3}
      className={cn(controlBase, "leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"select">) {
  return (
    <select
      className={cn(
        controlBase,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236e6055%22 stroke-width=%222%22 stroke-linecap=%22round%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:16px] bg-[position:right_0.85rem_center] bg-no-repeat pr-10",
        className,
      )}
      {...props}
    />
  );
}
