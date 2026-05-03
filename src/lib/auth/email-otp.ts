import type { SupabaseClient } from "@supabase/supabase-js";

export async function sendLoginOtp(
  supabase: SupabaseClient,
  email: string,
  emailRedirectTo: string,
) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo,
    },
  });
}

export async function sendRegisterOtp(
  supabase: SupabaseClient,
  email: string,
  displayName: string,
  emailRedirectTo: string,
) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo,
      data: {
        display_name: displayName.trim(),
      },
    },
  });
}
