'use client';

import { CSS } from '@/lib/config';
import { Target, Flame, Clock, Zap } from 'lucide-react';

interface DailyFocusProps {
  weakestKeys?: string[];
  streak?: number;
  todayMinutes?: number;
  onStartDrill?: (key: string) => void;
}

const DAILY_GOAL_MINUTES = 30;

function getMotivationalMessage(streak: number): string {
  if (streak >= 30) return "Legendary streak! You're unstoppable!";
  if (streak >= 21) return "21+ days! You've built a powerful habit!";
  if (streak >= 14) return "Two weeks strong! Muscle memory is forming!";
  if (streak >= 7) return "One week streak! Consistency is key!";
  if (streak >= 3) return "3 days in a row! Keep the momentum!";
  if (streak >= 1) return "Great start! Come back tomorrow too!";
  return "Start your streak today and build momentum!";
}

export function DailyFocus({
  weakestKeys = [],
  streak = 0,
  todayMinutes = 0,
  onStartDrill,
}: DailyFocusProps) {
  const progressPct = Math.min(100, Math.round((todayMinutes / DAILY_GOAL_MINUTES) * 100));
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div
      className="bg-paper border-2 border-pencil/20 p-4 shadow-hard-sm space-y-4"
      style={{ borderRadius: CSS.radii.md }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 border-2 border-amber-300 flex items-center justify-center" style={{ borderRadius: CSS.radii.sm }}>
          <Target className="w-4 h-4 text-amber-600" strokeWidth={3} />
        </div>
        <div>
          <h3 className="font-marker text-base text-pencil leading-none">Today's Focus</h3>
          <p className="text-[10px] font-hand text-pencil/50 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2 bg-postit border-2 border-pencil/15 p-3" style={{ borderRadius: CSS.radii.sm }}>
        <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} strokeWidth={2.5} fill={streak > 0 ? 'currentColor' : 'none'} />
        <div>
          <span className="font-marker text-lg text-pencil">{streak}</span>
          <span className="text-xs font-hand text-pencil/50 ml-1">day streak</span>
        </div>
      </div>

      {/* Practice time ring */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-blue-500 transition-all duration-500"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-marker text-lg text-pencil">{todayMinutes}</span>
            <span className="text-[9px] font-hand text-pencil/40">min</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-marker text-pencil">Daily Goal</div>
          <div className="text-[10px] font-hand text-pencil/50 mb-1">{todayMinutes} / {DAILY_GOAL_MINUTES} minutes</div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[10px] font-hand text-pencil/50 mt-2 italic">
            {getMotivationalMessage(streak)}
          </p>
        </div>
      </div>

      {/* Weakest keys */}
      {weakestKeys.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Zap className="w-3 h-3 text-red-400" strokeWidth={3} />
            <span className="text-[10px] font-marker text-pencil/60 uppercase tracking-wider">Weak Keys</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {weakestKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onStartDrill?.(key)}
                className="px-2.5 py-1 border-2 border-red-300 bg-red-50 text-red-700 font-marker text-xs hover:bg-red-100 hover:shadow-hard-sm transition-all"
                style={{ borderRadius: CSS.radii.sm }}
              >
                {key === ' ' ? '␣ Space' : key}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Practice button */}
      <button
        type="button"
        onClick={() => onStartDrill?.('quick')}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white border-2 border-blue-600 font-marker text-sm shadow-hard-sm hover:bg-blue-600 active:translate-y-0.5 transition-all"
        style={{ borderRadius: CSS.radii.sm }}
      >
        <Clock className="w-4 h-4" strokeWidth={3} />
        Quick Practice
      </button>
    </div>
  );
}
