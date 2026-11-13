import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ttmtmsafqmfjdkbtjglv.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_zAgfHOr1r2UmatFiZv8Eiw_Fh4Vos2y';

// Clean up any legacy auth token from the old shared project
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    Object.keys(window.localStorage).forEach((k) => {
      if (k.includes('xfyaizroguvnlekxuouu')) {
        window.localStorage.removeItem(k);
      }
    });
  } catch {
    // ignore storage errors
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export const SUPERUSER_EMAILS = [
  'techfairyanna@gmail.com',
  'anna.kelley300@gmail.com',
  'anna.kelley88@yahoo.com',
];

export function isSuperuserEmail(email) {
  if (!email) return false;
  return SUPERUSER_EMAILS.includes(email.trim().toLowerCase());
}
