import React from 'react';

export type AvatarId =
  | 'berlin_bear'
  | 'doener_king'
  | 'bretzel_bavaria'
  | 'cyber_chaya'
  | 'hipster_macher'
  | 'cool_alman'
  | 'party_kartoffel'
  | 'nord_kapitaen';

export interface AvatarMeta {
  id: AvatarId;
  name: string;
  subtitle: string;
  bg: string;
  accent: string;
  emoji: string;
}

export const AVATAR_LIST: AvatarMeta[] = [
  { id: 'berlin_bear', name: 'Kiez-Bär', subtitle: 'Berliner Schnauze & Späti-King', bg: 'bg-sky-400', accent: 'border-sky-600', emoji: '🐻' },
  { id: 'doener_king', name: 'Döner-Chef', subtitle: 'Mit Scharf & Alles Meister', bg: 'bg-amber-400', accent: 'border-amber-600', emoji: '🥙' },
  { id: 'bretzel_bavaria', name: 'Bavaria-Sepp', subtitle: 'Oachkatzl- & Wiesn-Legende', bg: 'bg-blue-400', accent: 'border-blue-600', emoji: '🥨' },
  { id: 'cyber_chaya', name: 'Cyber-Chaya', subtitle: 'Slay Queen & TikTok-Profi', bg: 'bg-rose-400', accent: 'border-rose-600', emoji: '💅' },
  { id: 'hipster_macher', name: 'Der Macher', subtitle: 'Club-Mate & Macher-Mindset', bg: 'bg-emerald-400', accent: 'border-emerald-600', emoji: '⚡' },
  { id: 'cool_alman', name: 'Herr Korrekt', subtitle: 'Laminierte Mülltrennung', bg: 'bg-slate-300', accent: 'border-slate-500', emoji: '📄' },
  { id: 'party_kartoffel', name: 'Party-Knolle', subtitle: 'Vorglüh-Experte & Stimmung', bg: 'bg-yellow-400', accent: 'border-yellow-600', emoji: '🥔' },
  { id: 'nord_kapitaen', name: 'Käptn Moin', subtitle: 'Hamburger Hafen-Original', bg: 'bg-teal-400', accent: 'border-teal-600', emoji: '⚓' },
];

interface Props {
  avatarId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  mood?: 'normal' | 'happy' | 'thinking' | 'shocked' | 'victory';
  className?: string;
  animate?: boolean;
}

export const CartoonAvatar: React.FC<Props> = ({
  avatarId = 'berlin_bear',
  size = 'md',
  mood = 'normal',
  className = '',
  animate = false,
}) => {
  const meta = AVATAR_LIST.find((a) => a.id === avatarId) || AVATAR_LIST[0];

  const sizeClasses = {
    sm: 'w-10 h-10 text-lg border-2',
    md: 'w-14 h-14 text-2xl border-3',
    lg: 'w-20 h-20 text-4xl border-3.5',
    xl: 'w-28 h-28 text-5xl border-4',
    '2xl': 'w-36 h-36 text-6xl border-4',
  }[size];

  // Specific colorful SVG cartoon faces for each character
  const renderAvatarContent = () => {
    switch (meta.id) {
      case 'berlin_bear':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bear Ears */}
            <circle cx="28" cy="28" r="16" fill="#8D5B4C" stroke="#0F172A" strokeWidth="4" />
            <circle cx="28" cy="28" r="8" fill="#FBBF24" />
            <circle cx="72" cy="28" r="16" fill="#8D5B4C" stroke="#0F172A" strokeWidth="4" />
            <circle cx="72" cy="28" r="8" fill="#FBBF24" />
            {/* Head */}
            <circle cx="50" cy="56" r="36" fill="#A76D5B" stroke="#0F172A" strokeWidth="4" />
            {/* Snout */}
            <ellipse cx="50" cy="65" rx="18" ry="14" fill="#FDE68A" stroke="#0F172A" strokeWidth="3" />
            <ellipse cx="50" cy="59" rx="7" ry="5" fill="#0F172A" />
            {/* Mouth */}
            {mood === 'shocked' ? (
              <circle cx="50" cy="71" r="5" fill="#0F172A" />
            ) : mood === 'victory' || mood === 'happy' ? (
              <path d="M43 67 Q50 77 57 67" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="#EF4444" />
            ) : (
              <path d="M44 68 Q50 73 56 68" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            )}
            {/* Cool Sunglasses */}
            <rect x="24" y="42" width="22" height="14" rx="4" fill="#0F172A" />
            <rect x="54" y="42" width="22" height="14" rx="4" fill="#0F172A" />
            <line x1="46" y1="48" x2="54" y2="48" stroke="#0F172A" strokeWidth="4" />
            {/* Cool cap */}
            <path d="M22 34 Q50 18 78 34 L88 36 Q50 26 12 36 Z" fill="#EF4444" stroke="#0F172A" strokeWidth="3" />
          </svg>
        );

      case 'doener_king':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <circle cx="50" cy="54" r="34" fill="#FCD34D" stroke="#0F172A" strokeWidth="4" />
            {/* Chef Hat */}
            <path d="M30 30 C20 15 45 10 50 20 C55 10 80 15 70 30 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3.5" />
            <rect x="30" y="26" width="40" height="10" rx="3" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
            {/* Eyes */}
            {mood === 'happy' || mood === 'victory' ? (
              <>
                <path d="M35 48 Q40 43 45 48" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
                <path d="M55 48 Q60 43 65 48" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="40" cy="48" r="4" fill="#0F172A" />
                <circle cx="60" cy="48" r="4" fill="#0F172A" />
              </>
            )}
            {/* Mustache */}
            <path d="M34 62 C40 58 48 64 50 63 C52 64 60 58 66 62 C63 68 50 69 50 64 C50 69 37 68 34 62 Z" fill="#451A03" stroke="#0F172A" strokeWidth="2" />
            {/* Smile / Tongue */}
            <path d="M44 68 Q50 76 56 68" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            {/* Garlic sauce smile highlight */}
            <circle cx="34" cy="56" r="3" fill="#F87171" opacity="0.6" />
            <circle cx="66" cy="56" r="3" fill="#F87171" opacity="0.6" />
          </svg>
        );

      case 'bretzel_bavaria':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bavarian Hat */}
            <path d="M22 36 L78 36 L70 18 L30 18 Z" fill="#15803D" stroke="#0F172A" strokeWidth="3.5" />
            <path d="M68 18 L76 6" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
            {/* Head */}
            <circle cx="50" cy="56" r="32" fill="#FED7AA" stroke="#0F172A" strokeWidth="4" />
            {/* Beard */}
            <path d="M30 60 C30 84 70 84 70 60" fill="#CA8A04" stroke="#0F172A" strokeWidth="3" />
            {/* Eyes */}
            <circle cx="40" cy="50" r="4" fill="#0F172A" />
            <circle cx="60" cy="50" r="4" fill="#0F172A" />
            <circle cx="50" cy="58" r="5" fill="#F97316" />
            <path d="M45 68 Q50 74 55 68" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="#FFFFFF" />
          </svg>
        );

      case 'cyber_chaya':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Neon Hair */}
            <path d="M24 65 C16 45 22 20 50 20 C78 20 84 45 76 65 C70 50 68 35 50 35 C32 35 30 50 24 65 Z" fill="#EC4899" stroke="#0F172A" strokeWidth="3" />
            {/* Head */}
            <circle cx="50" cy="54" r="30" fill="#FFE4E6" stroke="#0F172A" strokeWidth="4" />
            {/* Cyber Headphones */}
            <rect x="14" y="42" width="10" height="24" rx="5" fill="#8B5CF6" stroke="#0F172A" strokeWidth="3" />
            <rect x="76" y="42" width="10" height="24" rx="5" fill="#8B5CF6" stroke="#0F172A" strokeWidth="3" />
            <path d="M24 44 Q50 16 76 44" stroke="#0F172A" strokeWidth="4" fill="none" />
            {/* Eyes / Eyeliner */}
            <path d="M34 50 L44 48" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            <path d="M56 48 L66 50" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            <circle cx="39" cy="52" r="3" fill="#0F172A" />
            <circle cx="61" cy="52" r="3" fill="#0F172A" />
            {/* Lips */}
            <path d="M44 65 Q50 70 56 65 Q50 62 44 65 Z" fill="#F43F5E" stroke="#0F172A" strokeWidth="2" />
          </svg>
        );

      case 'hipster_macher':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Beanie Hat */}
            <path d="M26 38 C26 18 74 18 74 38 Z" fill="#F97316" stroke="#0F172A" strokeWidth="3.5" />
            <rect x="24" y="34" width="52" height="8" rx="2" fill="#EA580C" stroke="#0F172A" strokeWidth="3" />
            {/* Head */}
            <circle cx="50" cy="56" r="30" fill="#FEE2E2" stroke="#0F172A" strokeWidth="4" />
            {/* Full Hipster Beard */}
            <path d="M28 56 C28 84 72 84 72 56 L68 54 C68 76 32 76 32 54 Z" fill="#78350F" stroke="#0F172A" strokeWidth="3" />
            {/* Round Spectacles */}
            <circle cx="39" cy="50" r="8" stroke="#0F172A" strokeWidth="3" fill="#FFFFFF" fillOpacity="0.4" />
            <circle cx="61" cy="50" r="8" stroke="#0F172A" strokeWidth="3" fill="#FFFFFF" fillOpacity="0.4" />
            <line x1="47" y1="50" x2="53" y2="50" stroke="#0F172A" strokeWidth="3" />
            <circle cx="39" cy="50" r="3" fill="#0F172A" />
            <circle cx="61" cy="50" r="3" fill="#0F172A" />
            {/* Smile */}
            <path d="M45 68 Q50 72 55 68" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'cool_alman':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Hair */}
            <path d="M26 40 C28 22 72 22 74 40 L70 30 C50 24 40 28 26 40 Z" fill="#64748B" stroke="#0F172A" strokeWidth="3" />
            {/* Head */}
            <circle cx="50" cy="54" r="30" fill="#FEF08A" stroke="#0F172A" strokeWidth="4" />
            {/* Alman Rectangular Glasses */}
            <rect x="28" y="44" width="18" height="12" rx="2" stroke="#0F172A" strokeWidth="3" fill="#E2E8F0" fillOpacity="0.7" />
            <rect x="54" y="44" width="18" height="12" rx="2" stroke="#0F172A" strokeWidth="3" fill="#E2E8F0" fillOpacity="0.7" />
            <line x1="46" y1="50" x2="54" y2="50" stroke="#0F172A" strokeWidth="3" />
            <circle cx="37" cy="50" r="3" fill="#0F172A" />
            <circle cx="63" cy="50" r="3" fill="#0F172A" />
            {/* Serious / correct mouth */}
            <line x1="42" y1="68" x2="58" y2="68" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            {/* Collar & Tie */}
            <path d="M42 84 L50 74 L58 84" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
            <polygon points="48,77 52,77 54,90 50,96 46,90" fill="#DC2626" stroke="#0F172A" strokeWidth="2" />
          </svg>
        );

      case 'party_kartoffel':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Party Cone Hat */}
            <polygon points="50,6 34,34 66,34" fill="#EC4899" stroke="#0F172A" strokeWidth="3" />
            <circle cx="50" cy="6" r="4" fill="#FACC15" />
            {/* Potato Body */}
            <path d="M26 50 C24 32 40 28 60 30 C78 32 80 50 76 68 C72 82 48 84 32 78 C24 72 26 60 26 50 Z" fill="#F59E0B" stroke="#0F172A" strokeWidth="4" />
            {/* Freckles */}
            <circle cx="34" cy="46" r="2" fill="#B45309" />
            <circle cx="68" cy="48" r="2" fill="#B45309" />
            <circle cx="48" cy="72" r="2" fill="#B45309" />
            {/* Big Party Eyes */}
            <circle cx="42" cy="48" r="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
            <circle cx="44" cy="48" r="3" fill="#0F172A" />
            <circle cx="58" cy="48" r="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
            <circle cx="60" cy="48" r="3" fill="#0F172A" />
            {/* Huge Open Smile */}
            <path d="M40 60 Q50 74 62 60 Z" fill="#EF4444" stroke="#0F172A" strokeWidth="3" />
          </svg>
        );

      case 'nord_kapitaen':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Captain Hat */}
            <ellipse cx="50" cy="28" rx="28" ry="12" fill="#1E293B" stroke="#0F172A" strokeWidth="3.5" />
            <path d="M28 28 L34 16 L66 16 L72 28 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
            <circle cx="50" cy="22" r="4" fill="#F59E0B" />
            {/* Head */}
            <circle cx="50" cy="56" r="30" fill="#FED7AA" stroke="#0F172A" strokeWidth="4" />
            {/* White Sailor Beard */}
            <path d="M28 58 C28 84 72 84 72 58" fill="#F8FAFC" stroke="#0F172A" strokeWidth="3" />
            {/* Wink eye + Normal eye */}
            <path d="M36 50 Q40 44 44 50" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="49" r="4" fill="#0F172A" />
            {/* Pipe */}
            <path d="M40 68 L30 70 L28 62 L22 62 L24 74 L38 72 Z" fill="#78350F" stroke="#0F172A" strokeWidth="2" />
          </svg>
        );

      default:
        return <span className="select-none">{meta.emoji}</span>;
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl ${meta.bg} border-black shadow-[3px_3px_0px_#000000] ${sizeClasses} ${className} ${
        animate ? 'animate-bounce' : ''
      }`}
    >
      {renderAvatarContent()}
    </div>
  );
};
