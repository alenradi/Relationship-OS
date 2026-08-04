import Link from "next/link";

import { copy } from "@/lib/copy";

import { SignUpForm } from "./sign-up-form";

export const metadata = { title: copy.auth.signUpTitle };

export default function SignUpPage() {
  return (
    <div className="space-y-5">
      <SignUpForm />

      <p className="text-center text-sm text-ink-soft">
        {copy.auth.haveAccount}{" "}
        <Link
          href="/sign-in"
          className="font-medium text-accent-ink underline decoration-accent-line underline-offset-4 hover:decoration-accent"
        >
          {copy.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
