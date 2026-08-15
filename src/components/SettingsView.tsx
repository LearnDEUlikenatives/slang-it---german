import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CartoonAvatar, AVATAR_LIST } from './CartoonAvatar';
import { ACHIEVEMENTS } from '../data/achievements';
import { REGION_LABELS } from '../data/slangDatabase';
import { sounds } from '../utils/audio';
import { useTranslation, LANGUAGES, Language } from '../utils/translations';
import {
  User,
  Trophy,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Flame,
  Award,
  Crown,
  Sparkles,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sliders,
  BarChart2,
  Globe,
  Cloud,
  LogOut,
  LogIn
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    stats,
    setShowPaymentModal,
    setSystemLanguage,
    user,
    openAuthModal,
    logoutUser,
    refreshCloudSync,
    cloudSyncStatus,
  } = useGame();
  const { t } = useTranslation(profile.systemLanguage);

  const [name, setName] = useState(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarId);
  const [germanLevel, setGermanLevel] = useState(profile.germanLevel);
  const [preferredRegion, setPreferredRegion] = useState(profile.preferredRegion);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isSyncToast, setIsSyncToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playPop();
    updateProfile({
      name,
      avatarId: selectedAvatar,
      germanLevel: germanLevel as any,
      preferredRegion: preferredRegion as any,
    });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const toggleSound = () => {
    sounds.playPop();
    updateProfile({ soundEnabled: !profile.soundEnabled });
  };

  const toggleVoice = () => {
    sounds.playPop();
    updateProfile({ voiceInputEnabled: !profile.voiceInputEnabled });
  };

  const unlockedCount = profile.unlockedAchievementIds.length;
  const xpForNextLevel = 200;
  const currentLevelProgress = (profile.xp % xpForNextLevel);

  return (
    <div id="settings-view" className="max-w-4xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      {/* Top Banner: User Card with Avatar & Level Progress */}
      <div className="cartoon-card-lg bg-white rounded-3xl p-6 relative overflow-hidden border-4 border-black shadow-[6px_6px_0px_#000000] bg-gradient-to-r from-[#FF71CE]/20 via-white to-[#FFFB96]/30">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <CartoonAvatar avatarId={profile.avatarId} size="2xl" />
            <span className="absolute -bottom-2 -right-2 bg-[#FFFB96] border-2 border-black px-3 py-0.5 rounded-xl font-black text-xs text-black font-cartoon shadow-[2px_2px_0px_#000000]">
              Lv. {profile.level}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic">
                {profile.name}
              </h2>
              {profile.isPremium && (
                <span className="bg-[#FFFB96] text-black border-2 border-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase font-cartoon flex items-center gap-1 shadow-[1.5px_1.5px_0px_#000000]">
                  <Crown className="w-3 h-3 fill-black" /> VIP
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-black/80 mb-3">
              German Level: <span className="text-black font-black underline">{profile.germanLevel}</span> • Region:{' '}
              <span className="text-black font-black underline">{REGION_LABELS[profile.preferredRegion]?.label}</span>
            </p>

            {/* XP Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-black text-black font-cartoon mb-1">
                <span>XP Progress</span>
                <span>
                  {currentLevelProgress} / {xpForNextLevel} XP
                </span>
              </div>
              <div className="w-full bg-white h-4 rounded-full border-2 border-black overflow-hidden p-0.5 shadow-[2px_2px_0px_#000000]">
                <div
                  className="bg-[#05FFA1] h-full rounded-full transition-all duration-500 border border-black"
                  style={{ width: `${(currentLevelProgress / xpForNextLevel) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="cartoon-card bg-[#FFFB96] rounded-2xl p-3.5 text-center border-3 border-black shadow-[4px_4px_0px_#000000]">
          <Flame className="w-6 h-6 text-black fill-black mx-auto mb-1" />
          <span className="text-2xl font-black text-black font-cartoon block">{profile.streak} Days</span>
          <span className="text-[11px] font-bold text-black/80">{t('daily_streak')}</span>
        </div>

        <div className="cartoon-card bg-[#05FFA1] rounded-2xl p-3.5 text-center border-3 border-black shadow-[4px_4px_0px_#000000]">
          <CheckCircle2 className="w-6 h-6 text-black mx-auto mb-1" />
          <span className="text-2xl font-black text-black font-cartoon block">{profile.totalCorrect}</span>
          <span className="text-[11px] font-bold text-black/80">{t('total_correct')}</span>
        </div>

        <div className="cartoon-card bg-[#01CDFE] rounded-2xl p-3.5 text-center border-3 border-black shadow-[4px_4px_0px_#000000]">
          <Trophy className="w-6 h-6 text-black mx-auto mb-1" />
          <span className="text-2xl font-black text-black font-cartoon block">
            {unlockedCount} / {ACHIEVEMENTS.length}
          </span>
          <span className="text-[11px] font-bold text-black/80">Trophies Unlocked</span>
        </div>

        <div className="cartoon-card bg-[#FF71CE] rounded-2xl p-3.5 text-center border-3 border-black shadow-[4px_4px_0px_#000000]">
          <Award className="w-6 h-6 text-black mx-auto mb-1" />
          <span className="text-2xl font-black text-black font-cartoon block">{profile.learnedWordIds.length}</span>
          <span className="text-[11px] font-bold text-black/80">Learned Words</span>
        </div>
      </div>

      {/* Supabase Cloud Account & Sync Section */}
      <div className="cartoon-card bg-white rounded-3xl p-6 shadow-[6px_6px_0px_#000000] border-4 border-black">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#01CDFE] border-2 border-black flex items-center justify-center text-lg shadow-[2px_2px_0px_#000000]">
              ☁️
            </div>
            <div>
              <h3 className="text-lg font-black text-black font-cartoon italic">
                Supabase Cloud Sync & Account
              </h3>
              <p className="text-xs font-bold text-black/70">
                {user
                  ? `Signed in as ${user.email}`
                  : 'Save your points, streaks, and favorites across Web & Android!'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black font-cartoon border-2 border-black shadow-[2px_2px_0px_#000000] ${
                user
                  ? 'bg-[#05FFA1] text-black'
                  : 'bg-[#FFFB96] text-black'
              }`}
            >
              {user ? 'Cloud Synced ✅' : 'Guest Mode (Local)'}
            </span>
          </div>
        </div>

        {user ? (
          <div className="bg-[#05FFA1]/20 border-2 border-black rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[2px_2px_0px_#000000]">
            <div className="text-xs font-bold text-black space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span className="font-black">Connected to Supabase Cloud</span>
              </div>
              <p className="text-black/70">
                All game progress (XP, streaks, flashcards, favorites) automatically syncs to your account.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  sounds.playPop();
                  await refreshCloudSync();
                  setIsSyncToast(true);
                  setTimeout(() => setIsSyncToast(false), 2500);
                }}
                className="cartoon-btn-sm px-3.5 py-2 rounded-xl bg-[#01CDFE] hover:bg-[#01CDFE]/80 text-black font-cartoon font-black text-xs flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#000000]"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  sounds.playPop();
                  await logoutUser();
                }}
                className="cartoon-btn-sm px-3.5 py-2 rounded-xl bg-[#FF71CE] hover:bg-[#FF71CE]/80 text-black font-cartoon font-black text-xs flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#000000]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#FFFB96]/40 border-2 border-black rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[2px_2px_0px_#000000]">
            <div className="text-xs font-bold text-black space-y-1 text-center sm:text-left">
              <span className="font-black text-sm font-cartoon block">
                Never lose your progress!
              </span>
              <p className="text-black/70 max-w-md">
                Sign in with Google or your Email/Password to keep your level, unlocked trophies, and custom slang vocabulary synchronized anywhere.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                openAuthModal();
              }}
              className="cartoon-btn px-5 py-3 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black font-cartoon font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000000] shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Create Account 🚀</span>
            </button>
          </div>
        )}

        {isSyncToast && (
          <div className="mt-3 bg-[#05FFA1] border-2 border-black text-black p-2.5 rounded-xl text-xs font-black text-center animate-pop shadow-[2px_2px_0px_#000000]">
            ☁️ Cloud synchronization completed successfully!
          </div>
        )}
      </div>

      {/* Profile & Preferences Form */}
      <div className="cartoon-card bg-white rounded-3xl p-6 shadow-[6px_6px_0px_#000000] border-4 border-black">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-black" />
          <h3 className="text-lg font-black text-black font-cartoon italic">Profile & Settings</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* System Language Switcher */}
          <div>
            <label className="block text-xs font-black text-black font-cartoon mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-black" />
              <span>App System Language / Sprache der App:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  type="button"
                  key={lang.code}
                  onClick={() => {
                    sounds.playPop();
                    setSystemLanguage(lang.code);
                  }}
                  className={`p-2.5 rounded-2xl font-cartoon text-xs font-black flex items-center justify-between border-2 border-black transition-all ${
                    profile.systemLanguage === lang.code
                      ? 'bg-[#05FFA1] text-black shadow-[3px_3px_0px_#000000]'
                      : 'bg-white text-black hover:bg-[#FFFB96]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </div>
                  {profile.systemLanguage === lang.code && <CheckCircle2 className="w-4 h-4 text-black" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-black font-cartoon mb-1">
              Player Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border-2 border-black rounded-2xl px-4 py-2.5 text-sm font-black text-black focus:outline-none shadow-[2px_2px_0px_#000000]"
              maxLength={20}
            />
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-black text-black font-cartoon mb-2">
              Choose Avatar:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATAR_LIST.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => {
                    sounds.playPop();
                    setSelectedAvatar(av.id);
                  }}
                  className={`p-1.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                    selectedAvatar === av.id
                      ? 'border-black bg-[#FFFB96] ring-2 ring-black scale-105 shadow-[2px_2px_0px_#000000]'
                      : 'border-transparent hover:bg-neutral-100'
                  }`}
                >
                  <CartoonAvatar avatarId={av.id} size="sm" />
                  <span className="text-[9px] font-black text-black truncate max-w-[50px]">
                    {av.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-black text-black font-cartoon mb-1">
                German Proficiency Level:
              </label>
              <select
                value={germanLevel}
                onChange={(e) => setGermanLevel(e.target.value as any)}
                className="w-full bg-white border-2 border-black rounded-2xl px-3.5 py-2 text-xs font-black text-black focus:outline-none shadow-[2px_2px_0px_#000000]"
              >
                <option value="A1">A1 – Beginner</option>
                <option value="A2">A2 – Elementary</option>
                <option value="B1">B1 – Intermediate</option>
                <option value="B2">B2 – Upper Intermediate</option>
                <option value="C1">C1 – Advanced</option>
                <option value="Ehren-Native">Ehren-Native – Native / Kiez-Boss</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-black font-cartoon mb-1">
                Preferred Region / Dialect:
              </label>
              <select
                value={preferredRegion}
                onChange={(e) => setPreferredRegion(e.target.value as any)}
                className="w-full bg-white border-2 border-black rounded-2xl px-3.5 py-2 text-xs font-black text-black focus:outline-none shadow-[2px_2px_0px_#000000]"
              >
                <option value="all">🇩🇪 All Germany</option>
                <option value="berlin">🐻 Berlin & Kiez</option>
                <option value="bayern">🥨 Bavaria & Munich</option>
                <option value="nord">⚓ Hamburg & Coast</option>
                <option value="ruhrpott">⛏️ Ruhrpott</option>
                <option value="wien">🇦🇹 Vienna & Austria</option>
                <option value="schweiz">🇨🇭 Switzerland</option>
              </select>
            </div>
          </div>

          {/* Sound and Speech Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-black/20">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                className={`cartoon-btn-sm px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#000000] ${
                  profile.soundEnabled ? 'bg-[#FFFB96] text-black' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {profile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>Sound: {profile.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={toggleVoice}
                className={`cartoon-btn-sm px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#000000] ${
                  profile.voiceInputEnabled ? 'bg-[#FF71CE] text-black' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {profile.voiceInputEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>Voice Input: {profile.voiceInputEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <button
              type="submit"
              className="cartoon-btn px-6 py-2.5 rounded-xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black font-black text-xs font-cartoon border-2 border-black shadow-[2px_2px_0px_#000000]"
            >
              Save Profile
            </button>
          </div>

          {isSavedToast && (
            <div className="bg-[#05FFA1] border-2 border-black text-black p-2.5 rounded-xl text-xs font-black text-center animate-pop shadow-[2px_2px_0px_#000000]">
              ✅ Settings successfully saved!
            </div>
          )}
        </form>
      </div>

      {/* 15 Trophies / Achievement Showcase */}
      <div className="cartoon-card bg-white rounded-3xl p-6 shadow-[6px_6px_0px_#000000] border-4 border-black">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-black" />
            <h3 className="text-lg font-black text-black font-cartoon italic">
              {t('trophies_title')} ({unlockedCount}/{ACHIEVEMENTS.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = profile.unlockedAchievementIds.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`cartoon-card p-3.5 rounded-2xl flex items-start gap-3 transition-all border-2 border-black shadow-[3px_3px_0px_#000000] ${
                  isUnlocked
                    ? 'bg-[#FFFB96]/60'
                    : 'bg-neutral-100 opacity-60'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl border-2 border-black flex items-center justify-center text-xl shrink-0 shadow-[1.5px_1.5px_0px_#000000] ${
                    isUnlocked ? ach.badgeBg : 'bg-neutral-300'
                  }`}
                >
                  {isUnlocked ? ach.icon : <Lock className="w-4 h-4 text-black" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-black text-xs text-black font-cartoon">
                      {ach.title}
                    </h4>
                    <span className="text-[10px] font-black text-black bg-[#FFFB96] border border-black px-1.5 py-0.5 rounded-md">
                      +{ach.xpReward} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-black/80 font-bold leading-tight mt-0.5">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIP Upgrade Banner */}
      {!profile.isPremium && (
        <div className="cartoon-card-lg bg-gradient-to-r from-[#FF71CE] via-[#FFFB96] to-[#05FFA1] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-4 border-black shadow-[6px_6px_0px_#000000]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-black fill-black" />
              <h3 className="text-xl font-black text-black font-cartoon italic">
                VIP Pass Upgrade
              </h3>
            </div>
            <p className="text-xs font-bold text-black">
              Unlimited party games, all 100+ dialect packs, and zero restrictions!
            </p>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="cartoon-btn px-6 py-3 rounded-2xl bg-black hover:bg-black/80 text-[#05FFA1] font-black text-sm font-cartoon shrink-0 border-2 border-black shadow-[3px_3px_0px_#000000]"
          >
            {t('get_vip')} 👑
          </button>
        </div>
      )}
    </div>
  );
};
