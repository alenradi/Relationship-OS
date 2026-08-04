"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Wordmark } from "@/components/brand";
import { MenuIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { ProfileRow } from "@/lib/database.types";
import { isActive, primaryNav, secondaryNav } from "@/lib/nav";
import { displayName } from "@/lib/people";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {primaryNav.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
              active
                ? "bg-accent-soft font-medium text-accent-ink"
                : "text-ink-soft hover:bg-surface-muted hover:text-ink",
            )}
          >
            <Icon className={cn("size-5 shrink-0", active && "text-accent")} />
            {item.label}
          </Link>
        );
      })}

      <div className="my-2 border-t border-line" />

      {secondaryNav.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
              active
                ? "bg-accent-soft font-medium text-accent-ink"
                : "text-ink-soft hover:bg-surface-muted hover:text-ink",
            )}
          >
            <Icon className={cn("size-5 shrink-0", active && "text-accent")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The two of you, always visible — a quiet reminder of who this is for. */
function CoupleBadge({
  profile,
  partner,
}: {
  profile: ProfileRow;
  partner: ProfileRow | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-muted/70 px-3 py-2.5">
      <div className="flex -space-x-2">
        <Avatar profile={profile} variant="accent" size="sm" />
        <Avatar profile={partner} variant="lilac" size="sm" />
      </div>
      <p className="min-w-0 flex-1 truncate text-xs text-ink-soft">
        {displayName(profile)} &amp; {displayName(partner)}
      </p>
    </div>
  );
}

export function Sidebar({
  profile,
  partner,
  footer,
}: {
  profile: ProfileRow;
  partner: ProfileRow | null;
  footer: React.ReactNode;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 border-r border-line bg-surface/60 px-4 py-6 lg:flex">
      <Link href="/" className="px-2">
        <Wordmark />
      </Link>

      <CoupleBadge profile={profile} partner={partner} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavLinks />
      </div>

      <div className="border-t border-line pt-3">{footer}</div>
    </aside>
  );
}

export function MobileHeader({
  profile,
  partner,
  footer,
}: {
  profile: ProfileRow;
  partner: ProfileRow | null;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  /*
   * The drawer is open only for the route it was opened on, so navigating
   * anywhere — including with the browser's back button — closes it without
   * needing an effect to watch the pathname.
   */
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = (value: boolean) => setOpenFor(value ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/">
          <Wordmark />
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={copy.nav.menu}
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition hover:text-ink"
        >
          <MenuIcon />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={copy.app.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px] animate-in"
          />
          <div className="animate-rise absolute inset-y-0 right-0 flex w-[min(19rem,85vw)] flex-col gap-5 border-l border-line bg-surface px-4 py-6 shadow-lifted">
            <div className="flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={copy.app.close}
                className="flex size-9 items-center justify-center rounded-full text-ink-faint transition hover:bg-surface-muted hover:text-ink"
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

            <CoupleBadge profile={profile} partner={partner} />

            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>

            <div className="border-t border-line pt-3">{footer}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
