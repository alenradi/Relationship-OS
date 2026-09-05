"use client";

import { useMemo, useState } from "react";

import { PlusIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, SectionHeading } from "@/components/ui/page";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type {
  ProfileRow,
  RuleCategory,
  RuleRow,
  RuleStatus,
  RuleVersionRow,
} from "@/lib/database.types";
import { formatMediumDate } from "@/lib/dates";
import { displayName } from "@/lib/people";

import { RuleEditor, type RulePreset } from "./rule-editor";

const CATEGORY_ORDER: RuleCategory[] = [
  "communication",
  "alone_time",
  "boundaries",
  "fighting_fair",
  "other",
];

function toneForStatus(status: RuleStatus) {
  if (status === "active") return "sage" as const;
  if (status === "renegotiated") return "honey" as const;
  return "neutral" as const;
}

export function ConstitutionBoard({
  rules,
  versions,
  members,
  editable,
}: {
  rules: RuleRow[];
  versions: RuleVersionRow[];
  members: ProfileRow[];
  editable: boolean;
}) {
  const [editing, setEditing] = useState<RuleRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [preset, setPreset] = useState<RulePreset | null>(null);

  const takenTitles = useMemo(
    () => new Set(rules.map((rule) => rule.title.trim().toLowerCase())),
    [rules],
  );
  const unusedSuggestions = copy.suggestedRules.filter(
    (suggestion) => !takenTitles.has(suggestion.title.toLowerCase()),
  );

  const nameFor = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, displayName(m)]));
    return (id: string | null) => (id ? map.get(id) ?? "" : "");
  }, [members]);

  const versionsByRule = useMemo(() => {
    const map = new Map<string, RuleVersionRow[]>();
    for (const version of versions) {
      const list = map.get(version.rule_id) ?? [];
      list.push(version);
      map.set(version.rule_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => b.version - a.version);
    return map;
  }, [versions]);

  const active = rules.filter((r) => r.status === "active");
  const other = rules.filter((r) => r.status !== "active");

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: active.filter((r) => r.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8">
      <SectionHeading
        title={copy.constitution.activeCount(active.length)}
        actions={
          <>
            <ButtonLink href="/constitution/history" variant="secondary" size="sm">
              {copy.constitution.historyLink}
            </ButtonLink>
            {editable ? (
              <Button
                size="sm"
                onClick={() => {
                  setPreset(null);
                  setCreating(true);
                }}
              >
                <PlusIcon className="size-4" />
                {copy.constitution.addRule}
              </Button>
            ) : null}
          </>
        }
      />

      {!editable ? (
        <p className="rounded-2xl border border-line bg-surface-muted/70 px-4 py-3 text-sm text-ink-soft text-pretty">
          {copy.constitution.lockedNotice}
        </p>
      ) : (
        <p className="rounded-2xl border border-accent/20 bg-accent-soft/40 px-4 py-3 text-sm text-ink-soft text-pretty">
          <span className="font-medium text-ink">
            {copy.constitution.reviewOpenTitle}.{" "}
          </span>
          {copy.constitution.reviewOpenBody}
        </p>
      )}

      {rules.length === 0 ? (
        <EmptyState
          title={copy.constitution.empty}
          action={
            editable ? (
              <Button
                onClick={() => {
                  setPreset(null);
                  setCreating(true);
                }}
              >
                {copy.constitution.emptyCta}
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {editable && unusedSuggestions.length > 0 ? (
        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-ink-faint uppercase">
              {copy.constitution.recommendationsTitle}
            </h2>
            <p className="text-sm text-ink-soft text-pretty">
              {copy.constitution.recommendationsHelp}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {unusedSuggestions.map((suggestion) => (
              <Card key={suggestion.title} className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
                    {copy.constitution.categories[suggestion.category]}
                  </p>
                  <h3 className="text-base leading-snug text-pretty">
                    {suggestion.title}
                  </h3>
                  <p className="text-sm text-ink-soft text-pretty">
                    {suggestion.description}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPreset(suggestion);
                    setCreating(true);
                  }}
                >
                  {copy.constitution.useRecommendation}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {grouped.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-xs font-semibold tracking-[0.12em] text-ink-faint uppercase">
            {copy.constitution.categories[group.category]}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {group.items.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                history={versionsByRule.get(rule.id) ?? []}
                nameFor={nameFor}
                onEdit={editable ? () => setEditing(rule) : undefined}
              />
            ))}
          </div>
        </section>
      ))}

      {other.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-[0.12em] text-ink-faint uppercase">
            {copy.constitution.statuses.retired} &amp;{" "}
            {copy.constitution.statuses.renegotiated}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {other.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                history={versionsByRule.get(rule.id) ?? []}
                nameFor={nameFor}
                onEdit={editable ? () => setEditing(rule) : undefined}
                dimmed
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Remounted per rule so the form always starts from that rule's values. */}
      {creating && editable ? (
        <RuleEditor
          open
          key={preset?.title ?? "new-rule"}
          rule={null}
          preset={preset}
          onClose={() => {
            setCreating(false);
            setPreset(null);
          }}
        />
      ) : null}
      {editing && editable ? (
        <RuleEditor
          open
          key={editing.id}
          rule={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function RuleCard({
  rule,
  history,
  nameFor,
  onEdit,
  dimmed,
}: {
  rule: RuleRow;
  history: RuleVersionRow[];
  nameFor: (id: string | null) => string;
  onEdit?: () => void;
  dimmed?: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <Card className={cn("flex flex-col gap-3", dimmed && "opacity-75")}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base leading-snug text-pretty">{rule.title}</h3>
        {onEdit ? (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            {copy.app.edit}
          </Button>
        ) : null}
      </div>

      {rule.description ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {copy.constitution.inPractice}
          </p>
          <p className="text-sm leading-relaxed text-ink-soft text-pretty">
            {rule.description}
          </p>
        </div>
      ) : null}

      {rule.why_agreed ? (
        <div className="space-y-1 rounded-xl bg-surface-muted px-3.5 py-3">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {copy.constitution.whyWeAgreed}
          </p>
          <p className="text-sm leading-relaxed text-ink-soft text-pretty">
            {rule.why_agreed}
          </p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Badge tone={toneForStatus(rule.status)}>
          {copy.constitution.statuses[rule.status]}
        </Badge>
        <Badge tone="outline">{copy.constitution.versionLabel(rule.version)}</Badge>
        {rule.created_by ? (
          <span className="text-xs text-ink-faint">
            {copy.constitution.addedBy(nameFor(rule.created_by))}
          </span>
        ) : null}
      </div>

      {history.length > 1 ? (
        <div className="border-t border-line pt-3">
          <Button
            variant="quiet"
            className="text-xs"
            onClick={() => setShowHistory((value) => !value)}
          >
            {showHistory ? copy.app.close : copy.constitution.ruleHistoryTitle}
          </Button>

          {showHistory ? (
            <ol className="mt-3 space-y-3">
              {history.map((version) => (
                <li
                  key={version.id}
                  className="space-y-1 border-l-2 border-line pl-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="outline">
                      {copy.constitution.versionLabel(version.version)}
                    </Badge>
                    <span className="text-xs text-ink-faint">
                      {formatMediumDate(version.created_at.slice(0, 10))}
                      {version.changed_by
                        ? ` · ${nameFor(version.changed_by)}`
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-ink text-pretty">{version.title}</p>
                  {version.change_note ? (
                    <p className="text-xs leading-relaxed text-ink-soft text-pretty italic">
                      {version.change_note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
