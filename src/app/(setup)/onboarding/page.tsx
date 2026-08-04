import { redirect } from "next/navigation";

import { copy } from "@/lib/copy";
import { displayName } from "@/lib/people";
import { requireCouple } from "@/lib/session";

import { OnboardingWizard } from "./onboarding-wizard";

export const metadata = { title: copy.onboarding.welcomeTitle };

export default async function OnboardingPage() {
  const { couple, profile, partner } = await requireCouple({
    allowUnonboarded: true,
  });

  if (couple.onboarding_completed_at) redirect("/");

  return (
    <OnboardingWizard
      initialDisplayName={profile.display_name}
      partnerName={partner ? displayName(partner) : ""}
      solo={!partner}
    />
  );
}
