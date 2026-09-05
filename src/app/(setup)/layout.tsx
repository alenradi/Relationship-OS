import { Wordmark } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { copy } from "@/lib/copy";

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <span aria-label={copy.app.name}>
          <Wordmark className="max-sm:hidden" />
          <Wordmark compact className="sm:hidden" />
        </span>
        <SignOutButton variant="ghost" size="sm" />
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 pb-16 sm:px-8">
        {children}
      </main>
    </div>
  );
}
