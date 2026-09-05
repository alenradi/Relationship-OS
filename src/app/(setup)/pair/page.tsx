import { redirect } from "next/navigation";

import { copy } from "@/lib/copy";
import { requireSession } from "@/lib/session";

import { InviteCodePanel } from "./invite-code-panel";
import { PairChoice } from "./pair-choice";

export const metadata = { title: copy.pairing.title };

export default async function PairPage() {
  const { couple, partner } = await requireSession();

  // Complete couple, already onboarded.
  if (couple && partner && couple.onboarding_completed_at) redirect("/");
  // Complete couple, still need the wizard.
  if (couple && partner) redirect("/onboarding");

  if (couple) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <InviteCodePanel
          inviteCode={couple.invite_code}
          onboarded={Boolean(couple.onboarding_completed_at)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PairChoice />
    </div>
  );
}
