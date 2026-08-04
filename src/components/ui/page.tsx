import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl space-y-1.5">
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {description ? (
          <p className="text-sm leading-relaxed text-ink-soft text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-ink-soft text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface-muted/60 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="max-w-md text-sm leading-relaxed text-ink-soft text-pretty">
        {title}
      </p>
      {description ? (
        <p className="max-w-md text-xs leading-relaxed text-ink-faint text-pretty">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}

/** Thin warm divider used inside cards. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}
