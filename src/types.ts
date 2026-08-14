import { Language } from './utils/translations';

export type SlangCategory =
  | 'jugendsprache'
  | 'feiern'
  | 'flirten'
  | 'schule_arbeit'
  | 'food_drinks'
  | 'alman_kultur'
  | 'schimpf_ehre';

export type SlangRegion =
  | 'all'
  | 'berlin'
  | 'bayern'
  | 'ruhrpott'
  | 'nord'
  | 'wien'
  | 'schweiz';

export type SlangRarity = 'common' | 'rare' | 'legendary';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface DialogueScenario {
  title: string;
  speaker1: string;
  avatar1: string;
  text1: string;
  speaker2: string;
  avatar2: string;
  text2: string;
  targetSlot: 'speaker1' | 'speaker2';
}

export interface SlangWord {
  id: string;
  term: string;
  article?: 'der' | 'die' | 'das' | '';
  meaningDe: string;
  meaningEn: string;
  literalTranslation?: string;
  exampleDe: string;
  exampleEn: string;
  scenario: DialogueScenario;
  category: SlangCategory;
  region: SlangRegion;
  rarity: SlangRarity;
  isFamilyFriendly: boolean;
  hints: string[];
  funFact?: string;
  distractors: string[]; // 3-4 plausible false choices for quiz & game
}

export interface Player {
  id: string;
  name: string;
  avatarId: string;
  score: number;
  strikes: number;
  correctAnswers: number;
  streak: number;
  color: string;
}

export interface GameConfig {
  mode: 'single' | 'party_pass_play' | 'party_buzzer';
  sessionTime: 60 | 180 | 300; // in seconds (1 min, 3 min, 5 min)
  questionCount?: number;
  region: SlangRegion | 'all';
  categories: SlangCategory[];
  rarity: SlangRarity | 'all';
  difficulty: GameDifficulty;
  familyMode: boolean;
  timeLimit?: number;
}

export interface GameQuestion {
  id: string;
  slang: SlangWord;
  options: string[];
  correctTerm: string;
  scenarioText: string;
  speakerName: string;
  hintsRemaining: number;
}

export interface UserProfile {
  name: string;
  avatarId: string;
  systemLanguage: Language;
  germanLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'Ehren-Native';
  preferredRegion: SlangRegion;
  level: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
  totalCorrect: number;
  totalPlayed: number;
  dailyGoal: number; // e.g. 5 words
  dailyProgress: number;
  learnedWordIds: string[];
  favoritedWordIds: string[];
  unlockedAchievementIds: string[];
  isPremium: boolean;
  trialSecondsRemaining: number;
  soundEnabled: boolean;
  voiceInputEnabled: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'mastery' | 'party' | 'streak';
  rarity: 'common' | 'epic' | 'legendary';
  xpReward: number;
  badgeBg: string;
  checkUnlocked: (profile: UserProfile, stats: any) => boolean;
}
