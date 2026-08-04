import { Wordmark } from "@/components/brand";
import { copy } from "@/lib/copy";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wordmark />
          <p className="max-w-xs text-sm leading-relaxed text-ink-soft text-pretty">
            {copy.app.description}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
