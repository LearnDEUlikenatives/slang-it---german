import React, { useState } from 'react';
import { SLANG_DATABASE } from '../data/slangDatabase';
import { SlangWord } from '../types';
import { speakGerman, sounds } from '../utils/audio';
import { useGame } from '../context/GameContext';
import { useTranslation, LANGUAGES } from '../utils/translations';
import { getSlangMeaning } from '../utils/slangTranslations';
import {
  RotateCcw,
  Volume2,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WiederholenView: React.FC = () => {
  const { profile, addXP, recordGameResult } = useGame();
  const { t } = useTranslation(profile.systemLanguage);
  const currentLangObj = LANGUAGES.find((l) => l.code === profile.systemLanguage) || LANGUAGES[0];

  const [deck, setDeck] = useState<SlangWord[]>(() => {
    return [...SLANG_DATABASE].sort(() => Math.random() - 0.5);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);
  const [isDeckFinished, setIsDeckFinished] = useState(false);

  const currentCard = deck[currentIndex];

  const handleFlip = () => {
    sounds.playPop();
    setIsFlipped(!isFlipped);
  };

  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    sounds.playPop();
    speakGerman(`${currentCard.term}. ${currentCard.exampleDe}`);
  };

  const handleNextCard = (known: boolean) => {
    if (known) {
      sounds.playCorrect();
      setKnownCount((prev) => prev + 1);
    } else {
      sounds.playWrong();
      setRepeatCount((prev) => prev + 1);
    }

    setIsFlipped(false);
    const nextIdx = currentIndex + 1;
    if (nextIdx >= deck.length) {
      finishDeck();
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  const finishDeck = () => {
    setIsDeckFinished(true);
    sounds.playLevelUp();
    const xpGained = knownCount * 30 + 100;
    addXP(xpGained);
    recordGameResult(knownCount, deck.length, deck.slice(0, knownCount).map((d) => d.id));

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {}
  };

  const restartDeck = () => {
    sounds.playPop();
    setDeck([...SLANG_DATABASE].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setRepeatCount(0);
    setIsDeckFinished(false);
  };

  if (isDeckFinished) {
    return (
      <div id="deck-finished-screen" className="max-w-xl mx-auto py-6 px-3 sm:px-6">
        <div className="cartoon-card-lg bg-white rounded-3xl p-6 sm:p-8 text-center border-4 border-black shadow-[6px_6px_0px_#000000]">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFFB96] border-4 border-black flex items-center justify-center text-4xl mb-4 shadow-[4px_4px_0px_#000000]">
            🧠
          </div>

          <h2 className="text-3xl font-black text-black font-cartoon mb-1 italic">
            {t('deck_finished_title')}
          </h2>
          <p className="text-sm font-bold text-black/80 mb-6">
            {t('deck_finished_sub')}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#05FFA1] border-3 border-black rounded-2xl p-3 shadow-[3px_3px_0px_#000000]">
              <span className="text-xs font-black text-black block font-cartoon">
                {t('knew_immediately')}
              </span>
              <span className="text-2xl font-black text-black font-cartoon">{knownCount}</span>
            </div>
            <div className="bg-[#FF71CE] border-3 border-black rounded-2xl p-3 shadow-[3px_3px_0px_#000000]">
              <span className="text-xs font-black text-black block font-cartoon">
                {t('needs_review')}
              </span>
              <span className="text-2xl font-black text-black font-cartoon">{repeatCount}</span>
            </div>
          </div>

          <button
            onClick={restartDeck}
            className="cartoon-btn w-full py-3.5 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-black font-cartoon flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000] border-3 border-black"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('restart_deck')}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div id="wiederholen-view" className="max-w-2xl mx-auto py-4 px-3 sm:px-6">
      {/* Header & Progress */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[#B967FF] border-3 border-black flex items-center justify-center text-white text-xl shadow-[2px_2px_0px_#000000]">
            🧠
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-black font-cartoon italic">
              {t('revision_title')}
            </h2>
            <span className="text-xs text-black/80 font-bold">
              {t('revision_subtitle')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-[#FFFB96] border-2 border-black px-3 py-1 rounded-xl text-xs font-black text-black font-cartoon shadow-[2px_2px_0px_#000000]">
            {t('card_progress', { current: currentIndex + 1, total: deck.length })}
          </span>
        </div>
      </div>

      {/* Interactive Flip Card */}
      <div
        onClick={handleFlip}
        id="flashcard-container"
        className="cartoon-card-lg bg-white rounded-3xl p-6 sm:p-8 min-h-[320px] flex flex-col justify-between cursor-pointer select-none transition-transform hover:scale-[1.01] active:scale-[0.99] border-4 border-black shadow-[8px_8px_0px_#000000] relative overflow-hidden"
      >
        {/* Card Top: Region & Pronounce */}
        <div className="flex items-center justify-between gap-2">
          <span className="bg-[#FF71CE] px-3 py-1 rounded-xl text-xs font-black text-black border-2 border-black font-cartoon shadow-[2px_2px_0px_#000000]">
            {currentCard.category.toUpperCase()}
          </span>

          <button
            onClick={handlePronounce}
            className="w-10 h-10 rounded-xl bg-[#01CDFE] hover:bg-[#01CDFE]/80 border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000000]"
            title={t('pronounce_term')}
          >
            <Volume2 className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Card Center: Front (Term) or Back (Meaning & Example) */}
        {!isFlipped ? (
          <div className="text-center py-8 space-y-3 animate-pop">
            <span className="text-sm font-black text-black/60 italic font-cartoon">
              {currentCard.article || 'Slang'}
            </span>
            <h3 className="text-4xl sm:text-5xl font-black text-black font-cartoon tracking-tight italic">
              {currentCard.term}
            </h3>
            <p className="text-xs text-black/70 font-bold flex items-center justify-center gap-1">
              <Eye className="w-3.5 h-3.5 text-black" /> {t('flip_card_hint')}
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-3 animate-pop">
            <div className="bg-[#FFFB96] p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] font-black text-black uppercase font-cartoon block">
                {t('german_meaning')}
              </span>
              <p className="text-base sm:text-lg font-black text-black">{currentCard.meaningDe}</p>
            </div>

            {profile.systemLanguage !== 'de' && (
              <div className="bg-[#05FFA1]/30 p-3 rounded-xl border-2 border-black">
                <span className="text-[10px] font-black text-black uppercase font-cartoon block">
                  {currentLangObj.flag} {currentLangObj.nativeName}
                </span>
                <p className="text-sm font-bold text-black">
                  {getSlangMeaning(currentCard, profile.systemLanguage)}
                </p>
              </div>
            )}

            {currentCard.exampleDe && (
              <p className="text-xs italic text-black/90 font-semibold bg-white p-2.5 rounded-xl border border-black">
                "{currentCard.exampleDe}"
              </p>
            )}
          </div>
        )}

        {/* Card Bottom Hint */}
        <div className="text-center pt-3 border-t-2 border-dashed border-black/20">
          <span className="text-[11px] font-bold text-black/60 font-cartoon">
            {!isFlipped ? t('flip_card_hint') : t('tap_to_flip_back')}
          </span>
        </div>
      </div>

      {/* Answer Controls: I don't know vs I know it */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => handleNextCard(false)}
          className="cartoon-btn py-4 rounded-2xl bg-[#FF71CE] hover:bg-[#FF71CE]/80 text-black font-black text-sm sm:text-base font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[3px_3px_0px_#000000]"
        >
          <XCircle className="w-5 h-5 text-black" />
          <span>{t('dont_know')}</span>
        </button>

        <button
          onClick={() => handleNextCard(true)}
          className="cartoon-btn py-4 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black font-black text-sm sm:text-base font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[3px_3px_0px_#000000]"
        >
          <CheckCircle2 className="w-5 h-5 text-black" />
          <span>{t('know_it')}</span>
        </button>
      </div>
    </div>
  );
};
