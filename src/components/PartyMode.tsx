import React, { useState, useRef, useEffect } from 'react';
import { Player, SlangWord } from '../types';
import { SLANG_DATABASE } from '../data/slangDatabase';
import { CartoonAvatar, AVATAR_LIST } from './CartoonAvatar';
import { AnswerFeedbackModal } from './AnswerFeedbackModal';
import { AdInterstitialModal } from './AdInterstitialModal';
import { showGoogleRewardVideoAd } from '../services/admobService';
import { sounds } from '../utils/audio';
import { useGame } from '../context/GameContext';
import { useTranslation } from '../utils/translations';
import {
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Crown,
  Volume2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const PLAYER_COLORS = [
  'bg-[#FF71CE] text-black border-2 border-black shadow-[3px_3px_0px_#000000]',
  'bg-[#01CDFE] text-black border-2 border-black shadow-[3px_3px_0px_#000000]',
  'bg-[#05FFA1] text-black border-2 border-black shadow-[3px_3px_0px_#000000]',
  'bg-[#FFFB96] text-black border-2 border-black shadow-[3px_3px_0px_#000000]',
  'bg-[#B967FF] text-white border-2 border-black shadow-[3px_3px_0px_#000000]',
  'bg-emerald-400 text-black border-2 border-black shadow-[3px_3px_0px_#000000]',
  'bg-rose-400 text-black border-2 border-black shadow-[3px_3px_0px_#000000]',
  'bg-teal-300 text-black border-2 border-black shadow-[3px_3px_0px_#000000]',
];

interface PartyProps {
  onBackToMenu?: () => void;
  registerBackHandler?: (handler: (() => boolean) | null) => void;
}

export const PartyMode: React.FC<PartyProps> = ({ onBackToMenu, registerBackHandler }) => {
  const { profile, recordPartyGame, addXP } = useGame();
  const { t } = useTranslation(profile.systemLanguage);

  // Party Setup State
  const [isLobby, setIsLobby] = useState(true);
  const [roundLimit, setRoundLimit] = useState(8);
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'Player 1', avatarId: 'hipster_macher', score: 0, strikes: 0, correctAnswers: 0, streak: 0, color: PLAYER_COLORS[0] },
    { id: 'p2', name: 'Player 2', avatarId: 'cyber_chaya', score: 0, strikes: 0, correctAnswers: 0, streak: 0, color: PLAYER_COLORS[1] },
    { id: 'p3', name: 'Player 3', avatarId: 'cool_alman', score: 0, strikes: 0, correctAnswers: 0, streak: 0, color: PLAYER_COLORS[2] },
  ]);

  // Active Game State
  const [questions, setQuestions] = useState<SlangWord[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [activePlayerTurnIndex, setActivePlayerTurnIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showPartyFinishAd, setShowPartyFinishAd] = useState(false);
  const [hasClaimedPartyBonusXP, setHasClaimedPartyBonusXP] = useState(false);

  const autoNextTimeoutRef = useRef<any>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    };
  }, []);

  // Register Android back button handler
  useEffect(() => {
    if (registerBackHandler) {
      registerBackHandler(() => {
        if (!isLobby) {
          sounds.playPop();
          if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
          setIsLobby(true);
          setIsGameOver(false);
          return true; // handled, stopped active party match and went to lobby
        }
        return false; // let App.tsx return to home
      });
    }
    return () => {
      if (registerBackHandler) registerBackHandler(null);
    };
  }, [isLobby, registerBackHandler]);

  // Add new player to lobby
  const handleAddPlayer = () => {
    if (players.length >= 8) return;
    sounds.playPop();
    const newIdx = players.length + 1;
    const defaultAvatars = AVATAR_LIST.map((a) => a.id);
    const chosenAvatar = defaultAvatars[(newIdx - 1) % defaultAvatars.length];
    
    setPlayers((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        name: `Player ${newIdx}`,
        avatarId: chosenAvatar,
        score: 0,
        strikes: 0,
        correctAnswers: 0,
        streak: 0,
        color: PLAYER_COLORS[(newIdx - 1) % PLAYER_COLORS.length],
      },
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 2) return;
    sounds.playPop();
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePlayerName = (id: string, name: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const handleCycleAvatar = (id: string) => {
    sounds.playPop();
    const defaultAvatars = AVATAR_LIST.map((a) => a.id);
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const currentIdx = defaultAvatars.indexOf(p.avatarId as any);
        const nextIdx = (currentIdx + 1) % defaultAvatars.length;
        return { ...p, avatarId: defaultAvatars[nextIdx] };
      })
    );
  };

  // User clicks Start button in lobby
  const handleStartPartyClick = () => {
    sounds.playPop();
    startPartyGame();
  };

  // Start Party Game (Direct Pass & Play)
  const startPartyGame = () => {
    sounds.playPop();
    const shuffled = [...SLANG_DATABASE].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(roundLimit, shuffled.length));

    // Reset scores
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        score: 0,
        strikes: 0,
        correctAnswers: 0,
        streak: 0,
      }))
    );

    setQuestions(selected);
    setCurrentRound(0);
    setActivePlayerTurnIndex(0);
    setIsGameOver(false);
    setHasClaimedPartyBonusXP(false);
    setIsLobby(false);
    loadRound(0, selected);
  };

  const loadRound = (roundIdx: number, qList: SlangWord[]) => {
    if (roundIdx >= qList.length) {
      endPartyGame();
      return;
    }

    const currentQ = qList[roundIdx];
    setIsAnswerRevealed(false);
    setSelectedOption(null);

    const opts = [currentQ.term, ...(currentQ.distractors || ['Macher', 'Digga', 'Alman']).slice(0, 3)];
    opts.sort(() => Math.random() - 0.5);
    setShuffledOptions(opts);
  };

  const handleAnswerSelection = (chosenTerm: string) => {
    if (isAnswerRevealed) return;
    const currentQ = questions[currentRound];
    const isCorrect = chosenTerm.trim().toLowerCase() === currentQ.term.trim().toLowerCase();
    setSelectedOption(chosenTerm);
    setIsAnswerRevealed(true);

    const activePlayerId = players[activePlayerTurnIndex]?.id;

    if (isCorrect) {
      sounds.playCorrect();
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === activePlayerId) {
            const streakBonus = p.streak * 20;
            return {
              ...p,
              score: p.score + 100 + streakBonus,
              correctAnswers: p.correctAnswers + 1,
              streak: p.streak + 1,
            };
          }
          return p;
        })
      );

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      // Auto-advance after 1.2s on correct answer pop-up
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = setTimeout(() => {
        handleNextRound();
      }, 1200);
    } else {
      sounds.playWrong();
      setPlayers((prev) =>
        prev.map((p) => (p.id === activePlayerId ? { ...p, streak: 0 } : p))
      );
    }
  };

  const handleNextRound = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    sounds.playPop();
    const nextIdx = currentRound + 1;
    if (nextIdx >= questions.length) {
      endPartyGame();
    } else {
      setCurrentRound(nextIdx);
      setActivePlayerTurnIndex((prev) => (prev + 1) % players.length);
      loadRound(nextIdx, questions);
    }
  };

  const endPartyGame = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    setIsGameOver(true);
    sounds.playLevelUp();
    recordPartyGame(true);
    addXP(150);

    // Trigger Ad for free users upon finishing a round under Party
    if (!profile.isPremium) {
      setShowPartyFinishAd(true);
    }

    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.4 },
      });
    } catch {}
  };

  const currentQ = questions[currentRound];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const activeTurnPlayer = players[activePlayerTurnIndex];

  // 1. LOBBY SETUP VIEW (Optimized Single-Screen Layout, No Celebration Icon, No Scrolling)
  if (isLobby) {
    return (
      <div id="party-lobby-screen" className="max-w-2xl mx-auto py-2 sm:py-4 px-3 sm:px-5">
        <div className="cartoon-card-lg bg-white rounded-3xl p-4 sm:p-6 relative border-3 border-black shadow-[6px_6px_0px_#000000]">
          {/* Header without celebration icon */}
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-black/10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic tracking-tight">
                {t('party_title')}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-black/70">
                {t('party_subtitle')}
              </p>
            </div>

            <button
              onClick={handleAddPlayer}
              disabled={players.length >= 8}
              className="cartoon-btn-sm px-3 py-2 rounded-xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-xs text-black font-cartoon flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#000000] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add_player')} ({players.length}/8)</span>
            </button>
          </div>

          {/* Player Cards Compact Grid */}
          <div className="mb-4">
            <h4 className="text-xs font-black text-black font-cartoon mb-2 uppercase tracking-wide">
              {t('players_avatars_label')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 max-h-[300px] overflow-y-auto pr-0.5">
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className="cartoon-card bg-neutral-50 hover:bg-white rounded-2xl p-2.5 flex items-center justify-between gap-2 border-2 border-black shadow-[2px_2px_0px_#000000]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleCycleAvatar(player.id)}
                      title="Tap to change avatar"
                      className="transition-transform hover:scale-105 shrink-0"
                    >
                      <CartoonAvatar avatarId={player.avatarId} size="sm" />
                    </button>

                    <div className="min-w-0">
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handleUpdatePlayerName(player.id, e.target.value)}
                        className="font-black text-xs sm:text-sm text-black bg-transparent border-b border-black/50 focus:border-black focus:outline-none font-cartoon w-28 sm:w-32 truncate"
                        maxLength={18}
                      />
                      <span className="text-[10px] text-black/60 font-bold block">
                        {t('player_num', { num: idx + 1 })}
                      </span>
                    </div>
                  </div>

                  {players.length > 2 && (
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="text-black/40 hover:text-rose-600 p-1 transition-colors shrink-0"
                      title={t('remove_player')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Round Count Selector */}
          <div className="flex items-center justify-between gap-3 mb-5 py-3 border-t-2 border-black/10">
            <label className="text-xs sm:text-sm font-black text-black font-cartoon">
              {t('round_count_label')}: <span className="text-[#FF71CE]">{roundLimit} {t('rounds_suffix')}</span>
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              {[5, 8, 12, 16].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    sounds.playPop();
                    setRoundLimit(count);
                  }}
                  className={`cartoon-btn-sm px-2.5 sm:px-3 py-1 rounded-xl font-black text-xs border-2 border-black transition-all ${
                    roundLimit === count
                      ? 'bg-[#FFFB96] text-black shadow-[2px_2px_0px_#000000] scale-105'
                      : 'bg-white text-black/70 hover:bg-neutral-100'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Big Start Action Button */}
          <button
            id="start-party-match-btn"
            onClick={handleStartPartyClick}
            className="cartoon-btn w-full py-3.5 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-base text-black font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_#000000]"
          >
            <span>{t('start_party_btn')}</span>
            <Play className="w-5 h-5 fill-black" />
          </button>
        </div>
      </div>
    );
  }

  // 2. PODIUM / GAME OVER VIEW
  if (isGameOver) {
    const winner = sortedPlayers[0];
    const winAccuracy = Math.round((winner.correctAnswers / Math.max(1, currentRound + 1)) * 100);

    return (
      <div id="party-podium-screen" className="max-w-2xl mx-auto py-4 px-3 sm:px-6">
        <div className="cartoon-card-lg bg-white rounded-3xl p-5 sm:p-7 text-center relative overflow-hidden border-3 border-black shadow-[6px_6px_0px_#000000]">
          <div className="inline-block relative mb-3">
            <CartoonAvatar avatarId={winner.avatarId} size="2xl" mood="victory" animate={true} />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFFB96] border-2 border-black rounded-full p-2 shadow-[2px_2px_0px_#000000]">
              <Crown className="w-6 h-6 text-black fill-[#FFFB96]" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-black font-cartoon mb-1 italic">
            {winner.name} {t('party_winner')} 👑
          </h2>
          <p className="text-xs sm:text-sm font-bold text-black/80 mb-4">
            {winner.name} {t('winner_summary', { score: winner.score, accuracy: winAccuracy })}
          </p>

          {/* Podium Scoreboard */}
          <div className="space-y-2 mb-5 text-left">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className={`cartoon-card p-2.5 sm:p-3 rounded-2xl flex items-center justify-between shadow-[2px_2px_0px_#000000] border-2 border-black ${
                  idx === 0
                    ? 'bg-[#FFFB96]'
                    : idx === 1
                    ? 'bg-[#01CDFE]/20'
                    : idx === 2
                    ? 'bg-[#FF71CE]/20'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-base font-cartoon w-6 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                  </span>
                  <CartoonAvatar avatarId={player.avatarId} size="sm" />
                  <span className="font-black text-xs sm:text-sm text-black font-cartoon">{player.name}</span>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-black font-cartoon block">
                    {player.score} {t('score')}
                  </span>
                  <span className="text-[10px] text-black/70 font-bold">
                    {player.correctAnswers} {t('total_correct')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* High-eCPM Rewarded Ad Action (Party Winner Bonus XP) */}
          {!hasClaimedPartyBonusXP && (
            <div className="mb-4">
              <button
                onClick={() => {
                  sounds.playPop();
                  showGoogleRewardVideoAd(() => {
                    addXP(150);
                    setHasClaimedPartyBonusXP(true);
                    sounds.playLevelUp();
                    try {
                      confetti({ particleCount: 120, spread: 80 });
                    } catch {}
                  });
                }}
                className="cartoon-btn w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF71CE] via-[#FFFB96] to-[#05FFA1] text-black font-black text-xs sm:text-sm font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_#000000] hover:scale-[1.02] active:scale-[0.98] transition-transform animate-pulse"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Claim +150 Party Bonus XP • Watch Short Video</span>
              </button>
            </div>
          )}

          {hasClaimedPartyBonusXP && (
            <div className="mb-4 py-2 px-3 bg-[#05FFA1] border-2 border-black rounded-2xl font-cartoon text-xs font-black text-black shadow-[2px_2px_0px_#000000]">
              ✨ +150 Party Bonus XP Claimed!
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={() => setIsLobby(true)}
              className="cartoon-btn w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-xs sm:text-sm text-black font-cartoon flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000000]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('new_party_round')}</span>
            </button>
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="cartoon-btn w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-neutral-100 font-black text-xs sm:text-sm text-black font-cartoon border-2 border-black shadow-[2px_2px_0px_#000000]"
              >
                {t('back_to_menu')}
              </button>
            )}
          </div>

          {/* Ad Display for Free Users Upon Finishing a Party Match */}
          <AdInterstitialModal
            isOpen={showPartyFinishAd}
            onClose={() => setShowPartyFinishAd(false)}
            countdownSeconds={5}
            adContext="party_finish"
          />
        </div>
      </div>
    );
  }

  // 3. ACTIVE GAMEPLAY VIEW (Streamlined Single-Screen, Turn in Scenario Box, 2x2 Options, Correct/Wrong Modal)
  if (!currentQ) return null;

  return (
    <div id="active-party-game" className="max-w-2xl mx-auto py-2 sm:py-3 px-3 sm:px-5">
      {/* Main Party Scenario Comic Card with Integrated Turn Indicator */}
      <div className="cartoon-card-lg bg-white rounded-3xl p-4 sm:p-6 mb-3 sm:mb-4 relative overflow-hidden border-3 border-black shadow-[6px_6px_0px_#000000]">
        {/* Integrated Turn & Round Banner */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b-2 border-black/15">
          <div className="flex items-center gap-2.5 bg-[#FFFB96] px-3 py-1.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000000]">
            <CartoonAvatar avatarId={activeTurnPlayer?.avatarId} size="sm" className="w-7 h-7 ring-1.5 ring-black shrink-0" />
            <div className="leading-tight">
              <span className="text-[9px] font-black uppercase text-black/70 tracking-wider block">
                {t('turn_indicator', { name: '' })}:
              </span>
              <span className="font-black text-xs sm:text-sm text-black font-cartoon truncate max-w-[130px] block">
                👉 {activeTurnPlayer?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-[#01CDFE]/20 text-black px-2.5 py-1 rounded-xl text-xs font-black border-2 border-black font-cartoon shadow-[1.5px_1.5px_0px_#000000]">
              {currentQ.scenario.title}
            </span>
            <span className="bg-[#FF71CE] text-black px-2.5 py-1 rounded-xl text-xs font-black border-2 border-black font-cartoon shadow-[1.5px_1.5px_0px_#000000]">
              {currentRound + 1}/{questions.length}
            </span>
          </div>
        </div>

        {/* Comic Dialogue */}
        <div className="space-y-2.5 sm:space-y-3 my-2">
          {/* Speaker 1 */}
          <div className="flex items-start gap-2.5">
            <CartoonAvatar avatarId={currentQ.scenario.avatar1} size="md" className="shrink-0" />
            <div className="bg-neutral-50 border-2 border-black rounded-2xl rounded-tl-sm p-2.5 sm:p-3 shadow-[2px_2px_0px_#000000] max-w-[85%]">
              <span className="font-black text-[11px] text-black block font-cartoon mb-0.5">
                {currentQ.scenario.speaker1}:
              </span>
              <p className="text-xs sm:text-sm font-bold text-black leading-snug">
                "{currentQ.scenario.text1}"
              </p>
            </div>
          </div>

          {/* Speaker 2 */}
          <div className="flex items-start gap-2.5 justify-end">
            <div className="bg-[#01CDFE]/20 border-2 border-black rounded-2xl rounded-tr-sm p-2.5 sm:p-3 shadow-[2px_2px_0px_#000000] max-w-[85%] text-right">
              <span className="font-black text-[11px] text-black block font-cartoon mb-0.5">
                {currentQ.scenario.speaker2}:
              </span>
              <p className="text-xs sm:text-sm font-bold text-black leading-snug">
                "{currentQ.scenario.text2.replace('_____', isAnswerRevealed ? `✨ ${currentQ.term} ✨` : '❓ [ ??? ]')}"
              </p>
            </div>
            <CartoonAvatar avatarId={currentQ.scenario.avatar2} size="md" className="shrink-0" />
          </div>
        </div>
      </div>

      {/* 4 Answers in 2x2 Grid Arrangement */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {shuffledOptions.map((opt, idx) => {
          const isCorrect = opt.trim().toLowerCase() === currentQ.term.trim().toLowerCase();
          const isChosen = selectedOption === opt;
          let btnStyle = 'bg-white hover:bg-[#FFFB96] text-black shadow-[3px_3px_0px_#000000]';

          if (isAnswerRevealed) {
            if (isCorrect) {
              btnStyle = 'bg-[#05FFA1] text-black ring-3 ring-black shadow-[3px_3px_0px_#000000] scale-[1.02]';
            } else if (isChosen && !isCorrect) {
              btnStyle = 'bg-[#FF71CE] text-black line-through shadow-[2px_2px_0px_#000000]';
            } else {
              btnStyle = 'bg-neutral-100 text-black/40 border-black/40';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswerSelection(opt)}
              disabled={isAnswerRevealed}
              className={`cartoon-btn py-3 sm:py-3.5 px-3 rounded-2xl font-black text-sm sm:text-base font-cartoon transition-all italic border-3 border-black flex items-center justify-center text-center ${btnStyle}`}
            >
              <span className="truncate">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Modal Pop-Up for Right (1.2s auto advance) or Wrong (Explanation + NEXT button) */}
      <AnswerFeedbackModal
        isOpen={isAnswerRevealed && !!selectedOption}
        isCorrect={selectedOption?.trim().toLowerCase() === currentQ.term.trim().toLowerCase()}
        selectedOption={selectedOption || ''}
        slang={currentQ}
        earnedXP={100}
        onNext={handleNextRound}
      />
    </div>
  );
};


