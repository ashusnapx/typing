'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { FullPageLoader } from '@/components/ui/loading-logo';
import { getRecentTestResults } from '@/lib/test-storage';
import { getCachedDashboard, setCachedDashboard, isDashboardCacheFresh, invalidateDashboardCache } from '@/lib/dashboard-cache';
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
  ChevronLeft,
  ChevronRight,
  Trophy,
  Clock,
  AlertTriangle,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [page, setPage] = useState(0);
  const perPage = 5;
  const fetched = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isAuthenticated || isLoading || fetched.current) return;
    fetched.current = true;

    const cached = getCachedDashboard();
    if (cached) {
      setAnalytics(cached.overview);
      setPredictions(cached.predictions);
      const localTests = getRecentTestResults();
      const combined = [...(cached.recent_scores || []), ...localTests]
        .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setRecentTests(combined);
      if (isDashboardCacheFresh()) return;
    }

    api.request<any>('/dashboard').then((data) => {
      setCachedDashboard(data);
      setAnalytics(data.overview);
      setPredictions(data.predictions);
      const localTests = getRecentTestResults();
      const combined = [...(data.recent_scores || []), ...localTests]
        .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setRecentTests(combined);
    }).catch(() => {
      if (!cached) {
        const localTests = getRecentTestResults();
        setRecentTests(localTests);
      }
    });
  }, [isAuthenticated, isLoading]);

  if (isLoading || !user) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-paper">
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

        {/* Performance Summary (replaces old Qualification Prediction) */}
        {predictions && (
          <div className="bg-postit border-2 border-pencil shadow-hard p-6 mb-8 -rotate-[0.3deg] hover:rotate-0 transition-transform relative">
            <div className="tack" />
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-pencil" strokeWidth={3} />
              <h2 className="text-xl font-bold text-pencil font-marker">Performance Summary</h2>
            </div>

            {/* CHSL Progress */}
            {predictions.chsl_wpm_target && (
              <div className="bg-white border-2 border-pencil p-4 shadow-hard-sm mb-4"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold font-hand text-pencil">SSC CHSL Progress</h3>
                  <div className="flex items-center gap-2 text-xs font-hand">
                    <span className="text-pencil/50">Qualification odds:</span>
                    <span className="font-bold font-mono text-pencil">{predictions.chsl_qualification_probability}%</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mb-2">
                  <div>
                    <div className="flex items-center justify-between text-xs font-hand mb-1">
                      <span className="text-pencil/60">Net WPM</span>
                      <span className="font-semibold text-pencil">
                        {predictions.recent_avg_wpm || 0}
                        <span className="text-pencil/40 font-normal"> / {predictions.chsl_wpm_target}</span>
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((predictions.recent_avg_wpm || 0) / predictions.chsl_wpm_target) * 100)}%`,
                          background: (predictions.recent_avg_wpm || 0) >= predictions.chsl_wpm_target ? '#4caf50' : '#2F5BFF'
                        }} />
                    </div>
                    {predictions.wpm_gap > 0 && (
                      <div className="text-xs text-accent font-hand mt-0.5 flex items-center gap-0.5">
                        <ArrowUp className="w-3 h-3" strokeWidth={2.5} />
                        Need +{predictions.wpm_gap} WPM more
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs font-hand mb-1">
                      <span className="text-pencil/60">Accuracy</span>
                      <span className="font-semibold text-pencil">
                        {predictions.recent_avg_accuracy || 0}%
                        <span className="text-pencil/40 font-normal"> / {predictions.chsl_acc_target}%</span>
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((predictions.recent_avg_accuracy || 0) / predictions.chsl_acc_target) * 100)}%`,
                          background: (predictions.recent_avg_accuracy || 0) >= predictions.chsl_acc_target ? '#4caf50' : '#2F5BFF'
                        }} />
                    </div>
                    {predictions.acc_gap > 0 && (
                      <div className="text-xs text-accent font-hand mt-0.5 flex items-center gap-0.5">
                        <ArrowUp className="w-3 h-3" strokeWidth={2.5} />
                        Need +{predictions.acc_gap}% accuracy more
                      </div>
                    )}
                  </div>
                </div>
                {predictions.wpm_series && predictions.wpm_series.length >= 2 && (
                  <div className="pt-2 border-t border-pencil/10">
                    <MiniChart
                      data={predictions.wpm_series}
                      color="#2F5BFF"
                      label="WPM"
                    />
                  </div>
                )}
              </div>
            )}

            {/* CGL DEST Progress */}
            <div className="bg-white border-2 border-pencil p-4 shadow-hard-sm mb-4"
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold font-hand text-pencil">SSC CGL DEST Progress</h3>
                <div className="flex items-center gap-2 text-xs font-hand">
                  <span className="text-pencil/50">Qualification odds:</span>
                  <span className="font-bold font-mono text-pencil">{predictions.cgl_dest_qualification_probability}%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-hand mb-1">
                  <span className="text-pencil/60">Accuracy (CGL focus)</span>
                  <span className="font-semibold text-pencil">
                    {predictions.recent_avg_accuracy || 0}%
                    <span className="text-pencil/40 font-normal"> / 95%</span>
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((predictions.recent_avg_accuracy || 0) / 95) * 100)}%`,
                      background: (predictions.recent_avg_accuracy || 0) >= 95 ? '#4caf50' : '#e53935'
                    }} />
                </div>
              </div>
              {predictions.accuracy_series && predictions.accuracy_series.length >= 2 && (
                <div className="pt-2 mt-2 border-t border-pencil/10">
                  <MiniChart
                    data={predictions.accuracy_series}
                    color="#e53935"
                    label="Accuracy %"
                  />
                </div>
              )}
            </div>

            {/* Bottom row: consistency + trend + recommendation */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-white border border-pencil/30 p-3 text-center"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <div className="text-xs text-pencil/50 font-hand">Consistency</div>
                <div className="text-lg font-bold font-marker text-pencil">{predictions.consistency_score?.toFixed(0) || '-'}%</div>
                <div className="text-[10px] text-pencil/40 font-hand">{predictions.tests_analyzed || 0} tests analyzed</div>
              </div>
              <div className="bg-white border border-pencil/30 p-3 text-center"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <div className="text-xs text-pencil/50 font-hand">WPM Trend</div>
                <div className={`text-lg font-bold font-marker flex items-center justify-center gap-1 ${
                  predictions.wpm_trend === 'improving' ? 'text-green-600' :
                  predictions.wpm_trend === 'declining' ? 'text-accent' : 'text-pencil/70'
                }`}>
                  {predictions.wpm_trend === 'improving' ? <ArrowUp className="w-4 h-4" /> :
                   predictions.wpm_trend === 'declining' ? <ArrowDown className="w-4 h-4" /> : null}
                  {predictions.wpm_trend}
                </div>
                <div className="text-[10px] text-pencil/40 font-hand">Last {Math.min(predictions.wpm_series?.length || 0, 10)} tests</div>
              </div>
              <div className="bg-white border border-pencil/30 p-3 text-center"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <div className="text-xs text-pencil/50 font-hand">Accuracy Trend</div>
                <div className={`text-lg font-bold font-marker flex items-center justify-center gap-1 ${
                  predictions.accuracy_trend === 'improving' ? 'text-green-600' :
                  predictions.accuracy_trend === 'declining' ? 'text-accent' : 'text-pencil/70'
                }`}>
                  {predictions.accuracy_trend === 'improving' ? <ArrowUp className="w-4 h-4" /> :
                   predictions.accuracy_trend === 'declining' ? <ArrowDown className="w-4 h-4" /> : null}
                  {predictions.accuracy_trend}
                </div>
                <div className="text-[10px] text-pencil/40 font-hand">Last {Math.min(predictions.accuracy_series?.length || 0, 10)} tests</div>
              </div>
            </div>

            {predictions.recommendation && (
              <div className="mt-3 p-3 bg-white border-2 border-pencil/30 text-xs font-hand text-pencil/70 leading-relaxed"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <span className="font-bold text-pencil">Tip: </span>
                {predictions.recommendation}
              </div>
            )}
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
              recentTests.slice(page * perPage, (page + 1) * perPage).map((test: any, idx: number) => (
                <div key={test.id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-4 h-4 text-pencil/40" strokeWidth={2.5} />
                      <span className="font-bold text-pencil font-hand text-base">
                        {test.mode?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-pencil/40 font-hand">
                        {test.date ? new Date(test.date).toLocaleDateString() : ''}
                      </span>
                      {test.duration && (
                        <span className="text-xs text-pencil/40 font-hand flex items-center gap-0.5">
                          <Clock className="w-3 h-3" strokeWidth={2.5} />
                          {test.duration}s
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {test.qualified
                        ? <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={3} />
                        : <XCircle className="w-5 h-5 text-accent" strokeWidth={3} />}
                      {test.xp_earned > 0 && (
                        <span className="text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">
                          +{test.xp_earned}XP
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-xs font-hand">
                    <div className="bg-paper rounded p-1.5 text-center">
                      <div className="text-pencil/40">Net WPM</div>
                      <div className="font-bold font-mono text-pencil">{test.wpm?.toFixed(1)}</div>
                    </div>
                    <div className="bg-paper rounded p-1.5 text-center">
                      <div className="text-pencil/40">Gross WPM</div>
                      <div className="font-bold font-mono text-pencil">{test.gross_wpm?.toFixed(1) || '-'}</div>
                    </div>
                    <div className="bg-paper rounded p-1.5 text-center">
                      <div className="text-pencil/40">Accuracy</div>
                      <div className="font-bold font-mono text-pencil">{test.accuracy?.toFixed(1)}%</div>
                    </div>
                    <div className="bg-paper rounded p-1.5 text-center">
                      <div className="text-pencil/40">Errors</div>
                      <div className="font-bold font-mono text-accent">{test.total_errors ?? '-'}</div>
                    </div>
                    <div className="bg-paper rounded p-1.5 text-center hidden sm:block">
                      <div className="text-pencil/40">Backspaces</div>
                      <div className="font-bold font-mono text-pencil/80">{test.backspace_count ?? '-'}</div>
                    </div>
                    <div className="bg-paper rounded p-1.5 text-center hidden sm:block">
                      <div className="text-pencil/40">Consistency</div>
                      <div className="font-bold font-mono text-pencil/80">{test.consistency_score ? `${test.consistency_score.toFixed(0)}%` : '-'}</div>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {test.wpm >= 35 && test.accuracy >= 95 ? (
                      <span className="text-xs text-green-600 font-hand flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
                        Qualifies SSC CHSL
                      </span>
                    ) : (
                      <span className="text-xs text-pencil/40 font-hand flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                        {test.wpm < 35 ? `${35 - Math.floor(test.wpm)} WPM short` : ''}
                        {test.wpm < 35 && test.accuracy < 95 ? ' + ' : ''}
                        {test.accuracy < 95 ? `${(95 - (test.accuracy || 0)).toFixed(1)}% accuracy short` : ''}
                      </span>
                    )}
                    {idx > 0 && test.wpm && (() => {
                      const prevWPM = recentTests.slice(page * perPage, (page + 1) * perPage)[idx - 1]?.wpm;
                      if (!prevWPM || prevWPM === test.wpm) return null;
                      const improved = test.wpm > prevWPM;
                      return (
                        <span className={`text-xs font-hand flex items-center gap-0.5 ${improved ? 'text-green-600' : 'text-accent'}`}>
                          {improved ? '▲' : '▼'} {Math.abs(test.wpm - prevWPM).toFixed(1)}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>
          {recentTests.length > perPage && (
            <div className="px-6 py-3 border-t-2 border-pencil/20 flex items-center justify-between">
              <span className="text-sm font-hand text-pencil/50">
                Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, recentTests.length)} of {recentTests.length}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 border-2 border-pencil/30 text-pencil/60 hover:text-pencil hover:border-pencil disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={3} />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * perPage >= recentTests.length}
                  className="p-1.5 border-2 border-pencil/30 text-pencil/60 hover:text-pencil hover:border-pencil disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MiniChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const values = [...data].reverse();
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 180;
  const h = 32;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-hand mb-1">
        <span className="text-pencil/40">{label} trend (recent {values.length})</span>
        <span className="text-pencil/60">{values[values.length - 1].toFixed(1)}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          points={points} />
        {values.length >= 2 && (
          <>
            <circle cx={points.split(' ')[0].split(',')[0]} cy={points.split(' ')[0].split(',')[1]} r="2.5" fill={color} opacity="0.5" />
            <circle cx={points.split(' ')[values.length - 1].split(',')[0]} cy={points.split(' ')[values.length - 1].split(',')[1]} r="3" fill={color} />
          </>
        )}
      </svg>
    </div>
  );
}
