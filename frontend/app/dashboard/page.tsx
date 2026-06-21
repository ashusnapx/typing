'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Navbar } from '@/components/layout/navbar';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  FileText,
  Gauge,
  Target,
  Zap,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Brain,
  Sparkles,
  Timer,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };

export default function DashboardPage() {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 border-[3px] border-pencil border-t-accent animate-spin"
             style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 -rotate-1">
          <h1 className="text-3xl font-bold text-pencil font-marker">
            Hey, {user.full_name}!
          </h1>
          <p className="text-lg text-pencil/60 font-hand mt-1">Track your SSC typing preparation</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: analytics?.total_tests || 0, label: 'Tests Taken', icon: <FileText className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-1' },
            { value: analytics?.avg_wpm?.toFixed(1) || 0, label: 'Avg WPM', icon: <Gauge className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
            { value: `${analytics?.avg_accuracy?.toFixed(1) || 0}%`, label: 'Avg Accuracy', icon: <Target className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-2' },
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

        {/* Qualification Prediction */}
        {predictions && (
          <div className="bg-postit border-2 border-pencil shadow-hard p-6 mb-8 -rotate-[0.3deg] hover:rotate-0 transition-transform relative">
            <div className="tack" />
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-pencil" strokeWidth={3} />
              <h2 className="text-xl font-bold text-pencil font-marker">Qualification Prediction</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white border-2 border-pencil p-4 shadow-hard-sm"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <div className="text-sm text-pencil/60 font-hand">SSC CHSL</div>
                <div className="text-3xl font-bold text-pencil font-marker mt-1">
                  {predictions.chsl_qualification_probability}%
                </div>
                <div className="text-xs text-pencil/50 font-hand mt-1">
                  Trend: {predictions.wpm_trend}
                </div>
              </div>
              <div className="bg-white border-2 border-pencil p-4 shadow-hard-sm"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <div className="text-sm text-pencil/60 font-hand">SSC CGL DEST</div>
                <div className="text-3xl font-bold text-pencil font-marker mt-1">
                  {predictions.cgl_dest_qualification_probability}%
                </div>
                <div className="text-xs text-pencil/50 font-hand mt-1">
                  Trend: {predictions.accuracy_trend}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { href: '/exam/chsl', title: 'SSC CHSL Practice', desc: '10 min, 35 WPM target', icon: <Target className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-1' },
            { href: '/exam/mock', title: 'Mock Test', desc: 'Full exam simulation', icon: <Timer className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
            { href: '/coach', title: 'AI Coach', desc: 'Personalized feedback', icon: <Brain className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-2' },
          ].map((action) => (
            <Link key={action.title} href={action.href}
                  className="bg-white border-2 border-pencil shadow-hard-sm p-4 hover:shadow-hard transition-all duration-100 group"
                  style={{ borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px', transform: `rotate(${action.rotate})` }}>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 flex items-center justify-center border-2 border-pencil bg-muted"
                     style={wobbly}>{action.icon}</div>
                <h3 className="font-bold text-pencil font-marker">{action.title}</h3>
              </div>
              <p className="text-sm text-pencil/60 font-hand">{action.desc}</p>
              <div className="mt-2 flex items-center text-sm font-hand text-pencil/40 group-hover:text-pencil transition-colors">
                Go <ArrowRight className="w-3 h-3 ml-1" strokeWidth={3} />
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Tests */}
        <div className="bg-white border-2 border-pencil shadow-hard-sm">
          <div className="px-6 py-4 border-b-2 border-pencil flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-pencil" strokeWidth={3} />
            <h2 className="text-lg font-bold text-pencil font-marker">Recent Tests</h2>
          </div>
          <div className="divide-y-2 divide-pencil/20">
            {recentTests.length === 0 ? (
              <div className="p-6 text-center font-hand text-pencil/50">
                No tests taken yet. Start your first test!
              </div>
            ) : (
              recentTests.slice(0, 10).map((test: any) => (
                <div key={test.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
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
      </main>
    </div>
  );
}
