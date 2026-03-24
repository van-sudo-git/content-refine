import { createClient } from "@supabase/supabase-js";

// Public/anon credentials for the heros-redirect Supabase project (read-only)
const HEROS_REDIRECT_URL = "https://iqywlsxdxhhduvbhotwx.supabase.co";
const HEROS_REDIRECT_ANON_KEY = "sb_publishable_0oTNogHhUFjnnXiB2hESXA_PO8-myS_";

export const herosRedirectClient = createClient(HEROS_REDIRECT_URL, HEROS_REDIRECT_ANON_KEY);
