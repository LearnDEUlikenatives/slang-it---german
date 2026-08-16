import React, { useState } from 'react';
import { Player, SlangWord } from '../types';
import { SLANG_DATABASE } from '../data/slangDatabase';
import { CartoonAvatar, AVATAR_LIST } from './CartoonAvatar';
import { AdInterstitialModal } from './AdInterstitialModal';
import { sounds } from '../utils/audio';
import { useGame } from '../context/GameContext';
import { useTranslation } from '../utils/translations';
import { getSlangMeaning } from '../utils/slangTranslations';
import {
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Crown,
  ArrowRight,
  Sparkles
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

export const PartyMode: React.FC<{ onBackToMenu?: () => void }> = ({ onBackToMenu }) => {
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

  // User clicks Start button in lobby - launches game directly with zero friction
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
    } else {
      sounds.playWrong();
      setPlayers((prev) =>
        prev.map((p) => (p.id === activePlayerId ? { ...p, streak: 0 } : p))
      );
    }
  };

  const handleNextRound = () => {
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

  // LOBBY SETUP VIEW
  if (isLobby) {
    return (
      <div id="party-lobby-screen" className="max-w-3xl mx-auto py-4 px-3 sm:px-6">
        <div className="cartoon-card-lg bg-white rounded-3xl p-6 sm:p-8 relative">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF71CE] border-3 border-black flex items-center justify-center text-2xl text-black shadow-[3px_3px_0px_#000000]">
                🎉
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic">
                  {t('party_title')}
                </h2>
                <p className="text-sm font-bold text-black/80">
                  {t('party_subtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={handleAddPlayer}
              disabled={players.length >= 8}
              className="cartoon-btn-sm px-3.5 py-2 rounded-xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-xs text-black font-cartoon flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add_player')} ({players.length}/8)</span>
            </button>
          </div>

          {/* Player Cards Grid */}
          <div className="mb-6">
            <h4 className="text-sm font-black text-black font-cartoon mb-3">
              {t('players_avatars_label')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className="cartoon-card bg-white rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000000]"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCycleAvatar(player.id)}
                      title="Cycle Avatar"
                      className="transition-transform hover:scale-105"
                    >
                      <CartoonAvatar avatarId={player.avatarId} size="md" />
                    </button>

                    <div>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handleUpdatePlayerName(player.id, e.target.value)}
                        className="font-black text-sm text-black bg-transparent border-b-2 border-black focus:outline-none font-cartoon w-32 sm:w-40"
                        maxLength={18}
                      />
                      <span className="text-[11px] text-black/70 font-bold block">
                        {t('player_num', { num: idx + 1 })}
                      </span>
                    </div>
                  </div>

                  {players.length > 2 && (
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="text-black/50 hover:text-black p-1.5 transition-colors"
                      title={t('remove_player')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Round Count Selector */}
          <div className="flex items-center justify-between gap-4 mb-8 pt-4 border-t-2 border-black/20">
            <label className="text-sm font-black text-black font-cartoon">
              {t('round_count_label')}: <span className="text-[#FF71CE] underline">{roundLimit} {t('rounds_suffix')}</span>
            </label>
            <div className="flex gap-2">
              {[5, 8, 12, 16].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    sounds.playPop();
                    setRoundLimit(count);
                  }}
                  className={`cartoon-btn-sm px-3 py-1.5 rounded-xl font-black text-xs ${
                    roundLimit === count ? 'bg-[#FFFB96] text-black shadow-[2px_2px_0px_#000000]' : 'bg-white text-black'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Start Action */}
          <div className="flex items-center justify-end">
            <button
              id="start-party-match-btn"
              onClick={handleStartPartyClick}
              className="cartoon-btn w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-base text-black font-cartoon flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000]"
            >
              <span>{t('start_party_btn')}</span>
              <Play className="w-5 h-5 fill-black" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PODIUM / GAME OVER VIEW
  if (isGameOver) {
    const winner = sortedPlayers[0];
    const winAccuracy = Math.round((winner.correctAnswers / Math.max(1, currentRound + 1)) * 100);

    return (
      <div id="party-podium-screen" className="max-w-3xl mx-auto py-6 px-3 sm:px-6">
        <div className="cartoon-card-lg bg-white rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="inline-block relative mb-4">
            <CartoonAvatar avatarId={winner.avatarId} size="2xl" mood="victory" animate={true} />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFFB96] border-2 border-black rounded-full p-2 shadow-[2px_2px_0px_#000000]">
              <Crown className="w-6 h-6 text-black fill-[#FFFB96]" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-black font-cartoon mb-1 italic">
            {winner.name} {t('party_winner')} 👑
          </h2>
          <p className="text-sm font-bold text-black/80 mb-6">
            {winner.name} {t('winner_summary', { score: winner.score, accuracy: winAccuracy })}
          </p>

          {/* Podium Scoreboard */}
          <div className="space-y-2 mb-6 text-left">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className={`cartoon-card p-3 rounded-2xl flex items-center justify-between shadow-[3px_3px_0px_#000000] ${
                  idx === 0
                    ? 'bg-[#FFFB96] border-black'
                    : idx === 1
                    ? 'bg-[#01CDFE]/30 border-black'
                    : idx === 2
                    ? 'bg-[#FF71CE]/30 border-black'
                    : 'bg-white border-black'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-lg font-cartoon w-6 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                  </span>
                  <CartoonAvatar avatarId={player.avatarId} size="sm" />
                  <span className="font-black text-sm text-black font-cartoon">{player.name}</span>
                </div>

                <div className="text-right">
                  <span className="font-black text-base text-black font-cartoon block">
                    {player.score} {t('score')}
                  </span>
                  <span className="text-[10px] text-black/80 font-bold">
                    {player.correctAnswers} {t('total_correct')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsLobby(true)}
              className="cartoon-btn w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-black font-cartoon flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000000]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('new_party_round')}</span>
            </button>
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="cartoon-btn w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-neutral-100 font-black text-black font-cartoon"
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

  // ACTIVE PASS & PLAY GAMEPLAY VIEW
  return (
    <div id="active-party-game" className="max-w-3xl mx-auto py-3 px-3 sm:px-6">
      {/* Top Live Scoreboard Bar */}
      <div className="cartoon-card bg-white rounded-2xl p-2.5 mb-4 shadow-[4px_4px_0px_#000000] overflow-x-auto">
        <div className="flex items-center justify-between gap-3 min-w-max">
          <span className="bg-[#FF71CE] text-black font-black text-xs px-2.5 py-1 rounded-xl border-2 border-black font-cartoon shadow-[2px_2px_0px_#000000]">
            {t('round_indicator', { current: currentRound + 1, total: questions.length })}
          </span>

          <div className="flex items-center gap-2">
            {players.map((p, idx) => {
              const isCurrentTurn = idx === activePlayerTurnIndex;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-black text-xs font-black shadow-[2px_2px_0px_#000000] transition-all ${
                    isCurrentTurn
                      ? 'bg-[#FFFB96] ring-2 ring-black scale-105 shadow-[3px_3px_0px_#000000]'
                      : 'bg-white text-black'
                  }`}
                >
                  <CartoonAvatar avatarId={p.avatarId} size="sm" className="w-6 h-6 border" />
                  <span className="font-cartoon truncate max-w-[80px]">{p.name}:</span>
                  <span className="font-black text-black">{p.score}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Player Selector & Pass The Screen Banner */}
      <div className="cartoon-card bg-[#FFFB96] rounded-2xl p-3.5 mb-4 shadow-[4px_4px_0px_#000000] border-3 border-black">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <CartoonAvatar avatarId={activeTurnPlayer?.avatarId} size="md" className="ring-2 ring-black" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase text-black/70 tracking-wider">
                  Current Turn (Pass Screen):
                </span>
                <span className="bg-black text-[#FFFB96] px-1.5 py-0.2 rounded text-[10px] font-black">
                  Turn {activePlayerTurnIndex + 1}/{players.length}
                </span>
              </div>
              <span className="font-black text-lg text-black font-cartoon flex items-center gap-1.5">
                👉 {activeTurnPlayer?.name} is answering!
              </span>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-black text-black/60 block">Tap below to switch who's answering:</span>
            <span className="text-xs font-black text-black bg-white px-2 py-0.5 rounded-lg border-2 border-black">
              Score: {activeTurnPlayer?.score || 0} pts
            </span>
          </div>
        </div>

        {/* Interactive Player Selector Chips */}
        <div>
          <div className="text-[11px] font-black text-black/70 mb-1.5 flex items-center justify-between">
            <span>Select who is answering this question:</span>
            <span className="sm:hidden text-[10px] font-bold">Tap name to choose</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {players.map((p, idx) => {
              const isCurrentTurn = idx === activePlayerTurnIndex;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (isAnswerRevealed) return;
                    sounds.playPop();
                    setActivePlayerTurnIndex(idx);
                  }}
                  disabled={isAnswerRevealed}
                  className={`cartoon-btn p-2 rounded-xl flex items-center gap-2 text-left transition-all ${
                    isCurrentTurn
                      ? 'bg-[#05FFA1] ring-3 ring-black shadow-[3px_3px_0px_#000000] scale-[1.02]'
                      : 'bg-white hover:bg-neutral-100 border-2 border-black/70 opacity-80'
                  }`}
                >
                  <CartoonAvatar avatarId={p.avatarId} size="sm" className="w-7 h-7 shrink-0" />
                  <div className="overflow-hidden min-w-0 flex-1">
                    <span className="font-black text-xs text-black font-cartoon truncate block">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-black text-black/70 block">
                      {p.score} pts {isCurrentTurn ? '⭐ Active' : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Party Scenario Comic Card */}
      <div className="cartoon-card-lg bg-white rounded-3xl p-5 sm:p-7 mb-4 relative overflow-hidden bg-gradient-to-b from-white to-[#FF71CE]/10">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="bg-[#01CDFE]/30 text-black px-3 py-1 rounded-xl font-black text-xs border-2 border-black font-cartoon shadow-[2px_2px_0px_#000000]">
            🎬 {currentQ?.scenario.title}
          </span>
          <span className="text-xs font-black text-black/80">
            {t('turn_indicator', { name: activeTurnPlayer?.name || '' })}
          </span>
        </div>

        {/* Comic Dialogue */}
        <div className="space-y-3.5 my-3">
          <div className="flex items-start gap-3">
            <CartoonAvatar avatarId={currentQ?.scenario.avatar1} size="md" />
            <div className="bg-white border-3 border-black rounded-3xl rounded-tl-sm p-3.5 shadow-[3px_3px_0px_#000000] max-w-[85%]">
              <span className="font-black text-xs text-black block font-cartoon mb-0.5">
                {currentQ?.scenario.speaker1}:
              </span>
              <p className="text-sm font-bold text-black leading-relaxed">
                "{currentQ?.scenario.text1}"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 justify-end">
            <div className="bg-[#01CDFE]/20 border-3 border-black rounded-3xl rounded-tr-sm p-3.5 shadow-[3px_3px_0px_#000000] max-w-[85%] text-right">
              <span className="font-black text-xs text-black block font-cartoon mb-0.5">
                {currentQ?.scenario.speaker2}:
              </span>
              <p className="text-sm font-bold text-black leading-relaxed">
                {currentQ?.scenario.text2.replace('_____', isAnswerRevealed ? currentQ?.term : '❓ [ ??? ]')}
              </p>
            </div>
            <CartoonAvatar avatarId={currentQ?.scenario.avatar2} size="md" />
          </div>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {shuffledOptions.map((opt, idx) => {
          const isCorrect = opt === currentQ?.term;
          const isChosen = selectedOption === opt;
          let style = 'bg-white hover:bg-[#FFFB96] text-black shadow-[4px_4px_0px_#000000]';

          if (isAnswerRevealed) {
            if (isCorrect) {
              style = 'bg-[#05FFA1] text-black ring-4 ring-black scale-[1.02] shadow-[4px_4px_0px_#000000]';
            } else if (isChosen && !isCorrect) {
              style = 'bg-[#FF71CE] text-black line-through shadow-[2px_2px_0px_#000000]';
            } else {
              style = 'bg-white/60 text-black/40 border-black/30';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswerSelection(opt)}
              disabled={isAnswerRevealed}
              className={`cartoon-btn p-4 rounded-2xl font-black text-base sm:text-lg font-cartoon transition-all italic ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Post-Answer Reveal and Next Action */}
      {isAnswerRevealed && (
        <div className="cartoon-card bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pop shadow-[4px_4px_0px_#000000]">
          <div>
            <span className="font-black text-sm text-black font-cartoon block">
              {t('correct_answer_label')} "{currentQ?.term}"
            </span>
            <span className="text-xs font-bold text-black/80">
              {currentQ ? getSlangMeaning(currentQ, profile.systemLanguage) : ''}
            </span>
          </div>

          <button
            onClick={handleNextRound}
            className="cartoon-btn w-full sm:w-auto px-6 py-3 rounded-xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-sm text-black font-cartoon shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-1.5"
          >
            <span>{t('next_round_btn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

