import "server-only";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseServiceConfig = Boolean(supabaseUrl && serviceRoleKey);

export const supabaseAdmin = createClient(supabaseUrl || "https://example.supabase.co", serviceRoleKey || "missing-service-role-key", {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
