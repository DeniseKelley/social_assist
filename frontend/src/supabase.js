import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ttmtmsafqmfjdkbtjglv.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_zAgfHOr1r2UmatFiZv8Eiw_Fh4Vos2y';

// Capture OAuth intent ('signin' | 'signup') BEFORE createClient() inspects or strips URL parameters
let initialUrlIntent = '';
if (typeof window !== 'undefined') {
  try {
    const params = new URLSearchParams(window.location.search);
    initialUrlIntent = params.get('auth_intent') || '';
  } catch {
    // ignore URL parse errors
  }

  // Clean up any legacy auth tokens or old session bypass flags
  try {
    window.sessionStorage?.removeItem('sa_authenticated');
    Object.keys(window.localStorage).forEach((k) => {
      if (k.includes('xfyaizroguvnlekxuouu')) {
        window.localStorage.removeItem(k);
      }
    });
  } catch {
    // ignore storage errors
  }
}

const VALID_INTENTS = new Set(['signin', 'signup', 'recovery']);

export function peekOAuthIntent() {
  if (VALID_INTENTS.has(initialUrlIntent)) {
    return initialUrlIntent;
  }
  if (typeof window !== 'undefined') {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('auth_intent');
      if (VALID_INTENTS.has(fromUrl)) return fromUrl;
      const raw = window.localStorage.getItem('sa_oauth_intent');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          VALID_INTENTS.has(parsed.intent) &&
          Date.now() - (parsed.ts || 0) < 10 * 60 * 1000
        ) {
          return parsed.intent;
        }
      }
    } catch {
      // ignore storage errors
    }
  }
  return '';
}

export function setOAuthIntent(intent) {
  initialUrlIntent = intent || '';
  if (typeof window !== 'undefined') {
    try {
      if (intent) {
        window.localStorage.setItem(
          'sa_oauth_intent',
          JSON.stringify({ intent, ts: Date.now() })
        );
      } else {
        window.localStorage.removeItem('sa_oauth_intent');
      }
    } catch {
      // ignore storage errors
    }
  }
}

export function clearOAuthIntent() {
  setOAuthIntent('');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
