/**
 * WebCursorGlow
 * Renders a crisp, defined spotlight and focal point that precisely tracks
 * the user's cursor on desktop and finger position on mobile/touch screens.
 * Only the exact element and position under the user's finger/cursor glows.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export function WebCursorGlow() {
  const { scheme } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const isDark = scheme === 'dark';
    const primaryGlow = isDark ? 'rgba(0, 229, 255, 0.28)' : 'rgba(135, 169, 107, 0.32)';
    const midGlow = isDark ? 'rgba(59, 10, 107, 0.15)' : 'rgba(213, 133, 31, 0.12)';
    const coreBorder = isDark ? 'rgba(0, 229, 255, 0.55)' : 'rgba(135, 169, 107, 0.65)';
    const hoverBorder = isDark ? 'rgba(0, 229, 255, 0.45)' : 'rgba(135, 169, 107, 0.45)';
    const hoverShadow = isDark
      ? '0 6px 20px -2px rgba(0, 229, 255, 0.22)'
      : '0 6px 20px -2px rgba(135, 169, 107, 0.22)';

    // 1. Inject or update interactive hover/focus definition CSS
    let style = document.getElementById('medfind-cursor-styles') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'medfind-cursor-styles';
      document.head.appendChild(style);
    }
    style.textContent = `
      /* Crisp definition on interactive elements */
      div[role="button"]:hover,
      button:hover,
      [data-testid*="-btn"]:hover {
        transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, border-color 0.18s ease !important;
        box-shadow: ${hoverShadow} !important;
      }
      div[role="button"]:active,
      button:active {
        transform: scale(0.985);
      }
      /* Smooth definition for text inputs */
      input:focus,
      textarea:focus {
        outline: none !important;
        border-color: ${hoverBorder} !important;
        box-shadow: 0 0 0 3px ${isDark ? 'rgba(0, 229, 255, 0.16)' : 'rgba(135, 169, 107, 0.2)'} !important;
      }
    `;

    // 2. Create the defined cursor/finger tracker
    let glow = document.getElementById('medfind-cursor-glow') as HTMLDivElement | null;
    if (!glow) {
      glow = document.createElement('div');
      glow.id = 'medfind-cursor-glow';
      document.body.appendChild(glow);
    }

    glow.style.cssText = `
      position: fixed;
      pointer-events: none;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: radial-gradient(circle, ${primaryGlow} 0%, ${midGlow} 38%, transparent 70%);
      transform: translate(-50%, -50%) scale(0.9);
      z-index: 99999;
      opacity: 0;
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: left, top, opacity, transform;
    `;

    // Inner defined core for razor-sharp precision
    let core = document.getElementById('medfind-cursor-core') as HTMLDivElement | null;
    if (!core) {
      core = document.createElement('div');
      core.id = 'medfind-cursor-core';
      glow.appendChild(core);
    }
    core.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 22px;
      height: 22px;
      margin-left: -11px;
      margin-top: -11px;
      border-radius: 50%;
      border: 1.5px solid ${coreBorder};
      background: ${isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(135, 169, 107, 0.2)'};
      box-shadow: 0 0 8px ${primaryGlow};
      pointer-events: none;
    `;

    let rafId: number;
    let targetX = -999;
    let targetY = -999;
    let currentX = -999;
    let currentY = -999;

    const animate = () => {
      currentX += (targetX - currentX) * 0.3;
      currentY += (targetY - currentY) * 0.3;
      if (glow) {
        glow.style.left = `${currentX}px`;
        glow.style.top = `${currentY}px`;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (glow) {
        glow.style.opacity = '1';
        glow.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    };

    const onMouseLeave = () => {
      if (glow) {
        glow.style.opacity = '0';
        glow.style.transform = 'translate(-50%, -50%) scale(0.8)';
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        targetX = touch.clientX;
        targetY = touch.clientY;
        currentX = targetX;
        currentY = targetY;
        if (glow) {
          glow.style.opacity = '1';
          glow.style.transform = 'translate(-50%, -50%) scale(1.15)';
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        targetX = touch.clientX;
        targetY = touch.clientY;
        if (glow) {
          glow.style.opacity = '1';
          glow.style.transform = 'translate(-50%, -50%) scale(1.15)';
        }
      }
    };

    const onTouchEnd = () => {
      if (glow) {
        glow.style.opacity = '0';
        glow.style.transform = 'translate(-50%, -50%) scale(0.85)';
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [scheme]);

  return null;
}
