import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const globalForAdmin = globalThis as unknown as {
  __supabaseAdmin?: SupabaseClient;
};

/**
 * Storage の署名付き URL 生成など、サーバーのみで使う service_role クライアント。
 * `SUPABASE_SERVICE_ROLE_KEY` 未設定時は `null`。
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (globalForAdmin.__supabaseAdmin) {
    return globalForAdmin.__supabaseAdmin;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return null;
  }
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  globalForAdmin.__supabaseAdmin = client;
  return client;
}
