import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl || "https://example.supabase.co", supabaseAnonKey || "missing-anon-key", {
  auth: {
    persistSession: false
  }
});

export type MissingStatus = "missing" | "found_alive" | "deceased" | "critical_health";

export type PublicStats = {
  total_missing: number;
  found_alive: number;
  deceased: number;
  critical_health: number;
};

export type SearchResult = {
  id: string;
  full_name: string;
  status: MissingStatus;
  location_category: string;
  location_detail: string | null;
  image_url: string | null;
  is_minor: boolean;
  last_seen_at: string;
};
