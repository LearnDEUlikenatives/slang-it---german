import React, { useState, useMemo } from 'react';
import { SLANG_DATABASE, CATEGORY_LABELS, REGION_LABELS, RARITY_LABELS } from '../data/slangDatabase';
import { SlangWord } from '../types';
import { SlangCard } from './SlangCard';
import { sounds } from '../utils/audio';
import { useGame } from '../context/GameContext';
import { useTranslation, LANGUAGES } from '../utils/translations';
import { getSlangMeaning } from '../utils/slangTranslations';
import { Search, Sparkles, Bookmark, Flame } from 'lucide-react';

interface Props {
  onPracticeSlang?: (slang: SlangWord) => void;
}

export const LernenView: React.FC<Props> = ({ onPracticeSlang }) => {
  const { profile } = useGame();
  const { t } = useTranslation(profile.systemLanguage);
  const currentLangObj = LANGUAGES.find((l) => l.code === profile.systemLanguage) || LANGUAGES[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyFamilyFriendly, setShowOnlyFamilyFriendly] = useState(false);

  // Slang of the Day (deterministic based on date)
  const slangOfTheDay = useMemo(() => {
    const todayNum = new Date().getDate();
    return SLANG_DATABASE[todayNum % SLANG_DATABASE.length] || SLANG_DATABASE[0];
  }, []);

  // Filtered list
  const filteredWords = useMemo(() => {
    return SLANG_DATABASE.filter((item) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTerm = item.term.toLowerCase().includes(query);
        const matchesDe = item.meaningDe.toLowerCase().includes(query);
        const matchesEn = item.meaningEn.toLowerCase().includes(query);
        const localizedMeaning = getSlangMeaning(item, profile.systemLanguage).toLowerCase();
        const matchesLocalized = localizedMeaning.includes(query);
        const matchesExample = item.exampleDe.toLowerCase().includes(query);
        if (!matchesTerm && !matchesDe && !matchesEn && !matchesLocalized && !matchesExample) return false;
      }

      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Region
      if (selectedRegion !== 'all' && item.region !== selectedRegion && item.region !== 'all') {
        return false;
      }

      // Rarity
      if (selectedRarity !== 'all' && item.rarity !== selectedRarity) {
        return false;
      }

      // Favorites
      if (showOnlyFavorites && !profile.favoritedWordIds.includes(item.id)) {
        return false;
      }

      // Family Friendly
      if (showOnlyFamilyFriendly && !item.isFamilyFriendly) {
        return false;
      }

      return true;
    });
  }, [
    searchTerm,
    selectedCategory,
    selectedRegion,
    selectedRarity,
    showOnlyFavorites,
    showOnlyFamilyFriendly,
    profile.favoritedWordIds,
    profile.systemLanguage,
  ]);

  return (
    <div id="lernen-view" className="max-w-6xl mx-auto py-4 px-3 sm:px-6">
      {/* Slang of the Day Feature Banner */}
      <div className="cartoon-card-lg bg-gradient-to-r from-[#FF71CE] via-[#FFFB96] to-[#05FFA1] rounded-3xl p-5 sm:p-6 mb-6 shadow-[6px_6px_0px_#000000] border-4 border-black">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-black text-[#05FFA1] text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider font-cartoon flex items-center gap-1 shadow-[2px_2px_0px_#000000]">
            <Sparkles className="w-3.5 h-3.5 text-[#05FFA1]" /> {t('slang_of_day')}
          </span>
          <span className="text-xs font-bold text-black hidden sm:inline">
            ✨ {t('tagline')}
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-black font-cartoon italic">
              "{slangOfTheDay.term}"
            </h2>
            <p className="text-sm font-bold text-black mt-1 max-w-2xl">
              🇩🇪 {slangOfTheDay.meaningDe}
              {profile.systemLanguage !== 'de' && (
                <span className="ml-2 font-bold text-black/80">
                  • {currentLangObj.flag} {getSlangMeaning(slangOfTheDay, profile.systemLanguage)}
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onPracticeSlang?.(slangOfTheDay);
            }}
            className="cartoon-btn px-5 py-2.5 rounded-2xl bg-black hover:bg-black/80 text-[#05FFA1] font-black text-sm font-cartoon shrink-0 flex items-center gap-2 shadow-[3px_3px_0px_#000000]"
          >
            <span>{t('practice_this_term')}</span>
            <Flame className="w-4 h-4 text-[#FF71CE] fill-[#FF71CE]" />
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="cartoon-card bg-white rounded-3xl p-4 sm:p-6 mb-6 space-y-4 shadow-[6px_6px_0px_#000000] border-4 border-black">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-black/60 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="slang-search-input"
            type="text"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-3 border-black rounded-2xl text-sm font-black text-black placeholder:text-black/40 focus:outline-none focus:bg-[#FFFB96]/20 shadow-[3px_3px_0px_#000000]"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              sounds.playPop();
              setSelectedCategory('all');
            }}
            className={`cartoon-btn-sm px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap font-cartoon ${
              selectedCategory === 'all' ? 'bg-black text-white shadow-[2px_2px_0px_#000000]' : 'bg-white text-black border-2 border-black'
            }`}
          >
            {t('filter_all')} ({SLANG_DATABASE.length})
          </button>

          {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => (
            <button
              key={catKey}
              onClick={() => {
                sounds.playPop();
                setSelectedCategory(catKey);
              }}
              className={`cartoon-btn-sm px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 font-cartoon ${
                selectedCategory === catKey
                  ? 'bg-[#FFFB96] text-black ring-2 ring-black shadow-[2px_2px_0px_#000000]'
                  : 'bg-white text-black border-2 border-black'
              }`}
            >
              <span>{catMeta.icon}</span>
              <span>{catMeta.label}</span>
            </button>
          ))}
        </div>

        {/* Dropdowns & Toggle Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-black/20 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-white border-2 border-black rounded-xl px-3 py-1.5 font-black text-black focus:outline-none shadow-[2px_2px_0px_#000000]"
            >
              <option value="all">🌍 {t('region_label')}</option>
              {Object.entries(REGION_LABELS).map(([regKey, regMeta]) => (
                <option key={regKey} value={regKey}>
                  {regMeta.flag} {regMeta.label}
                </option>
              ))}
            </select>

            {/* Rarity Filter */}
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="bg-white border-2 border-black rounded-xl px-3 py-1.5 font-black text-black focus:outline-none shadow-[2px_2px_0px_#000000]"
            >
              <option value="all">⭐ {t('difficulty_label')}</option>
              {Object.entries(RARITY_LABELS).map(([rarKey, rarMeta]) => (
                <option key={rarKey} value={rarKey}>
                  {rarMeta.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* Favorites Toggle */}
            <button
              onClick={() => {
                sounds.playPop();
                setShowOnlyFavorites(!showOnlyFavorites);
              }}
              className={`flex items-center gap-1.5 font-black px-3 py-1.5 rounded-xl border-2 border-black font-cartoon ${
                showOnlyFavorites ? 'bg-[#FFFB96] text-black shadow-[2px_2px_0px_#000000]' : 'bg-white text-black/70'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{t('filter_favorites')}</span>
            </button>

            {/* Family Friendly Toggle */}
            <button
              onClick={() => {
                sounds.playPop();
                setShowOnlyFamilyFriendly(!showOnlyFamilyFriendly);
              }}
              className={`flex items-center gap-1.5 font-black px-3 py-1.5 rounded-xl border-2 border-black font-cartoon ${
                showOnlyFamilyFriendly ? 'bg-[#05FFA1] text-black shadow-[2px_2px_0px_#000000]' : 'bg-white text-black/70'
              }`}
            >
              <span>{t('filter_learned')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Slang Cards */}
      <div className="mb-4 flex items-center justify-between text-xs font-black text-black font-cartoon">
        <span>{filteredWords.length} {t('nav_lexicon')}</span>
        <span className="text-black/60 hidden sm:inline">{t('flip_card_hint')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWords.map((slang) => (
          <SlangCard
            key={slang.id}
            slang={slang}
            onPractice={onPracticeSlang}
          />
        ))}
      </div>

      {filteredWords.length === 0 && (
        <div className="cartoon-card bg-white rounded-3xl p-12 text-center border-4 border-black shadow-[6px_6px_0px_#000000] my-8">
          <div className="text-4xl mb-2">🔍</div>
          <h3 className="text-xl font-black text-black font-cartoon mb-1">
            {t('no_results_title')}
          </h3>
          <p className="text-xs font-bold text-black/60">
            {t('no_results_sub')}
          </p>
        </div>
      )}
    </div>
  );
};
