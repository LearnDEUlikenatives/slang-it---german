import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CartoonAvatar, AVATAR_LIST } from './CartoonAvatar';
import { REGION_LABELS } from '../data/slangDatabase';
import { sounds } from '../utils/audio';
import { useTranslation, LANGUAGES, Language } from '../utils/translations';
import AppLogoImg from '../assets/images/german_slang_logo_1786812856007.jpg';
import { Sparkles, ArrowRight, Check, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingModal: React.FC = () => {
  const { isFirstVisit, completeOnboarding, profile, setSystemLanguage } = useGame();
  const { t } = useTranslation(profile.systemLanguage);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('Slang-Pro');
  const [avatarId, setAvatarId] = useState('berlin_bear');
  const [germanLevel, setGermanLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'Ehren-Native'>('B1');
  const [preferredRegion, setPreferredRegion] = useState('all');
  const [dailyGoal, setDailyGoal] = useState(5);

  if (!isFirstVisit) return null;

  const handleNext = () => {
    sounds.playPop();
    if (step < 3) {
      setStep(step + 1);
    } else {
      completeOnboarding(name, avatarId, germanLevel, preferredRegion, dailyGoal);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-pop">
      <div className="cartoon-card-lg bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden border-4 border-black shadow-[8px_8px_0px_#000000]">
        {/* Step Indicator */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-[#05FFA1] border-2 border-black' : 'w-2.5 bg-neutral-200 border border-black'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-black text-black font-cartoon">
            Step {step} of 3
          </span>
        </div>

        {/* STEP 1: Language, Name & Avatar */}
        {step === 1 && (
          <div>
            <div className="text-center mb-5">
              <img
                src={AppLogoImg}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl border-3 border-black mx-auto mb-2 shadow-[3px_3px_0px_#000000]"
              />
              <h3 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic">
                Welcome to Slang It - German!
              </h3>
              <p className="text-xs font-bold text-black/80 mt-1">
                Choose your app language, cartoon avatar & player name:
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Language Selection */}
              <div>
                <label className="block text-xs font-black text-black font-cartoon mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-black" />
                  <span>Choose System Language:</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setSystemLanguage(lang.code);
                      }}
                      className={`p-1.5 rounded-xl border-2 font-cartoon text-xs font-black flex items-center justify-center gap-1 ${
                        profile.systemLanguage === lang.code
                          ? 'bg-[#05FFA1] text-black border-black shadow-[2px_2px_0px_#000000]'
                          : 'bg-white text-black border-black/30 hover:bg-[#FFFB96]'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="uppercase text-[10px]">{lang.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black font-cartoon mb-1">
                  Player Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded-2xl px-4 py-2.5 font-black text-sm text-black focus:outline-none focus:bg-[#FFFB96]/20 font-cartoon shadow-[2px_2px_0px_#000000]"
                  placeholder="e.g. Alex"
                  maxLength={18}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black font-cartoon mb-2">
                  Choose Avatar:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_LIST.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setAvatarId(av.id);
                      }}
                      className={`p-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                        avatarId === av.id
                          ? 'border-black bg-[#FFFB96] ring-2 ring-black shadow-[2px_2px_0px_#000000]'
                          : 'border-transparent hover:bg-neutral-100'
                      }`}
                    >
                      <CartoonAvatar avatarId={av.id} size="sm" />
                      <span className="text-[10px] font-black text-black truncate max-w-[55px]">
                        {av.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Level & Region */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <span className="text-3xl block mb-1">🎯</span>
              <h3 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic">
                Your German Level & Focus
              </h3>
              <p className="text-xs font-bold text-black/80 mt-1">
                Customize difficulty and regional slang:
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black text-black font-cartoon mb-1">
                  German Level:
                </label>
                <select
                  value={germanLevel}
                  onChange={(e) => setGermanLevel(e.target.value as any)}
                  className="w-full bg-white border-2 border-black rounded-2xl px-4 py-2.5 font-black text-xs text-black focus:outline-none shadow-[2px_2px_0px_#000000]"
                >
                  <option value="A1">A1 – Absolute Beginner</option>
                  <option value="A2">A2 – Elementary</option>
                  <option value="B1">B1 – Intermediate</option>
                  <option value="B2">B2 – Independent</option>
                  <option value="C1">C1 – Proficient</option>
                  <option value="Ehren-Native">Ehren-Native – Native Speaker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black font-cartoon mb-1">
                  Preferred Dialect Region:
                </label>
                <select
                  value={preferredRegion}
                  onChange={(e) => setPreferredRegion(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded-2xl px-4 py-2.5 font-black text-xs text-black focus:outline-none shadow-[2px_2px_0px_#000000]"
                >
                  <option value="all">🇩🇪 All Germany (Standard Youth Slang)</option>
                  <option value="berlin">🐻 Berlin & Kiez</option>
                  <option value="bayern">🥨 Bavaria & Munich</option>
                  <option value="nord">⚓ Hamburg & Coast</option>
                  <option value="ruhrpott">⛏️ Ruhrpott</option>
                  <option value="wien">🇦🇹 Vienna & Austria</option>
                  <option value="schweiz">🇨🇭 Switzerland</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Daily Goal */}
        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <span className="text-3xl block mb-1">🔥</span>
              <h3 className="text-2xl sm:text-3xl font-black text-black font-cartoon italic">
                Set Daily Goal
              </h3>
              <p className="text-xs font-bold text-black/80 mt-1">
                How many slang terms do you want to learn each day?
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { count: 3, label: 'Chill', icon: '☕' },
                { count: 5, label: 'Standard', icon: '⚡' },
                { count: 10, label: 'Hardcore', icon: '🚀' },
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setDailyGoal(item.count);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-1 ${
                    dailyGoal === item.count
                      ? 'border-black bg-[#05FFA1] ring-2 ring-black shadow-[3px_3px_0px_#000000]'
                      : 'border-black/30 hover:bg-neutral-100'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-black text-black font-cartoon">{item.count} Words</span>
                  <span className="text-[10px] font-bold text-black/70">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Next Button */}
        <button
          onClick={handleNext}
          className="cartoon-btn w-full py-4 rounded-2xl bg-[#05FFA1] hover:bg-[#05FFA1]/80 text-black font-black text-sm font-cartoon flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_#000000]"
        >
          <span>{step < 3 ? 'Next Step' : 'Get Started! 🚀'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
