import { supabaseAdmin } from "@/lib/supabase";

// NOTE: On Vercel serverless, each function invocation gets a fresh memory
// instance, so in-memory caching provides almost no value. We now fetch
// directly from Supabase on every call. PostgreSQL caches hot rows well,
// and the settings table is tiny (single row). For true cross-instance
// caching, use Redis or Vercel KV.
export async function getCachedSettings() {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  return data;
}
