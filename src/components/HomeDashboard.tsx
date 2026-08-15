import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { CartoonAvatar } from './CartoonAvatar';
import { ACHIEVEMENTS } from '../data/achievements';
import { SLANG_DATABASE } from '../data/slangDatabase';
import { sounds, speakGerman } from '../utils/audio';
import { useTranslation, LANGUAGES } from '../utils/translations';
import { getSlangMeaning } from '../utils/slangTranslations';
import { TabType } from '../App';
import {
  Flame,
  Zap,
  Trophy,
  Crown,
  Sparkles,
  Target,
  ArrowRight,
  CheckCircle2,
  Clock,
  Volume2,
  Play
} from 'lucide-react';

interface Props {
  onNavigate: (tab: TabType) => void;
  onPracticeSlang?: (slang: any) => void;
}

export const HomeDashboard: React.FC<Props> = ({ onNavigate, onPracticeSlang }) => {
  const { profile, setShowPaymentModal } = useGame();
  const { t } = useTranslation(profile.systemLanguage);

  const xpForNextLevel = 200;
  const currentLevelProgress = profile.xp % xpForNextLevel;

  // Slang of the Day
  const slangOfTheDay = useMemo(() => {
    const todayNum = new Date().getDate();
    return SLANG_DATABASE[todayNum % SLANG_DATABASE.length] || SLANG_DATABASE[0];
  }, []);

  const minutesLeft = Math.floor(profile.trialSecondsRemaining / 60);
  const secondsLeft = profile.trialSecondsRemaining % 60;

  const handleSpeakDaySlang = () => {
    sounds.playPop();
    speakGerman(`${slangOfTheDay.article ? slangOfTheDay.article + ' ' : ''}${slangOfTheDay.term}. ${slangOfTheDay.exampleDe}`);
  };

  return (
    <div id="home-dashboard" className="max-w-5xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      {/* Top Hero Banner: Avatar + Dynamic Stats + Streak */}
      <div className="cartoon-card-lg bg-gradient-to-r from-[#FFFB96] via-[#05FFA1] to-[#01CDFE] rounded-3xl p-6 sm:p-8 relative overflow-hidden border-4 border-black shadow-[8px_8px_0px_#000000]">
        {/* Background Comic Decors */}
        <div className="absolute top-2 right-4 text-7xl opacity-20 select-none pointer-events-none">
          🥨
        </div>
        <div className="absolute bottom-2 right-40 text-7xl opacity-15 select-none pointer-events-none">
          🥙
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          {/* User Profile Info */}
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="relative">
              <CartoonAvatar avatarId={profile.avatarId} size="2xl" />
              <span className="absolute -bottom-2 -right-2 bg-black text-[#FFFB96] border-2 border-black px-3 py-0.5 rounded-xl font-black text-xs font-cartoon shadow-[2px_2px_0px_#ffffff]">
                Lv. {profile.level}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-3xl sm:text-4xl font-black text-black font-cartoon tracking-tight italic">
                  {t('greeting_prefix')}, {profile.name}!
                </h1>
                {profile.isPremium && (
                  <span className="bg-black text-[#FFFB96] border-2 border-black px-2.5 py-0.5 rounded-xl text-xs font-black uppercase font-cartoon flex items-center gap-1 shadow-[2px_2px_0px_#000000]">
                    <Crown className="w-3.5 h-3.5 fill-[#FFFB96]" /> VIP
                  </span>
                )}
              </div>

              {/* XP Progress Bar */}
              <div className="mt-3 w-full sm:w-64">
                <div className="flex justify-between text-[11px] font-black text-black font-cartoon mb-1">
                  <span>Level {profile.level}</span>
                  <span>{currentLevelProgress} / {xpForNextLevel} XP</span>
                </div>
                <div className="w-full bg-black/20 h-4 rounded-full border-2 border-black overflow-hidden p-0.5">
                  <div
                    className="bg-black h-full rounded-full transition-all duration-500"
                    style={{ width: `${(currentLevelProgress / xpForNextLevel) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Badges: Streak, Daily Goal, Correct Count */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto">
            {/* Daily Streak */}
            <div className="cartoon-card bg-white rounded-2xl p-3 sm:p-4 text-center border-2 border-black shadow-[3px_3px_0px_#000000]">
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                <Flame className="w-5 h-5 fill-orange-500 animate-wiggle" />
                <span className="text-xl sm:text-2xl font-black text-black font-cartoon">
                  {profile.streak}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-black text-black/80 uppercase font-cartoon block">
                {t('daily_streak')}
              </span>
            </div>

            {/* Daily Goal */}
            <div className="cartoon-card bg-white rounded-2xl p-3 sm:p-4 text-center border-2 border-black shadow-[3px_3px_0px_#000000]">
              <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                <Target className="w-5 h-5" />
                <span className="text-xl sm:text-2xl font-black text-black font-cartoon">
                  {profile.dailyProgress}/{profile.dailyGoal}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-black text-black/80 uppercase font-cartoon block">
                {t('daily_goal')}
              </span>
            </div>

            {/* Total Correct */}
            <div className="cartoon-card bg-white rounded-2xl p-3 sm:p-4 text-center border-2 border-black shadow-[3px_3px_0px_#000000]">
              <div className="flex items-center justify-center gap-1 text-[#01CDFE] mb-1">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xl sm:text-2xl font-black text-black font-cartoon">
                  {profile.totalCorrect}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-black text-black/80 uppercase font-cartoon block">
                {t('total_correct')}
              </span>
            </div>
          </div>
        </div>

        {/* Free Trial Banner in Hero if non-premium */}
        {!profile.isPremium && (
          <div className="mt-5 pt-4 border-t-2 border-black/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-black font-black">
              <Clock className="w-4 h-4 text-black" />
              <span>
                {t('free_trial_remaining')} <strong>{minutesLeft}:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}</strong> {t('min_full_access')}
              </span>
            </div>
            <button
              onClick={() => {
                sounds.playPop();
                setShowPaymentModal(true);
              }}
              className="cartoon-btn-sm px-4 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-[#FFFB96] font-black text-xs font-cartoon flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
            >
              <Crown className="w-3.5 h-3.5 fill-[#FFFB96]" />
              <span>{t('get_vip')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Slang of the Day Feature Showcase */}
      <div className="cartoon-card-lg bg-white rounded-3xl p-5 sm:p-7 border-4 border-black shadow-[6px_6px_0px_#000000] bg-gradient-to-r from-white to-[#FFFB96]/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFFB96] border-3 border-black flex items-center justify-center text-3xl shrink-0 shadow-[3px_3px_0px_#000000]">
              🌟
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black text-black uppercase tracking-wider font-cartoon bg-[#FF71CE] px-2.5 py-0.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_#000000]">
                  {t('slang_of_day')}
                </span>
                <button
                  onClick={handleSpeakDaySlang}
                  className="w-7 h-7 rounded-lg border-2 border-black bg-[#01CDFE] flex items-center justify-center hover:bg-[#01CDFE]/80 shadow-[1.5px_1.5px_0px_#000000]"
                  title="Listen pronunciation"
                >
                  <Volume2 className="w-4 h-4 text-black" />
                </button>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic">
                "{slangOfTheDay.term}"
              </h3>
              <p className="text-xs sm:text-sm font-bold text-black/90 mt-1 leading-snug">
                🇩🇪 {slangOfTheDay.meaningDe}
              </p>
              {profile.systemLanguage !== 'de' && (
                <p className="text-xs font-bold text-black/80 mt-0.5">
                  {LANGUAGES.find((l) => l.code === profile.systemLanguage)?.flag || '🌐'}{' '}
                  {getSlangMeaning(slangOfTheDay, profile.systemLanguage)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onPracticeSlang?.(slangOfTheDay);
            }}
            className="cartoon-btn px-6 py-3 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-sm text-black font-cartoon shrink-0 border-3 border-black shadow-[4px_4px_0px_#000000] flex items-center gap-2"
          >
            <span>{t('practice_this_term')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Achievements Showcase */}
      <div className="cartoon-card-lg bg-white rounded-3xl p-5 sm:p-6 border-4 border-black shadow-[6px_6px_0px_#000000]">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-black" />
            <h3 className="text-base sm:text-lg font-black text-black font-cartoon">
              {t('recent_achievements')} ({profile.unlockedAchievementIds.length}/{ACHIEVEMENTS.length})
            </h3>
          </div>
          <button
            onClick={() => {
              sounds.playPop();
              onNavigate('settings');
            }}
            className="text-xs font-black text-black hover:underline font-cartoon"
          >
            {t('view_all')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACHIEVEMENTS.slice(0, 3).map((ach) => {
            const isUnlocked = profile.unlockedAchievementIds.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`cartoon-card p-3 rounded-2xl flex items-center gap-3 border-2 border-black ${
                  isUnlocked ? 'bg-[#FFFB96] shadow-[3px_3px_0px_#000000]' : 'bg-neutral-100 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center text-lg shrink-0 ${
                    isUnlocked ? ach.badgeBg : 'bg-neutral-300'
                  }`}
                >
                  {isUnlocked ? ach.icon : '🔒'}
                </div>
                <div>
                  <h4 className="font-black text-xs text-black font-cartoon">{ach.title}</h4>
                  <span className="text-[10px] text-black/80 font-bold line-clamp-1">
                    {ach.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
