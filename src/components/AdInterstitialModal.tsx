import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../utils/audio';
import { useTranslation } from '../utils/translations';
import { showGoogleInterstitialAd, canShowAd, isNativeAdMobAvailable, ADMOB_CONFIG } from '../services/admobService';
import { Crown, Sparkles, X, Volume2, ExternalLink, Zap, ShieldCheck } from 'lucide-react';

export type AdContextType =
  | 'play_finish'
  | 'party_finish'
  | 'dictionary_time'
  | 'revision_12words';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  countdownSeconds?: number;
  adContext?: AdContextType;
}

interface SponsorCreative {
  id: string;
  brand: string;
  tagline: string;
  description: string;
  bgColor: string;
  textColor: string;
  emoji: string;
  ctaText: string;
  badge: string;
  rating: string;
}

const SPONSORS: SponsorCreative[] = [
  {
    id: 'berlin_gear',
    brand: 'Berlin Streetwear Co.',
    tagline: 'Authentic Kreuzberg & Neukölln Apparel',
    description: 'Level up your look with oversized hoodies, vintage jackets, and Berlin underground vibes.',
    bgColor: 'from-amber-400 to-orange-500',
    textColor: 'text-black',
    emoji: '🧢',
    ctaText: 'Shop Streetwear (20% Off)',
    badge: 'Trending in Berlin',
    rating: '★ 4.9 (12.4k reviews)',
  },
  {
    id: 'mate_energy',
    brand: 'Club-Mate & Späti Brews',
    tagline: 'Pure Natural Caffeine for All-Night Gaming',
    description: 'Fuel your slang study sessions and party nights with Germany’s favorite fizzy mate tea.',
    bgColor: 'from-emerald-400 to-teal-600',
    textColor: 'text-black',
    emoji: '⚡',
    ctaText: 'Order Mate Pack',
    badge: 'Club Favorite',
    rating: '★ 4.8 (8.1k reviews)',
  },
  {
    id: 'goethe_audio',
    brand: 'AudioDeutsch Pro',
    tagline: 'Master Native Dialects & B2/C1 German',
    description: 'Interactive audio courses recorded with native speakers from Hamburg, Munich, and Berlin.',
    bgColor: 'from-purple-400 to-indigo-600',
    textColor: 'text-white',
    emoji: '🎧',
    ctaText: 'Start Free Trial',
    badge: 'Top Language App',
    rating: '★ 4.9 (24.3k reviews)',
  },
  {
    id: 'curry_doener',
    brand: 'Döner & Currywurst Club',
    tagline: 'Best Street Food Guide in Germany',
    description: 'Find legendary hidden gems and legendary street food spots with secret local discount codes.',
    bgColor: 'from-rose-400 to-red-600',
    textColor: 'text-white',
    emoji: '🥙',
    ctaText: 'Explore Street Food',
    badge: 'Foodie Guide',
    rating: '★ 4.9 (19.8k reviews)',
  },
];

export const AdInterstitialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  countdownSeconds = 5,
  adContext = 'play_finish',
}) => {
  const { profile, setShowPaymentModal } = useGame();
  const { t } = useTranslation(profile.systemLanguage);
  
  const [secondsRemaining, setSecondsRemaining] = useState(countdownSeconds);
  const [sponsorIndex, setSponsorIndex] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger native Google AdMob or fallback web countdown
  useEffect(() => {
    if (isOpen && !profile.isPremium) {
      // Cooldown check
      if (!canShowAd()) {
        onClose();
        return;
      }

      // 1. If running natively in Android APK, fire the pre-cached Native Ad instantly
      if (isNativeAdMobAvailable()) {
        showGoogleInterstitialAd().finally(() => {
          onClose();
        });
        return;
      }

      // 2. Web browser fallback: Start clean visual countdown
      const randomIdx = Math.floor(Math.random() * SPONSORS.length);
      setSponsorIndex(randomIdx);
      setSecondsRemaining(countdownSeconds);
      setCanSkip(false);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setCanSkip(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, countdownSeconds, profile.isPremium, onClose]);

  // If user is Pro, modal is closed, or native AdMob is handling the display natively:
  if (!isOpen || profile.isPremium || isNativeAdMobAvailable()) return null;

  const currentSponsor = SPONSORS[sponsorIndex] || SPONSORS[0];

  const handleClose = () => {
    if (!canSkip && secondsRemaining > 0) return;
    sounds.playPop();
    onClose();
  };

  const handleUpgradeToPro = () => {
    sounds.playPop();
    onClose();
    setShowPaymentModal(true);
  };


  const getContextBadge = () => {
    switch (adContext) {
      case 'play_finish':
        return 'Round Finished • Sponsored Message';
      case 'party_start':
        return 'Party Match Starting in 5s...';
      case 'party_finish':
        return 'Party Round Complete • Sponsored Message';
      case 'dictionary_time':
        return 'Dictionary Sponsor • 20s Study Milestone';
      case 'revision_5words':
        return '5 Slang Words Mastered! • Sponsored Message';
      default:
        return 'Sponsored Message';
    }
  };

  return (
    <div
      id="ad-interstitial-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl border-4 border-black shadow-[8px_8px_0px_#000000] overflow-hidden text-center relative animate-pop">
        
        {/* Top Header Bar */}
        <div className="bg-[#FFFB96] px-4 py-2.5 border-b-4 border-black flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-black text-[#FFFB96] text-[10px] font-black uppercase px-2 py-0.5 rounded-md font-cartoon shadow-[1px_1px_0px_#ffffff]">
              AD • WERBUNG
            </span>
            <span className="text-xs font-black text-black font-cartoon truncate max-w-[200px] sm:max-w-xs">
              {getContextBadge()}
            </span>
          </div>

          {/* Countdown & Close/Skip Button */}
          <div>
            {canSkip || secondsRemaining === 0 ? (
              <button
                id="ad-close-btn"
                onClick={handleClose}
                className="px-3 py-1 bg-black text-[#05FFA1] hover:bg-neutral-800 rounded-xl font-cartoon text-xs font-black flex items-center gap-1 border-2 border-white shadow-[2px_2px_0px_#000000] active:scale-95 transition-transform animate-pulse"
              >
                <span>Skip Ad</span>
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            ) : (
              <div className="px-2.5 py-1 bg-black text-[#FFFB96] rounded-xl font-cartoon text-xs font-black flex items-center gap-1 border-2 border-white shadow-[1px_1px_0px_#000000]">
                <span>Reward in {secondsRemaining}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Sponsor Creative Content */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Main Visual Banner */}
          <div className={`p-6 rounded-3xl bg-gradient-to-br ${currentSponsor.bgColor} border-3 border-black shadow-[4px_4px_0px_#000000] text-left relative overflow-hidden`}>
            
            {/* Top Category Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border border-white/40 font-cartoon">
                {currentSponsor.badge}
              </span>
              <span className="text-[11px] font-black bg-white/90 text-black px-2 py-0.5 rounded-lg border border-black font-cartoon">
                {currentSponsor.rating}
              </span>
            </div>

            {/* Icon & Title */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-white border-3 border-black flex items-center justify-center text-3xl shadow-[3px_3px_0px_#000000]">
                {currentSponsor.emoji}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black font-cartoon italic text-black leading-tight">
                  {currentSponsor.brand}
                </h3>
                <p className="text-xs font-bold text-black/80">
                  {currentSponsor.tagline}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs font-bold text-black/90 leading-relaxed bg-white/80 p-3 rounded-2xl border-2 border-black mb-3">
              {currentSponsor.description}
            </p>

            {/* Fake CTA button */}
            <button
              onClick={() => {
                sounds.playPop();
                window.open('https://google.com', '_blank');
              }}
              className="cartoon-btn w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-[#05FFA1] font-black text-xs font-cartoon flex items-center justify-center gap-1.5 border-2 border-white shadow-[2px_2px_0px_#000000]"
            >
              <span>{currentSponsor.ctaText}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PRO Upgrade Callout Banner */}
          <div className="bg-[#05FFA1]/20 border-3 border-black rounded-2xl p-3.5 text-left flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000000]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFFB96] border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_#000000] shrink-0">
                👑
              </div>
              <div>
                <span className="text-xs font-black text-black font-cartoon block leading-tight">
                  Hate seeing ads?
                </span>
                <span className="text-[11px] font-bold text-black/80">
                  Get <strong className="font-black text-black">Pro Version for $10</strong> to remove all ads forever!
                </span>
              </div>
            </div>

            <button
              id="ad-upgrade-pro-btn"
              onClick={handleUpgradeToPro}
              className="cartoon-btn px-3 py-2 rounded-xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black font-black text-xs font-cartoon border-2 border-black shadow-[2px_2px_0px_#000000] whitespace-nowrap active:scale-95 transition-transform"
            >
              <span>Get Pro ($10)</span>
            </button>
          </div>

          {/* Bottom Action when ad completes */}
          {canSkip && (
            <button
              onClick={handleClose}
              className="cartoon-btn w-full py-3 rounded-2xl bg-black hover:bg-neutral-900 text-[#05FFA1] font-black text-sm font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[3px_3px_0px_#000000]"
            >
              <span>Continue to Game</span>
              <Zap className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
