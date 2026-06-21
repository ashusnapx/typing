'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { FullPageLoader } from '@/components/ui/loading-logo';
import {
  Brain,
  Target,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  TrendingUp,
  Lightbulb,
  Sparkles,
  Dumbbell,
  Activity,
} from 'lucide-react';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };

export default function AICoachPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [feedback, setFeedback] = useState<any>(null);
  const [weakWords, setWeakWords] = useState<string[]>([]);
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/auth/login'); }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      api.getRecentScores().then(setRecentTests).catch(() => {});
      api.getWeakWords().then(setWeakWords).catch(() => {});
    }
  }, [isAuthenticated]);

  const loadFeedback = async (testId: string) => {
    setSelectedTestId(testId);
    try {
      const data = await api.getAIFeedback(testId);
      setFeedback(data);
    } catch (err) {
      console.error('Failed to load feedback', err);
    }
  };

  if (isLoading || !user) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center space-x-4 mb-8 rotate-1">
          <Brain className="w-8 h-8 text-blue-pen" strokeWidth={3} />
          <h1 className="text-3xl font-bold text-pencil font-marker">AI Typing Coach</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border-2 border-pencil shadow-hard-sm p-4" style={wobbly}>
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="w-5 h-5 text-pencil" strokeWidth={3} />
                <h2 className="font-bold text-pencil font-marker">Recent Tests</h2>
              </div>
              <div className="space-y-2">
                {recentTests.map((test: any) => (
                  <button
                    key={test.id}
                    onClick={() => loadFeedback(test.id)}
                    className={`w-full text-left p-3 border-2 border-pencil transition-all duration-100 font-hand ${
                      selectedTestId === test.id
                        ? 'bg-postit shadow-hard-sm'
                        : 'bg-paper hover:shadow-hard-sm'
                    }`}
                    style={wobbly}
                  >
                    <div className="font-bold text-pencil text-sm">
                      {test.mode?.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-xs text-pencil/60 mt-1">
                      {test.wpm?.toFixed(1)} WPM | {test.accuracy?.toFixed(1)}% |{' '}
                      {test.qualified
                        ? <CheckCircle2 className="w-3 h-3 inline text-green-600" strokeWidth={3} />
                        : <XCircle className="w-3 h-3 inline text-accent" strokeWidth={3} />}
                    </div>
                  </button>
                ))}
                {recentTests.length === 0 && (
                  <div className="text-sm text-pencil/50 font-hand text-center py-4">
                    Complete a test to get AI feedback
                  </div>
                )}
              </div>
            </div>

            {weakWords.length > 0 && (
              <div className="bg-white border-2 border-pencil shadow-hard-sm p-4" style={wobbly}>
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-5 h-5 text-accent" strokeWidth={3} />
                  <h2 className="font-bold text-pencil font-marker">Weak Words</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {weakWords.map((word) => (
                    <span key={word}
                      className="px-2 py-1 bg-accent/10 text-accent border-2 border-accent font-hand text-sm"
                      style={wobbly}>
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Feedback */}
          <div className="lg:col-span-2">
            {feedback ? (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="bg-white border-2 border-pencil shadow-hard p-6 -rotate-[0.3deg] hover:rotate-0 transition-transform">
                  <div className="relative">
                    <div className="tape" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-6 h-6 text-accent" strokeWidth={3} />
                        <h2 className="text-xl font-bold text-pencil font-marker">Overall Score</h2>
                      </div>
                      <div className="text-4xl font-bold text-pencil font-marker">{feedback.overall_score}%</div>
                    </div>
                    <p className="text-lg text-pencil/70 font-hand">{feedback.detailed_feedback}</p>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white border-2 border-pencil shadow-hard-sm p-4 -rotate-1 hover:rotate-0 transition-transform">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={3} />
                      <h3 className="font-bold text-pencil font-marker">Strengths</h3>
                    </div>
                    <ul className="space-y-2">
                      {feedback.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-base text-pencil font-hand flex items-start space-x-2">
                          <span className="text-green-600 mt-0.5">&#10003;</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white border-2 border-pencil shadow-hard-sm p-4 rotate-1 hover:rotate-0 transition-transform">
                    <div className="flex items-center space-x-2 mb-3">
                      <XCircle className="w-5 h-5 text-accent" strokeWidth={3} />
                      <h3 className="font-bold text-pencil font-marker">Weaknesses</h3>
                    </div>
                    <ul className="space-y-2">
                      {feedback.weaknesses?.map((w: string, i: number) => (
                        <li key={i} className="text-base text-pencil font-hand flex items-start space-x-2">
                          <span className="text-accent mt-0.5">&times;</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Daily Drills */}
                <div className="bg-white border-2 border-pencil shadow-hard-sm p-4 rotate-[0.2deg]">
                  <div className="flex items-center space-x-2 mb-3">
                    <Dumbbell className="w-5 h-5 text-blue-pen" strokeWidth={3} />
                    <h3 className="font-bold text-pencil font-marker">Daily Drills</h3>
                  </div>
                  <div className="space-y-3">
                    {feedback.daily_drills?.map((drill: any, i: number) => (
                      <div key={i}
                           className="flex items-center justify-between p-3 bg-muted/50 border-2 border-pencil"
                           style={wobbly}>
                        <div>
                          <div className="font-bold text-sm text-pencil font-hand">{drill.name}</div>
                          <div className="text-xs text-pencil/60 font-hand">{drill.description}</div>
                        </div>
                        <span className="text-sm text-pencil/50 font-hand flex items-center space-x-1">
                          <Clock className="w-3 h-3" strokeWidth={3} />
                          <span>{drill.duration_minutes} min</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fatigue Analysis */}
                {feedback.fatigue_analysis?.fatigue_detected && (
                  <div className="bg-postit border-2 border-pencil shadow-hard-sm p-4 -rotate-[0.5deg]">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-accent" strokeWidth={3} />
                      <h3 className="font-bold text-pencil font-marker">Fatigue Detected</h3>
                    </div>
                    <p className="text-base text-pencil font-hand">
                      Fatigue starts at ~{feedback.fatigue_analysis.fatigue_start_seconds}s.
                      Speed declined by {feedback.fatigue_analysis.speed_decline_percentage}% in the second half.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border-2 border-pencil shadow-hard p-12 text-center -rotate-[0.5deg]">
                <Lightbulb className="w-16 h-16 text-postit mx-auto mb-4" strokeWidth={2} fill="#fff9c4" />
                <h2 className="text-2xl font-bold text-pencil font-marker mb-2">
                  Select a test to get AI feedback
                </h2>
                <p className="text-lg text-pencil/60 font-hand">
                  Choose a test from the left to receive personalized coaching
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
