/// <reference types="vite/client" />
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { UserProfile } from '../types';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.trim() !== '' &&
    supabaseAnonKey.trim() !== '' &&
    supabaseUrl.startsWith('https://')
  );
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
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
      error: 'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
    };
  }

  try {
    const redirectTo = window.location.origin;
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { error: error.message };
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
