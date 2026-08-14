import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../utils/audio';
import { useTranslation } from '../utils/translations';
import { Crown, Check, X, Sparkles, Zap, Flame, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PaymentGateModal: React.FC = () => {
  const { profile, updateProfile, showPaymentModal, setShowPaymentModal } = useGame();
  const { t } = useTranslation(profile.systemLanguage);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('monthly');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-pop">
      <div className="cartoon-card-lg bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden text-center border-4 border-black shadow-[8px_8px_0px_#000000]">
        {/* Close Button */}
        <button
          onClick={() => setShowPaymentModal(false)}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl border-2 border-black flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 shadow-[2px_2px_0px_#000000]"
        >
          <X className="w-5 h-5 text-black" />
        </button>

        {isSuccess ? (
          <div className="py-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFFB96] border-4 border-black flex items-center justify-center text-4xl mb-4 shadow-[4px_4px_0px_#000000] animate-bounce">
              👑
            </div>
            <h3 className="text-3xl font-black text-black font-cartoon italic">
              Welcome to VIP Club!
            </h3>
            <p className="text-sm font-bold text-black/80 mt-2">
              You now have unlimited access to all German slang terms, party modes, and dialect packs!
            </p>
          </div>
        ) : (
          <div>
            {/* Header Crown */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FFFB96] border-3 border-black flex items-center justify-center text-3xl mb-3 shadow-[3px_3px_0px_#000000]">
              👑
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic">
              VIP Pass Upgrade
            </h3>

            {!profile.isPremium && (
              <div className="mt-2 inline-block bg-[#FFFB96] border-2 border-black px-3 py-1 rounded-xl text-xs font-black text-black font-cartoon shadow-[2px_2px_0px_#000000]">
                ⏳ {t('free_trial_remaining')} {minutesLeft}:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft} {t('min_full_access')}
              </div>
            )}

            <p className="text-xs font-bold text-black/80 mt-2">
              Unlock the full German slang experience without limits for you and your friends!
            </p>

            {/* Perks List */}
            <div className="my-5 text-left space-y-2 bg-[#FFFB96]/40 p-4 rounded-2xl border-3 border-black text-xs font-bold text-black shadow-[3px_3px_0px_#000000]">
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
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedPlan('monthly');
                }}
                className={`cartoon-card p-3 rounded-2xl text-left transition-all border-2 border-black ${
                  selectedPlan === 'monthly'
                    ? 'bg-[#FFFB96] ring-2 ring-black shadow-[4px_4px_0px_#000000]'
                    : 'bg-neutral-100 opacity-70'
                }`}
              >
                <span className="text-[10px] font-black uppercase text-black block font-cartoon">
                  Monthly Pass
                </span>
                <span className="text-xl font-black text-black font-cartoon">€2.99</span>
                <span className="text-[10px] text-black/70 font-bold block">/ month</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedPlan('lifetime');
                }}
                className={`cartoon-card p-3 rounded-2xl text-left transition-all relative border-2 border-black ${
                  selectedPlan === 'lifetime'
                    ? 'bg-[#05FFA1] ring-2 ring-black shadow-[4px_4px_0px_#000000]'
                    : 'bg-neutral-100 opacity-70'
                }`}
              >
                <span className="absolute -top-2 -right-2 bg-[#FF71CE] text-black font-black text-[9px] px-2 py-0.5 rounded-full border border-black font-cartoon">
                  POPULAR
                </span>
                <span className="text-[10px] font-black uppercase text-black block font-cartoon">
                  Ehrenmann Lifetime
                </span>
                <span className="text-xl font-black text-black font-cartoon">€9.99</span>
                <span className="text-[10px] text-black/70 font-bold block">One-time</span>
              </button>
            </div>

            {/* Action Upgrade Button */}
            <button
              onClick={handleUpgrade}
              className="cartoon-btn w-full py-4 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 font-black text-base text-black font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_#000000]"
            >
              <Zap className="w-5 h-5 fill-black text-black" />
              <span>Unlock VIP Pass Now</span>
            </button>

            <p className="text-[10px] text-black/60 font-bold mt-3">
              Cancel anytime • Instant access
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
