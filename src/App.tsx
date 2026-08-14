import React, { useState } from 'react';
import { GameProvider } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { HomeDashboard } from './components/HomeDashboard';
import { GameScreen } from './components/GameScreen';
import { PartyMode } from './components/PartyMode';
import { LernenView } from './components/LernenView';
import { WiederholenView } from './components/WiederholenView';
import { SettingsView } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { PaymentGateModal } from './components/PaymentGateModal';
import { SlangWord } from './types';

export type TabType = 'home' | 'spielen' | 'party' | 'lernen' | 'wiederholen' | 'settings';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [practiceWord, setPracticeWord] = useState<SlangWord | undefined>(undefined);

  const handlePracticeSlang = (slang: SlangWord) => {
    setPracticeWord(slang);
    setActiveTab('spielen');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FF71CE] text-black selection:bg-[#FFFB96] selection:text-black pb-20 md:pb-6 relative">
      {/* Top Cartoon Header */}
      <Navbar activeTab={activeTab} onSelectTab={(tab) => {
        setPracticeWord(undefined);
        setActiveTab(tab);
      }} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4">
        {activeTab === 'home' && (
          <HomeDashboard
            onNavigate={(tab) => {
              setPracticeWord(undefined);
              setActiveTab(tab);
            }}
            onPracticeSlang={handlePracticeSlang}
          />
        )}

        {activeTab === 'spielen' && (
          <GameScreen
            preselectedSlang={practiceWord}
            onBackToMenu={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'party' && (
          <PartyMode onBackToMenu={() => setActiveTab('home')} />
        )}

        {activeTab === 'lernen' && (
          <LernenView onPracticeSlang={handlePracticeSlang} />
        )}

        {activeTab === 'wiederholen' && (
          <WiederholenView />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <MobileNav activeTab={activeTab} onSelectTab={(tab) => {
        setPracticeWord(undefined);
        setActiveTab(tab);
      }} />

      {/* Modals */}
      <OnboardingModal />
      <PaymentGateModal />
    </div>
  );
}

export function App() {
  return (
    <GameProvider>
      <MainAppContent />
    </GameProvider>
  );
}

export default App;
