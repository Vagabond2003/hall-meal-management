import { supabaseAdmin } from "@/lib/supabase";

// In-memory settings cache with 60-second TTL.
// On Vercel serverless, each function invocation may get a fresh instance,
// so this cache is a "best effort" optimization — it helps when multiple
// requests hit the same warm instance but is NOT a guarantee of freshness.
// For true cross-instance caching, use Redis or Vercel KV.
let settingsCache: any = null;
let settingsCacheTime = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

export async function getCachedSettings() {
  if (settingsCache && Date.now() - settingsCacheTime < CACHE_TTL_MS) {
    return settingsCache;
  }

  const { data } = await supabaseAdmin
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  settingsCache = data;
  settingsCacheTime = Date.now();
  return data;
}
