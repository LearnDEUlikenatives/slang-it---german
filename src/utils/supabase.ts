/// <reference types="vite/client" />
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';

// Built-in Supabase Project Configuration (Public Anon Key)
const DEFAULT_SUPABASE_URL = 'https://vemvetbhrnclcokqfvbk.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbXZldGJocm5jbGNva3FmdmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTA2MDIsImV4cCI6MjEwMjI4NjYwMn0.9249686HT7O0YQ3oIO9opT6PeY-FYUrgW43ToZmYD08';

// Static string access with built-in fallback for Android APK and Web builds
const getSupabaseUrl = (): string => {
  const val =
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL : '');
  return val && val.trim() !== '' ? val : DEFAULT_SUPABASE_URL;
};

const getSupabaseAnonKey = (): string => {
  const val =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY ? process.env.VITE_SUPABASE_ANON_KEY : '');
  return val && val.trim() !== '' ? val : DEFAULT_SUPABASE_ANON_KEY;
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  return Boolean(
    url &&
    key &&
    url.trim() !== '' &&
    key.trim() !== '' &&
    url.startsWith('https://')
  );
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });

    // Native Capacitor deep link listener for OAuth redirect callbacks
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      try {
        CapacitorApp.addListener('appUrlOpen', async (event) => {
          console.log('--- DEEP LINK RECEIVED ---');
          console.log('URL:', event.url);
          
          if (event.url) {
            try {
              await Browser.close();
            } catch {}

            try {
              // Parse tokens or auth code from URL hash or search params
              let accessToken: string | null = null;
              let refreshToken: string | null = null;
              let code: string | null = null;

              if (event.url.includes('#')) {
                const hashPart = event.url.substring(event.url.indexOf('#') + 1);
                const hashParams = new URLSearchParams(hashPart);
                accessToken = hashParams.get('access_token');
                refreshToken = hashParams.get('refresh_token');
              }

              if (!accessToken && event.url.includes('?')) {
                const queryPart = event.url.substring(event.url.indexOf('?') + 1).split('#')[0];
                const queryParams = new URLSearchParams(queryPart);
                accessToken = queryParams.get('access_token');
                refreshToken = queryParams.get('refresh_token');
                code = queryParams.get('code');
              }

              console.log('Parsed tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, code: !!code });

              if (accessToken && refreshToken && supabaseInstance) {
                await supabaseInstance.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                console.log('Session set via tokens');
              } else if (code && supabaseInstance) {
                await supabaseInstance.auth.exchangeCodeForSession(code);
                console.log('Session set via code exchange');
              } else {
                console.log('No valid tokens or code found to set session');
              }
            } catch (authParseErr) {
              console.warn('Error processing deep link OAuth tokens:', authParseErr);
            }
          }
        });
      } catch (e) {
        console.warn('Capacitor deep link listener init warning:', e);
      }
    }
  }
  return supabaseInstance;
};

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: string | null;
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(email: string, password: string, name?: string): Promise<AuthResponse> {
  const client = getSupabase();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || 'Slang Master',
          display_name: name || 'Slang Master',
        },
      },
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err: any) {
    return { user: null, session: null, error: err.message || 'Signup failed' };
  }
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const client = getSupabase();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err: any) {
    return { user: null, session: null, error: err.message || 'Login failed' };
  }
}

/**
 * Sign in with Google OAuth (Uses Supabase OAuth redirect)
 */
export async function signInWithGoogle(): Promise<{ error: string | null; url?: string | null }> {
  const client = getSupabase();
  if (!client) {
    return {
      error: 'Supabase is not configured yet.',
    };
  }

  try {
    const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
    // For native Android, deep link scheme is used
    const redirectTo = isNative
      ? 'com.learngermanlikenatives.slangit://auth/callback'
      : window.location.origin;

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: isNative, // Prevents WebView from crashing into Google 403
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.url && isNative) {
      try {
        await Browser.open({ url: data.url, windowName: '_system' });
      } catch (browserErr) {
        console.warn('Browser.open failed, falling back to window.location', browserErr);
        window.location.href = data.url;
      }
    }

    return { error: null, url: data.url };
  } catch (err: any) {
    return { error: err.message || 'Google Sign-in failed' };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: string | null }> {
  const client = getSupabase();
  if (!client) {
    return { error: null };
  }

  try {
    const { error } = await client.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: any) {
    return { error: err.message || 'Signout error' };
  }
}

/**
 * Fetch user profile from Supabase Database ('profiles' table)
 */
export async function fetchCloudProfile(userId: string): Promise<Partial<UserProfile> | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      name: data.player_name || data.name,
      avatarId: data.avatar_id,
      xp: data.xp,
      level: data.level || (data.xp ? Math.floor(data.xp / 200) + 1 : 1),
      streak: data.streak,
      germanLevel: data.german_level,
      preferredRegion: data.preferred_region,
      favoritedWordIds: data.favorited_words || [],
      learnedWordIds: data.learned_words || [],
      totalCorrect: data.total_correct || 0,
      totalPlayed: data.total_played || 0,
    };
  } catch (err) {
    console.warn('Failed to fetch cloud profile from Supabase:', err);
    return null;
  }
}

/**
 * Sync user profile to Supabase Database ('profiles' table)
 */
export async function syncProfileToCloud(profile: UserProfile, userId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: userId,
      player_name: profile.name,
      avatar_id: profile.avatarId,
      xp: profile.xp,
      level: profile.level,
      streak: profile.streak,
      german_level: profile.germanLevel,
      preferred_region: profile.preferredRegion,
      favorited_words: profile.favoritedWordIds,
      learned_words: profile.learnedWordIds,
      total_correct: profile.totalCorrect,
      total_played: profile.totalPlayed,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase profile upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync profile to Supabase:', err);
    return false;
  }
}
