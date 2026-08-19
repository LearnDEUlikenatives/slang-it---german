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

  // Initialize AdMob smoothly on app launch
  useEffect(() => {
    initializeAdMob(false).catch(err => console.error('AdMob init failed:', err));
  }, []);

  // Handle Android Hardware / Gesture Back Button
  useEffect(() => {
    // Only bind in native mobile Capacitor environments
    const isNative = typeof window !== 'undefined' && Boolean((window as any).Capacitor?.isNativePlatform?.());
    if (!isNative) return;

    let isMounted = true;
    let listenerHandle: { remove: () => Promise<void> | void } | null = null;

    try {
      CapacitorApp.addListener('backButton', () => {
        // 1. Close sidebar if open
        if (isSidebarOpenRef.current) {
          setIsSidebarOpen(false);
          return;
        }

        // 2. Close modals if open
        if (showPaymentModalRef.current) {
          setShowPaymentModal(false);
          return;
        }
        if (isAuthModalOpenRef.current) {
          closeAuthModal();
          return;
        }

        // 3. If in 'spielen' tab:
        if (activeTabRef.current === 'spielen') {
          if (gameScreenBackRef.current && gameScreenBackRef.current()) {
            return; // Handled: returned to Play config/start screen
          }
          setPracticeWord(undefined);
          setActiveTab('home');
          return;
        }

        // 4. If in 'party' tab:
        if (activeTabRef.current === 'party') {
          if (partyScreenBackRef.current && partyScreenBackRef.current()) {
            return; // Handled: returned to Party lobby
          }
          setActiveTab('home');
          return;
        }

        // 5. If in any other sub-tab (lernen, wiederholen, settings), return to home:
        if (activeTabRef.current !== 'home') {
          setPracticeWord(undefined);
          setActiveTab('home');
          return;
        }

        // 6. Already at home: exit app gracefully
        try {
          CapacitorApp.exitApp();
        } catch (exitErr) {
          console.warn('Could not exit app', exitErr);
        }
      })
        .then((handle) => {
          if (isMounted) {
            listenerHandle = handle;
          } else if (handle && typeof handle.remove === 'function') {
            try {
              handle.remove();
            } catch {}
          }
        })
        .catch((err) => {
          console.warn('Could not register backButton listener', err);
        });
    } catch (err) {
      console.warn('Error setting up backButton listener', err);
    }

    return () => {
      isMounted = false;
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        try {
          listenerHandle.remove();
        } catch (e) {
          console.warn('Error removing backButton listener', e);
        }
      }
    };
  }, [closeAuthModal, setShowPaymentModal]);

  const handlePracticeSlang = (slang: SlangWord) => {
    setPracticeWord(slang);
    setActiveTab('spielen');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FF71CE] text-black selection:bg-[#FFFB96] selection:text-black pb-20 md:pb-6 relative">
      {/* Top Header with App Symbol that Panes in the Left Menu */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setPracticeWord(undefined);
          setActiveTab(tab);
        }}
        onOpenMenu={() => setIsSidebarOpen(true)}
      />

      {/* Left Sidebar Drawer - Panes in from the left and panes out upon selection */}
      <LeftSidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setPracticeWord(undefined);
          setActiveTab(tab);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4">
        <ErrorBoundary>
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
              registerBackHandler={(handler) => {
                gameScreenBackRef.current = handler;
              }}
            />
          )}

          {activeTab === 'party' && (
            <PartyMode
              onBackToMenu={() => setActiveTab('home')}
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
      <MobileNav activeTab={activeTab} onSelectTab={(tab) => {
        setPracticeWord(undefined);
        setActiveTab(tab);
      }} />

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
