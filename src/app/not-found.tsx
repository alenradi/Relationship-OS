import { Wordmark } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { copy } from "@/lib/copy";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
      <Wordmark />
      <div className="space-y-2">
        <h1 className="text-2xl">{copy.errors.notFound}</h1>
        <p className="text-sm text-ink-soft">{copy.errors.notFoundBody}</p>
      </div>
      <ButtonLink href="/">{copy.errors.goHome}</ButtonLink>
    </div>
  );
}
