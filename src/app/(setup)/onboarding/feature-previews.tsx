import { cn } from "@/lib/cn";

/** Phone-framed app previews used as onboarding “screenshots”. */
export function DeviceFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[min(100%,17.5rem)] select-none",
        className,
      )}
      aria-hidden
    >
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent/10 blur-2xl animate-soft-pulse" />
      <div className="overflow-hidden rounded-[1.75rem] border border-line-strong bg-canvas-deep shadow-lifted ring-1 ring-ink/5">
        <div className="flex items-center justify-between border-b border-line/80 bg-surface-muted/80 px-4 py-2.5">
          <div className="flex gap-1">
            <span className="size-1.5 rounded-full bg-line-strong" />
            <span className="size-1.5 rounded-full bg-line-strong" />
            <span className="size-1.5 rounded-full bg-line-strong" />
          </div>
          <span className="font-serif text-[0.65rem] tracking-tight text-ink-soft">
            Ilaria & Alen
          </span>
          <span className="w-6" />
        </div>
        <div className="relative h-[22rem] overflow-hidden bg-canvas p-3.5">
          {children}
        </div>
      </div>
    </div>
  );
}

function PreviewChip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "sage" | "honey" | "lilac";
}) {
  const tones = {
    default: "bg-surface border-line text-ink-soft",
    accent: "bg-accent-soft border-accent-line text-accent-ink",
    sage: "bg-sage-soft border-sage-line text-sage-ink",
    honey: "bg-honey-soft border-honey-line text-honey-ink",
    lilac: "bg-lilac-soft border-lilac-line text-lilac-ink",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function PreviewCard({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "muted" | "accent" | "lilac" | "sage";
}) {
  const tones = {
    default: "bg-surface border-line",
    muted: "bg-surface-muted border-line",
    accent: "bg-accent-soft border-accent-line",
    lilac: "bg-lilac-soft border-lilac-line",
    sage: "bg-sage-soft border-sage-line",
  } as const;

  return (
    <div
      className={cn(
        "rounded-xl border p-2.5 shadow-soft",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RhythmPreview() {
  return (
    <DeviceFrame className="animate-float">
      <div className="animate-stagger space-y-2.5">
        <div>
          <p className="font-serif text-base text-ink">Today</p>
          <p className="text-[0.65rem] text-ink-faint">Thursday · Ljubljana</p>
        </div>
        <PreviewCard>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.7rem] font-medium text-ink">Ilaria</span>
            <PreviewChip tone="sage">8 / 10</PreviewChip>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full w-[80%] rounded-full bg-sage" />
          </div>
          <p className="text-[0.65rem] leading-snug text-ink-soft">
            Client workshop all morning — quiet evening preferred.
          </p>
        </PreviewCard>
        <PreviewCard tone="accent">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.7rem] font-medium text-ink">Alen</span>
            <PreviewChip tone="accent">6 / 10</PreviewChip>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface/60">
            <div className="h-full w-[60%] rounded-full bg-accent" />
          </div>
          <p className="text-[0.65rem] leading-snug text-ink-soft">
            Deep work block 2–5. Free after dinner.
          </p>
        </PreviewCard>
        <PreviewCard tone="muted" className="text-center">
          <p className="text-[0.65rem] text-ink-faint">Busy blocks · free text</p>
        </PreviewCard>
      </div>
    </DeviceFrame>
  );
}

export function ReflectionPreview() {
  return (
    <DeviceFrame className="animate-float">
      <div className="animate-stagger space-y-2.5">
        <div>
          <p className="font-serif text-base text-ink">This week</p>
          <p className="text-[0.65rem] text-ink-faint">Mon 28 Jul – Sun 3 Aug</p>
        </div>
        <PreviewCard tone="lilac">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.7rem] font-medium text-lilac-ink">
              Sealed
            </span>
            <PreviewChip tone="lilac">1 of 2 in</PreviewChip>
          </div>
          <div className="space-y-1.5">
            <div className="rounded-lg bg-surface/70 px-2 py-1.5">
              <p className="text-[0.6rem] text-ink-faint">What felt good</p>
              <p className="sealed mt-0.5 text-[0.7rem] text-ink">
                Long walk after dinner and no phones
              </p>
            </div>
            <div className="rounded-lg bg-surface/70 px-2 py-1.5">
              <p className="text-[0.6rem] text-ink-faint">What was hard</p>
              <p className="sealed mt-0.5 text-[0.7rem] text-ink">
                Midweek stress spilling into evenings
              </p>
            </div>
          </div>
        </PreviewCard>
        <PreviewCard>
          <p className="text-[0.7rem] font-medium text-ink">Your answers</p>
          <p className="mt-1 text-[0.65rem] leading-snug text-ink-soft">
            Submitted · waiting for your partner
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full w-1/2 rounded-full bg-lilac" />
          </div>
        </PreviewCard>
      </div>
    </DeviceFrame>
  );
}

export function ConstitutionPreview() {
  return (
    <DeviceFrame className="animate-float">
      <div className="animate-stagger space-y-2.5">
        <div>
          <p className="font-serif text-base text-ink">Constitution</p>
          <p className="text-[0.65rem] text-ink-faint">Agreements on purpose</p>
        </div>
        {[
          "No phones at dinner",
          "Repair beats winning",
          "Ask before big plans",
        ].map((title, i) => (
          <PreviewCard key={title} tone={i === 0 ? "accent" : "default"}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md border border-accent bg-accent text-ink-inverse">
                <svg viewBox="0 0 24 24" className="size-2.5" aria-hidden>
                  <path
                    d="M5 13l4 4L19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="text-[0.7rem] font-medium text-ink">{title}</p>
                <p className="mt-0.5 text-[0.6rem] leading-snug text-ink-soft">
                  Why we agreed · kept in history
                </p>
              </div>
            </div>
          </PreviewCard>
        ))}
        <PreviewChip tone="honey">Review in ~30 days</PreviewChip>
      </div>
    </DeviceFrame>
  );
}

export function GoalsPreview() {
  return (
    <DeviceFrame className="animate-float">
      <div className="animate-stagger space-y-2.5">
        <div>
          <p className="font-serif text-base text-ink">Goals</p>
          <p className="text-[0.65rem] text-ink-faint">Mine · yours · ours</p>
        </div>
        <div className="flex gap-1.5">
          <PreviewChip tone="accent">Mine</PreviewChip>
          <PreviewChip>Yours</PreviewChip>
          <PreviewChip tone="sage">Ours</PreviewChip>
        </div>
        <PreviewCard tone="accent">
          <p className="text-[0.7rem] font-medium text-ink">Morning runs</p>
          <p className="mt-0.5 text-[0.6rem] text-ink-soft">3× this week</p>
          <div className="mt-2 flex items-center gap-1.5">
            <PreviewChip tone="sage">Cheer from Alen</PreviewChip>
          </div>
        </PreviewCard>
        <PreviewCard tone="sage">
          <p className="text-[0.7rem] font-medium text-ink">Save for the trip</p>
          <p className="mt-0.5 text-[0.6rem] text-ink-soft">Shared · on track</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface/70">
            <div className="h-full w-[65%] rounded-full bg-sage" />
          </div>
        </PreviewCard>
        <PreviewCard tone="muted">
          <p className="text-[0.65rem] text-ink-faint">No comparison metrics</p>
        </PreviewCard>
      </div>
    </DeviceFrame>
  );
}

export function FuturePreview() {
  return (
    <DeviceFrame className="animate-float">
      <div className="animate-stagger space-y-2.5">
        <div>
          <p className="font-serif text-base text-ink">Future</p>
          <p className="text-[0.65rem] text-ink-faint">Dates · trips · milestones</p>
        </div>
        <PreviewCard tone="accent">
          <p className="text-[0.6rem] font-medium tracking-wide text-accent-ink uppercase">
            Date jar
          </p>
          <p className="mt-1 font-serif text-sm text-ink">Sunset picnic at the castle</p>
          <p className="mt-0.5 text-[0.6rem] text-ink-soft">Drawn for this weekend</p>
        </PreviewCard>
        <PreviewCard>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[0.7rem] font-medium text-ink">Istria weekend</p>
              <p className="text-[0.6rem] text-ink-soft">Sep 12–14</p>
            </div>
            <PreviewChip tone="honey">2 tasks</PreviewChip>
          </div>
        </PreviewCard>
        <PreviewCard tone="sage">
          <p className="text-[0.7rem] font-medium text-ink">Anniversary</p>
          <p className="mt-0.5 text-[0.6rem] text-ink-soft">Suggestion ready</p>
        </PreviewCard>
      </div>
    </DeviceFrame>
  );
}
