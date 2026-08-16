import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../utils/audio';
import { useTranslation } from '../utils/translations';
import { Crown, Check, X, Sparkles, Zap, Flame, ShieldCheck, Ban } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PaymentGateModal: React.FC = () => {
  const { profile, updateProfile, showPaymentModal, setShowPaymentModal } = useGame();
  const { t } = useTranslation(profile.systemLanguage);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('lifetime');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!showPaymentModal) return null;

  const handleUpgrade = () => {
    sounds.playLevelUp();
    updateProfile({ isPremium: true });
    setIsSuccess(true);

    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch {}

    setTimeout(() => {
      setIsSuccess(false);
      setShowPaymentModal(false);
    }, 2000);
  };

  const minutesLeft = Math.floor(profile.trialSecondsRemaining / 60);
  const secondsLeft = profile.trialSecondsRemaining % 60;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-pop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowPaymentModal(false);
        }
      }}
    >
      <div className="cartoon-card-lg bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full max-h-[92vh] overflow-y-auto relative text-center border-4 border-black shadow-[8px_8px_0px_#000000]">
        {/* Prominent Sticky Top Close Button */}
        <button
          onClick={() => {
            sounds.playPop();
            setShowPaymentModal(false);
          }}
          aria-label="Close modal"
          className="absolute top-3 right-3 z-30 w-10 h-10 rounded-2xl border-3 border-black flex items-center justify-center bg-[#FF71CE] hover:bg-[#FF71CE]/80 text-black shadow-[2px_2px_0px_#000000] active:scale-95 transition-transform"
        >
          <X className="w-6 h-6 stroke-[3]" />
        </button>

        {isSuccess ? (
          <div className="py-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFFB96] border-4 border-black flex items-center justify-center text-4xl mb-4 shadow-[4px_4px_0px_#000000] animate-bounce">
              👑
            </div>
            <h3 className="text-3xl font-black text-black font-cartoon italic">
              Welcome to Pro VIP Club!
            </h3>
            <p className="text-sm font-bold text-black/80 mt-2">
              🎉 <strong>All ads are now permanently removed!</strong> You have unlimited access to all German slang terms, party modes, and dialect packs!
            </p>
          </div>
        ) : (
          <div className="pt-2">
            {/* Header Crown */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl bg-[#FFFB96] border-3 border-black flex items-center justify-center text-3xl mb-2 shadow-[3px_3px_0px_#000000]">
              👑
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic">
              Slang It! Pro Upgrade
            </h3>

            {/* Ad-Free & VIP Banner */}
            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#05FFA1] border-2 border-black px-3 py-1 rounded-xl text-xs font-black text-black font-cartoon shadow-[2px_2px_0px_#000000]">
              <Ban className="w-3.5 h-3.5 stroke-[3]" />
              <span>100% Ad-Free Experience Guaranteed</span>
            </div>

            <p className="text-xs font-bold text-black/80 mt-2">
              Subscribe to Pro for $10 to eliminate all ad interruptions throughout the entire app and unlock unlimited party & dialect access!
            </p>

            {/* Perks List */}
            <div className="my-4 text-left space-y-2 bg-[#FFFB96]/40 p-3.5 rounded-2xl border-3 border-black text-xs font-bold text-black shadow-[3px_3px_0px_#000000]">
              <div className="flex items-center gap-2 text-emerald-950 font-black">
                <Check className="w-4 h-4 text-emerald-600 stroke-[4]" />
                <span>🚫 Zero Ads: No video/interstitial ads in Play, Party, Dictionary or Revision</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>Unlimited Multiplayer & Buzzer Party rounds (2-8 players)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>All 100+ slang terms & regional dialect packs (Bavarian, Berlin, etc.)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>Voice recognition mode & speech pronunciation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>Exclusive VIP Cartoon Avatars & Gold rank badge</span>
              </div>
            </div>

            {/* Pricing Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedPlan('lifetime');
                }}
                className={`cartoon-card p-3 rounded-2xl text-left transition-all relative border-2 border-black ${
                  selectedPlan === 'lifetime'
                    ? 'bg-[#05FFA1] ring-3 ring-black shadow-[4px_4px_0px_#000000]'
                    : 'bg-neutral-100 opacity-70'
                }`}
              >
                <span className="absolute -top-2.5 -right-2 bg-[#FF71CE] text-black font-black text-[9px] px-2 py-0.5 rounded-full border border-black font-cartoon animate-pulse">
                  BEST VALUE
                </span>
                <span className="text-[10px] font-black uppercase text-black block font-cartoon">
                  Pro Lifetime
                </span>
                <span className="text-2xl font-black text-black font-cartoon">$10</span>
                <span className="text-[10px] text-black/70 font-bold block">One-time • No Ads</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedPlan('monthly');
                }}
                className={`cartoon-card p-3 rounded-2xl text-left transition-all border-2 border-black ${
                  selectedPlan === 'monthly'
                    ? 'bg-[#FFFB96] ring-3 ring-black shadow-[4px_4px_0px_#000000]'
                    : 'bg-neutral-100 opacity-70'
                }`}
              >
                <span className="text-[10px] font-black uppercase text-black block font-cartoon">
                  Monthly Pass
                </span>
                <span className="text-2xl font-black text-black font-cartoon">$2.99</span>
                <span className="text-[10px] text-black/70 font-bold block">/ month • No Ads</span>
              </button>
            </div>

            {/* Action Upgrade Button */}
            <button
              id="unlock-pro-btn"
              onClick={handleUpgrade}
              className="cartoon-btn w-full py-3.5 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-base text-black font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_#000000] active:scale-98 transition-transform"
            >
              <Zap className="w-5 h-5 fill-black text-black" />
              <span>{selectedPlan === 'lifetime' ? 'Get Pro for $10 (Remove Ads)' : 'Subscribe to Pro for $2.99/mo'}</span>
            </button>

            {/* Clear Dismiss / Free Mode Button */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setShowPaymentModal(false);
              }}
              className="mt-3 text-xs font-black text-black/70 hover:text-black underline block w-full py-1 text-center font-cartoon"
            >
              ✕ Maybe Later (Continue Free with Ads)
            </button>

            <p className="text-[10px] text-black/60 font-bold mt-2">
              One-click instant activation • Lifetime ad-free guarantee
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
