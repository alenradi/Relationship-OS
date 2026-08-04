"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { RuleCategory } from "@/lib/database.types";

import { completeOnboardingAction } from "./actions";

type Draft = {
  key: string;
  category: RuleCategory;
  title: string;
  description: string;
  why_agreed: string;
  selected: boolean;
  custom: boolean;
};

const TOTAL_STEPS = 4;

const CATEGORY_ORDER: RuleCategory[] = [
  "communication",
  "alone_time",
  "boundaries",
  "fighting_fair",
  "other",
];

function initialDrafts(): Draft[] {
  return copy.suggestedRules.map((rule, index) => ({
    key: `suggested-${index}`,
    category: rule.category as RuleCategory,
    title: rule.title,
    description: rule.description,
    why_agreed: rule.why_agreed,
    selected: false,
    custom: false,
  }));
}

export function OnboardingWizard({
  initialDisplayName,
  partnerName,
  solo = false,
}: {
  initialDisplayName: string;
  partnerName: string;
  solo?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialDisplayName);
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const chosen = useMemo(() => drafts.filter((d) => d.selected), [drafts]);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: drafts.filter((d) => d.category === category),
    })).filter((group) => group.items.length > 0);
  }, [drafts]);

  function update(key: string, patch: Partial<Draft>) {
    setDrafts((current) =>
      current.map((d) => (d.key === key ? { ...d, ...patch } : d)),
    );
  }

  function toggle(key: string) {
    setDrafts((current) =>
      current.map((d) => (d.key === key ? { ...d, selected: !d.selected } : d)),
    );
  }

  function addCustom(draft: Omit<Draft, "key" | "selected" | "custom">) {
    const key = `custom-${Date.now()}`;
    setDrafts((current) => [
      ...current,
      { ...draft, key, selected: true, custom: true },
    ]);
    setCustomOpen(false);
  }

  function goNext() {
    setError(null);

    if (step === 1 && !name.trim()) {
      setError(copy.errors.required);
      return;
    }

    if (step === 2 && chosen.length === 0) {
      setError(copy.onboarding.needAtLeastOne);
      return;
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function finish() {
    setError(null);
    startSaving(async () => {
      const result = await completeOnboardingAction({
        displayName: name,
        rules: chosen.map(({ category, title, description, why_agreed }) => ({
          category,
          title,
          description,
          why_agreed,
        })),
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-accent" : "bg-line",
              )}
            />
          ))}
        </div>
        <span className="shrink-0 text-xs text-ink-faint">
          {copy.onboarding.stepOf(step + 1, TOTAL_STEPS)}
        </span>
      </div>

      {step === 0 ? (
        <Card className="space-y-4">
          <CardTitle as="h1" className="text-2xl">
            {copy.onboarding.welcomeTitle}
          </CardTitle>
          <CardDescription>{copy.onboarding.welcomeBody}</CardDescription>
          <Button size="lg" onClick={goNext}>
            {copy.onboarding.welcomeCta}
          </Button>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="space-y-5">
          <div className="space-y-1.5">
            <CardTitle as="h1" className="text-2xl">
              {copy.onboarding.profileTitle}
            </CardTitle>
            <CardDescription>{copy.onboarding.profileBody}</CardDescription>
          </div>

          <Field label={copy.auth.displayName} htmlFor="display_name">
            <Input
              id="display_name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={copy.auth.displayNamePlaceholder}
              autoFocus
            />
          </Field>

          {error ? (
            <Notice tone="accent" role="alert">
              {error}
            </Notice>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep(0)}>
              {copy.app.back}
            </Button>
            <Button onClick={goNext}>{copy.app.next}</Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          <Card className="space-y-2">
            <CardTitle as="h1" className="text-2xl">
              {copy.onboarding.constitutionIntroTitle}
            </CardTitle>
            <CardDescription>
              {copy.onboarding.constitutionIntroBody}
            </CardDescription>
            <p className="text-sm text-ink-soft">
              {copy.onboarding.suggestionsHelp}
            </p>
          </Card>

          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.category} className="space-y-3">
                <h2 className="text-sm font-semibold tracking-wide text-ink-soft uppercase">
                  {copy.constitution.categories[group.category]}
                </h2>

                <div className="space-y-2.5">
                  {group.items.map((draft) => {
                    const isOpen = expanded === draft.key;
                    return (
                      <Card
                        key={draft.key}
                        padded={false}
                        tone={draft.selected ? "accent" : "default"}
                        className="overflow-hidden transition"
                      >
                        <div className="flex items-start gap-3 p-4">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={draft.selected}
                            onClick={() => toggle(draft.key)}
                            className={cn(
                              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition",
                              draft.selected
                                ? "border-accent bg-accent text-ink-inverse"
                                : "border-line-strong bg-surface hover:border-accent",
                            )}
                          >
                            {draft.selected ? (
                              <svg
                                viewBox="0 0 24 24"
                                className="size-3.5"
                                aria-hidden
                              >
                                <path
                                  d="M5 13l4 4L19 7"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggle(draft.key)}
                            className="flex-1 space-y-1 text-left"
                          >
                            <p className="text-sm font-medium text-ink text-pretty">
                              {draft.title}
                            </p>
                            <p className="text-xs leading-relaxed text-ink-soft text-pretty">
                              {draft.description}
                            </p>
                          </button>

                          {draft.selected ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpanded(isOpen ? null : draft.key)}
                            >
                              {isOpen ? copy.app.done : copy.app.edit}
                            </Button>
                          ) : null}
                        </div>

                        {draft.selected && isOpen ? (
                          <div className="space-y-3 border-t border-accent-line bg-surface/70 p-4">
                            <Field
                              label={copy.constitution.fieldTitle}
                              htmlFor={`${draft.key}-title`}
                            >
                              <Input
                                id={`${draft.key}-title`}
                                value={draft.title}
                                onChange={(event) =>
                                  update(draft.key, { title: event.target.value })
                                }
                              />
                            </Field>
                            <Field
                              label={copy.constitution.fieldDescription}
                              htmlFor={`${draft.key}-description`}
                            >
                              <Textarea
                                id={`${draft.key}-description`}
                                value={draft.description}
                                onChange={(event) =>
                                  update(draft.key, {
                                    description: event.target.value,
                                  })
                                }
                              />
                            </Field>
                            <Field
                              label={copy.constitution.fieldWhy}
                              htmlFor={`${draft.key}-why`}
                            >
                              <Textarea
                                id={`${draft.key}-why`}
                                value={draft.why_agreed}
                                onChange={(event) =>
                                  update(draft.key, {
                                    why_agreed: event.target.value,
                                  })
                                }
                              />
                            </Field>
                          </div>
                        ) : null}
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <Button variant="secondary" onClick={() => setCustomOpen(true)}>
            {copy.onboarding.addYourOwn}
          </Button>

          {error ? (
            <Notice tone="accent" role="alert">
              {error}
            </Notice>
          ) : null}

          <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-full border border-line bg-surface/95 px-4 py-3 shadow-lifted backdrop-blur">
            <span className="text-sm text-ink-soft">
              {copy.onboarding.selectedCount(chosen.length)}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                {copy.app.back}
              </Button>
              <Button onClick={goNext}>{copy.app.next}</Button>
            </div>
          </div>

          <CustomRuleModal
            open={customOpen}
            onClose={() => setCustomOpen(false)}
            onAdd={addCustom}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <Card className="space-y-2">
            <CardTitle as="h1" className="text-2xl">
              {copy.onboarding.finishTitle}
            </CardTitle>
            <CardDescription>
              {solo
                ? copy.onboarding.soloFinishBody
                : copy.onboarding.finishBody}
            </CardDescription>
          </Card>

          <Card tone="muted" className="space-y-3">
            <p className="text-sm font-medium text-ink">
              {copy.onboarding.selectedCount(chosen.length)}
            </p>
            <ul className="space-y-2.5">
              {chosen.map((draft) => (
                <li key={draft.key} className="space-y-0.5">
                  <p className="text-sm font-medium text-ink text-pretty">
                    {draft.title}
                  </p>
                  {draft.why_agreed ? (
                    <p className="text-xs leading-relaxed text-ink-soft text-pretty">
                      {copy.constitution.whyWeAgreed}: {draft.why_agreed}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>

          {partnerName ? (
            <p className="text-xs text-ink-faint text-pretty">
              {copy.onboarding.partnerWillSee(partnerName)}
            </p>
          ) : null}

          {error ? (
            <Notice tone="accent" role="alert">
              {error}
            </Notice>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep(2)} disabled={saving}>
              {copy.app.back}
            </Button>
            <Button size="lg" onClick={finish} disabled={saving}>
              {saving ? copy.app.saving : copy.onboarding.finishCta}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CustomRuleModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (draft: {
    category: RuleCategory;
    title: string;
    description: string;
    why_agreed: string;
  }) => void;
}) {
  const [category, setCategory] = useState<RuleCategory>("communication");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [why, setWhy] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!title.trim()) {
      setError(copy.errors.required);
      return;
    }
    onAdd({
      category,
      title: title.trim(),
      description: description.trim(),
      why_agreed: why.trim(),
    });
    setTitle("");
    setDescription("");
    setWhy("");
    setError(null);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.onboarding.addYourOwn}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {copy.app.cancel}
          </Button>
          <Button onClick={submit}>{copy.app.add}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={copy.constitution.fieldCategory} htmlFor="custom-category">
          <Select
            id="custom-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as RuleCategory)}
          >
            {CATEGORY_ORDER.map((option) => (
              <option key={option} value={option}>
                {copy.constitution.categories[option]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={copy.constitution.fieldTitle} htmlFor="custom-title">
          <Input
            id="custom-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={copy.constitution.fieldTitlePlaceholder}
          />
        </Field>

        <Field
          label={copy.constitution.fieldDescription}
          htmlFor="custom-description"
        >
          <Textarea
            id="custom-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={copy.constitution.fieldDescriptionPlaceholder}
          />
        </Field>

        <Field label={copy.constitution.fieldWhy} htmlFor="custom-why">
          <Textarea
            id="custom-why"
            value={why}
            onChange={(event) => setWhy(event.target.value)}
            placeholder={copy.constitution.fieldWhyPlaceholder}
          />
        </Field>

        {error ? (
          <Notice tone="accent" role="alert">
            {error}
          </Notice>
        ) : null}
      </div>
    </Modal>
  );
}
