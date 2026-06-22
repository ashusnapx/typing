'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cacheGet, cacheSet } from '@/lib/dashboard-cache';
import { Trophy, Medal, Gauge, Target, FileText, Zap } from 'lucide-react';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [scope, setScope] = useState('global');

  useEffect(() => {
    const cacheKey = `leaderboard-${scope}`;
    const cached = cacheGet<any>(cacheKey);
    if (cached) {
      setLeaderboard(cached);
    }
    if (!cached) {
      api.getLeaderboard(scope).then((data) => {
        setLeaderboard(data);
        cacheSet(cacheKey, data, 2 * 60 * 1000);
      }).catch(() => {});
    }
  }, [scope]);

  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center space-x-4 mb-8 -rotate-1">
          <Trophy className="w-8 h-8 text-accent" strokeWidth={3} />
          <h1 className="text-3xl font-bold text-pencil font-marker">Leaderboard</h1>
        </div>

        <div className="flex space-x-2 mb-6">
          {['global', 'state', 'college'].map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-4 py-2 border-[3px] border-pencil font-hand text-base transition-all duration-100 ${
                scope === s
                  ? 'bg-pencil text-paper shadow-hard-sm'
                  : 'bg-white text-pencil shadow-hard-sm hover:shadow-hard'
              }`}
              style={wobbly}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-white border-2 border-pencil shadow-hard-sm">
          <div className="px-6 py-4 border-b-2 border-pencil bg-muted/30">
            <div className="grid grid-cols-12 gap-4 text-sm font-bold text-pencil/60 font-hand uppercase tracking-wider">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-2 text-right">WPM</div>
              <div className="col-span-2 text-right">Accuracy</div>
              <div className="col-span-2 text-right">Tests</div>
              <div className="col-span-1 text-right">XP</div>
            </div>
          </div>
          <div className="divide-y-2 divide-pencil/20">
            {leaderboard?.entries?.map((entry: any) => (
              <div key={entry.rank} className="px-6 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/30 transition-colors">
                <div className="col-span-1">
                  {entry.rank <= 3 ? (
                    <Medal className={`w-6 h-6 ${
                      entry.rank === 1 ? 'text-yellow-500' :
                      entry.rank === 2 ? 'text-gray-400' : 'text-orange-600'
                    }`} strokeWidth={3} fill="currentColor" />
                  ) : (
                    <span className="font-bold text-pencil/50 font-hand text-lg">{entry.rank}</span>
                  )}
                </div>
                <div className="col-span-4 font-bold text-pencil font-hand truncate flex items-center space-x-2">
                  <span>{entry.full_name}</span>
                  {entry.college && (
                    <span className="text-xs text-pencil/40 font-hand truncate">{entry.college}</span>
                  )}
                </div>
                <div className="col-span-2 text-right font-bold text-pencil font-marker">
                  {entry.best_wpm?.toFixed(1)}
                </div>
                <div className="col-span-2 text-right font-semibold text-pencil/70 font-hand">
                  {entry.best_accuracy?.toFixed(1)}%
                </div>
                <div className="col-span-2 text-right text-pencil/60 font-hand">{entry.tests_taken}</div>
                <div className="col-span-1 text-right font-bold text-accent font-marker">{entry.xp}</div>
              </div>
            ))}
            {(!leaderboard?.entries || leaderboard.entries.length === 0) && (
              <div className="p-6 text-center font-hand text-pencil/50">No entries yet</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
