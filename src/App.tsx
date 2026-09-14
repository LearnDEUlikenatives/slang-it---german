import React, { useState, useEffect, useRef } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { LeftSidebarDrawer } from './components/LeftSidebarDrawer';
import { MobileNav } from './components/MobileNav';
import { HomeDashboard } from './components/HomeDashboard';
import { GameScreen } from './components/GameScreen';
import { PartyMode } from './components/PartyMode';
import { LernenView } from './components/LernenView';
import { WiederholenView } from './components/WiederholenView';
import { SettingsView } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { PaymentGateModal } from './components/PaymentGateModal';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeAdMob } from './services/admobService';
import { SlangWord } from './types';
import { App as CapacitorApp } from '@capacitor/app';
import { logger } from './utils/logger';

export type TabType = 'home' | 'spielen' | 'party' | 'lernen' | 'wiederholen' | 'settings';

function MainAppContent() {
  const { profile, showPaymentModal, setShowPaymentModal, isAuthModalOpen, closeAuthModal } = useGame();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [practiceWord, setPracticeWord] = useState<SlangWord | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const gameScreenBackRef = useRef<(() => boolean) | null>(null);
  const partyScreenBackRef = useRef<(() => boolean) | null>(null);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const isSidebarOpenRef = useRef(isSidebarOpen);
  isSidebarOpenRef.current = isSidebarOpen;

  const showPaymentModalRef = useRef(showPaymentModal);
  showPaymentModalRef.current = showPaymentModal;

  const isAuthModalOpenRef = useRef(isAuthModalOpen);
  isAuthModalOpenRef.current = isAuthModalOpen;

  const handleTabChange = (newTab: TabType, source: string = 'user_click') => {
    const fromTab = activeTabRef.current;
    if (fromTab !== newTab) {
      logger.nav(`Tab transition: ${fromTab} ➔ ${newTab} (via ${source})`, {
        from: fromTab,
        to: newTab,
        source,
        practiceWordTerm: practiceWord?.term,
        admobState: logger.getAdMobPhase(),
      });
      setPracticeWord(undefined);
      setActiveTab(newTab);
    }
  };

  // Initialize AdMob smoothly on app launch
  useEffect(() => {
    logger.lifecycle('MainAppContent mounted. Triggering initializeAdMob...');
    initializeAdMob().catch(err => {
      logger.error('AdMob init failed in App mount effect', err);
    });
  }, []);

  // Handle Android Hardware / Gesture Back Button
  useEffect(() => {
    const isNative = typeof window !== 'undefined' && Boolean((window as any).Capacitor?.isNativePlatform?.());
    if (!isNative) return;

    let isMounted = true;
    let listenerHandle: { remove: () => Promise<void> | void } | null = null;

    try {
      CapacitorApp.addListener('backButton', () => {
        logger.nav(`Android Hardware Back Button pressed. Current tab: ${activeTabRef.current}`, {
          isSidebarOpen: isSidebarOpenRef.current,
          showPaymentModal: showPaymentModalRef.current,
          isAuthModalOpen: isAuthModalOpenRef.current,
        });

        // 1. Close sidebar if open
        if (isSidebarOpenRef.current) {
          logger.nav('Back Button: Closing left sidebar drawer');
          setIsSidebarOpen(false);
          return;
        }

        // 2. Close modals if open
        if (showPaymentModalRef.current) {
          logger.nav('Back Button: Closing payment modal');
          setShowPaymentModal(false);
          return;
        }
        if (isAuthModalOpenRef.current) {
          logger.nav('Back Button: Closing auth modal');
          closeAuthModal();
          return;
        }

        // 3. If in 'spielen' tab:
        if (activeTabRef.current === 'spielen') {
          if (gameScreenBackRef.current && gameScreenBackRef.current()) {
            logger.nav('Back Button: Handled by GameScreen internal back stack');
            return;
          }
          logger.nav('Back Button: Leaving spielen ➔ home');
          setPracticeWord(undefined);
          setActiveTab('home');
          return;
        }

        // 4. If in 'party' tab:
        if (activeTabRef.current === 'party') {
          if (partyScreenBackRef.current && partyScreenBackRef.current()) {
            logger.nav('Back Button: Handled by PartyMode internal back stack');
            return;
          }
          logger.nav('Back Button: Leaving party ➔ home');
          setActiveTab('home');
          return;
        }

        // 5. If in any other sub-tab (lernen, wiederholen, settings), return to home:
        if (activeTabRef.current !== 'home') {
          logger.nav(`Back Button: Leaving ${activeTabRef.current} ➔ home`);
          setPracticeWord(undefined);
          setActiveTab('home');
          return;
        }

        // 6. Already at home: exit app gracefully
        try {
          logger.nav('Back Button at home root: Triggering CapacitorApp.exitApp()');
          CapacitorApp.exitApp();
        } catch (exitErr) {
          logger.warn('Could not exit app via CapacitorApp.exitApp()', exitErr);
        }
      })
        .then((handle) => {
          if (isMounted) {
            listenerHandle = handle;
            logger.lifecycle('Android backButton listener attached successfully');
          } else if (handle && typeof handle.remove === 'function') {
            try {
              handle.remove();
            } catch {}
          }
        })
        .catch((err) => {
          logger.warn('Could not register backButton listener', err);
        });
    } catch (err) {
      logger.warn('Error setting up backButton listener', err);
    }

    return () => {
      isMounted = false;
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        try {
          listenerHandle.remove();
        } catch (e) {
          logger.warn('Error removing backButton listener', e);
        }
      }
    };
  }, [closeAuthModal, setShowPaymentModal]);

  const handlePracticeSlang = (slang: SlangWord) => {
    logger.nav(`Direct practice initiated for word: "${slang.term}"`, { slangId: slang.id });
    setPracticeWord(slang);
    setActiveTab('spielen');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FF71CE] text-black selection:bg-[#FFFB96] selection:text-black pb-20 md:pb-6 relative">
      {/* Top Header with App Symbol that Panes in the Left Menu */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => handleTabChange(tab, 'navbar')}
        onOpenMenu={() => {
          logger.nav('Opening Left Sidebar Drawer');
          setIsSidebarOpen(true);
        }}
      />

      {/* Left Sidebar Drawer - Panes in from the left and panes out upon selection */}
      <LeftSidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => {
          logger.nav('Closing Left Sidebar Drawer');
          setIsSidebarOpen(false);
        }}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsSidebarOpen(false);
          handleTabChange(tab, 'sidebar');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4">
        <ErrorBoundary componentName={`Tab:${activeTab}`}>
          {activeTab === 'home' && (
            <HomeDashboard
              onNavigate={(tab) => handleTabChange(tab, 'home_dashboard_cta')}
              onPracticeSlang={handlePracticeSlang}
            />
          )}

          {activeTab === 'spielen' && (
            <GameScreen
              preselectedSlang={practiceWord}
              onBackToMenu={() => handleTabChange('home', 'game_back_to_menu')}
              registerBackHandler={(handler) => {
                gameScreenBackRef.current = handler;
              }}
            />
          )}

          {activeTab === 'party' && (
            <PartyMode
              onBackToMenu={() => handleTabChange('home', 'party_back_to_menu')}
              registerBackHandler={(handler) => {
                partyScreenBackRef.current = handler;
              }}
            />
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
        </ErrorBoundary>
      </main>

      {/* Bottom Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={(tab) => handleTabChange(tab, 'mobile_bottom_nav')}
      />

      {/* Modals */}
      <OnboardingModal />
      <PaymentGateModal />
      <AuthModal />
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
