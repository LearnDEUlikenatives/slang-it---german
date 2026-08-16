import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { CartoonAvatar } from './CartoonAvatar';
import { sounds } from '../utils/audio';
import { useTranslation, LANGUAGES } from '../utils/translations';
import { TabType } from '../App';
import AppLogoImg from '../assets/images/german_slang_logo_1786812856007.jpg';
import {
  Flame,
  Crown,
  Volume2,
  VolumeX,
  ChevronDown,
  Cloud,
  X,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const LeftSidebarDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
}) => {
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
  const [showLangMenu, setShowLangMenu] = React.useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const toggleSound = () => {
    sounds.playPop();
    updateProfile({ soundEnabled: !profile.soundEnabled });
  };

  const navItems = [
    { id: 'home', label: t('nav_home'), icon: '🏠', desc: 'Overview & Daily Quest' },
    { id: 'spielen', label: t('nav_play'), icon: '🎮', desc: 'Comic Dialogue Quiz' },
    { id: 'party', label: t('nav_party'), icon: '🎉', desc: 'Multiplayer Buzzer' },
    { id: 'lernen', label: t('nav_lexicon'), icon: '📖', desc: 'Street Slang Dictionary' },
    { id: 'wiederholen', label: t('nav_revision'), icon: '🧠', desc: 'Flashcard Mastery' },
    { id: 'settings', label: t('nav_profile'), icon: '⚙️', desc: 'Avatar, XP & Settings' },
  ];

  const currentLangObj = LANGUAGES.find((l) => l.code === profile.systemLanguage) || LANGUAGES[0];

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className="hidden md:block">
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          sounds.playPop();
          onClose();
        }}
      />

      {/* Slide-out Sidebar Panel */}
      <aside
        aria-label="App Navigation Drawer"
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white border-r-4 border-black shadow-[8px_0px_0px_#000000] flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header of Sidebar */}
        <div className="p-4 sm:p-5 border-b-4 border-black bg-[#FFFB96]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src={AppLogoImg}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-2xl border-2 border-black object-cover shadow-[2px_2px_0px_#000000]"
              />
              <div>
                <h2 className="font-black text-xl text-black font-cartoon italic tracking-tight leading-none">
                  Slang It!
                </h2>
                <span className="text-[10px] font-black uppercase text-black/70 font-cartoon">
                  German Slang Edition
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                sounds.playPop();
                onClose();
              }}
              className="w-9 h-9 rounded-xl border-2 border-black bg-white hover:bg-rose-400 flex items-center justify-center text-black shadow-[2px_2px_0px_#000000] active:scale-95 transition-all"
              title="Close Menu"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* User Summary Widget */}
        <div className="p-3 mx-4 mt-3 rounded-2xl bg-[#01CDFE]/20 border-2 border-black flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-2">
            <CartoonAvatar avatarId={profile.avatarId} size="sm" className="w-8 h-8 border-2 border-black" />
            <div>
              <span className="text-xs font-black text-black font-cartoon block leading-tight">
                {profile.nickname || 'Slang Master'}
              </span>
              <span className="text-[10px] font-bold text-black/70">
                Level {profile.level} • {profile.xp} XP
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[#FFFB96] px-2 py-1 rounded-xl border-2 border-black shadow-[1px_1px_0px_#000000]">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span className="text-xs font-black font-cartoon">{profile.streak}</span>
          </div>
        </div>

        {/* Navigation Items (Pane out after selection) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-black/60 font-cartoon px-1 block">
            Navigation Menu
          </span>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playPop();
                  onSelectTab(item.id as TabType);
                  // Pane out sidebar drawer on select
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-2xl font-cartoon transition-all border-2 border-black flex items-center gap-3 ${
                  isActive
                    ? 'bg-[#FFFB96] text-black font-black shadow-[4px_4px_0px_#000000] translate-x-1'
                    : 'bg-white hover:bg-[#05FFA1]/30 text-black/90 font-bold shadow-[2px_2px_0px_#000000] hover:translate-x-1'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black flex items-center justify-between">
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                    )}
                  </div>
                  <div className="text-[10px] text-black/60 font-normal truncate">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Drawer Actions: Language, Sound, VIP, Cloud */}
        <div className="p-4 border-t-3 border-black bg-neutral-50 space-y-2.5">
          {/* VIP Pass */}
          {!profile.isPremium ? (
            <button
              onClick={() => {
                sounds.playPop();
                setShowPaymentModal(true);
                onClose();
              }}
              className="cartoon-btn w-full py-2.5 rounded-xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-cartoon font-black text-xs text-black flex items-center justify-center gap-2 border-2 border-black shadow-[2px_2px_0px_#000000]"
            >
              <Crown className="w-4 h-4 fill-black text-black" />
              <span>{t('vip_pass')}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="w-full py-1.5 rounded-xl bg-[#FFFB96] border-2 border-black text-[11px] font-black uppercase font-cartoon text-black flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_#000000]">
              <Crown className="w-3.5 h-3.5 fill-black text-black" /> VIP Unlocked
            </div>
          )}

          {/* Quick Settings Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Language Selector */}
            <div className="relative flex-1" ref={langMenuRef}>
              <button
                onClick={() => {
                  sounds.playPop();
                  setShowLangMenu(!showLangMenu);
                }}
                className="w-full py-1.5 px-2 rounded-xl bg-white hover:bg-[#FFFB96] border-2 border-black font-cartoon text-xs font-black flex items-center justify-between shadow-[2px_2px_0px_#000000]"
              >
                <div className="flex items-center gap-1">
                  <span>{currentLangObj.flag}</span>
                  <span className="uppercase text-[10px]">{currentLangObj.code}</span>
                </div>
                <ChevronDown className="w-3 h-3 stroke-[3]" />
              </button>

              {showLangMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_#000000] p-1.5 z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        sounds.playPop();
                        setSystemLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl font-cartoon text-xs font-black flex items-center justify-between ${
                        profile.systemLanguage === lang.code
                          ? 'bg-[#05FFA1] text-black border-2 border-black'
                          : 'hover:bg-[#FFFB96] text-black'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      <span className="text-[10px] text-black/70 uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cloud Auth */}
            <button
              onClick={() => {
                sounds.playPop();
                openAuthModal();
                onClose();
              }}
              className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#01CDFE]/40 border-2 border-black font-cartoon text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_#000000]"
              title="Cloud Sync"
            >
              <Cloud className="w-3.5 h-3.5 text-black" />
              <span className="text-[10px]">{user ? 'Cloud' : 'Login'}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="w-8 h-8 rounded-xl border-2 border-black bg-white hover:bg-[#05FFA1] flex items-center justify-center text-black shadow-[2px_2px_0px_#000000]"
              title={profile.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {profile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-black/50" />}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
