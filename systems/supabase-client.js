const SUPABASE_URL = "https://dkxayfqtjjklxowkoobw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_fDCrP0FbIuyfCvs2qaAfSA_bxd1Vmx-";

const { createClient } = window.supabase;

const gameSupabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

window.GameSupabase = gameSupabase;

console.log("Supabase 연결 완료");