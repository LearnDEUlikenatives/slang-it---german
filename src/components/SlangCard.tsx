import React, { useState } from 'react';
import { SlangWord } from '../types';
import { CATEGORY_LABELS, REGION_LABELS, RARITY_LABELS } from '../data/slangDatabase';
import { CartoonAvatar } from './CartoonAvatar';
import { speakGerman, sounds } from '../utils/audio';
import { Volume2, Bookmark, BookmarkCheck, Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTranslation, LANGUAGES } from '../utils/translations';
import { getSlangMeaning, getSlangLiteral } from '../utils/slangTranslations';

interface Props {
  slang: SlangWord;
  onPractice?: (slang: SlangWord) => void;
  compact?: boolean;
}

export const SlangCard: React.FC<Props> = ({ slang, onPractice }) => {
  const { profile, toggleFavorite } = useGame();
  const { t } = useTranslation(profile.systemLanguage);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const currentLangObj = LANGUAGES.find((l) => l.code === profile.systemLanguage) || LANGUAGES[0];
  const isFavorited = profile.favoritedWordIds.includes(slang.id);
  const categoryMeta = CATEGORY_LABELS[slang.category] || CATEGORY_LABELS.jugendsprache;
  const regionMeta = REGION_LABELS[slang.region] || REGION_LABELS.all;
  const rarityMeta = RARITY_LABELS[slang.rarity] || RARITY_LABELS.common;

  const localizedMeaning = getSlangMeaning(slang, profile.systemLanguage);
  const localizedLiteral = getSlangLiteral(slang, profile.systemLanguage) || slang.literalTranslation;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSpeaking(true);
    sounds.playPop();
    speakGerman(`${slang.article ? slang.article + ' ' : ''}${slang.term}. ${slang.exampleDe}`, () => {
      setIsSpeaking(false);
    });
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    toggleFavorite(slang.id);
  };

  return (
    <div
      id={`slang-card-${slang.id}`}
      className="cartoon-card bg-white rounded-3xl p-5 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000000] bg-gradient-to-b from-white to-[#FFFB96]/30 border-3 border-black shadow-[4px_4px_0px_#000000]"
    >
      {/* Top Badges & Actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`px-2.5 py-1 text-xs font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] text-black ${categoryMeta.color}`}>
            {categoryMeta.icon} {categoryMeta.label}
          </span>
          <span className={`px-2.5 py-1 text-xs font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] text-black ${regionMeta.badge}`}>
            {regionMeta.flag} {regionMeta.label}
          </span>
          <span className={`px-2 py-0.5 text-[11px] font-black rounded-lg ${rarityMeta.color} border-2 border-black shadow-[1.5px_1.5px_0px_#000000]`}>
            {rarityMeta.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id={`fav-btn-${slang.id}`}
            onClick={handleFav}
            aria-label="Save Favorite"
            className="w-9 h-9 rounded-xl border-2 border-black flex items-center justify-center bg-[#FFFB96] hover:bg-[#FFFB96]/80 transition-colors shadow-[2px_2px_0px_#000000]"
          >
            {isFavorited ? (
              <BookmarkCheck className="w-5 h-5 text-black fill-black" />
            ) : (
              <Bookmark className="w-5 h-5 text-black" />
            )}
          </button>

          <button
            id={`tts-btn-${slang.id}`}
            onClick={handleSpeak}
            aria-label="Listen Pronunciation"
            className={`w-9 h-9 rounded-xl border-2 border-black flex items-center justify-center transition-transform shadow-[2px_2px_0px_#000000] ${
              isSpeaking ? 'bg-[#FF71CE] scale-110' : 'bg-[#01CDFE] hover:bg-[#01CDFE]/80'
            }`}
          >
            <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-black animate-pulse' : 'text-black'}`} />
          </button>
        </div>
      </div>

      {/* Main Term & Translations in selected language */}
      <div className="mb-2">
        <div className="flex items-baseline gap-2">
          {slang.article && (
            <span className="text-sm font-black text-black/60 italic font-cartoon">{slang.article}</span>
          )}
          <h3 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-cartoon italic">
            {slang.term}
          </h3>
        </div>
        
        {/* German Definition */}
        <p className="text-sm font-bold text-black mt-1 leading-snug">
          🇩🇪 {slang.meaningDe}
        </p>

        {/* Selected System Language Definition */}
        {profile.systemLanguage !== 'de' && (
          <p className="text-xs font-bold text-black/80 mt-1">
            {currentLangObj.flag} {localizedMeaning}
          </p>
        )}
      </div>

      {/* Accordion Toggle: Comic Scene & Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t-2 border-dashed border-black/30 space-y-3 animate-pop">
          {/* Comic Scenario Dialog */}
          <div className="bg-[#FFFB96]/60 border-2 border-black rounded-2xl p-3.5 relative shadow-[2px_2px_0px_#000000]">
            <div className="flex items-center gap-1.5 text-xs font-black text-black uppercase tracking-wider mb-2 font-cartoon">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>{t('comic_scene')}: {slang.scenario.title}</span>
            </div>

            <div className="space-y-2.5">
              {/* Speaker 1 */}
              <div className="flex items-start gap-2.5">
                <CartoonAvatar avatarId={slang.scenario.avatar1} size="sm" />
                <div className="bg-white border-2 border-black rounded-2xl rounded-tl-sm px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#000000] max-w-[85%]">
                  <span className="font-black text-black block text-[10px]">
                    {slang.scenario.speaker1}
                  </span>
                  <p className="text-black">{slang.scenario.text1}</p>
                </div>
              </div>

              {/* Speaker 2 */}
              <div className="flex items-start gap-2.5 justify-end">
                <div className="bg-[#01CDFE]/30 border-2 border-black rounded-2xl rounded-tr-sm px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#000000] max-w-[85%] text-right">
                  <span className="font-black text-black block text-[10px]">
                    {slang.scenario.speaker2}
                  </span>
                  <p className="text-black font-bold">
                    {slang.scenario.text2.replace('_____', slang.term)}
                  </p>
                </div>
                <CartoonAvatar avatarId={slang.scenario.avatar2} size="sm" />
              </div>
            </div>
          </div>

          {/* Literal Translation & Insider Tip */}
          {localizedLiteral && (
            <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] text-xs">
              <HelpCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-black">{t('literal_meaning')}</span>
                <p className="text-black/80 font-bold mt-0.5">{localizedLiteral}</p>
              </div>
            </div>
          )}

          {slang.funFact && (
            <div className="bg-[#05FFA1]/40 border-2 border-black p-2.5 rounded-xl text-black shadow-[2px_2px_0px_#000000] text-xs">
              <span className="font-black">💡 {t('insider_tip')} </span>
              <span className="font-bold">{slang.funFact}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between mt-3 pt-2">
        <button
          onClick={() => {
            sounds.playPop();
            setShowDetails(!showDetails);
          }}
          className="text-xs font-black text-black/80 hover:text-black flex items-center gap-1 font-cartoon cursor-pointer py-1"
        >
          {showDetails ? (
            <>
              {t('less_details')} <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              {t('show_details')} <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        {onPractice && (
          <button
            onClick={() => {
              sounds.playPop();
              onPractice(slang);
            }}
            className="cartoon-btn-sm bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-cartoon border-2 border-black shadow-[2px_2px_0px_#000000]"
          >
            <span>{t('practice_now')}</span> ⚡
          </button>
        )}
      </div>
    </div>
  );
};
