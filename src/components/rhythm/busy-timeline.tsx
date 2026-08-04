import { cn } from "@/lib/cn";
import type { BusyBlock } from "@/lib/database.types";
import { minutesFromTime } from "@/lib/dates";
import { isValidBlock, resolveBlockTimes } from "@/lib/rhythm";

const WINDOW_START = 6 * 60;
const WINDOW_END = 24 * 60;
const WINDOW = WINDOW_END - WINDOW_START;

const TICKS = [6, 9, 12, 15, 18, 21, 24];

/**
 * A day at a glance. Free-text blocks with parseable times show on the bar;
 * everything else lists underneath as chips.
 */
export function BusyTimeline({
  blocks,
  tone = "accent",
  showTicks = true,
  className,
}: {
  blocks: BusyBlock[];
  tone?: "accent" | "lilac";
  showTicks?: boolean;
  className?: string;
}) {
  const valid = blocks.filter(isValidBlock);
  const timed = valid
    .map((block) => {
      const times = resolveBlockTimes(block);
      return times ? { ...block, ...times } : null;
    })
    .filter((b): b is BusyBlock & { start: string; end: string } => b !== null);

  const fill = tone === "lilac" ? "bg-lilac" : "bg-accent";
  const labelInk = tone === "lilac" ? "text-lilac-ink" : "text-accent-ink";

  return (
    <div className={cn("space-y-1.5", className)}>
      {timed.length > 0 ? (
        <>
          <div className="relative h-9 overflow-hidden rounded-xl border border-line bg-surface-sunken">
            {showTicks
              ? TICKS.slice(1, -1).map((hour) => (
                  <span
                    key={hour}
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-line"
                    style={{
                      left: `${(((hour * 60) - WINDOW_START) / WINDOW) * 100}%`,
                    }}
                  />
                ))
              : null}

            {timed.map((block, index) => {
              const start = Math.max(minutesFromTime(block.start), WINDOW_START);
              const end = Math.min(minutesFromTime(block.end), WINDOW_END);
              const left = ((start - WINDOW_START) / WINDOW) * 100;
              const width = Math.max(((end - start) / WINDOW) * 100, 1.5);

              return (
                <div
                  key={`${block.label}-${index}`}
                  title={block.label}
                  className={cn(
                    "absolute inset-y-1 flex items-center overflow-hidden rounded-lg px-1.5",
                    fill,
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  <span className="truncate text-[0.65rem] font-medium text-ink-inverse">
                    {block.label}
                  </span>
                </div>
              );
            })}
          </div>

          {showTicks ? (
            <div className="relative h-3">
              {TICKS.map((hour) => (
                <span
                  key={hour}
                  aria-hidden
                  className="tabular absolute -translate-x-1/2 text-[0.6rem] text-ink-faint"
                  style={{
                    left: `${(((hour * 60) - WINDOW_START) / WINDOW) * 100}%`,
                  }}
                >
                  {hour === 24 ? "24" : String(hour).padStart(2, "0")}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {valid.length > 0 ? (
        <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
          {valid.map((block, index) => (
            <li
              key={`${block.label}-chip-${index}`}
              className={cn(
                "rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium",
                labelInk,
              )}
            >
              {block.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
