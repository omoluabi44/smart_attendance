import React from 'react';
import { montserrat, jetbrainsMono } from '@/app/ui/fonts';

interface FacePassLogoProps {
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export default function FacePassLogo({
  theme = 'light',
  size = 'md',
  showBadge = true,
}: FacePassLogoProps) {
  const isDark = theme === 'dark';

  const boxSizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="inline-flex items-center gap-3 select-none group">
      {/* Biometric Face Reticle Emblem */}
      <div
        className={`relative flex items-center justify-center ${boxSizes[size]} ${
          isDark
            ? 'bg-obsidian-900 border border-blue-400/35 shadow-[0_0_20px_-5px_rgba(0,123,255,0.45)]'
            : 'bg-blue-500 border border-blue-600 shadow-sm shadow-blue-500/25'
        } transition-transform duration-300 group-hover:scale-[1.03]`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          className="w-3/5 h-3/5"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Corner Vision Reticles */}
          <path
            d="M4 11V6C4 4.89543 4.89543 4 6 4H11"
            stroke={isDark ? '#3395FF' : '#FFFFFF'}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M25 4H30C31.1046 4 32 4.89543 32 6V11"
            stroke={isDark ? '#3395FF' : '#FFFFFF'}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M4 25V30C4 31.1046 4.89543 32 6 32H11"
            stroke={isDark ? '#3395FF' : '#FFFFFF'}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M32 25V30C32 31.1046 31.1046 32 30 32H25"
            stroke={isDark ? '#3395FF' : '#FFFFFF'}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Biometric Nodes & Mesh */}
          <circle cx="13.5" cy="14.5" r="1.6" fill="#FFFFFF" />
          <circle cx="22.5" cy="14.5" r="1.6" fill="#FFFFFF" />
          <path
            d="M18 14.5V19.5L16.5 20.5"
            stroke={isDark ? '#ADD5FF' : '#D6EAFF'}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.5 24C14.8 25.4 16.3 26 18 26C19.7 26 21.2 25.4 22.5 24"
            stroke={isDark ? '#3395FF' : '#FFFFFF'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Laser Horizontal Scan Line */}
          <line
            x1="7"
            y1="18"
            x2="29"
            y2="18"
            stroke={isDark ? '#70B5FF' : '#D6EAFF'}
            strokeWidth="1"
            strokeDasharray="2 2"
            strokeOpacity="0.85"
          />
        </svg>
      </div>

      {/* Brand Wordmark & Vision Pill */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`${montserrat.className} ${textSizes[size]} font-extrabold tracking-tight leading-none ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}
          >
            face<span className={isDark ? 'text-blue-400' : 'text-blue-500'}>Pass</span>
          </span>
          {showBadge && (
            <span
              className={`${jetbrainsMono.className} text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                isDark
                  ? 'bg-blue-500/15 text-blue-300 border-blue-400/30'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}
            >
              SMART
            </span>
          )}
        </div>
        <span
          className={`${jetbrainsMono.className} text-[10px] tracking-wider uppercase mt-0.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Lecturer Portal
        </span>
      </div>
    </div>
  );
}
