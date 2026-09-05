import { AppLogo } from "@/components/brand";
import { copy } from "@/lib/copy";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(40rem_20rem_at_50%_-10%,rgba(201,123,138,0.14),transparent)]"
        aria-hidden
      />

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <AppLogo className="size-16 rounded-[1.35rem] shadow-lifted" />
          <div className="space-y-2">
            <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">
              {copy.app.name}
            </h1>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-ink-soft text-pretty">
              {copy.app.description}
            </p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
