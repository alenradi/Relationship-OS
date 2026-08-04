import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import type { RuleVersionRow } from "@/lib/database.types";
import { formatLongDate, formatMediumDate } from "@/lib/dates";
import { displayName } from "@/lib/people";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: copy.constitution.historyTitle };

export default async function ConstitutionHistoryPage() {
  const { couple } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const [{ data: versions }, { data: members }] = await Promise.all([
    supabase
      .from("rule_versions")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("couple_id", couple.id),
  ]);

  const nameFor = (id: string | null) => {
    const member = (members ?? []).find((m) => m.id === id);
    return member ? displayName(member) : "";
  };

  // One heading per day, newest first, so the shape of "when we changed things"
  // is visible at a glance.
  const byDay = new Map<string, RuleVersionRow[]>();
  for (const version of versions ?? []) {
    const day = version.created_at.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(version);
    byDay.set(day, list);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={copy.constitution.historyTitle}
        description={copy.constitution.historySubtitle}
        actions={
          <ButtonLink href="/constitution" variant="secondary" size="sm">
            {copy.app.back}
          </ButtonLink>
        }
      />

      {byDay.size === 0 ? (
        <EmptyState title={copy.constitution.historyEmpty} />
      ) : (
        <div className="space-y-8">
          {[...byDay.entries()].map(([day, entries]) => (
            <section key={day} className="space-y-3">
              <h2 className="text-xs font-semibold tracking-[0.12em] text-ink-faint uppercase">
                {formatLongDate(day)}
              </h2>

              <div className="space-y-3">
                {entries.map((version) => (
                  <Card key={version.id} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="outline">
                        {copy.constitution.versionLabel(version.version)}
                      </Badge>
                      <Badge tone="neutral">
                        {copy.constitution.categories[version.category]}
                      </Badge>
                      <Badge
                        tone={version.status === "active" ? "sage" : "honey"}
                      >
                        {copy.constitution.statuses[version.status]}
                      </Badge>
                      <span className="text-xs text-ink-faint">
                        {version.version === 1
                          ? copy.constitution.addedBy(nameFor(version.changed_by))
                          : copy.constitution.changedBy(
                              nameFor(version.changed_by),
                            )}
                      </span>
                    </div>

                    <h3 className="text-base leading-snug text-pretty">
                      {version.title}
                    </h3>

                    {version.description ? (
                      <p className="text-sm leading-relaxed text-ink-soft text-pretty">
                        {version.description}
                      </p>
                    ) : null}

                    {version.why_agreed ? (
                      <div className="space-y-1 rounded-xl bg-surface-muted px-3.5 py-3">
                        <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
                          {copy.constitution.whyWeAgreed}
                        </p>
                        <p className="text-sm leading-relaxed text-ink-soft text-pretty">
                          {version.why_agreed}
                        </p>
                      </div>
                    ) : null}

                    {version.change_note ? (
                      <div className="space-y-1 border-l-2 border-accent-line pl-3">
                        <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
                          {copy.constitution.fieldChangeNote}
                        </p>
                        <p className="text-sm leading-relaxed text-ink-soft text-pretty italic">
                          {version.change_note}
                        </p>
                      </div>
                    ) : null}

                    <p className="text-xs text-ink-faint">
                      {formatMediumDate(version.created_at.slice(0, 10))}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
