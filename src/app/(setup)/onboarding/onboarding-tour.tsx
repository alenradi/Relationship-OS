"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

import {
  ConstitutionPreview,
  FuturePreview,
  GoalsPreview,
  ReflectionPreview,
  RhythmPreview,
} from "./feature-previews";

const SLIDES = [
  {
    key: "rhythm",
    ...copy.onboarding.tour.rhythm,
    Preview: RhythmPreview,
  },
  {
    key: "reflection",
    ...copy.onboarding.tour.reflection,
    Preview: ReflectionPreview,
  },
  {
    key: "constitution",
    ...copy.onboarding.tour.constitution,
    Preview: ConstitutionPreview,
  },
  {
    key: "goals",
    ...copy.onboarding.tour.goals,
    Preview: GoalsPreview,
  },
  {
    key: "future",
    ...copy.onboarding.tour.future,
    Preview: FuturePreview,
  },
] as const;

export function OnboardingTour({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const Preview = slide.Preview;

  function goTo(next: number) {
    if (next < 0 || next >= SLIDES.length) return;
    setDirection(next > index ? "left" : "right");
    setIndex(next);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setIndex((current) => {
          if (current >= SLIDES.length - 1) {
            onComplete();
            return current;
          }
          setDirection("left");
          return current + 1;
        });
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => {
          if (current <= 0) return current;
          setDirection("right");
          return current - 1;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onComplete]);

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          {copy.onboarding.tourEyebrow}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-ink-soft transition hover:text-ink"
        >
          {copy.onboarding.tourSkip}
        </button>
      </div>

      <div
        className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-10"
        onTouchStart={(event) => setTouchStart(event.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStart == null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
          if (Math.abs(delta) < 48) return;
          if (delta < 0) {
            if (isLast) onComplete();
            else goTo(index + 1);
          } else {
            goTo(index - 1);
          }
          setTouchStart(null);
        }}
      >
        <div
          key={slide.key}
          className={cn(
            "space-y-4 text-center lg:text-left",
            direction === "left" ? "animate-slide-left" : "animate-slide-right",
          )}
        >
          <span className="inline-flex rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
            {slide.highlight}
          </span>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl tracking-tight text-balance sm:text-4xl">
              {slide.title}
            </h1>
            <p className="mx-auto max-w-md text-base leading-relaxed text-ink-soft text-pretty lg:mx-0">
              {slide.body}
            </p>
          </div>

          <div className="hidden items-center gap-3 pt-2 lg:flex">
            <Button
              variant="ghost"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
            >
              {copy.app.back}
            </Button>
            <Button
              size="lg"
              onClick={() => (isLast ? onComplete() : goTo(index + 1))}
            >
              {isLast ? copy.onboarding.tourContinue : copy.app.next}
            </Button>
          </div>
        </div>

        <div
          key={`${slide.key}-preview`}
          className={cn(
            direction === "left" ? "animate-slide-left" : "animate-slide-right",
          )}
          style={{ animationDelay: "60ms" }}
        >
          <Preview />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2" role="tablist" aria-label="Tour slides">
          {SLIDES.map((item, i) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={item.title}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index
                  ? "w-7 bg-accent"
                  : "w-2 bg-line-strong hover:bg-ink-faint",
              )}
            />
          ))}
        </div>
        <p className="text-xs text-ink-faint">
          {copy.onboarding.tourOf(index + 1, SLIDES.length)}
        </p>

        <div className="flex w-full items-center justify-between gap-2 lg:hidden">
          <Button
            variant="ghost"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
          >
            {copy.app.back}
          </Button>
          <Button onClick={() => (isLast ? onComplete() : goTo(index + 1))}>
            {isLast ? copy.onboarding.tourContinue : copy.app.next}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const TOUR_SLIDE_COUNT = SLIDES.length;
