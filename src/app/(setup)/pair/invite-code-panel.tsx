"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";

/**
 * Shown to whoever created the space. Polls rather than subscribing: the
 * partner's profile row is invisible to RLS until the moment they join, so
 * there is nothing to receive an event about beforehand.
 */
export function InviteCodePanel({
  inviteCode,
  onboarded = false,
}: {
  inviteCode: string;
  onboarded?: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
    } catch {
      // Clipboard blocked — the code is on screen.
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl">{copy.pairing.waitingTitle}</h1>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-ink-soft text-pretty">
          {copy.pairing.waitingBody}
        </p>
      </div>

      <Card className="space-y-5 text-center">
        <div className="space-y-1.5">
          <CardTitle as="h2">{copy.pairing.inviteHeading}</CardTitle>
          <CardDescription className="mx-auto max-w-sm">
            {copy.pairing.inviteBody}
          </CardDescription>
        </div>

        <p className="font-mono text-3xl tracking-[0.35em] text-accent-ink sm:text-4xl">
          {inviteCode}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={copyCode} variant={copied ? "soft" : "primary"}>
            {copied ? copy.pairing.copied : copy.pairing.copyCode}
          </Button>
          <Button variant="secondary" onClick={() => router.refresh()}>
            {copy.pairing.refresh}
          </Button>
        </div>
      </Card>

      <div className="space-y-2 text-center">
        <ButtonLink
          href={onboarded ? "/" : "/onboarding"}
          variant="soft"
          size="lg"
        >
          {copy.pairing.continueAlone}
        </ButtonLink>
        <p className="mx-auto max-w-sm text-xs text-ink-faint text-pretty">
          {copy.pairing.continueAloneHelp}
        </p>
      </div>
    </div>
  );
}
