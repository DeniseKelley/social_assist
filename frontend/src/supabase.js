import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://xfyaizroguvnlekxuouu.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Xv3OS810wGh7OV-zzewkkw_tlKW3JLJ';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const SUPERUSER_EMAILS = [
  'techfairyanna@gmail.com',
  'anna.kelley300@gmail.com',
  'anna.kelley88@yahoo.com',
];

export function isSuperuserEmail(email) {
  if (!email) return false;
  return SUPERUSER_EMAILS.includes(email.trim().toLowerCase());
}
