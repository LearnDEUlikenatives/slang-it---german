import React from 'react';
import { sounds } from '../utils/audio';
import { useGame } from '../context/GameContext';
import { useTranslation } from '../utils/translations';
import { TabType } from '../App';

interface Props {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const MobileNav: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  const { profile } = useGame();
  const { t } = useTranslation(profile.systemLanguage);

  const navItems = [
    { id: 'home', label: t('nav_home'), icon: '🏠' },
    { id: 'spielen', label: t('nav_play'), icon: '🎮' },
    { id: 'party', label: t('nav_party'), icon: '🎉' },
    { id: 'lernen', label: t('nav_lexicon'), icon: '📖' },
    { id: 'wiederholen', label: t('nav_revision'), icon: '🧠' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-4 border-black px-2 py-1.5 shadow-[0_-4px_0_#000000]">
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sounds.playPop();
                onSelectTab(item.id as TabType);
              }}
              className={`flex-1 flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#FFFB96] border-2 border-black text-black font-black scale-105 shadow-[2px_2px_0px_#000000]'
                  : 'text-black/80 hover:text-black hover:bg-[#05FFA1]/30'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-cartoon font-black leading-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
