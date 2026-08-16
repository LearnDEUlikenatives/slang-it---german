import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SLANG_DATABASE, CATEGORY_LABELS, REGION_LABELS, RARITY_LABELS } from '../data/slangDatabase';
import { SlangWord } from '../types';
import { SlangCard } from './SlangCard';
import { AdInterstitialModal } from './AdInterstitialModal';
import { sounds } from '../utils/audio';
import { useGame } from '../context/GameContext';
import { useTranslation, LANGUAGES } from '../utils/translations';
import { getSlangMeaning } from '../utils/slangTranslations';
import { Search, Bookmark, X, Filter, RotateCcw, Sparkles } from 'lucide-react';

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
  const [showDictionaryAd, setShowDictionaryAd] = useState(false);
  const hasTriggeredAdRef = useRef(false);

  // Trigger ad when user spends extended time (60 seconds) on dictionary page (throttled by global cooldown)
  useEffect(() => {
    if (profile.isPremium || hasTriggeredAdRef.current) return;

    const timer = setTimeout(() => {
      if (!profile.isPremium && !hasTriggeredAdRef.current) {
        hasTriggeredAdRef.current = true;
        setShowDictionaryAd(true);
      }
    }, 60000); // 60 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [profile.isPremium]);

  // Clear all active filters
  const handleResetFilters = () => {
    sounds.playPop();
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedRegion('all');
    setSelectedRarity('all');
    setShowOnlyFavorites(false);
    setShowOnlyFamilyFriendly(false);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedRegion !== 'all' ||
    selectedRarity !== 'all' ||
    showOnlyFavorites ||
    showOnlyFamilyFriendly;

  // Filtered list with strict category, dialect/region, and difficulty/rarity matching
  const filteredWords = useMemo(() => {
    if (!hasActiveFilters) {
      return [];
    }

    return SLANG_DATABASE.filter((item) => {
      // Search term query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesTerm = item.term.toLowerCase().includes(query);
        const matchesDe = item.meaningDe.toLowerCase().includes(query);
        const matchesEn = item.meaningEn.toLowerCase().includes(query);
        const localizedMeaning = getSlangMeaning(item, profile.systemLanguage).toLowerCase();
        const matchesLocalized = localizedMeaning.includes(query);
        const matchesExample = item.exampleDe.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesRegion = item.region.toLowerCase().includes(query);

        if (
          !matchesTerm &&
          !matchesDe &&
          !matchesEn &&
          !matchesLocalized &&
          !matchesExample &&
          !matchesCategory &&
          !matchesRegion
        ) {
          return false;
        }
      }

      // Category matching
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Regional Dialect matching (exact match when specific region is selected)
      if (selectedRegion !== 'all' && item.region !== selectedRegion) {
        return false;
      }

      // Difficulty / Rarity matching (e.g. 'common' for Alltäglich, 'rare', 'legendary')
      if (selectedRarity !== 'all' && item.rarity !== selectedRarity) {
        return false;
      }

      // Favorites filter
      if (showOnlyFavorites && !profile.favoritedWordIds.includes(item.id)) {
        return false;
      }

      // Family Friendly filter
      if (showOnlyFamilyFriendly && !item.isFamilyFriendly) {
        return false;
      }

      return true;
    });
  }, [
    hasActiveFilters,
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
            className="w-full pl-12 pr-10 py-3.5 bg-white border-3 border-black rounded-2xl text-sm sm:text-base font-black text-black placeholder:text-black/40 focus:outline-none focus:bg-[#FFFB96]/20 shadow-[3px_3px_0px_#000000]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-neutral-100 text-black/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div>
          <div className="text-[11px] font-black uppercase text-black/70 font-cartoon mb-1.5 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              onClick={() => {
                sounds.playPop();
                setSelectedCategory('all');
              }}
              className={`cartoon-btn-sm px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap font-cartoon transition-all ${
                selectedCategory === 'all'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000000]'
                  : 'bg-white text-black border-2 border-black hover:bg-[#FFFB96]/50'
              }`}
            >
              {t('filter_all')} ({SLANG_DATABASE.length})
            </button>

            {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => {
              const countInCat = SLANG_DATABASE.filter((w) => w.category === catKey).length;
              return (
                <button
                  key={catKey}
                  onClick={() => {
                    sounds.playPop();
                    setSelectedCategory(catKey);
                  }}
                  className={`cartoon-btn-sm px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 font-cartoon transition-all ${
                    selectedCategory === catKey
                      ? 'bg-[#FFFB96] text-black ring-2 ring-black shadow-[2px_2px_0px_#000000]'
                      : 'bg-white text-black border-2 border-black hover:bg-neutral-50'
                  }`}
                >
                  <span>{catMeta.icon}</span>
                  <span>{catMeta.label}</span>
                  <span className="text-[10px] text-black/60 font-mono">({countInCat})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dropdowns & Toggle Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-black/20 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Regional Dialect Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-black font-cartoon text-black/70 hidden sm:inline">
                Dialect:
              </label>
              <select
                id="filter-region-select"
                value={selectedRegion}
                onChange={(e) => {
                  sounds.playPop();
                  setSelectedRegion(e.target.value);
                }}
                className={`bg-white border-2 border-black rounded-xl px-3 py-2 font-black text-black text-xs focus:outline-none shadow-[2px_2px_0px_#000000] cursor-pointer ${
                  selectedRegion !== 'all' ? 'bg-[#FFFB96] ring-2 ring-black' : ''
                }`}
              >
                <option value="all">🌍 All Regions / Dialects</option>
                {Object.entries(REGION_LABELS).map(([regKey, regMeta]) => (
                  <option key={regKey} value={regKey}>
                    {regMeta.flag} {regMeta.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty / Rarity Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-black font-cartoon text-black/70 hidden sm:inline">
                Difficulty:
              </label>
              <select
                id="filter-rarity-select"
                value={selectedRarity}
                onChange={(e) => {
                  sounds.playPop();
                  setSelectedRarity(e.target.value);
                }}
                className={`bg-white border-2 border-black rounded-xl px-3 py-2 font-black text-black text-xs focus:outline-none shadow-[2px_2px_0px_#000000] cursor-pointer ${
                  selectedRarity !== 'all' ? 'bg-[#05FFA1] ring-2 ring-black' : ''
                }`}
              >
                <option value="all">⭐ All Difficulty Levels</option>
                {Object.entries(RARITY_LABELS).map(([rarKey, rarMeta]) => (
                  <option key={rarKey} value={rarKey}>
                    {rarMeta.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button if any filter active */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="cartoon-btn-sm px-2.5 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-black border-2 border-black font-black text-xs font-cartoon flex items-center gap-1 shadow-[1.5px_1.5px_0px_#000000]"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Favorites Toggle */}
            <button
              onClick={() => {
                sounds.playPop();
                setShowOnlyFavorites(!showOnlyFavorites);
              }}
              className={`flex items-center gap-1.5 font-black px-3 py-2 rounded-xl border-2 border-black font-cartoon text-xs transition-all ${
                showOnlyFavorites ? 'bg-[#FFFB96] text-black shadow-[2px_2px_0px_#000000]' : 'bg-white text-black/70 hover:bg-neutral-50'
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
              className={`flex items-center gap-1.5 font-black px-3 py-2 rounded-xl border-2 border-black font-cartoon text-xs transition-all ${
                showOnlyFamilyFriendly ? 'bg-[#05FFA1] text-black shadow-[2px_2px_0px_#000000]' : 'bg-white text-black/70 hover:bg-neutral-50'
              }`}
            >
              <span>{t('filter_learned')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Initial State (Before searching or selecting filters) */}
      {!hasActiveFilters && (
        <div className="cartoon-card bg-white rounded-3xl p-8 sm:p-12 text-center border-4 border-black shadow-[6px_6px_0px_#000000] my-4">
          <div className="text-5xl sm:text-6xl mb-3">🔍</div>
          <h3 className="text-2xl sm:text-3xl font-black text-black font-cartoon mb-2 italic">
            Search the Slang Dictionary
          </h3>
          <p className="text-sm font-bold text-black/70 max-w-lg mx-auto mb-6">
            Type any word in the search box above, or select a <span className="text-black font-black underline">Category</span>, <span className="text-black font-black underline">Regional Dialect</span>, or <span className="text-black font-black underline">Difficulty Level</span> to discover authentic German street slang.
          </p>

          {/* Quick Filter Starters */}
          <div className="border-t-2 border-black/10 pt-5 max-w-md mx-auto">
            <span className="text-[11px] font-black uppercase text-black/60 font-cartoon block mb-3">
              ⚡ Quick Explore:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => {
                  sounds.playPop();
                  setSelectedRegion('berlin');
                }}
                className="cartoon-btn-sm px-3 py-1.5 rounded-xl bg-[#FFFB96] hover:bg-[#FFFB96]/80 text-black border-2 border-black font-black text-xs font-cartoon shadow-[2px_2px_0px_#000000]"
              >
                🐻 Berlin & Kiez
              </button>
              <button
                onClick={() => {
                  sounds.playPop();
                  setSelectedRegion('bavaria');
                }}
                className="cartoon-btn-sm px-3 py-1.5 rounded-xl bg-[#01CDFE]/30 hover:bg-[#01CDFE]/50 text-black border-2 border-black font-black text-xs font-cartoon shadow-[2px_2px_0px_#000000]"
              >
                🥨 Bayern & München
              </button>
              <button
                onClick={() => {
                  sounds.playPop();
                  setSelectedCategory('youth');
                }}
                className="cartoon-btn-sm px-3 py-1.5 rounded-xl bg-[#FF71CE]/30 hover:bg-[#FF71CE]/50 text-black border-2 border-black font-black text-xs font-cartoon shadow-[2px_2px_0px_#000000]"
              >
                🔥 Jugendsprache
              </button>
              <button
                onClick={() => {
                  sounds.playPop();
                  setSelectedRarity('common');
                }}
                className="cartoon-btn-sm px-3 py-1.5 rounded-xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black border-2 border-black font-black text-xs font-cartoon shadow-[2px_2px_0px_#000000]"
              >
                ⭐ Alltäglich
              </button>
            </div>
          </div>
        </div>
      )}

      {/* When Filters or Search are Active */}
      {hasActiveFilters && (
        <>
          {/* Grid of Slang Cards Header */}
          <div className="mb-4 flex items-center justify-between text-xs font-black text-black font-cartoon px-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 rounded-lg">
                {filteredWords.length} {filteredWords.length === 1 ? 'Word' : 'Words'} Found
              </span>
              {searchTerm && (
                <span className="bg-[#FFFB96] border-2 border-black px-2 py-0.5 rounded-lg text-[11px]">
                  Search: "{searchTerm}"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="bg-white border-2 border-black px-2 py-0.5 rounded-lg text-[11px]">
                  Category: {CATEGORY_LABELS[selectedCategory]?.label}
                </span>
              )}
              {selectedRegion !== 'all' && (
                <span className="bg-[#FFFB96] border-2 border-black px-2 py-0.5 rounded-lg text-[11px]">
                  Dialect: {REGION_LABELS[selectedRegion]?.label}
                </span>
              )}
              {selectedRarity !== 'all' && (
                <span className="bg-[#05FFA1] border-2 border-black px-2 py-0.5 rounded-lg text-[11px]">
                  Level: {RARITY_LABELS[selectedRarity]?.label}
                </span>
              )}
            </div>
            <span className="text-black/60 hidden sm:inline">{t('flip_card_hint')}</span>
          </div>

          {/* Grid of Slang Cards */}
          {filteredWords.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWords.map((slang) => (
                <SlangCard
                  key={slang.id}
                  slang={slang}
                  onPractice={onPracticeSlang}
                />
              ))}
            </div>
          )}

          {/* Empty Search Result State */}
          {filteredWords.length === 0 && (
            <div className="cartoon-card bg-white rounded-3xl p-10 sm:p-12 text-center border-4 border-black shadow-[6px_6px_0px_#000000] my-6">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-xl sm:text-2xl font-black text-black font-cartoon mb-2">
                {t('no_results_title')}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-black/70 max-w-md mx-auto mb-4">
                No German slang words matched your active search query or filter combination.
              </p>
              <button
                onClick={handleResetFilters}
                className="cartoon-btn px-6 py-2.5 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black font-black text-xs font-cartoon inline-flex items-center gap-1.5 shadow-[3px_3px_0px_#000000]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* 20-Second Dictionary Dwell Ad */}
      <AdInterstitialModal
        isOpen={showDictionaryAd}
        onClose={() => setShowDictionaryAd(false)}
        countdownSeconds={5}
        adContext="dictionary_20s"
      />
    </div>
  );
};

