"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { copy } from "@/lib/copy";
import type { RuleCategory, RuleRow, RuleStatus } from "@/lib/database.types";

import { deleteRuleAction, saveRuleAction } from "./actions";

const CATEGORIES: RuleCategory[] = [
  "communication",
  "alone_time",
  "boundaries",
  "fighting_fair",
  "other",
];
const STATUSES: RuleStatus[] = ["active", "renegotiated", "retired"];

export function RuleEditor({
  open,
  rule,
  onClose,
}: {
  open: boolean;
  rule: RuleRow | null;
  onClose: () => void;
}) {
  const editing = Boolean(rule);

  const [title, setTitle] = useState(rule?.title ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [why, setWhy] = useState(rule?.why_agreed ?? "");
  const [category, setCategory] = useState<RuleCategory>(
    rule?.category ?? "communication",
  );
  const [status, setStatus] = useState<RuleStatus>(rule?.status ?? "active");
  const [changeNote, setChangeNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function save() {
    setError(null);
    startSaving(async () => {
      const result = await saveRuleAction({
        id: rule?.id,
        title,
        description,
        why_agreed: why,
        category,
        status,
        change_note: changeNote,
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function remove() {
    if (!rule) return;
    setError(null);
    startSaving(async () => {
      const result = await deleteRuleAction(rule.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? copy.constitution.editRule : copy.constitution.newRule}
      footer={
        <>
          {editing ? (
            <Button
              variant="ghost"
              className="mr-auto text-accent-ink"
              disabled={saving}
              onClick={() =>
                confirmingDelete ? remove() : setConfirmingDelete(true)
              }
            >
              {confirmingDelete ? copy.app.confirmDelete : copy.app.delete}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {copy.app.cancel}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? copy.app.saving : copy.app.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={copy.constitution.fieldTitle} htmlFor="rule-title">
          <Input
            id="rule-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={copy.constitution.fieldTitlePlaceholder}
          />
        </Field>

        <Field
          label={copy.constitution.fieldDescription}
          htmlFor="rule-description"
        >
          <Textarea
            id="rule-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={copy.constitution.fieldDescriptionPlaceholder}
          />
        </Field>

        <Field label={copy.constitution.fieldWhy} htmlFor="rule-why">
          <Textarea
            id="rule-why"
            value={why}
            onChange={(event) => setWhy(event.target.value)}
            placeholder={copy.constitution.fieldWhyPlaceholder}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.constitution.fieldCategory} htmlFor="rule-category">
            <Select
              id="rule-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as RuleCategory)
              }
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {copy.constitution.categories[option]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={copy.constitution.fieldStatus}
            htmlFor="rule-status"
            hint={copy.constitution.statusHelp[status]}
          >
            <Select
              id="rule-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as RuleStatus)}
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {copy.constitution.statuses[option]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {editing ? (
          <Field
            label={copy.constitution.fieldChangeNote}
            htmlFor="rule-change-note"
            hint={copy.constitution.changeNoteHelp}
            optional
          >
            <Textarea
              id="rule-change-note"
              rows={2}
              value={changeNote}
              onChange={(event) => setChangeNote(event.target.value)}
              placeholder={copy.constitution.fieldChangeNotePlaceholder}
            />
          </Field>
        ) : null}

        {error ? (
          <Notice tone="accent" role="alert">
            {error}
          </Notice>
        ) : null}
      </div>
    </Modal>
  );
}
