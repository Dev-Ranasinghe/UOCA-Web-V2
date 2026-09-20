"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  info?: string;
};

const emailSchema = (value: FormDataEntryValue | null) =>
  typeof value === "string" && /^\S+@\S+\.\S+$/.test(value) ? value : null;

export async function signInWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = emailSchema(formData.get("email"));
  const password = formData.get("password");

  if (!email || typeof password !== "string" || password.length === 0) {
    return { error: "Enter a valid email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email or password." };
  }

  // The admin-table check happens in the DAL when the destination page
  // renders — this action only proves Supabase identity. redirect() throws,
  // so nothing after this line in a caller runs on success.
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/admin") ? next : "/admin");
}

export async function signUpWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = emailSchema(formData.get("email"));
  const password = formData.get("password");

  if (!email || typeof password !== "string" || password.length < 8) {
    return { error: "Enter a valid email and a password of at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  return {
    info:
      "Account created. If email confirmation is enabled for this Supabase project, check your inbox before signing in — then ask an existing Super Admin (or run the bootstrap SQL, if this is the very first account) to grant Admin access.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
