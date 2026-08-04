"use client";

import { useState, useTransition } from "react";

import { saveDailyStatusAction } from "@/app/(app)/rhythm/actions";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { RatingScale } from "@/components/ui/rating-scale";
import { copy } from "@/lib/copy";
import type { BusyBlock, DailyStatusRow } from "@/lib/database.types";
import { formatRelativeDay } from "@/lib/dates";
import { busyScoreLabel } from "@/lib/rhythm";

type EditableBlock = BusyBlock & { key: string };

function toEditable(blocks: BusyBlock[]): EditableBlock[] {
  return blocks.map((block, index) => ({
    key: `existing-${index}`,
    label: block.label,
  }));
}

function blankBlock(): EditableBlock {
  return {
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: "",
  };
}

export function DayEditorButton({
  date,
  status,
  variant = "primary",
  size = "md",
  className,
}: {
  date: string;
  status: DailyStatusRow | null;
  variant?: "primary" | "secondary" | "soft" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {status ? copy.dashboard.updateMyDay : copy.dashboard.logMyDay}
      </Button>

      {open ? (
        <DayEditorModal
          date={date}
          status={status}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function DayEditorModal({
  date,
  status,
  onClose,
}: {
  date: string;
  status: DailyStatusRow | null;
  onClose: () => void;
}) {
  const [score, setScore] = useState<number>(status?.busy_score ?? 5);
  const [note, setNote] = useState(status?.note ?? "");
  const [blocks, setBlocks] = useState<EditableBlock[]>(
    status ? toEditable(status.busy_blocks) : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function updateBlock(key: string, label: string) {
    setBlocks((current) =>
      current.map((block) => (block.key === key ? { ...block, label } : block)),
    );
  }

  function save() {
    setError(null);
    startSaving(async () => {
      const result = await saveDailyStatusAction({
        status_date: date,
        busy_score: score,
        note,
        busy_blocks: blocks.map(({ label }) => ({ label })),
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={copy.rhythm.logTitle(formatRelativeDay(date).toLowerCase())}
      description={copy.rhythm.nudgePartner}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {copy.app.cancel}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? copy.app.saving : copy.rhythm.saveDay}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Field
          label={copy.rhythm.busyScore}
          hint={`${copy.rhythm.busyScoreHelp} ${busyScoreLabel(score)}`}
        >
          <RatingScale
            name={copy.rhythm.busyScore}
            value={score}
            onChange={setScore}
            lowLabel={copy.rhythm.busyScoreLabels[1]}
            highLabel={copy.rhythm.busyScoreLabels[10]}
            disabled={saving}
          />
        </Field>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink">{copy.rhythm.blocks}</p>
            <p className="text-xs text-ink-faint">{copy.rhythm.blocksHelp}</p>
          </div>

          {blocks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong bg-surface-muted/60 px-3.5 py-3 text-xs text-ink-faint">
              {copy.rhythm.noBlocks}
            </p>
          ) : null}

          <div className="space-y-2">
            {blocks.map((block) => (
              <div
                key={block.key}
                className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-line bg-surface-muted/50 p-2.5"
              >
                <Input
                  aria-label={copy.rhythm.blockLabel}
                  value={block.label}
                  onChange={(event) =>
                    updateBlock(block.key, event.target.value)
                  }
                  placeholder={copy.rhythm.blockLabelPlaceholder}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={copy.app.remove}
                  onClick={() =>
                    setBlocks((current) =>
                      current.filter((b) => b.key !== block.key),
                    )
                  }
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
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBlocks((current) => [...current, blankBlock()])}
          >
            <PlusIcon className="size-4" />
            {copy.rhythm.addBlock}
          </Button>
        </div>

        <Field label={copy.rhythm.note} htmlFor="day-note" optional>
          <Textarea
            id="day-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={copy.rhythm.notePlaceholder}
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
