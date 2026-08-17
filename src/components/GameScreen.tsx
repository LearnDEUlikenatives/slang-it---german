import React, { useState, useEffect, useRef } from 'react';
import { GameConfig, SlangWord, GameDifficulty, SlangRegion, SlangCategory, SlangRarity } from '../types';
import { SLANG_DATABASE, CATEGORY_LABELS, REGION_LABELS, RARITY_LABELS } from '../data/slangDatabase';
import { CartoonAvatar } from './CartoonAvatar';
import { AnswerFeedbackModal } from './AnswerFeedbackModal';
import { AdInterstitialModal } from './AdInterstitialModal';
import { sounds, speakGerman, createSpeechRecognizer } from '../utils/audio';
import { useGame } from '../context/GameContext';
import { useTranslation, LANGUAGES } from '../utils/translations';
import { getSlangMeaning } from '../utils/slangTranslations';
import {
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  Flame,
  HelpCircle,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Filter,
  Sliders,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onBackToMenu?: () => void;
  preselectedSlang?: SlangWord | null;
  registerBackHandler?: (handler: (() => boolean) | null) => void;
}

export const GameScreen: React.FC<Props> = ({ onBackToMenu, preselectedSlang, registerBackHandler }) => {
  const { profile, addXP, recordGameResult, recordVoiceGuess, setShowPaymentModal } = useGame();
  const { t } = useTranslation(profile.systemLanguage);

  // Config State
  const [isConfiguring, setIsConfiguring] = useState(!preselectedSlang);
  const [config, setConfig] = useState<GameConfig>({
    mode: 'single',
    sessionTime: 180, // 3 min default (60, 180, 300)
    region: 'all',
    categories: ['jugendsprache', 'feiern', 'alman_kultur', 'flirten', 'food_drinks'],
    rarity: 'all',
    difficulty: 'easy',
    familyMode: false,
  });

  // Game Engine State
  const [questions, setQuestions] = useState<SlangWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(config.sessionTime);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showEndGameAd, setShowEndGameAd] = useState(false);
  const [gameHistory, setGameHistory] = useState<Array<{ slang: SlangWord; chosen: string; isCorrect: boolean }>>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Timer Refs
  const timerRef = useRef<any>(null);
  const autoNextTimeoutRef = useRef<any>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    };
  }, []);

  // Register Android back button handler
  useEffect(() => {
    if (registerBackHandler) {
      registerBackHandler(() => {
        if (!isConfiguring) {
          sounds.playPop();
          if (timerRef.current) clearInterval(timerRef.current);
          if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
          setIsConfiguring(true);
          setIsGameOver(false);
          return true; // handled, stopped active game and went to play config screen
        }
        return false; // let App.tsx return to home
      });
    }
    return () => {
      if (registerBackHandler) registerBackHandler(null);
    };
  }, [isConfiguring, registerBackHandler]);

  // If preselected word was passed
  useEffect(() => {
    if (preselectedSlang) {
      startGameWithWord(preselectedSlang);
    }
  }, [preselectedSlang]);

  const startGameWithWord = (word: SlangWord) => {
    const pool = [word, ...SLANG_DATABASE.filter((w) => w.id !== word.id).sort(() => Math.random() - 0.5)];
    setQuestions(pool);
    setCurrentIndex(0);
    setScore(0);
    setStrikes(0);
    setCombo(0);
    setGameHistory([]);
    setTotalTimeLeft(config.sessionTime);
    setIsGameOver(false);
    setIsConfiguring(false);
    loadQuestion(0, pool, config.difficulty);
  };

  // Start game with filtered questions
  const startGame = () => {
    sounds.playPop();
    let pool = [...SLANG_DATABASE];

    if (config.familyMode) {
      pool = pool.filter((w) => w.isFamilyFriendly);
    }

    if (config.region !== 'all') {
      pool = pool.filter((w) => w.region === config.region || w.region === 'all');
    }

    if (config.categories.length > 0) {
      pool = pool.filter((w) => config.categories.includes(w.category));
    }

    if (config.rarity !== 'all') {
      pool = pool.filter((w) => w.rarity === config.rarity);
    }

    // Shuffle pool
    pool.sort(() => Math.random() - 0.5);

    if (pool.length === 0) {
      pool = [...SLANG_DATABASE].sort(() => Math.random() - 0.5);
    }

    setQuestions(pool);
    setCurrentIndex(0);
    setScore(0);
    setStrikes(0);
    setCombo(0);
    setGameHistory([]);
    setTotalTimeLeft(config.sessionTime);
    setIsGameOver(false);
    setIsConfiguring(false);
    loadQuestion(0, pool, config.difficulty);
  };

  const loadQuestion = (index: number, qList: SlangWord[], difficulty: GameDifficulty) => {
    if (index >= qList.length) {
      finishGame();
      return;
    }

    const currentQ = qList[index];
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setRevealedHints(0);
    setVoiceTranscript('');
    setVoiceError(null);

    // Prepare options based on DIFFICULTY:
    // Easy: 2 options (1 correct + 1 distractor)
    // Medium: 3 options (1 correct + 2 distractors)
    // Hard: 4 options (1 correct + 3 distractors)
    const distractorPool = currentQ.distractors && currentQ.distractors.length > 0
      ? currentQ.distractors
      : ['Digga', 'Alman', 'Macher', 'Chaya'];
    
    let distractorsToTake = 1;
    if (difficulty === 'medium') distractorsToTake = 2;
    if (difficulty === 'hard') distractorsToTake = 3;

    const chosenDistractors = distractorPool.slice(0, distractorsToTake);
    const options = [currentQ.term, ...chosenDistractors];
    options.sort(() => Math.random() - 0.5);
    setShuffledOptions(options);
  };

  // Session Timer Tick
  useEffect(() => {
    if (isConfiguring || isGameOver) return;

    timerRef.current = setInterval(() => {
      setTotalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 10 && prev % 2 === 0) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConfiguring, isGameOver]);

  // Safely trigger finishGame when timer reaches 0
  useEffect(() => {
    if (!isConfiguring && !isGameOver && totalTimeLeft === 0 && questions.length > 0) {
      finishGame();
    }
  }, [totalTimeLeft, isConfiguring, isGameOver, questions.length]);

  const handleAnswer = (chosenTerm: string, isFromClick = true) => {
    if (isAnswerRevealed || isGameOver) return;

    const currentQ = questions[currentIndex];
    const isCorrect = chosenTerm.trim().toLowerCase() === currentQ.term.trim().toLowerCase();

    setSelectedOption(chosenTerm);
    setIsAnswerRevealed(true);

    if (isCorrect) {
      sounds.playCorrect();
      const comboMultiplier = combo >= 3 ? 2 : combo >= 2 ? 1.5 : 1;
      const basePoints = config.difficulty === 'hard' ? 150 : config.difficulty === 'medium' ? 100 : 75;
      const earned = Math.round(basePoints * comboMultiplier);
      setScore((prev) => prev + earned);
      setCombo((prev) => prev + 1);

      // Confetti on streaks
      if (combo >= 2) {
        try {
          confetti({
            particleCount: 40,
            spread: 55,
            origin: { y: 0.6 },
          });
        } catch {}
      }

      // Auto-advance straight after 1 second (1000ms) to next scenario on correct answer
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 1000);
    } else {
      sounds.playWrong();
      setCombo(0);
      const newStrikes = strikes + 1;
      setStrikes(newStrikes);
      if (newStrikes >= 3 && config.difficulty === 'hard') {
        // 3 strikes game over on Hard mode after popup
      }
    }

    setGameHistory((prev) => [
      ...prev,
      {
        slang: currentQ,
        chosen: chosenTerm,
        isCorrect,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    sounds.playPop();
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length || totalTimeLeft <= 0) {
      finishGame();
    } else {
      setCurrentIndex(nextIdx);
      loadQuestion(nextIdx, questions, config.difficulty);
    }
  };

  const finishGame = () => {
    clearInterval(timerRef.current);
    setIsGameOver(true);
    const correctCount = gameHistory.filter((h) => h.isCorrect).length;
    const learnedIds = gameHistory.filter((h) => h.isCorrect).map((h) => h.slang.id);
    
    // Calculate total XP
    const xpGained = score + (correctCount * 25);
    addXP(xpGained);
    recordGameResult(correctCount, gameHistory.length || 1, learnedIds);

    // Trigger Ad for free users upon finishing a round under Play
    if (!profile.isPremium) {
      setShowEndGameAd(true);
    }

    if (correctCount >= 3) {
      sounds.playLevelUp();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.4 },
        });
      } catch {}
    }
  };

  const handleShowHint = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ.hints || revealedHints >= currentQ.hints.length) return;
    sounds.playPop();
    setRevealedHints((prev) => prev + 1);
  };

  const handleSpeakDialogue = () => {
    const currentQ = questions[currentIndex];
    sounds.playPop();
    const textToSpeak = `${currentQ.scenario.speaker1}: ${currentQ.scenario.text1}`;
    speakGerman(textToSpeak);
  };

  // Voice Input Handler
  const toggleVoiceInput = () => {
    if (!profile.voiceInputEnabled) return;
    if (isListening) {
      speechRecognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    sounds.playPop();
    recordVoiceGuess();
    setIsListening(true);
    setVoiceError(null);
    setVoiceTranscript('');

    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setVoiceTranscript(transcript);
        const currentQ = questions[currentIndex];
        const normalized = transcript.toLowerCase();
        
        if (normalized.includes(currentQ.term.toLowerCase())) {
          handleAnswer(currentQ.term, false);
          recognizer?.stop();
          setIsListening(false);
        } else {
          for (const opt of shuffledOptions) {
            if (normalized.includes(opt.toLowerCase())) {
              handleAnswer(opt, false);
              recognizer?.stop();
              setIsListening(false);
              break;
            }
          }
        }
      },
      () => {
        setVoiceError('Microphone not recognized or speech unclear');
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    speechRecognizerRef.current = recognizer;
    recognizer?.start();
  };

  const currentQ = questions[currentIndex];

  // 1. CONFIGURATION VIEW
  if (isConfiguring) {
    return (
      <div id="game-config-screen" className="max-w-3xl mx-auto py-4 px-3 sm:px-6">
        <div className="cartoon-card-lg bg-white rounded-3xl p-6 sm:p-8 relative overflow-hidden border-4 border-black shadow-[8px_8px_0px_#000000]">
          {/* Header Banner */}
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-black/10">
            <div className="w-10 h-10 rounded-2xl bg-[#05FFA1] border-3 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_#000000] shrink-0">
              🎮
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-black font-cartoon italic tracking-tight whitespace-nowrap">
                {t('game_config_title')}
              </h2>
            </div>
          </div>

          <div className="space-y-6">
            {/* FIRST OPTION: Zeit (Time Duration) */}
            <div>
              <label className="block text-sm font-black text-black mb-2 font-cartoon flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-black" />
                <span>{t('time_label')}:</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { time: 60, label: t('time_1min') },
                  { time: 180, label: t('time_3min') },
                  { time: 300, label: t('time_5min') },
                ].map((item) => (
                  <button
                    key={item.time}
                    onClick={() => {
                      sounds.playPop();
                      setConfig((prev) => ({ ...prev, sessionTime: item.time as any }));
                    }}
                    className={`cartoon-btn-sm py-3 rounded-2xl font-black text-xs sm:text-sm border-2 border-black transition-all ${
                      config.sessionTime === item.time
                        ? 'bg-[#FFFB96] text-black ring-2 ring-black shadow-[4px_4px_0px_#000000]'
                        : 'bg-white text-black hover:bg-[#FFFB96]/40 shadow-[2px_2px_0px_#000000]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SECOND OPTION: Difficulty Level (2 vs 3 vs 4 options) */}
            <div>
              <label className="block text-sm font-black text-black mb-2 font-cartoon flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-black" />
                <span>{t('difficulty_label')}:</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { diff: 'easy', label: t('diff_easy') },
                  { diff: 'medium', label: t('diff_medium') },
                  { diff: 'hard', label: t('diff_hard') },
                ].map((item) => (
                  <button
                    key={item.diff}
                    onClick={() => {
                      sounds.playPop();
                      setConfig((prev) => ({ ...prev, difficulty: item.diff as GameDifficulty }));
                    }}
                    className={`cartoon-btn-sm py-3 rounded-2xl font-black text-xs sm:text-sm border-2 border-black transition-all ${
                      config.difficulty === item.diff
                        ? 'bg-[#05FFA1] text-black ring-2 ring-black shadow-[4px_4px_0px_#000000]'
                        : 'bg-white text-black hover:bg-[#05FFA1]/40 shadow-[2px_2px_0px_#000000]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Region Selection */}
            <div>
              <label className="block text-sm font-black text-black mb-2 font-cartoon">
                {t('region_label')}:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(REGION_LABELS) as SlangRegion[]).map((reg) => {
                  const meta = REGION_LABELS[reg];
                  return (
                    <button
                      key={reg}
                      onClick={() => {
                        sounds.playPop();
                        setConfig((prev) => ({ ...prev, region: reg }));
                      }}
                      className={`cartoon-btn-sm p-2 rounded-2xl flex items-center gap-2 text-xs font-black text-left border-2 border-black ${
                        config.region === reg
                          ? 'bg-[#01CDFE] text-black shadow-[3px_3px_0px_#000000]'
                          : 'bg-white text-black hover:bg-[#01CDFE]/30 shadow-[2px_2px_0px_#000000]'
                      }`}
                    >
                      <span className="text-lg">{meta.flag}</span>
                      <span className="truncate">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories (2x4 Arrangement) */}
            <div>
              <label className="block text-sm font-black text-black mb-2 font-cartoon">
                {t('category_label')}:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CATEGORY_LABELS) as SlangCategory[]).map((cat) => {
                  const meta = CATEGORY_LABELS[cat];
                  const isSelected = config.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        sounds.playPop();
                        setConfig((prev) => {
                          const exists = prev.categories.includes(cat);
                          const updated = exists
                            ? prev.categories.filter((c) => c !== cat)
                            : [...prev.categories, cat];
                          return { ...prev, categories: updated.length ? updated : [cat] };
                        });
                      }}
                      className={`cartoon-btn-sm p-2 rounded-xl text-xs font-black flex items-center gap-2 border-2 border-black transition-all ${
                        isSelected
                          ? 'bg-[#FF71CE] text-black shadow-[2.5px_2.5px_0px_#000000]'
                          : 'bg-white text-black/70 hover:bg-neutral-100 shadow-[1.5px_1.5px_0px_#000000]'
                      }`}
                    >
                      <span className="text-base shrink-0">{meta.icon}</span>
                      <span className="truncate">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startGame}
              className="cartoon-btn w-full py-4 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-base text-black font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_#000000] mt-4"
            >
              <Play className="w-5 h-5 fill-black text-black" />
              <span>{t('start_game_btn')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. GAME OVER VIEW
  if (isGameOver) {
    const correctCount = gameHistory.filter((h) => h.isCorrect).length;
    const totalAnswered = gameHistory.length;

    return (
      <div id="game-results-screen" className="max-w-2xl mx-auto py-6 px-3 sm:px-6">
        <div className="cartoon-card-lg bg-white rounded-3xl p-6 sm:p-8 text-center border-4 border-black shadow-[8px_8px_0px_#000000] animate-pop">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFFB96] border-4 border-black flex items-center justify-center text-4xl mb-4 shadow-[4px_4px_0px_#000000] animate-bounce">
            🏆
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-black font-cartoon tracking-tight italic mb-2">
            {t('game_over_title')}
          </h2>

          <p className="text-sm font-bold text-black/80 mb-6">
            {t('great_job')} <strong className="text-black text-base">+{score + correctCount * 25} XP</strong>!
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#FFFB96] p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000000]">
              <span className="text-2xl font-black text-black font-cartoon block">{score}</span>
              <span className="text-[11px] font-bold text-black/80">{t('score')}</span>
            </div>
            <div className="bg-[#05FFA1] p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000000]">
              <span className="text-2xl font-black text-black font-cartoon block">{correctCount}/{totalAnswered}</span>
              <span className="text-[11px] font-bold text-black/80">{t('total_correct')}</span>
            </div>
            <div className="bg-[#01CDFE] p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000000]">
              <span className="text-2xl font-black text-black font-cartoon block">{Math.round((correctCount / (totalAnswered || 1)) * 100)}%</span>
              <span className="text-[11px] font-bold text-black/80">Accuracy</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                sounds.playPop();
                startGame();
              }}
              className="cartoon-btn flex-1 py-3.5 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-sm text-black font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[3px_3px_0px_#000000]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('play_again')}</span>
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                if (onBackToMenu) onBackToMenu();
                else setIsConfiguring(true);
              }}
              className="cartoon-btn flex-1 py-3.5 rounded-2xl bg-white hover:bg-neutral-100 font-black text-sm text-black font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[3px_3px_0px_#000000]"
            >
              <span>{t('back_to_menu')}</span>
            </button>
          </div>

          {/* Ad Display for Free Users Upon Finishing a Round */}
          <AdInterstitialModal
            isOpen={showEndGameAd}
            onClose={() => setShowEndGameAd(false)}
            countdownSeconds={5}
            adContext="play_finish"
          />
        </div>
      </div>
    );
  }

  // 3. ACTIVE GAMEPLAY SCREEN
  if (!currentQ) return null;

  const minutesLeft = Math.floor(totalTimeLeft / 60);
  const secondsLeft = totalTimeLeft % 60;

  return (
    <div id="active-game-screen" className="max-w-2xl mx-auto py-2 sm:py-3 px-3 sm:px-5">
      {/* Top Status Bar: Timer, Combo, Hint (Inline), Strikes & Score */}
      <div className="cartoon-card bg-white rounded-2xl p-2.5 sm:p-3 mb-3 flex items-center justify-between gap-2 border-3 border-black shadow-[4px_4px_0px_#000000]">
        {/* Total Session Time Left */}
        <div className="flex items-center gap-1.5 bg-[#FFFB96] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000]">
          <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${totalTimeLeft <= 15 ? 'text-rose-600 animate-spin' : 'text-black'}`} />
          <span className="font-cartoon text-xs sm:text-sm font-black text-black">
            {minutesLeft}:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
          </span>
        </div>

        {/* Combo Multiplier (if active) */}
        {combo > 1 && (
          <div className="flex items-center gap-1 bg-[#FF71CE] px-2 py-1 rounded-xl border-2 border-black animate-bounce shadow-[1.5px_1.5px_0px_#000000]">
            <Flame className="w-3.5 h-3.5 text-black fill-black" />
            <span className="font-cartoon text-[11px] font-black text-black">
              {combo}x
            </span>
          </div>
        )}

        {/* Strikes (Hard Mode) */}
        {config.difficulty === 'hard' && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`text-sm ${s <= strikes ? 'opacity-100 grayscale-0 scale-110' : 'opacity-25 grayscale'}`}
              >
                ❌
              </span>
            ))}
          </div>
        )}

        {/* Hint Button (Moved to top status bar) */}
        {currentQ.hints && currentQ.hints.length > 0 && (
          <button
            disabled={isAnswerRevealed || revealedHints >= currentQ.hints.length}
            onClick={handleShowHint}
            className="cartoon-btn-sm px-2.5 py-1 rounded-xl bg-white hover:bg-neutral-100 text-black font-cartoon text-xs font-black flex items-center gap-1 border-2 border-black shadow-[1.5px_1.5px_0px_#000000] disabled:opacity-40"
            title="Get a hint"
          >
            <HelpCircle className="w-3.5 h-3.5 text-black" />
            <span>{t('hint_btn')} {revealedHints < currentQ.hints.length ? `(${currentQ.hints.length - revealedHints})` : ''}</span>
          </button>
        )}

        {/* Score Tally */}
        <div className="flex items-center gap-1.5 bg-[#05FFA1] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000]">
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
          <span className="font-cartoon text-xs sm:text-sm font-black text-black">
            {score} {t('score')}
          </span>
        </div>
      </div>

      {/* Revealed Hint Message (if clicked) */}
      {revealedHints > 0 && currentQ.hints && (
        <div className="mb-2 p-2 bg-[#FFFB96] rounded-xl border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_#000000] animate-pop">
          💡 Hint: {currentQ.hints[revealedHints - 1]}
        </div>
      )}

      {/* Comic Scenario Question Card */}
      <div className="cartoon-card-lg bg-white rounded-3xl p-4 sm:p-5 border-3 border-black shadow-[5px_5px_0px_#000000]">
        {/* Comic Dialogue Bubble */}
        <div className="bg-[#FFFB96]/20 border-2 border-black rounded-2xl p-3 sm:p-4 mb-3 space-y-2.5 shadow-[2px_2px_0px_#000000]">
          {/* Speaker 1 (Context Prompt) */}
          <div className="flex items-start gap-2.5">
            <CartoonAvatar avatarId={currentQ.scenario.avatar1} size="md" className="shrink-0" />
            <div className="bg-white border-2 border-black rounded-2xl rounded-tl-sm p-2.5 shadow-[1.5px_1.5px_0px_#000000] max-w-[85%]">
              <span className="text-[10px] font-black text-black font-cartoon block mb-0.5">
                {currentQ.scenario.speaker1}:
              </span>
              <p className="text-xs sm:text-sm font-bold text-black leading-snug">
                "{currentQ.scenario.text1}"
              </p>
            </div>
          </div>

          {/* Speaker 2 (Missing Slang Blank) */}
          <div className="flex items-start gap-2.5 justify-end">
            <div className="bg-[#05FFA1]/30 border-2 border-black rounded-2xl rounded-tr-sm p-2.5 shadow-[1.5px_1.5px_0px_#000000] max-w-[85%] text-right">
              <span className="text-[10px] font-black text-black font-cartoon block mb-0.5">
                {currentQ.scenario.speaker2}:
              </span>
              <p className="text-xs sm:text-sm font-black text-black leading-snug">
                "{currentQ.scenario.text2.replace('_____', isAnswerRevealed ? `✨ ${currentQ.term} ✨` : '❓ [ ... ]')}"
              </p>
            </div>
            <CartoonAvatar avatarId={currentQ.scenario.avatar2} size="md" className="shrink-0" />
          </div>
        </div>

        {/* Dynamic Multiple Choice Options in 2x2 Grid */}
        <div className={`grid gap-2 sm:gap-2.5 ${shuffledOptions.length === 2 ? 'grid-cols-2' : shuffledOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {shuffledOptions.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option.toLowerCase() === currentQ.term.toLowerCase();
            
            let btnBg = 'bg-white hover:bg-[#FFFB96] text-black shadow-[2.5px_2.5px_0px_#000000]';
            if (isAnswerRevealed) {
              if (isCorrect) {
                btnBg = 'bg-[#05FFA1] text-black ring-3 ring-black shadow-[3px_3px_0px_#000000] scale-[1.02]';
              } else if (isSelected && !isCorrect) {
                btnBg = 'bg-[#FF71CE] text-black line-through shadow-[1.5px_1.5px_0px_#000000]';
              } else {
                btnBg = 'bg-neutral-100 text-black/40 border-black/40';
              }
            }

            return (
              <button
                key={option}
                disabled={isAnswerRevealed}
                onClick={() => handleAnswer(option, true)}
                className={`cartoon-btn py-3 sm:py-3.5 px-3 rounded-2xl font-black text-sm sm:text-base font-cartoon transition-all border-3 border-black flex items-center justify-center text-center italic ${btnBg}`}
              >
                <span className="truncate">{option}</span>
                {isAnswerRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-black shrink-0 ml-1.5" />}
                {isAnswerRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-black shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>

        {/* Modal Pop-Up for Right (1s auto) or Wrong (Explanation + NEXT button) */}
        <AnswerFeedbackModal
          isOpen={isAnswerRevealed && !!selectedOption}
          isCorrect={selectedOption?.trim().toLowerCase() === currentQ.term.trim().toLowerCase()}
          selectedOption={selectedOption || ''}
          slang={currentQ}
          earnedXP={config.difficulty === 'hard' ? 150 : config.difficulty === 'medium' ? 100 : 75}
          onNext={handleNextQuestion}
        />
      </div>
    </div>
  );
};
