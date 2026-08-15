import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useTranslation } from '../utils/translations';
import { sounds } from '../utils/audio';
import { isSupabaseConfigured, signInWithEmail, signUpWithEmail, signInWithGoogle } from '../utils/supabase';
import { X, Mail, Lock, User, Sparkles, CheckCircle2, AlertCircle, Cloud, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, profile, user, logoutUser, refreshCloudSync, cloudSyncStatus } = useGame();
  const { t } = useTranslation(profile.systemLanguage);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    sounds.playPop();
    setErrorMessage(null);
    setSuccessMessage(null);
    closeAuthModal();
  };

  const handleGoogleSignIn = async () => {
    sounds.playPop();
    setErrorMessage(null);
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables to enable Google Login.'
      );
      setLoading(false);
      return;
    }

    const { error, url } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error);
      setLoading(false);
    } else if (url) {
      window.location.href = url;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playPop();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      // Helpful fallback when running in preview before secrets are added
      setTimeout(() => {
        setLoading(false);
        setErrorMessage(
          'Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment/settings to enable live authentication.'
        );
      }, 500);
      return;
    }

    if (isSignUp) {
      const res = await signUpWithEmail(email, password, displayName || profile.name);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error);
        sounds.playWrong();
      } else {
        sounds.playLevelUp();
        setSuccessMessage('Account created successfully! Check your email if verification is required.');
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
        } catch {}
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } else {
      const res = await signInWithEmail(email, password);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error);
        sounds.playWrong();
      } else {
        sounds.playCorrect();
        setSuccessMessage('Welcome back! Syncing your progress...');
        try {
          confetti({ particleCount: 50, spread: 50, origin: { y: 0.5 } });
        } catch {}
        setTimeout(() => {
          handleClose();
        }, 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-pop">
      <div
        id="auth-modal"
        className="cartoon-card-lg bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full border-4 border-black shadow-[8px_8px_0px_#000000] relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-[#FF71CE] hover:bg-[#FF71CE]/80 border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000000] transition-transform active:scale-90"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>

        {/* Already Logged In View */}
        {user ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#05FFA1] border-3 border-black mx-auto flex items-center justify-center text-3xl shadow-[3px_3px_0px_#000000]">
              ☁️
            </div>
            <div>
              <h2 className="text-2xl font-black text-black font-cartoon italic">
                {t('cloud_synced')}
              </h2>
              <p className="text-xs font-bold text-black/70 mt-1">
                {t('auth_logged_in_as')}: <span className="text-black font-black">{user.email}</span>
              </p>
            </div>

            <div className="bg-[#FFFB96] border-2 border-black rounded-2xl p-4 text-left text-xs font-bold space-y-1.5 shadow-[2px_2px_0px_#000000]">
              <div className="flex items-center justify-between">
                <span>XP Saved:</span>
                <span className="font-black text-sm">{profile.xp} XP (Lv. {profile.level})</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Daily Streak:</span>
                <span className="font-black text-sm">{profile.streak} Days 🔥</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Learned Words:</span>
                <span className="font-black text-sm">{profile.learnedWordIds.length} Slangs</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cloud Status:</span>
                <span className="font-black text-emerald-700 uppercase">{cloudSyncStatus}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  sounds.playPop();
                  refreshCloudSync();
                  setSuccessMessage('Synced with Supabase Cloud!');
                }}
                className="cartoon-btn py-3 rounded-2xl bg-[#01CDFE] hover:bg-[#01CDFE]/80 font-black text-black text-xs font-cartoon flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000000]"
              >
                <Cloud className="w-4 h-4" />
                <span>Force Cloud Sync Now</span>
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  logoutUser();
                  handleClose();
                }}
                className="cartoon-btn py-2.5 rounded-2xl bg-[#FF71CE] hover:bg-[#FF71CE]/80 font-black text-black text-xs font-cartoon border-2 border-black shadow-[2px_2px_0px_#000000]"
              >
                {t('auth_logout')}
              </button>
            </div>
          </div>
        ) : (
          /* Login & Signup Form */
          <div>
            {/* Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFFB96] border-3 border-black text-2xl shadow-[3px_3px_0px_#000000] mb-2">
                ⚡
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic tracking-tight">
                {isSignUp ? t('auth_title_signup') : t('auth_title_signin')}
              </h2>
              <p className="text-xs font-bold text-black/70 mt-1 max-w-xs mx-auto">
                {t('auth_subtitle')}
              </p>
            </div>

            {/* Supabase Status Banner if not configured */}
            {!isSupabaseConfigured() && (
              <div className="mb-4 bg-[#FFFB96]/90 border-2 border-black rounded-2xl p-3 text-left text-xs font-bold flex items-start gap-2 shadow-[2px_2px_0px_#000000]">
                <Sparkles className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-black block font-cartoon">Supabase Ready</span>
                  <p className="text-black/80 text-[11px]">
                    To connect your live Supabase project, supply <code className="bg-black/10 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> and <code className="bg-black/10 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Error / Success Feedback */}
            {errorMessage && (
              <div className="mb-3 bg-red-100 border-2 border-red-600 rounded-2xl p-2.5 text-xs font-bold text-red-900 flex items-center gap-2 animate-pop">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-3 bg-[#05FFA1]/40 border-2 border-black rounded-2xl p-2.5 text-xs font-bold text-black flex items-center gap-2 animate-pop">
                <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="cartoon-btn w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-50 text-black font-black text-xs sm:text-sm font-cartoon flex items-center justify-center gap-2.5 border-3 border-black shadow-[3px_3px_0px_#000000] mb-4 transition-all disabled:opacity-50 cursor-pointer"
            >
              {/* Colorful Google G Logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{t('auth_google_btn')}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-0.5 bg-black/20" />
              <span className="text-[10px] font-black text-black/50 uppercase font-cartoon">
                {t('auth_or_email')}
              </span>
              <div className="flex-1 h-0.5 bg-black/20" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-black text-black mb-1 font-cartoon uppercase">
                    {t('auth_name_label')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-black/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Slang-König"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-[#FFFB96]/30 shadow-[2px_2px_0px_#000000]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-black mb-1 font-cartoon uppercase">
                  {t('auth_email_label')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-black/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-[#FFFB96]/30 shadow-[2px_2px_0px_#000000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-black mb-1 font-cartoon uppercase">
                  {t('auth_password_label')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-black/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:bg-[#FFFB96]/30 shadow-[2px_2px_0px_#000000]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cartoon-btn w-full py-3.5 mt-2 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black font-black text-xs sm:text-sm font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[3px_3px_0px_#000000] cursor-pointer disabled:opacity-50"
              >
                <span>{isSignUp ? t('auth_signup_btn') : t('auth_signin_btn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Sign Up vs Sign In */}
            <div className="text-center mt-4 pt-3 border-t-2 border-black/10">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-black text-black underline hover:text-black/80 font-cartoon cursor-pointer"
              >
                {isSignUp ? t('auth_switch_to_signin') : t('auth_switch_to_signup')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
