import { redirect } from "next/navigation";

import { copy } from "@/lib/copy";
import { displayName } from "@/lib/people";
import { requireCouple } from "@/lib/session";

import { OnboardingWizard } from "./onboarding-wizard";

export const metadata = {
  title: `${copy.onboarding.welcomeTitle} · ${copy.app.name}`,
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string }>;
}) {
  const { couple, profile, partner } = await requireCouple({
    allowUnonboarded: true,
  });

  const params = await searchParams;
  const tourOnly = params.tour === "1" || params.tour === "true";

  // Already set up — only the replayable tour is allowed back in.
  if (couple.onboarding_completed_at && !tourOnly) {
    redirect("/");
  }

  return (
    <OnboardingWizard
      initialDisplayName={profile.display_name}
      partnerName={partner ? displayName(partner) : ""}
      solo={!partner}
      tourOnly={Boolean(couple.onboarding_completed_at && tourOnly)}
    />
  );
}
