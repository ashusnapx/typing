'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { getTestResults } from '@/lib/test-storage';
import { getExamSpecs, checkQualification } from '@/lib/exam-config';
import { getModeDisplayName } from '@/lib/utils';
import { FullPageLoader } from '@/components/ui/loading-logo';
import PassageDiffView, { buildWordDisplay, getWordTiming, formatMs } from '@/components/exam/passage-diff';
import {
  CheckCircle2, XCircle, ArrowLeft, Clock, Gauge, Target,
  AlertTriangle, Brain, BarChart3, Zap,
} from 'lucide-react';

interface WordAnalysis {
  index: number;
  original: string;
  typed: string;
  isCorrect: boolean;
  errorType: string | null;
  similarity: number;
  wordDurationMs: number;
  pauseBeforeMs: number;
}

// computeWordTiming, levenshtein, formatMs now imported from @/components/exam/passage-diff

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;
  const { isAuthenticated, isLoading } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testData, setTestData] = useState<any>(null);
  const [replay, setReplay] = useState<any>(null);
  const [wordAnalyses, setWordAnalyses] = useState<WordAnalysis[]>([]);
  const [originalContent, setOriginalContent] = useState('');
  const [typedContent, setTypedContent] = useState('');
  const [source, setSource] = useState<'api' | 'local'>('api');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push('/auth/login'); return; }

    loadData();
  }, [isLoading, isAuthenticated]);

  async function loadData() {
    setLoading(true);
    setError('');

    // Try API first
    try {
      const result = await api.getTestResult(testId);
      setTestData(result);
      setOriginalContent(result.original_content || ''); // may not be in response
      setTypedContent(result.typed_content || '');
      setSource('api');

      // Fetch replay for keystroke events
      try {
        const replayData = await api.getTestReplay(testId);
        setReplay(replayData);
        if (replayData.original_content) setOriginalContent(replayData.original_content);
        if (replayData.typed_content) setTypedContent(replayData.typed_content);
      } catch { /* replay not available */ }

      setLoading(false);
      return;
    } catch { /* try local */ }

    // Try localStorage
    const localTests = getTestResults();
    const localTest = localTests.find(t => t.id === testId);
    if (localTest) {
      setTestData({
        ...localTest,
        net_wpm: localTest.wpm,
        accuracy: localTest.accuracy,
        is_qualified: localTest.qualified,
      });
      setOriginalContent(localTest.original_content || '');
      setTypedContent(localTest.typed_content || '');
      setSource('local');
      setLoading(false);
      return;
    }

    setError('Test not found. It may have been deleted or the link is invalid.');
    setLoading(false);
  }

  useEffect(() => {
    if (!originalContent || !typedContent) return;
    const replayEvents = replay?.events;
    const analyses = getWordTiming(originalContent, typedContent, replayEvents);
    setWordAnalyses(analyses);
  }, [originalContent, typedContent, replay]);

  if (isLoading || loading) return <FullPageLoader />;

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="bg-white border-2 border-pencil shadow-hard-sm p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-4" strokeWidth={2.5} />
          <h2 className="text-xl font-bold font-marker text-pencil mb-2">Test Not Found</h2>
          <p className="text-pencil/60 font-hand mb-6">{error}</p>
          <button onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-pencil text-white font-bold font-hand border-2 border-pencil shadow-hard-sm hover:bg-pencil/90 transition-colors"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!testData) return null;

  const mode = testData.mode || '';
  const specs = getExamSpecs(mode);
  const sscNetWpm = testData.ssc_net_wpm || testData.net_wpm || testData.wpm || 0;
  const sscAccuracy = testData.ssc_accuracy || testData.accuracy || 0;
  const fullMistakes = testData.full_mistakes ?? 0;
  const halfMistakes = testData.half_mistakes ?? 0;
  const totalErrors = testData.total_errors ?? 0;
  const kd = testData.key_depression_count ?? 0;
  const errorPct = testData.ssc_error_percentage ?? (sscAccuracy > 0 ? 100 - sscAccuracy : 0);

  const kdph = specs && testData.time_taken_seconds
    ? Math.round((kd / (testData.time_taken_seconds / 60)) * 60)
    : 0;

  const typedWordCount = typedContent?.trim() ? typedContent.trim().split(/\s+/).length : 0;
  const originalWordCount = originalContent?.trim() ? originalContent.trim().split(/\s+/).length : 1;
  const passageCompletionPct = Math.min(100, Math.round((typedWordCount / originalWordCount) * 100));

  const qualified = specs?.qualifyingNature === 'speed_wpm'
    ? sscNetWpm >= (specs?.englishSpeedWpm || 35) && errorPct <= (specs?.errorAllowanceGeneral ?? 20) && passageCompletionPct >= 50
    : kdph >= (specs?.englishKdph || 8000) && errorPct <= (specs?.errorAllowanceGeneral ?? 20) && passageCompletionPct >= 50;

  const categories = [
    { cat: 'UR', label: 'Unreserved', maxErrorPct: specs?.errorAllowanceGeneral ?? 20 },
    { cat: 'OBC', label: 'OBC / EWS', maxErrorPct: specs?.errorAllowanceObcEws ?? 25 },
    { cat: 'SC', label: 'SC / ST', maxErrorPct: specs?.errorAllowanceScSt ?? 30 },
  ];

  const dateStr = testData.date || testData.completed_at || '';
  const slowWords = wordAnalyses
    .filter(w => w.pauseBeforeMs > 500 && w.original)
    .sort((a, b) => b.pauseBeforeMs - a.pauseBeforeMs)
    .slice(0, 15);

  const errorWords = wordAnalyses.filter(w => !w.isCorrect && w.original);

  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Back button */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-hand text-pencil/50 hover:text-pencil mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> Back
        </button>

        {/* Header Card */}
        <div className="bg-white border-2 border-pencil shadow-hard-sm mb-6">
          <div className="px-6 py-5 border-b-2 border-pencil/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold font-marker text-pencil">
                  {getModeDisplayName(mode) || 'Typing Test'} — Analysis Report
                </h1>
                <p className="text-sm font-hand text-pencil/50 mt-1">
                  {dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  {testData.time_taken_seconds ? `  •  ${Math.round(testData.time_taken_seconds)}s` : ''}
                  {source === 'local' ? '  •  Saved Locally' : ''}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 border-2 ${qualified ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-accent text-accent'}`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                {qualified
                  ? <><CheckCircle2 className="w-5 h-5" strokeWidth={3} /><span className="font-bold font-hand">Qualified</span></>
                  : <><XCircle className="w-5 h-5" strokeWidth={3} /><span className="font-bold font-hand">Not Qualified</span></>}
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x-2 divide-pencil/10">
            {[
              { label: 'SSC Net WPM', value: sscNetWpm.toFixed(1), icon: <Gauge className="w-4 h-4" strokeWidth={3} />, color: sscNetWpm >= (specs?.englishSpeedWpm || 35) ? '#16a34a' : '#dc2626' },
              { label: 'SSC Accuracy', value: `${sscAccuracy.toFixed(1)}%`, icon: <Target className="w-4 h-4" strokeWidth={3} />, color: sscAccuracy >= 95 ? '#16a34a' : '#dc2626' },
              { label: 'Key Depressions', value: kd.toLocaleString(), icon: <BarChart3 className="w-4 h-4" strokeWidth={3} />, color: '#333' },
              { label: 'Time Taken', value: testData.time_taken_seconds ? `${Math.round(testData.time_taken_seconds)}s` : '-', icon: <Clock className="w-4 h-4" strokeWidth={3} />, color: '#333' },
            ].map((m, i) => (
              <div key={i} className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-pencil/40 mb-1">{m.icon}<span className="text-[10px] uppercase tracking-wider font-hand">{m.label}</span></div>
                <div className="text-2xl font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Full/Half Mistakes */}
          <div className="bg-white border-2 border-pencil shadow-hard-sm p-5">
            <h2 className="text-sm font-bold font-marker text-pencil mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" strokeWidth={3} /> SSC Error Analysis
            </h2>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm font-hand text-pencil/70">Full Mistakes</span>
                <span className="text-lg font-bold font-mono" style={{ color: fullMistakes > 0 ? '#dc2626' : '#16a34a' }}>{fullMistakes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-hand text-pencil/70">Half Mistakes</span>
                <span className="text-lg font-bold font-mono" style={{ color: halfMistakes > 0 ? '#ea580c' : '#16a34a' }}>{halfMistakes}</span>
              </div>
              <div className="border-t-2 border-pencil/10 pt-2 flex justify-between items-center">
                <span className="text-sm font-hand text-pencil/70">SSC Error %</span>
                <span className="text-lg font-bold font-mono" style={{ color: errorPct > 10 ? '#dc2626' : '#16a34a' }}>{errorPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Passage Completion */}
          <div className="bg-white border-2 border-pencil shadow-hard-sm p-5">
            <h2 className="text-sm font-bold font-marker text-pencil mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" strokeWidth={3} /> Passage Completion
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-hand text-pencil/70">Passage Completed</span>
                <span className={`text-lg font-bold font-mono ${passageCompletionPct >= 80 ? 'text-green-600' : passageCompletionPct >= 50 ? 'text-orange-500' : 'text-accent'}`}>
                  {passageCompletionPct}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-hand text-pencil/70">Typed Words / Total Words</span>
                <span className="text-sm font-mono text-pencil/60">{typedWordCount} / {originalWordCount}</span>
              </div>
              {passageCompletionPct < 50 && (
                <div className="text-xs font-hand text-accent mt-1">
                  Need ≥50% passage completion to qualify
                </div>
              )}
              <div className="border-t-2 border-pencil/10 pt-2 text-[10px] font-hand text-pencil/40 leading-relaxed">
                <strong>Source:</strong> {specs?.source || 'SSC Official Notification'}.{' '}
                {specs?.citations?.map((url, i) => (
                  <span key={i}><a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{url.replace(/^https?:\/\//, '')}</a>{i < (specs.citations?.length ?? 0) - 1 ? ' · ' : ''} </span>
                ))}
                <a href="https://ssc.gov.in" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">ssc.gov.in</a>
              </div>
            </div>
          </div>

          {/* Qualification by Category */}
          <div className="bg-white border-2 border-pencil shadow-hard-sm p-5">
            <h2 className="text-sm font-bold font-marker text-pencil mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" strokeWidth={3} /> Qualification by Category
            </h2>
            <div className="space-y-2">
              {categories.map(c => {
                const qualifies = specs?.qualifyingNature === 'speed_wpm'
                  ? sscNetWpm >= (specs?.englishSpeedWpm || 35) && errorPct <= c.maxErrorPct
                  : kdph >= (specs?.englishKdph || 8000) && errorPct <= c.maxErrorPct;
                return (
                  <div key={c.cat} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${qualifies ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="text-sm font-hand text-pencil/80">{c.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-hand text-pencil/40">≤{c.maxErrorPct}% err</span>
                      {qualifies
                        ? <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={3} />
                        : <XCircle className="w-4 h-4 text-accent" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t-2 border-pencil/10 pt-2 mt-2 text-[10px] font-hand text-pencil/40 leading-relaxed">
              <strong>Source:</strong> {specs?.source || 'SSC Official Notification'}.{' '}
              {specs?.citations?.map((url, i) => (
                <span key={i}><a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{url.replace(/^https?:\/\//, '')}</a>{i < (specs.citations?.length ?? 0) - 1 ? ' · ' : ''} </span>
              ))}
              <a href="https://ssc.gov.in" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">ssc.gov.in</a>
            </div>
          </div>

          {/* Error Breakdown */}
          <div className="bg-white border-2 border-pencil shadow-hard-sm p-5">
            <h2 className="text-sm font-bold font-marker text-pencil mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" strokeWidth={3} /> Error Breakdown
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Omission', value: testData.omission_errors ?? 0, color: '#dc2626' },
                { label: 'Addition', value: testData.addition_errors ?? 0, color: '#dc2626' },
                { label: 'Substitution', value: testData.substitution_errors ?? 0, color: '#ea580c' },
                { label: 'Wrong Word', value: testData.wrong_word_errors ?? 0, color: '#dc2626' },
                { label: 'Space', value: testData.space_errors ?? 0, color: '#ea580c' },
                { label: 'Backspaces', value: testData.backspace_count ?? 0, color: '#2563eb' },
              ].map((e, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-hand text-pencil/70">{e.label}</span>
                  <span className="font-bold font-mono" style={{ color: e.value > 0 ? e.color : '#999' }}>{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side-by-Side Passage Comparison */}
        <div className="bg-white border-2 border-pencil shadow-hard-sm mb-6">
          <div className="px-6 py-4 border-b-2 border-pencil/20 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pencil" strokeWidth={3} />
            <h2 className="text-base font-bold font-marker text-pencil">Passage Comparison</h2>
            <span className="text-xs font-hand text-pencil/40 ml-auto">
              <span style={{ color: '#16a34a' }}>green</span> = correct &nbsp;{'|'}&nbsp;
              <span style={{ color: '#ea580c' }}>orange</span> = typo/caps &nbsp;{'|'}&nbsp;
              <span style={{ color: '#dc2626' }}>red</span> = wrong &nbsp;{'|'}&nbsp;
              <span style={{ color: '#bbb' }}>gray</span> = missed &nbsp;{'|'}&nbsp;
              <span style={{ color: '#dc2626', textDecoration: 'underline' }}>underline</span> = extra
            </span>
          </div>
          <div className="px-6 py-4">
            {typedContent && originalContent ? (
              <PassageDiffView original={originalContent} typed={typedContent} />
            ) : (
              <p className="text-sm font-hand text-pencil/40 text-center py-4">
                No passage data available for comparison.
              </p>
            )}
          </div>
        </div>

        {/* Slow Words & Error Words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Slow Words */}
          <div className="bg-white border-2 border-pencil shadow-hard-sm p-5">
            <h2 className="text-sm font-bold font-marker text-pencil mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" strokeWidth={3} /> Slow Words (hesitated before typing)
            </h2>
            {slowWords.length === 0 ? (
              <p className="text-sm font-hand text-pencil/40">No significant pauses detected.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {slowWords.map((w, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-pencil/10 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-pencil/30 w-5">{i + 1}.</span>
                      <span className="text-sm font-hand text-pencil/80">{w.original}</span>
                      {!w.isCorrect && <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-accent border border-accent/30 rounded">error</span>}
                    </div>
                    <span className="text-xs font-mono text-orange-600 font-bold">{formatMs(w.pauseBeforeMs)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Words */}
          <div className="bg-white border-2 border-pencil shadow-hard-sm p-5">
            <h2 className="text-sm font-bold font-marker text-pencil mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" strokeWidth={3} /> Words with Errors
            </h2>
            {errorWords.length === 0 ? (
              <p className="text-sm font-hand text-pencil/40">No errors! Perfect typing.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {errorWords.map((w, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-pencil/10 last:border-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-mono text-pencil/30 w-5 shrink-0">{i + 1}.</span>
                      <div className="min-w-0">
                        <span className="text-sm font-hand line-through text-pencil/50">{w.original}</span>
                        <span className="text-sm font-hand ml-2" style={{ color: w.errorType === 'capitalization' || w.errorType === 'typo' ? '#ea580c' : '#dc2626' }}>{w.typed}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-2 ${w.errorType === 'capitalization' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-red-50 text-accent border border-red-200'}`}>
                      {w.errorType || 'error'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Consistency & Rhythm */}
        {(testData.consistency_score || testData.typing_rhythm_score) && (
          <div className="bg-white border-2 border-pencil shadow-hard-sm p-5 mb-6">
            <h2 className="text-sm font-bold font-marker text-pencil mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" strokeWidth={3} /> Pace & Consistency
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {testData.consistency_score && (
                <div className="text-center p-3 bg-paper border border-pencil/20" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                  <div className="text-lg font-bold font-mono">{testData.consistency_score.toFixed(0)}%</div>
                  <div className="text-xs font-hand text-pencil/50">Consistency</div>
                </div>
              )}
              {testData.typing_rhythm_score && (
                <div className="text-center p-3 bg-paper border border-pencil/20" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                  <div className="text-lg font-bold font-mono">{testData.typing_rhythm_score.toFixed(1)}</div>
                  <div className="text-xs font-hand text-pencil/50">Rhythm Score</div>
                </div>
              )}
              {testData.pause_count > 0 && (
                <div className="text-center p-3 bg-paper border border-pencil/20" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                  <div className="text-lg font-bold font-mono">{testData.pause_count}</div>
                  <div className="text-xs font-hand text-pencil/50">Pauses</div>
                </div>
              )}
              {testData.backspace_count > 0 && (
                <div className="text-center p-3 bg-paper border border-pencil/20" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                  <div className="text-lg font-bold font-mono">{testData.backspace_count}</div>
                  <div className="text-xs font-hand text-pencil/50">Backspaces</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mb-8">
          <button onClick={() => router.push('/dashboard')}
            className="flex-1 py-2.5 bg-pencil text-white font-bold font-hand border-2 border-pencil shadow-hard-sm hover:bg-pencil/90 transition-colors text-sm"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            Back to Dashboard
          </button>
          <button onClick={() => router.push('/exam')}
            className="flex-1 py-2.5 bg-white text-pencil font-bold font-hand border-2 border-pencil shadow-hard-sm hover:bg-muted transition-colors text-sm"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            Take Another Test
          </button>
        </div>
      </main>
    </div>
  );
}
