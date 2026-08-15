import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { CartoonAvatar } from './CartoonAvatar';
import { sounds } from '../utils/audio';
import { useTranslation, LANGUAGES, Language } from '../utils/translations';
import { TabType } from '../App';
import {
  Flame,
  Crown,
  Volume2,
  VolumeX,
  Globe,
  User,
  ChevronDown,
  Cloud,
  Check
} from 'lucide-react';

interface Props {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  const {
    profile,
    updateProfile,
    setSystemLanguage,
    setShowPaymentModal,
    user,
    openAuthModal,
    cloudSyncStatus,
  } = useGame();
  const { t } = useTranslation(profile.systemLanguage);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const toggleSound = () => {
    sounds.playPop();
    updateProfile({ soundEnabled: !profile.soundEnabled });
  };

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home', label: t('nav_home'), icon: '🏠' },
    { id: 'spielen', label: t('nav_play'), icon: '🎮' },
    { id: 'party', label: t('nav_party'), icon: '🎉' },
    { id: 'lernen', label: t('nav_lexicon'), icon: '📖' },
    { id: 'wiederholen', label: t('nav_revision'), icon: '🧠' },
  ];

  const currentLangObj = LANGUAGES.find((l) => l.code === profile.systemLanguage) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-4 border-black shadow-[0_4px_0_#000000]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand Logo - clean without pretzel */}
        <div
          onClick={() => {
            sounds.playPop();
            onSelectTab('home');
          }}
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group shrink-0"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg sm:text-2xl text-black font-cartoon tracking-tighter italic whitespace-nowrap">
              Slang It - German
            </span>
            <span className="bg-[#FF71CE] text-black font-black text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-lg border-2 border-black font-cartoon hidden md:inline-block shadow-[1.5px_1.5px_0px_#000000]">
              GERMAN SLANG
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                sounds.playPop();
                onSelectTab(item.id as any);
              }}
              className={`cartoon-btn-sm px-3 py-1.5 rounded-xl font-cartoon text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === item.id
                  ? 'bg-[#FFFB96] text-black border-2 border-black shadow-[3px_3px_0px_#000000]'
                  : 'bg-white/80 border-2 border-black/30 text-black hover:bg-[#05FFA1]/40'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Badges & Actions (Language + Streak + Profile at Top Right + Sound + VIP) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => {
                sounds.playPop();
                setShowLangMenu(!showLangMenu);
              }}
              className="cartoon-btn-sm px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FFFB96] border-2 border-black font-cartoon text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_#000000]"
              title="Change Language / Sprache ändern"
            >
              <span className="text-sm">{currentLangObj.flag}</span>
              <span className="uppercase text-[11px] font-black">{currentLangObj.code}</span>
              <ChevronDown className="w-3 h-3 stroke-[3]" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_#000000] p-1.5 z-50 animate-pop">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-black/60 font-cartoon border-b-2 border-black/10 mb-1">
                  Language / Sprache
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      sounds.playPop();
                      setSystemLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl font-cartoon text-xs font-black flex items-center justify-between transition-colors ${
                      profile.systemLanguage === lang.code
                        ? 'bg-[#05FFA1] text-black border-2 border-black'
                        : 'hover:bg-[#FFFB96] text-black'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </div>
                    <span className="text-[10px] text-black/70 uppercase">{lang.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cloud Sync & Auth Button */}
          <button
            id="cloud-auth-btn"
            onClick={() => {
              sounds.playPop();
              openAuthModal();
            }}
            className={`cartoon-btn-sm px-2.5 py-1 rounded-xl flex items-center gap-1 text-xs font-black font-cartoon border-2 border-black shadow-[2px_2px_0px_#000000] transition-transform active:scale-95 ${
              user
                ? 'bg-[#05FFA1] text-black hover:bg-[#05FFA1]/80'
                : 'bg-[#FFFB96] text-black hover:bg-[#FFFB96]/80'
            }`}
            title={user ? `Signed in as ${user.email} (Cloud Synced)` : 'Sign in to save points to Supabase Cloud'}
          >
            <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">
              {user ? 'Synced' : 'Save XP'}
            </span>
            {user && (
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse hidden sm:inline-block" />
            )}
          </button>

          {/* Streak Badge */}
          <div
            className="cartoon-card-sm bg-[#FFFB96] px-2.5 py-1 rounded-xl flex items-center gap-1 text-xs font-black text-black font-cartoon cursor-default"
            title="Daily Streak"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-wiggle" />
            <span>{profile.streak}</span>
          </div>

          {/* Profile & Avatar Badge (TOP RIGHT CORNER) */}
          <button
            id="top-profile-btn"
            onClick={() => {
              sounds.playPop();
              onSelectTab('settings');
            }}
            className={`cartoon-btn-sm p-1 sm:px-2.5 sm:py-1 rounded-xl flex items-center gap-1.5 text-xs font-black text-black font-cartoon transition-all border-2 border-black shadow-[2px_2px_0px_#000000] ${
              activeTab === 'settings' ? 'bg-[#FFFB96] ring-2 ring-black' : 'bg-[#01CDFE] hover:bg-[#01CDFE]/80'
            }`}
            title="Profile & Settings"
          >
            <CartoonAvatar avatarId={profile.avatarId} size="sm" className="w-5 h-5 border border-black" />
            <span className="font-cartoon text-xs hidden sm:inline">{t('nav_profile')}</span>
            <span className="bg-black text-[#FFFB96] text-[10px] font-black px-1.5 py-0.2 rounded-md hidden lg:inline">
              Lv. {profile.level}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="w-8 h-8 rounded-xl border-2 border-black bg-white hover:bg-[#05FFA1] flex items-center justify-center text-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            title={profile.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {profile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* VIP Upgrade Button */}
          {!profile.isPremium ? (
            <button
              onClick={() => {
                sounds.playPop();
                setShowPaymentModal(true);
              }}
              className="cartoon-btn-sm px-2.5 py-1.5 rounded-xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-cartoon font-black text-xs text-black flex items-center gap-1 animate-pulse shadow-[2px_2px_0px_#000000]"
            >
              <Crown className="w-3.5 h-3.5 fill-black text-black" />
              <span className="hidden sm:inline">{t('vip_pass')}</span>
            </button>
          ) : (
            <span className="bg-[#FFFB96] border-2 border-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase font-cartoon text-black flex items-center gap-1 shadow-[2px_2px_0px_#000000]">
              <Crown className="w-3 h-3 fill-black text-black" /> VIP
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
