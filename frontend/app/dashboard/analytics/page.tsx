'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { FullPageLoader } from '@/components/ui/loading-logo';
import Link from 'next/link';
import {
  FileText,
  Gauge,
  Target,
  Zap,
  TrendingUp,
  ArrowLeft,
  BarChart3,
  Sparkles,
  Timer,
  CheckCircle2,
  XCircle,
  Brain,
} from 'lucide-react';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };

export default function AnalyticsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (isAuthenticated) {
      api.getAnalyticsOverview().then(setAnalytics).catch(() => {});
      api.getRecentScores().then(setRecentTests).catch(() => {});
      api.getPredictions().then(setPredictions).catch(() => {});
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !user) {
    return <FullPageLoader />;
  }

  const avgWpm = analytics?.avg_wpm || 0;
  const avgAcc = analytics?.avg_accuracy || 0;
  const totalTests = analytics?.total_tests || 0;
  const bestWpm = analytics?.best_wpm || 0;
  const bestAcc = analytics?.best_accuracy || 0;

  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center border-2 border-pencil hover:bg-muted transition-colors"
                style={wobbly}>
            <ArrowLeft className="w-5 h-5 text-pencil" strokeWidth={3} />
          </Link>
          <div className="-rotate-1">
            <h1 className="text-3xl font-bold text-pencil font-marker">Typing Analytics</h1>
            <p className="text-lg text-pencil/60 font-hand mt-1">Deep dive into your typing performance</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: totalTests, label: 'Tests Taken', icon: <FileText className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-1' },
            { value: avgWpm.toFixed(1), label: 'Avg WPM', icon: <Gauge className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
            { value: `${avgAcc.toFixed(1)}%`, label: 'Avg Accuracy', icon: <Target className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-2' },
            { value: user.xp, label: `XP (Lvl ${user.level})`, icon: <Zap className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
          ].map((stat) => (
            <div key={stat.label}
                 className="bg-white border-2 border-pencil shadow-hard-sm p-4 text-center hover:shadow-hard transition-all duration-100"
                 style={{ borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px', transform: `rotate(${stat.rotate})` }}>
              <div className="flex justify-center mb-2 text-pencil">{stat.icon}</div>
              <div className="text-2xl font-bold text-pencil font-marker">{stat.value}</div>
              <div className="text-sm text-pencil/60 font-hand mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Best Scores */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-postit border-2 border-pencil shadow-hard-sm p-4 -rotate-[0.3deg] hover:rotate-0 transition-transform">
            <div className="tape" />
            <div className="flex items-center space-x-2 mb-3">
              <Gauge className="w-5 h-5 text-pencil" strokeWidth={3} />
              <h2 className="text-lg font-bold text-pencil font-marker">Best WPM</h2>
            </div>
            <div className="text-5xl font-bold text-pencil font-marker">{bestWpm.toFixed(1)}</div>
            <div className="text-base text-pencil/60 font-hand mt-1">words per minute</div>
          </div>
          <div className="bg-postit border-2 border-pencil shadow-hard-sm p-4 rotate-[0.3deg] hover:rotate-0 transition-transform">
            <div className="tape" />
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5 text-pencil" strokeWidth={3} />
              <h2 className="text-lg font-bold text-pencil font-marker">Best Accuracy</h2>
            </div>
            <div className="text-5xl font-bold text-pencil font-marker">{bestAcc.toFixed(1)}%</div>
            <div className="text-base text-pencil/60 font-hand mt-1">percent accurate</div>
          </div>
        </div>

        {/* Qualification Prediction */}
        {predictions && (
          <div className="bg-white border-2 border-pencil shadow-hard p-6 mb-8 -rotate-[0.3deg] hover:rotate-0 transition-transform relative">
            <div className="tack" />
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-pencil" strokeWidth={3} />
              <h2 className="text-xl font-bold text-pencil font-marker">Qualification Prediction</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-paper border-2 border-pencil p-4 shadow-hard-sm"
                   style={wobbly}>
                <div className="text-sm text-pencil/60 font-hand">SSC CHSL</div>
                <div className="text-3xl font-bold text-pencil font-marker mt-1">
                  {predictions.chsl_qualification_probability}%
                </div>
                <div className="text-xs text-pencil/50 font-hand mt-1">
                  Trend: {predictions.wpm_trend} | Consistency: {predictions.consistency_score}
                </div>
              </div>
              <div className="bg-paper border-2 border-pencil p-4 shadow-hard-sm"
                   style={wobbly}>
                <div className="text-sm text-pencil/60 font-hand">SSC CGL DEST</div>
                <div className="text-3xl font-bold text-pencil font-marker mt-1">
                  {predictions.cgl_dest_qualification_probability}%
                </div>
                <div className="text-xs text-pencil/50 font-hand mt-1">
                  Trend: {predictions.accuracy_trend}
                </div>
              </div>
            </div>
            {predictions.recommendation && (
              <div className="p-3 bg-postit border-2 border-pencil" style={wobbly}>
                <div className="flex items-start space-x-2">
                  <Brain className="w-5 h-5 text-pencil mt-0.5" strokeWidth={3} />
                  <p className="text-base text-pencil font-hand">{predictions.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Tests History */}
        <div className="bg-white border-2 border-pencil shadow-hard-sm">
          <div className="px-6 py-4 border-b-2 border-pencil flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-pencil" strokeWidth={3} />
            <h2 className="text-lg font-bold text-pencil font-marker">Test History</h2>
          </div>
          <div className="divide-y-2 divide-pencil/20">
            {recentTests.length === 0 ? (
              <div className="p-6 text-center font-hand text-pencil/50">
                No tests taken yet.{' '}
                <Link href="/exam/practice" className="text-blue-pen font-bold hover:underline">Start your first test</Link>
              </div>
            ) : (
              recentTests.map((test: any, idx: number) => (
                <div key={test.id} className={`px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors ${idx % 2 === 0 ? 'bg-paper' : 'bg-white'}`}>
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-4 h-4 text-pencil/40" strokeWidth={2.5} />
                    <div>
                      <span className="font-bold text-pencil font-hand">
                        {test.mode?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="ml-2 text-sm text-pencil/50 font-hand">
                        {test.date ? new Date(test.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-base font-hand">
                    <span className="font-mono font-bold text-pencil">{test.wpm?.toFixed(1)} WPM</span>
                    <span className="font-mono text-pencil/70">{test.accuracy?.toFixed(1)}%</span>
                    {test.qualified
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={3} />
                      : <XCircle className="w-5 h-5 text-accent" strokeWidth={3} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <Link href="/exam/practice"
                className="bg-white border-2 border-pencil shadow-hard-sm p-4 hover:shadow-hard transition-all duration-100 text-center -rotate-1"
                style={{ borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px' }}>
            <Timer className="w-6 h-6 text-pencil mx-auto mb-2" strokeWidth={3} />
            <span className="font-bold text-pencil font-hand">Practice Mode</span>
          </Link>
          <Link href="/coach"
                className="bg-white border-2 border-pencil shadow-hard-sm p-4 hover:shadow-hard transition-all duration-100 text-center rotate-1"
                style={{ borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px' }}>
            <Brain className="w-6 h-6 text-pencil mx-auto mb-2" strokeWidth={3} />
            <span className="font-bold text-pencil font-hand">AI Coach</span>
          </Link>
          <Link href="/leaderboard"
                className="bg-white border-2 border-pencil shadow-hard-sm p-4 hover:shadow-hard transition-all duration-100 text-center -rotate-2"
                style={{ borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px' }}>
            <TrendingUp className="w-6 h-6 text-pencil mx-auto mb-2" strokeWidth={3} />
            <span className="font-bold text-pencil font-hand">Leaderboard</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
