import { SignOutButton } from "@/components/sign-out-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import { APP_TIMEZONE, formatLongDate } from "@/lib/dates";
import { displayName } from "@/lib/people";
import { requireCouple } from "@/lib/session";

import { ProfileForm } from "./profile-form";
import { PushToggle } from "./push-toggle";

export const metadata = { title: copy.settings.title };

export default async function SettingsPage() {
  const { couple, profile, partner, user } = await requireCouple();

  return (
    <div className="space-y-8">
      <PageHeader title={copy.settings.title} description={copy.settings.subtitle} />

      <Card className="space-y-5">
        <CardTitle>{copy.settings.profileHeading}</CardTitle>
        <p className="text-sm text-ink-soft">{user.email}</p>
        <ProfileForm initialDisplayName={profile.display_name} />
      </Card>

      <Card className="space-y-4">
        <CardTitle>{copy.settings.partnerHeading}</CardTitle>
        <div className="flex items-center gap-3">
          <Avatar profile={partner} variant="lilac" size="lg" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-ink">
              {partner
                ? displayName(partner)
                : copy.pairing.waitingTitle}
            </p>
            {!partner ? (
              <p className="text-xs text-ink-faint">
                {copy.pairing.waitingBannerBody(couple.invite_code)}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle>{copy.settings.spaceHeading}</CardTitle>

        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {copy.settings.inviteCodeLabel}
          </p>
          <p className="font-mono text-lg tracking-[0.25em] text-ink-soft">
            {couple.invite_code}
          </p>
          {partner ? (
            <p className="text-xs text-ink-faint">{copy.settings.inviteCodeSpent}</p>
          ) : null}
        </div>

        <p className="text-sm text-ink-soft">
          {copy.settings.createdAt(formatLongDate(couple.created_at.slice(0, 10)))}
        </p>

        <Badge tone="neutral">{copy.settings.timezoneNote(APP_TIMEZONE)}</Badge>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle as="h2" className="text-base">
            {copy.settings.pushHeading}
          </CardTitle>
          <CardDescription>{copy.settings.pushBody}</CardDescription>
        </div>
        <PushToggle vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle as="h2" className="text-base">
            {copy.settings.replayTourHeading}
          </CardTitle>
          <CardDescription>{copy.settings.replayTourBody}</CardDescription>
        </div>
        <ButtonLink href="/onboarding?tour=1" variant="secondary">
          {copy.settings.replayTourCta}
        </ButtonLink>
      </Card>

      <Card tone="muted" className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle as="h2" className="text-base">
          {copy.settings.signOutHeading}
        </CardTitle>
        <SignOutButton variant="secondary" size="md" />
      </Card>
    </div>
  );
}
