/**
 * Zero-Canvas DOM Particle Burst Confetti
 *
 * Why DOM instead of Canvas:
 * On Android WebViews (particularly Infinix, MediaTek & Mali GPUs), HTML5 <canvas>
 * elements created dynamically by canvas-confetti render an opaque white framebuffer
 * layer over the viewport, causing intermittent white-screen bugs on correct answers/streaks.
 *
 * This implementation uses lightweight DOM elements animated via CSS Transforms / Web Animations,
 * guaranteeing ZERO white canvas flashes, perfect 60fps performance, and automatic DOM cleanup.
 */

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#05FFA1', // Neon Mint
  '#FF71CE', // Neon Pink
  '#01CDFE', // Neon Cyan
  '#FFF700', // Neon Yellow
  '#B967FF', // Neon Purple
  '#FF5E36', // Coral
];

export function fireConfetti(options?: ConfettiOptions): void {
  if (typeof document === 'undefined') return;

  const count = Math.min(options?.particleCount || 40, 60);
  const originX = (options?.origin?.x ?? 0.5) * window.innerWidth;
  const originY = (options?.origin?.y ?? 0.6) * window.innerHeight;
  const colors = options?.colors || DEFAULT_COLORS;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '99999';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.floor(Math.random() * 8) + 6; // 6-14px
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const velocity = Math.random() * 250 + 150; // Distance
    const targetX = Math.cos(angle) * velocity;
    const targetY = Math.sin(angle) * velocity + Math.random() * 100; // gravity effect
    const rotation = Math.random() * 720 - 360;

    particle.style.position = 'absolute';
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${Math.random() > 0.5 ? size : size * 1.5}px`;
    particle.style.backgroundColor = color;
    particle.style.borderRadius = Math.random() > 0.4 ? '2px' : '50%';
    particle.style.pointerEvents = 'none';
    particle.style.willChange = 'transform, opacity';
    container.appendChild(particle);

    if (typeof particle.animate === 'function') {
      const anim = particle.animate(
        [
          {
            transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
            opacity: 1,
          },
          {
            transform: `translate3d(${targetX * 0.6}px, ${targetY * 0.4}px, 0) rotate(${rotation * 0.5}deg) scale(1.1)`,
            opacity: 0.9,
            offset: 0.4,
          },
          {
            transform: `translate3d(${targetX}px, ${targetY + 200}px, 0) rotate(${rotation}deg) scale(0.6)`,
            opacity: 0,
          },
        ],
        {
          duration: Math.random() * 400 + 800, // 800-1200ms
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          fill: 'forwards',
        }
      );

      anim.onfinish = () => {
        particle.remove();
      };
    }
  }

  // Self cleanup entire container after 1.5s
  setTimeout(() => {
    container.remove();
  }, 1500);
}

export default fireConfetti;
