import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Achievement } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';

import { Language } from '../utils/translations';

const STORAGE_KEY = 'slangit_german_profile_v2';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Slang-Learner',
  avatarId: 'berlin_bear',
  systemLanguage: 'en',
  germanLevel: 'B1',
  preferredRegion: 'all',
  level: 1,
  xp: 45,
  streak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  totalCorrect: 0,
  totalPlayed: 0,
  dailyGoal: 5,
  dailyProgress: 0,
  learnedWordIds: ['digga', 'ehrenmann'],
  favoritedWordIds: [],
  unlockedAchievementIds: [],
  isPremium: false,
  trialSecondsRemaining: 300, // 5 min free trial preview
  soundEnabled: true,
  voiceInputEnabled: true,
};

interface GameContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setSystemLanguage: (lang: Language) => void;
  addXP: (amount: number) => { newLevel: number; leveledUp: boolean };
  recordGameResult: (correctCount: number, totalCount: number, learnedIds: string[]) => void;
  toggleFavorite: (wordId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  newUnlockedAchievement: Achievement | null;
  dismissAchievementToast: () => void;
  stats: {
    partyGamesPlayed: number;
    partyVictories: number;
    voiceGuessesUsed: number;
  };
  recordPartyGame: (isWinner: boolean) => void;
  recordVoiceGuess: () => void;
  isFirstVisit: boolean;
  completeOnboarding: (name: string, avatarId: string, level: any, region: any, goal: number) => void;
  showPaymentModal: boolean;
  setShowPaymentModal: (val: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load profile from localStorage', e);
    }
    return DEFAULT_PROFILE;
  });

  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('umgangssprache_stats_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { partyGamesPlayed: 0, partyVictories: 0, voiceGuessesUsed: 0 };
  });

  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    return !localStorage.getItem('umgangssprache_onboarded');
  });

  const [newUnlockedAchievement, setNewUnlockedAchievement] = useState<Achievement | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Sync profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  // Sync stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('umgangssprache_stats_v1', JSON.stringify(stats));
    } catch {}
  }, [stats]);

  // Free trial countdown timer
  useEffect(() => {
    if (profile.isPremium) return;
    const interval = setInterval(() => {
      setProfile((prev) => {
        if (prev.trialSecondsRemaining <= 0) {
          return prev;
        }
        return { ...prev, trialSecondsRemaining: prev.trialSecondsRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [profile.isPremium]);

  // Check and update streaks on day rollover
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastActiveDate !== today) {
      const lastDate = new Date(profile.lastActiveDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = profile.streak;
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // streak reset
      }

      setProfile((prev) => ({
        ...prev,
        lastActiveDate: today,
        streak: newStreak,
        dailyProgress: 0, // Reset daily goal progress on new day
      }));
    }
  }, [profile.lastActiveDate, profile.streak]);

  // Sound Engine Sync
  useEffect(() => {
    sounds.setEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  // Check for newly unlocked achievements
  const evaluateAchievements = (currentProfile: UserProfile, currentStats: any) => {
    for (const ach of ACHIEVEMENTS) {
      if (!currentProfile.unlockedAchievementIds.includes(ach.id)) {
        if (ach.checkUnlocked(currentProfile, currentStats)) {
          // Unlock achievement!
          const updatedUnlocked = [...currentProfile.unlockedAchievementIds, ach.id];
          const newXp = currentProfile.xp + ach.xpReward;
          const newLevel = Math.floor(newXp / 200) + 1;

          setProfile((prev) => ({
            ...prev,
            unlockedAchievementIds: updatedUnlocked,
            xp: newXp,
            level: newLevel,
          }));

          setNewUnlockedAchievement(ach);
          sounds.playLevelUp();
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          break;
        }
      }
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      evaluateAchievements(next, stats);
      return next;
    });
  };

  const addXP = (amount: number) => {
    const oldLevel = profile.level;
    const newXp = profile.xp + amount;
    const newLevel = Math.floor(newXp / 200) + 1;
    const leveledUp = newLevel > oldLevel;

    if (leveledUp) {
      sounds.playLevelUp();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {}
    }

    const updated = {
      ...profile,
      xp: newXp,
      level: newLevel,
    };

    setProfile(updated);
    evaluateAchievements(updated, stats);
    return { newLevel, leveledUp };
  };

  const recordGameResult = (correctCount: number, totalCount: number, learnedIds: string[]) => {
    const updatedLearned = Array.from(new Set([...profile.learnedWordIds, ...learnedIds]));
    const updated = {
      ...profile,
      totalCorrect: profile.totalCorrect + correctCount,
      totalPlayed: profile.totalPlayed + totalCount,
      dailyProgress: Math.min(profile.dailyGoal, profile.dailyProgress + correctCount),
      learnedWordIds: updatedLearned,
    };
    setProfile(updated);
    evaluateAchievements(updated, stats);
  };

  const toggleFavorite = (wordId: string) => {
    setProfile((prev) => {
      const exists = prev.favoritedWordIds.includes(wordId);
      const favoritedWordIds = exists
        ? prev.favoritedWordIds.filter((id) => id !== wordId)
        : [...prev.favoritedWordIds, wordId];
      return { ...prev, favoritedWordIds };
    });
  };

  const unlockAchievement = (achievementId: string) => {
    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!ach || profile.unlockedAchievementIds.includes(achievementId)) return;

    const updatedUnlocked = [...profile.unlockedAchievementIds, achievementId];
    const newXp = profile.xp + ach.xpReward;
    const newLevel = Math.floor(newXp / 200) + 1;

    setProfile((prev) => ({
      ...prev,
      unlockedAchievementIds: updatedUnlocked,
      xp: newXp,
      level: newLevel,
    }));

    setNewUnlockedAchievement(ach);
  };

  const recordPartyGame = (isWinner: boolean) => {
    setStats((prev: any) => {
      const next = {
        ...prev,
        partyGamesPlayed: prev.partyGamesPlayed + 1,
        partyVictories: isWinner ? prev.partyVictories + 1 : prev.partyVictories,
      };
      evaluateAchievements(profile, next);
      return next;
    });
  };

  const recordVoiceGuess = () => {
    setStats((prev: any) => {
      const next = {
        ...prev,
        voiceGuessesUsed: prev.voiceGuessesUsed + 1,
      };
      evaluateAchievements(profile, next);
      return next;
    });
  };

  const setSystemLanguage = (lang: Language) => {
    updateProfile({ systemLanguage: lang });
  };

  const completeOnboarding = (
    name: string,
    avatarId: string,
    germanLevel: any,
    preferredRegion: any,
    dailyGoal: number
  ) => {
    localStorage.setItem('umgangssprache_onboarded', 'true');
    setIsFirstVisit(false);
    updateProfile({
      name,
      avatarId,
      germanLevel,
      preferredRegion,
      dailyGoal,
    });
    sounds.playPop();
  };

  const dismissAchievementToast = () => {
    setNewUnlockedAchievement(null);
  };

  return (
    <GameContext.Provider
      value={{
        profile,
        updateProfile,
        setSystemLanguage,
        addXP,
        recordGameResult,
        toggleFavorite,
        unlockAchievement,
        newUnlockedAchievement,
        dismissAchievementToast,
        stats,
        recordPartyGame,
        recordVoiceGuess,
        isFirstVisit,
        completeOnboarding,
        showPaymentModal,
        setShowPaymentModal,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
