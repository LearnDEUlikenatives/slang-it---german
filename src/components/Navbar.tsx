import React from 'react';
import { sounds } from '../utils/audio';
import { TabType } from '../App';
import AppLogoImg from '../assets/images/german_slang_logo_1786812856007.jpg';
import { Menu } from 'lucide-react';

interface Props {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenMenu: () => void;
}

export const Navbar: React.FC<Props> = ({ onSelectTab, onOpenMenu }) => {
  const handleClickLogo = () => {
    sounds.playPop();
    // On web version (>= md: 768px), open the slide-out drawer menu.
    // On mobile app version, clicking the top-left symbol leads directly to the Profile + Settings page.
    if (window.innerWidth >= 768) {
      onOpenMenu();
    } else {
      onSelectTab('settings');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-4 border-black shadow-[0_4px_0_#000000]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
        {/* App Symbol / Logo on Top Left Corner */}
        <button
          id="app-symbol-menu-btn"
          onClick={handleClickLogo}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0 focus:outline-none"
          title="Web: Menu | App: Profile & Settings"
        >
          <div className="relative">
            <img
              src={AppLogoImg}
              alt="Slang It - German Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border-2 border-black object-cover shadow-[2px_2px_0px_#000000] group-hover:scale-105 group-hover:rotate-3 transition-transform"
            />
            {/* Menu indicator badge (Web / Desktop only) */}
            <span className="hidden md:flex absolute -bottom-1 -right-1 bg-[#FFFB96] border border-black rounded-full p-0.5 shadow-[1px_1px_0px_#000000]">
              <Menu className="w-2.5 h-2.5 text-black" />
            </span>
          </div>
          <div className="flex items-center gap-2 text-left">
            <div>
              <span className="font-black text-lg sm:text-2xl text-black font-cartoon tracking-tighter italic whitespace-nowrap block leading-none">
                Slang It - German
              </span>
              {/* Web Only: Click to Explore Hint */}
              <span className="text-[10px] font-black text-black/60 font-cartoon hidden md:flex items-center gap-1">
                <span>☰ Menu</span>
                <span>• Click to Explore</span>
              </span>
              {/* Mobile App Only: Profile & Settings Hint */}
              <span className="text-[10px] font-black text-black/60 font-cartoon flex md:hidden items-center gap-1">
                <span>⚙️ Profile & Settings</span>
              </span>
            </div>
            <span className="bg-[#FF71CE] text-black font-black text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-lg border-2 border-black font-cartoon hidden sm:inline-block shadow-[1.5px_1.5px_0px_#000000]">
              GERMAN SLANG
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
