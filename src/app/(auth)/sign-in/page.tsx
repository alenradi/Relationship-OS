import Link from "next/link";

import { copy } from "@/lib/copy";

import { SignInForm } from "./sign-in-form";

export const metadata = { title: copy.auth.signInTitle };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="space-y-5">
      <SignInForm next={next ?? "/"} />

      <p className="text-center text-sm text-ink-soft">
        {copy.auth.noAccount}{" "}
        <Link
          href="/sign-up"
          className="font-medium text-accent-ink underline decoration-accent-line underline-offset-4 hover:decoration-accent"
        >
          {copy.auth.signUp}
        </Link>
      </p>
    </div>
  );
}
