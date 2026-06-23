'use client';

import { useMemo } from 'react';

type CatMood = 'neutral' | 'happy' | 'sad' | 'excited' | 'sleepy' | 'surprised' | 'proud';

interface CuteCatProps {
  mood: CatMood;
  wpm?: number;
  accuracy?: number;
}

const TIPS: Record<CatMood, string> = {
  neutral: "Meow... Keep typing!",
  happy: "Purry good! You're doing great!",
  sad: "Oh no! Take your time, you got this!",
  excited: "Amazing! You're on fire today!",
  sleepy: "Don't give up! I believe in you!",
  surprised: "Wow! Look at you go!",
  proud: "You did it! I'm so proud! 🐱",
};

export default function CuteCat({ mood, wpm, accuracy }: CuteCatProps) {
  const face = useMemo(() => {
    const cx = 100;
    const cy = 100;
    const baseColor = '#f5e6d3';
    const darkColor = '#5a3e2b';

    const eyes = () => {
      switch (mood) {
        case 'happy':
        case 'proud':
          return (
            <g>
              <path d="M 65 85 Q 75 75 85 85" fill="none" stroke={darkColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 115 85 Q 125 75 135 85" fill="none" stroke={darkColor} strokeWidth="2.5" strokeLinecap="round" />
            </g>
          );
        case 'sad':
          return (
            <g>
              <circle cx="75" cy="82" r="7" fill={darkColor} />
              <circle cx="125" cy="82" r="7" fill={darkColor} />
              <circle cx="73" cy="80" r="3" fill="white" />
              <circle cx="123" cy="80" r="3" fill="white" />
              <ellipse cx="75" cy="96" rx="6" ry="3" fill="#e8c4b0" opacity="0.6" />
              <ellipse cx="125" cy="96" rx="6" ry="3" fill="#e8c4b0" opacity="0.6" />
            </g>
          );
        case 'excited':
          return (
            <g>
              <circle cx="75" cy="80" r="10" fill={darkColor} />
              <circle cx="125" cy="80" r="10" fill={darkColor} />
              <circle cx="73" cy="77" r="4.5" fill="white" />
              <circle cx="123" cy="77" r="4.5" fill="white" />
              <circle cx="72" cy="75" r="2" fill="white" />
              <circle cx="122" cy="75" r="2" fill="white" />
            </g>
          );
        case 'sleepy':
          return (
            <g>
              <line x1="65" y1="85" x2="85" y2="85" stroke={darkColor} strokeWidth="3" strokeLinecap="round" />
              <line x1="115" y1="85" x2="135" y2="85" stroke={darkColor} strokeWidth="3" strokeLinecap="round" />
            </g>
          );
        case 'surprised':
          return (
            <g>
              <circle cx="75" cy="80" r="9" fill="white" stroke={darkColor} strokeWidth="2" />
              <circle cx="125" cy="80" r="9" fill="white" stroke={darkColor} strokeWidth="2" />
              <circle cx="75" cy="80" r="5" fill={darkColor} />
              <circle cx="125" cy="80" r="5" fill={darkColor} />
              <circle cx="73" cy="78" r="2" fill="white" />
              <circle cx="123" cy="78" r="2" fill="white" />
            </g>
          );
        default:
          return (
            <g>
              <circle cx="75" cy="82" r="7" fill={darkColor} />
              <circle cx="125" cy="82" r="7" fill={darkColor} />
              <circle cx="73" cy="80" r="2.5" fill="white" />
              <circle cx="123" cy="80" r="2.5" fill="white" />
            </g>
          );
      }
    };

    const mouth = () => {
      switch (mood) {
        case 'happy':
        case 'proud':
          return <path d="M 85 108 Q 100 120 115 108" fill="none" stroke={darkColor} strokeWidth="2" strokeLinecap="round" />;
        case 'sad':
          return <path d="M 85 118 Q 100 108 115 118" fill="none" stroke={darkColor} strokeWidth="2" strokeLinecap="round" />;
        case 'excited':
          return <ellipse cx="100" cy="112" rx="12" ry="8" fill={darkColor} />;
        case 'surprised':
          return <ellipse cx="100" cy="112" rx="6" ry="8" fill={darkColor} />;
        case 'sleepy':
          return <path d="M 88 110 Q 100 104 112 110" fill="none" stroke={darkColor} strokeWidth="2" strokeLinecap="round" />;
        default:
          return <path d="M 88 110 Q 100 114 112 110" fill="none" stroke={darkColor} strokeWidth="2" strokeLinecap="round" />;
      }
    };

    const blush = () => {
      if (mood === 'happy' || mood === 'proud' || mood === 'excited') {
        return (
          <g>
            <ellipse cx="58" cy="100" rx="9" ry="5" fill="#ffb3b3" opacity="0.5" />
            <ellipse cx="142" cy="100" rx="9" ry="5" fill="#ffb3b3" opacity="0.5" />
          </g>
        );
      }
      return null;
    };

    const teardrop = () => {
      if (mood === 'sad') {
        return (
          <g>
            <path d="M 65 70 Q 62 76 65 80 Q 68 76 65 70 Z" fill="#88c0ff" opacity="0.7" />
          </g>
        );
      }
      return null;
    };

    const zzz = () => {
      if (mood === 'sleepy') {
        return (
          <g>
            <text x="148" y="55" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#5a3e2b" opacity="0.4">z</text>
            <text x="156" y="48" fontSize="12" fontFamily="monospace" fontWeight="bold" fill="#5a3e2b" opacity="0.5">z</text>
            <text x="166" y="39" fontSize="14" fontFamily="monospace" fontWeight="bold" fill="#5a3e2b" opacity="0.6">Z</text>
          </g>
        );
      }
      return null;
    };

    const sparkle = () => {
      if (mood === 'excited' || mood === 'surprised') {
        return (
          <g>
            <text x="50" y="55" fontSize="14" opacity="0.6">✦</text>
            <text x="148" y="50" fontSize="10" opacity="0.5">✧</text>
          </g>
        );
      }
      return null;
    };

    const earLeft = (
      <polygon points="40,68 55,20 70,68" fill={baseColor} stroke={darkColor} strokeWidth="2.5" strokeLinejoin="round" />
    );
    const earLeftInner = (
      <polygon points="47,63 55,30 63,63" fill="#e8c4b0" stroke="none" />
    );
    const earRight = (
      <polygon points="130,68 145,20 160,68" fill={baseColor} stroke={darkColor} strokeWidth="2.5" strokeLinejoin="round" />
    );
    const earRightInner = (
      <polygon points="137,63 145,30 153,63" fill="#e8c4b0" stroke="none" />
    );
    const faceOutline = (
      <circle cx={cx} cy={cy} r="60" fill={baseColor} stroke={darkColor} strokeWidth="2.5" />
    );
    const nose = (
      <polygon points="97,100 103,100 100,105" fill="#ff8a8a" stroke="none" />
    );
    const whiskerLeft = (
      <g stroke={darkColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
        <line x1="42" y1="98" x2="18" y2="94" />
        <line x1="42" y1="104" x2="16" y2="104" />
        <line x1="42" y1="110" x2="18" y2="114" />
      </g>
    );
    const whiskerRight = (
      <g stroke={darkColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
        <line x1="158" y1="98" x2="182" y2="94" />
        <line x1="158" y1="104" x2="184" y2="104" />
        <line x1="158" y1="110" x2="182" y2="114" />
      </g>
    );

    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {zzz()}
        {sparkle()}
        {earLeft}
        {earLeftInner}
        {earRight}
        {earRightInner}
        {whiskerLeft}
        {whiskerRight}
        {faceOutline}
        {blush()}
        {teardrop()}
        {eyes()}
        {nose}
        {mouth()}
      </svg>
    );
  }, [mood]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24">
        {face}
      </div>
      <p className="mt-1 text-xs font-hand text-pencil/50 text-center leading-tight min-h-[2em]">
        {TIPS[mood]}
      </p>
    </div>
  );
}
