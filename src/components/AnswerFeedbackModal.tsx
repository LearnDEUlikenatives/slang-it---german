import React from 'react';
import { useGame } from '../context/GameContext';
import { useTranslation, LANGUAGES } from '../utils/translations';
import { getSlangMeaning } from '../utils/slangTranslations';
import { SlangWord } from '../types';
import { sounds, speakGerman } from '../utils/audio';
import { Check, X, ArrowRight, Sparkles, Volume2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  isCorrect: boolean;
  selectedOption: string;
  slang: SlangWord;
  earnedXP: number;
  onNext: () => void;
}

export const AnswerFeedbackModal: React.FC<Props> = ({
  isOpen,
  isCorrect,
  selectedOption,
  slang,
  earnedXP,
  onNext,
}) => {
  const { profile } = useGame();
  const { t } = useTranslation(profile.systemLanguage);

  if (!isOpen) return null;

  const handleSpeak = () => {
    sounds.playPop();
    speakGerman(`${slang.article ? slang.article + ' ' : ''}${slang.term}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-3xl border-4 border-black p-5 sm:p-7 shadow-[8px_8px_0px_#000000] text-center animate-pop relative ${
          isCorrect ? 'bg-[#05FFA1]' : 'bg-[#FFFB96]'
        }`}
      >
        {/* Top Status Icon Badge */}
        <div className="mx-auto mb-3 flex items-center justify-center">
          {isCorrect ? (
            <div className="w-16 h-16 rounded-2xl bg-black text-[#05FFA1] border-3 border-white flex items-center justify-center font-black text-3xl shadow-[4px_4px_0px_#000000] animate-bounce">
              <Check className="w-10 h-10 stroke-[4]" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#FF71CE] text-black border-3 border-black flex items-center justify-center font-black text-3xl shadow-[4px_4px_0px_#000000] animate-shake">
              <X className="w-10 h-10 stroke-[4]" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic tracking-tight mb-2">
          {isCorrect
            ? profile.systemLanguage === 'de'
              ? 'Richtig! 🎉'
              : 'Correct! 🎉'
            : profile.systemLanguage === 'de'
            ? 'Leider Falsch! ❌'
            : 'Incorrect! ❌'}
        </h2>

        {/* Subtitle / Selected vs Correct Notice */}
        {isCorrect ? (
          <div className="mb-2">
            <p className="text-xs sm:text-sm font-bold text-black/90">
              {profile.systemLanguage === 'de'
                ? 'Super gemacht! Du hast das richtige Slang-Wort gewählt.'
                : 'Awesome job! You nailed the slang word.'}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-black text-[#FFFB96] px-4 py-1.5 rounded-xl font-cartoon text-xs sm:text-sm font-black shadow-[2px_2px_0px_#000000]">
              <Sparkles className="w-4 h-4" />
              <span>+{earnedXP} XP</span>
            </div>
            <p className="text-[11px] font-bold text-black/70 mt-3 animate-pulse">
              {profile.systemLanguage === 'de'
                ? 'Weiter gehts in 1 Sekunde...'
                : 'Moving to next question in 1s...'}
            </p>
          </div>
        ) : (
          <div className="mb-3 space-y-2.5 text-left">
            <div className="bg-[#FF71CE]/30 border-2 border-black rounded-2xl p-2.5 shadow-[2px_2px_0px_#000000]">
              <div className="text-[10px] font-black uppercase text-black font-cartoon mb-0.5">
                {profile.systemLanguage === 'de' ? 'Deine Antwort:' : 'Your Answer:'}
              </div>
              <p className="text-xs sm:text-sm font-black text-black line-through">
                {selectedOption}
              </p>
            </div>

            {/* Explanation card */}
            <div className="bg-white border-3 border-black rounded-2xl p-3.5 shadow-[3px_3px_0px_#000000] space-y-2">
              <div className="flex items-center justify-between gap-2 border-b-2 border-black/10 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-cartoon font-black text-base sm:text-lg text-black italic">
                    {slang.article ? `${slang.article} ` : ''}{slang.term}
                  </span>
                  <button
                    onClick={handleSpeak}
                    className="p-1 rounded-lg bg-[#01CDFE] border border-black hover:bg-[#01CDFE]/80 text-black shadow-[1px_1px_0px_#000000]"
                    title="Pronounce word"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] font-black bg-black text-[#FFFB96] px-2 py-0.5 rounded-md font-cartoon">
                  🇩🇪 {slang.meaningDe}
                </span>
              </div>

              {profile.systemLanguage !== 'de' ? (
                <p className="text-xs font-bold text-black leading-relaxed">
                  <strong className="font-black">
                    {LANGUAGES.find((l) => l.code === profile.systemLanguage)?.flag || '🌐'}{' '}
                    {LANGUAGES.find((l) => l.code === profile.systemLanguage)?.nativeName || 'Translation'}:
                  </strong>{' '}
                  {getSlangMeaning(slang, profile.systemLanguage)}
                </p>
              ) : (
                <p className="text-xs font-bold text-black leading-relaxed">
                  <strong className="font-black">🇬🇧 English:</strong> {slang.meaningEn}
                </p>
              )}

              {slang.exampleDe && (
                <div className="bg-[#FFFB96]/40 p-2 rounded-xl border border-black text-xs italic font-bold text-black shadow-[1px_1px_0px_#000000]">
                  "{slang.exampleDe}"
                </div>
              )}
            </div>

            {/* NEXT Button */}
            <div className="pt-1">
              <button
                id="modal-next-question-btn"
                onClick={() => {
                  sounds.playPop();
                  onNext();
                }}
                className="cartoon-btn w-full py-3 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black font-black text-sm font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[3px_3px_0px_#000000] active:scale-98 transition-transform"
              >
                <span>{t('next_question')}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
