"use client";

import { useEffect, useId, useRef } from "react";

import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

/**
 * Lightweight modal: Escape to close, click the backdrop to close, focus moves
 * in on open and body scroll is locked while it is up.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first sensible target so keyboard users land inside the dialog.
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button, [href], [tabindex]:not([tabindex='-1'])",
    );
    focusable?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={copy.app.close}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px] animate-in"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-lifted animate-rise sm:rounded-3xl",
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg sm:text-xl">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="text-sm leading-relaxed text-ink-soft text-pretty"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.app.close}
            className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition hover:bg-surface-muted hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-muted/60 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
