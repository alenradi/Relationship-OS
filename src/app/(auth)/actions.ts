"use server";

import { redirect } from "next/navigation";

import { copy } from "@/lib/copy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string | null;
  notice?: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Only ever redirect to a path inside this app. */
function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(readString(formData, "next"));

  if (!EMAIL_PATTERN.test(email)) return { error: copy.errors.invalidEmail };
  if (!password) return { error: copy.errors.required };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: copy.auth.invalidCredentials };
  }

  redirect(next);
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = readString(formData, "display_name");

  if (!displayName) return { error: copy.errors.required };
  if (!EMAIL_PATTERN.test(email)) return { error: copy.errors.invalidEmail };
  if (password.length < 8) return { error: copy.errors.passwordTooShort };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) return { error: error.message };

  if (!data.session) return { notice: copy.auth.checkEmail };

  redirect("/pair");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
