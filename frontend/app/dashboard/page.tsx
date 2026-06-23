'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';

import Link from 'next/link';
import {
  FileText, Gauge, Target, Zap, TrendingUp, ArrowRight, BarChart3,
  Brain, Sparkles, Timer, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Trophy, Clock, AlertTriangle, Activity, ArrowUp, ArrowDown, X,
} from 'lucide-react';
import { getLevelFromXP, getLevelIndex, getLevelProgress, LEVEL_NAMES } from '@/lib/utils';
import { CSS, ROUTES, TIME, PAGINATION } from '@/lib/config';

const wobbly = { borderRadius: CSS.radii.sm };

function Skeleton() {
  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 -rotate-1">
          <div className="h-9 w-48 bg-pencil/10 rounded animate-pulse" />
          <div className="h-5 w-64 bg-pencil/10 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className={`bg-white border-2 border-pencil/10 ${CSS.shadows.sm} p-4`}>
              <div className="h-10 w-10 bg-pencil/10 rounded animate-pulse mb-3 mx-auto" />
              <div className="h-8 w-16 bg-pencil/10 rounded animate-pulse mx-auto mb-2" />
              <div className="h-4 w-20 bg-pencil/10 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[1,2].map(i => (
            <div key={i} className={`bg-white border-2 border-pencil/10 ${CSS.shadows.sm} p-4`}>
              <div className="h-5 w-32 bg-pencil/10 rounded animate-pulse mb-3" />
              <div className="h-4 w-48 bg-pencil/10 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-pencil/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className={`bg-white border-2 border-pencil/10 ${CSS.shadows.sm}`}>
          <div className="px-6 py-4 border-b-2 border-pencil/10">
            <div className="h-5 w-28 bg-pencil/10 rounded animate-pulse" />
          </div>
          {[1,2,3].map(i => (
            <div key={i} className="px-6 py-4 border-b border-pencil/10">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-32 bg-pencil/10 rounded animate-pulse" />
                <div className="h-4 w-12 bg-pencil/10 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map(j => (
                  <div key={j} className="h-10 bg-pencil/10 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showXPModal, setShowXPModal] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = PAGINATION.dashboardPerPage;

  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    window.addEventListener('dashboard-invalidate', handler);
    return () => window.removeEventListener('dashboard-invalidate', handler);
  }, [queryClient]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.request<any>('/dashboard'),
    staleTime: TIME.cacheDashboard,
    retry: 1,
  });

  if (!user || isLoading) return <Skeleton />;

  if (isError) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className={`text-center max-w-md mx-auto p-8 bg-white border-2 border-accent ${CSS.shadows.sm}`}
             style={wobbly}>
          <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-4" strokeWidth={2.5} />
          <h2 className="text-xl font-bold text-pencil font-marker mb-2">Failed to load dashboard</h2>
          <p className="text-sm text-pencil/60 font-hand mb-4">Check your connection and try again.</p>
          <button onClick={() => refetch()} className="btn-hand">Retry</button>
        </div>
      </div>
    );
  }

  const analytics = data?.overview;
  const predictions = data?.predictions;
  const recentTests = data?.recent_scores || [];

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
            { value: analytics?.total_tests || 0, label: 'Tests Taken', icon: <FileText className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-1', isXp: false },
            { value: analytics?.avg_wpm?.toFixed(1) || 0, label: 'Avg WPM', icon: <Gauge className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1', isXp: false },
            { value: `${analytics?.avg_accuracy?.toFixed(1) || 0}%`, label: 'Avg Accuracy', icon: <Target className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-2', isXp: false },
            { value: user.xp, label: getLevelFromXP(user.xp), icon: <Zap className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1', isXp: true },
          ].map((stat) => stat.isXp ? (
            <button key={stat.label} onClick={() => setShowXPModal(true)}
                 className={`bg-white border-2 border-pencil ${CSS.shadows.sm} p-4 text-center ${CSS.shadows.mdHover} transition-all duration-100 cursor-pointer w-full`}
                 style={{ borderRadius: CSS.radii.md, transform: `rotate(${stat.rotate})` }}>
              <div className="flex justify-center mb-2 text-pencil">{stat.icon}</div>
              <div className="text-2xl font-bold text-pencil font-marker">{stat.value}</div>
              <div className="text-sm text-pencil/60 font-hand mt-1">{stat.label}</div>
            </button>
          ) : (
            <div key={stat.label}
                 className={`bg-white border-2 border-pencil ${CSS.shadows.sm} p-4 text-center ${CSS.shadows.mdHover} transition-all duration-100`}
                 style={{ borderRadius: CSS.radii.md, transform: `rotate(${stat.rotate})` }}>
              <div className="flex justify-center mb-2 text-pencil">{stat.icon}</div>
              <div className="text-2xl font-bold text-pencil font-marker">{stat.value}</div>
              <div className="text-sm text-pencil/60 font-hand mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        {predictions && (
          <div className={`bg-postit border-2 border-pencil ${CSS.shadows.md} p-6 mb-8 -rotate-[0.3deg] hover:rotate-0 transition-transform relative`}>
            <div className="tack" />
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-pencil" strokeWidth={3} />
              <h2 className="text-xl font-bold text-pencil font-marker">Performance Summary</h2>
            </div>

            {predictions.chsl_wpm_target && (
              <div className={`bg-white border-2 border-pencil p-4 ${CSS.shadows.sm} mb-4`}
                   style={{ borderRadius: CSS.radii.sm }}>
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
                          background: (predictions.recent_avg_wpm || 0) >= predictions.chsl_wpm_target ? CSS.colors.green : CSS.colors.blue
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
                          background: (predictions.recent_avg_accuracy || 0) >= predictions.chsl_acc_target ? CSS.colors.green : CSS.colors.blue
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
                    <MiniChart data={predictions.wpm_series} color={CSS.colors.blue} label="WPM" />
                  </div>
                )}
              </div>
            )}

            <div className={`bg-white border-2 border-pencil p-4 ${CSS.shadows.sm} mb-4`}
                 style={{ borderRadius: CSS.radii.sm }}>
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
                      background: (predictions.recent_avg_accuracy || 0) >= 95 ? CSS.colors.green : CSS.colors.red
                    }} />
                </div>
              </div>
              {predictions.accuracy_series && predictions.accuracy_series.length >= 2 && (
                <div className="pt-2 mt-2 border-t border-pencil/10">
                  <MiniChart data={predictions.accuracy_series} color={CSS.colors.red} label="Accuracy %" />
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-white border border-pencil/30 p-3 text-center"
                   style={{ borderRadius: CSS.radii.sm }}>
                <div className="text-xs text-pencil/50 font-hand">Consistency</div>
                <div className="text-lg font-bold font-marker text-pencil">{predictions.consistency_score?.toFixed(0) || '-'}%</div>
                <div className="text-[10px] text-pencil/40 font-hand">{predictions.tests_analyzed || 0} tests analyzed</div>
              </div>
              <div className="bg-white border border-pencil/30 p-3 text-center"
                   style={{ borderRadius: CSS.radii.sm }}>
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
                   style={{ borderRadius: CSS.radii.sm }}>
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
                   style={{ borderRadius: CSS.radii.sm }}>
                <span className="font-bold text-pencil">Tip: </span>
                {predictions.recommendation}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { href: ROUTES.examChsl, title: 'SSC CHSL Practice', desc: '10 min, 35 WPM target', icon: <Target className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-1' },
            { href: ROUTES.examMock, title: 'Mock Test', desc: 'Full exam simulation', icon: <Timer className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
            { href: '/coach', title: 'AI Coach', desc: 'Personalized feedback', icon: <Brain className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-2' },
          ].map((action) => (
            <Link key={action.title} href={action.href}
                  className={`bg-white border-2 border-pencil ${CSS.shadows.sm} p-4 ${CSS.shadows.mdHover} transition-all duration-100 group`}
                  style={{ borderRadius: CSS.radii.md, transform: `rotate(${action.rotate})` }}>
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
        <div className={`bg-white border-2 border-pencil ${CSS.shadows.sm}`}>
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
                <Link key={test.id} href={`/analysis/${test.id}`} className="px-6 py-4 hover:bg-muted/50 transition-colors block">
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
                </Link>
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
                  style={{ borderRadius: CSS.radii.sm }}
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={3} />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * perPage >= recentTests.length}
                  className="p-1.5 border-2 border-pencil/30 text-pencil/60 hover:text-pencil hover:border-pencil disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ borderRadius: CSS.radii.sm }}
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* XP Detail Modal */}
        {showXPModal && user && (() => {
          const xp = user.xp || 0;
          const rank = getLevelFromXP(xp);
          const rankIdx = getLevelIndex(xp);
          const progress = getLevelProgress(xp);
          const totalTests = analytics?.total_tests || 0;
          const recentXpTotal = recentTests.slice(0, 10).reduce((s: number, t: any) => s + (t.xp_earned || 0), 0);
          const avgXpPerTest = totalTests > 0 ? Math.round(xp / totalTests) : 0;
          const lessonXpEstimate = 895;
          const testXpEstimate = Math.max(0, xp - lessonXpEstimate);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowXPModal(false)}>
              <div className={`bg-white border-2 border-pencil ${CSS.shadows.md} max-w-lg w-full mx-4 relative overflow-y-auto max-h-[90vh]`}
                   style={{ borderRadius: CSS.radii.sm }}
                   onClick={e => e.stopPropagation()}>
                <div className="p-6">
                  <button onClick={() => setShowXPModal(false)}
                          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border-2 border-pencil/30 text-pencil/50 hover:text-pencil hover:border-pencil transition-colors"
                          style={{ borderRadius: CSS.radii.sm }}>
                    <X className="w-4 h-4" strokeWidth={3} />
                  </button>

                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 flex items-center justify-center bg-yellow-100 border-[3px] border-yellow-500 rounded-full shrink-0">
                      <Zap className="w-8 h-8 text-yellow-600" strokeWidth={3} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-marker text-pencil">{rank}</h2>
                      <p className="text-sm font-hand text-pencil/50">{xp.toLocaleString()} total XP</p>
                    </div>
                  </div>

                  {progress.next && (
                    <>
                      <div className="mb-1 flex items-center justify-between text-sm font-hand">
                        <span className="text-pencil/60">Next: {progress.next}</span>
                        <span className="font-semibold text-pencil">{xp - progress.currentXp} / {progress.nextXp - progress.currentXp} XP</span>
                      </div>
                      <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden border border-pencil/20">
                        <div className="h-full rounded-full transition-all duration-500 bg-yellow-400 flex items-center justify-end pr-2"
                             style={{ width: `${progress.progress}%` }}>
                          {progress.progress > 15 && (
                            <span className="text-[10px] font-bold text-yellow-800">{progress.progress.toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-hand text-pencil/40 mt-1 mb-5">
                        {Math.ceil(progress.nextXp - xp)} more XP to reach {progress.next}
                      </p>
                    </>
                  )}

                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-paper border border-pencil/20 p-3 text-center"
                         style={{ borderRadius: CSS.radii.sm }}>
                      <div className="text-xl font-bold font-marker text-pencil">{totalTests}</div>
                      <div className="text-xs font-hand text-pencil/50">Tests Taken</div>
                    </div>
                    <div className="bg-paper border border-pencil/20 p-3 text-center"
                         style={{ borderRadius: CSS.radii.sm }}>
                      <div className="text-xl font-bold font-marker text-pencil">{avgXpPerTest}</div>
                      <div className="text-xs font-hand text-pencil/50">Avg XP / Test</div>
                    </div>
                    <div className="bg-paper border border-pencil/20 p-3 text-center"
                         style={{ borderRadius: CSS.radii.sm }}>
                      <div className="text-xl font-bold font-marker text-green-600">+{recentXpTotal}</div>
                      <div className="text-xs font-hand text-pencil/50">Last 10 Tests XP</div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="text-sm font-bold font-hand text-pencil mb-2">XP Sources</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-paper border border-pencil/20"
                           style={{ borderRadius: CSS.radii.sm }}>
                        <span className="text-sm font-hand text-pencil/70">Lessons (max 895 XP)</span>
                        <span className="text-sm font-bold font-mono text-pencil">{Math.min(lessonXpEstimate, xp)}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-paper border border-pencil/20"
                           style={{ borderRadius: CSS.radii.sm }}>
                        <span className="text-sm font-hand text-pencil/70">Typing Tests</span>
                        <span className="text-sm font-bold font-mono text-pencil">{Math.max(0, testXpEstimate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-pencil/10 pt-4">
                    <h3 className="text-sm font-bold font-hand text-pencil mb-3">Rank Progression</h3>
                    <div className="space-y-1.5">
                      {LEVEL_NAMES.map((l, i) => {
                        const unlocked = xp >= l.minXp;
                        return (
                          <div key={l.name}
                               className={`flex items-center justify-between p-2.5 ${unlocked ? 'bg-yellow-50 border border-yellow-200' : 'bg-paper border border-pencil/10'} ${l.name === rank ? 'ring-2 ring-yellow-400' : ''}`}
                               style={{ borderRadius: CSS.radii.sm }}>
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold font-mono rounded-full ${unlocked ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-300'}`}>
                                {unlocked ? '✓' : i + 1}
                              </span>
                              <span className={`text-sm font-hand ${unlocked ? 'text-pencil font-bold' : 'text-pencil/40'}`}>
                                {l.name}
                              </span>
                            </div>
                            <span className={`text-xs font-hand ${unlocked ? 'text-yellow-600' : 'text-pencil/30'}`}>
                              {l.minXp === 0 ? 'Start' : `${l.minXp.toLocaleString()} XP`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
