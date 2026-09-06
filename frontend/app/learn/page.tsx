'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Play,
  Check,
  ChevronRight,
  Flame,
  Target,
  Gauge,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import LEVELS, {
  STAGES,
  getFlatLessons,
  getLevelName,
  getLevelProgress,
  type Level,
  type Lesson,
} from '@/lib/typing-curriculum';
import {
  getAllLessonProgress,
  getOverallProgress,
  type LessonProgress,
} from '@/lib/lesson-storage';
import { ROUTES } from '@/lib/config';
import { PostSelector, useSelectedPost } from '@/components/learn/post-selector';

/* -------------------------------------------------------------------------- */
/*  Derived progress                                                          */
/* -------------------------------------------------------------------------- */

function computeStreak(progress: Record<string, LessonProgress>): number {
  const dates = new Set<string>();
  for (const p of Object.values(progress)) {
    for (const d of p.completedDates) dates.add(d.slice(0, 10));
  }
  const sorted = [...dates].sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (sorted[i] === expected.toISOString().slice(0, 10)) streak++;
    else break;
  }
  return streak;
}

function earnedXp(progress: Record<string, LessonProgress>): number {
  let xp = 0;
  for (const level of LEVELS) {
    for (const l of level.lessons) {
      if (progress[l.id]?.qualified) xp += l.xpReward;
    }
  }
  return xp;
}

/** Stage 3 is the product's differentiator, so it is pulled out of the flow
 *  and given its own slab. Everything below reads from this one constant. */
const FEATURED_STAGE = 3;

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                    */
/* -------------------------------------------------------------------------- */

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="card flex flex-col p-5">
      <Icon className="h-4 w-4 text-vast/40" strokeWidth={2} />
      <div className="tnum mt-4 font-display text-3xl sm:text-4xl">{value}</div>
      <div className="eyebrow mt-2">{label}</div>
      {sub && <div className="mt-1 text-sm text-vast/50">{sub}</div>}
    </div>
  );
}

function LessonRow({
  lesson,
  done,
  best,
  isNext,
  onStart,
}: {
  lesson: Lesson;
  done: boolean;
  best?: LessonProgress;
  isNext: boolean;
  onStart: () => void;
}) {
  return (
    <li className="border-b-2 border-vast/10 last:border-0">
      <button
        onClick={onStart}
        className={`group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors sm:px-5 ${
          isNext && !done ? 'bg-dawn/40' : 'hover:bg-dawn/25'
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
            done
              ? 'border-ok bg-ok-bg text-ok'
              : isNext
                ? 'border-vast bg-dawn'
                : 'border-vast/20 bg-lumen'
          }`}
        >
          {done ? (
            <Check className="h-4 w-4" strokeWidth={2.5} />
          ) : isNext ? (
            <Play className="h-3 w-3" strokeWidth={2.5} fill="currentColor" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-vast/40" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-medium">{lesson.title}</span>
            {/* The two exam constraints are what make a lesson harder than its
                title suggests, so they are flagged on the row itself. */}
            {lesson.noBackspace && (
              <span className="chip chip-flare">No backspace</span>
            )}
            {lesson.hidePositionHighlight && (
              <span className="chip chip-glow">No highlight</span>
            )}
            {isNext && !done && <span className="chip chip-lilac">Next up</span>}
          </span>
          <span className="mt-1 block truncate text-sm text-vast/60">
            {lesson.rule ?? lesson.instruction}
          </span>
        </span>

        <span className="hidden shrink-0 items-center gap-4 text-sm text-vast/50 sm:flex">
          {best?.bestWpm ? (
            <span className="tnum">{Math.round(best.bestWpm)} WPM</span>
          ) : (
            <span className="tnum">{Math.round(lesson.durationSec / 60)} min</span>
          )}
          <ChevronRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </span>
      </button>
    </li>
  );
}

function StageSection({
  stage,
  levels,
  progress,
  nextLessonId,
  onStart,
  onDark = false,
}: {
  stage: (typeof STAGES)[number];
  levels: Level[];
  progress: Record<string, LessonProgress>;
  nextLessonId: string | null;
  onStart: (id: string) => void;
  /** Set on the green slab, where the muted ramps have to flip to cream. */
  onDark?: boolean;
}) {
  const all = levels.flatMap((l) => l.lessons);
  const done = all.filter((l) => progress[l.id]?.qualified).length;
  const pct = all.length ? (done / all.length) * 100 : 0;
  const complete = pct === 100;

  const muted = onDark ? 'text-lumen/70' : 'text-vast/60';
  const subtle = onDark ? 'text-lumen/50' : 'text-vast/50';

  return (
    <section id={`stage-${stage.id}`} className="scroll-mt-24" data-reveal>
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 font-display text-2xl ${
            complete
              ? 'border-ok bg-ok-bg text-ok'
              : onDark
                ? 'border-lumen bg-lumen/10'
                : 'border-vast bg-lumen'
          }`}
          aria-hidden="true"
        >
          {complete ? <Check className="h-5 w-5" strokeWidth={2.5} /> : stage.id}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-3xl">{stage.name}</h3>
            <span className={`text-base ${subtle}`}>{stage.english}</span>
          </div>
          <p className={`mt-2.5 max-w-prose text-base leading-relaxed ${muted}`}>
            {stage.blurb}
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <span className="tnum font-display text-3xl">
            {done}/{all.length}
          </span>
          <span className="eyebrow mt-1 block">Done</span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={`${stage.name}: ${done} of ${all.length} lessons done`}
        className={`mt-5 h-1.5 w-full overflow-hidden rounded-full ${
          onDark ? 'bg-lumen/20' : 'bg-vast/10'
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            complete ? 'bg-ok' : onDark ? 'bg-lumen' : 'bg-vast'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-6 space-y-4">
        {levels.map((level) => (
          <div key={level.id} className="card overflow-hidden">
            <div className="border-b-2 border-vast bg-lumen px-4 py-3 sm:px-5">
              <h4 className="text-xl">{level.name}</h4>
              <p className="mt-1 text-sm text-vast/60">{level.subtitle}</p>
            </div>
            <ul>
              {level.lessons.map((l) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  done={!!progress[l.id]?.qualified}
                  best={progress[l.id]}
                  isNext={l.id === nextLessonId}
                  onStart={() => onStart(l.id)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function LearnPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [overall, setOverall] = useState<ReturnType<typeof getOverallProgress> | null>(
    null
  );
  const { post, category, scribe, setPost, setCategory, setScribe } =
    useSelectedPost();

  useEffect(() => {
    setProgress(getAllLessonProgress());
    setOverall(getOverallProgress());
  }, []);

  const flat = useMemo(() => getFlatLessons(), []);
  const totalLessons = flat.length;
  const completed = flat.filter((l) => progress[l.id]?.qualified).length;

  const nextLessonId = useMemo(
    () => flat.find((l) => !progress[l.id]?.qualified)?.id ?? null,
    [flat, progress]
  );
  const nextLesson = flat.find((l) => l.id === nextLessonId);

  const xp = useMemo(() => earnedXp(progress), [progress]);
  const xpInfo = useMemo(() => getLevelProgress(xp), [xp]);
  const streak = useMemo(() => computeStreak(progress), [progress]);

  const start = useCallback(
    (id: string) => router.push(`${ROUTES.examLesson}/${id}`),
    [router]
  );

  const stageGroups = useMemo(
    () =>
      STAGES.map((s) => ({
        stage: s,
        levels: LEVELS.filter((l) => l.stage === s.id),
      })).filter((g) => g.levels.length > 0),
    []
  );

  // Split by slab, not by stage order — the order within each group is still
  // the curriculum's own.
  const foundation = stageGroups.filter((g) => g.stage.id < FEATURED_STAGE);
  const featured = stageGroups.filter((g) => g.stage.id === FEATURED_STAGE);
  const advanced = stageGroups.filter((g) => g.stage.id > FEATURED_STAGE);

  return (
    <>
      {/* ═══════════════════════════════════════════════════ head — cream */}
      <section className="px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="mx-auto w-full max-w-content">
          <div className="max-w-3xl">
            <p className="eyebrow">
              The course · six stages ·{' '}
              <span className="tnum">{totalLessons}</span> lessons
            </p>
            <h1 className="mt-6 text-5xl sm:text-7xl">
              Start at zero.
              <br />
              <em>Finish exam-ready.</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg text-vast/70">
              Not a generic typing course. The middle of it is the half and full
              mistakes that fail candidates who already type fast enough.
            </p>
          </div>

          <div className="mt-10">
            <PostSelector
              post={post}
              category={category}
              scribe={scribe}
              onPostChange={setPost}
              onCategoryChange={setCategory}
              onScribeChange={setScribe}
            />
          </div>

          {/* ----------------------------------------------------- continue */}
          {nextLesson && (
            <div
              className="on-dark card mt-4 flex flex-col gap-6 bg-vast p-6 text-lumen sm:flex-row sm:items-center sm:p-8"
              data-reveal
            >
              <div className="min-w-0 flex-1">
                <p className="eyebrow">
                  {completed === 0 ? 'Start here' : 'Continue where you left off'}
                </p>
                <h2 className="mt-3 text-3xl sm:text-4xl">{nextLesson.title}</h2>
                <p className="mt-3 text-base text-lumen/70">
                  {nextLesson.levelName} ·{' '}
                  <span className="tnum">
                    {Math.round(nextLesson.durationSec / 60)} min
                  </span>{' '}
                  · Lesson <span className="tnum">{nextLesson.index + 1}</span> of{' '}
                  <span className="tnum">{totalLessons}</span>
                </p>
              </div>
              <button
                onClick={() => start(nextLesson.id)}
                className="btn btn-primary btn-lg shrink-0"
              >
                <Play className="h-4 w-4" strokeWidth={2} fill="currentColor" />
                {completed === 0 ? 'Start lesson 1' : 'Continue'}
              </button>
            </div>
          )}

          {/* -------------------------------------------------------- stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" data-reveal>
            <StatTile
              icon={Check}
              label="Lessons done"
              value={`${completed}/${totalLessons}`}
            />
            <StatTile
              icon={Flame}
              label="Day streak"
              value={streak}
              sub={streak === 0 ? 'Practise today to start' : undefined}
            />
            <StatTile
              icon={Gauge}
              label="Avg speed"
              value={overall?.avgWpm ? `${overall.avgWpm.toFixed(0)} WPM` : '—'}
            />
            <StatTile
              icon={Target}
              label="Rank"
              value={getLevelName(xp)}
              sub={xpInfo.next ? `${xp}/${xpInfo.nextXp} XP` : `${xp} XP`}
            />
          </div>

          {/* ---------------------------------------------------- stage nav */}
          <nav
            aria-label="Jump to stage"
            className="no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-1"
          >
            {stageGroups.map(({ stage }) => (
              <a
                key={stage.id}
                href={`#stage-${stage.id}`}
                className={`chip shrink-0 transition-colors hover:bg-dawn ${
                  stage.id === FEATURED_STAGE ? 'chip-glow' : ''
                }`}
              >
                <span className="tnum">{stage.id}</span>
                {stage.name}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════ foundations — white slab */}
      {foundation.length > 0 && (
        <section className="slab slab-white">
          <div className="mx-auto w-full max-w-content px-5 sm:px-8">
            <div className="max-w-2xl" data-reveal>
              <p className="eyebrow">Stages 0–2</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">
                Learn the keyboard <em>properly</em>
              </h2>
              <p className="mt-5 max-w-xl text-lg text-vast/60">
                Posture and home row first, then every key in the order it
                actually turns up in an SSC passage — so you reach real words by
                the fourth lesson.
              </p>
            </div>

            <div className="mt-14 space-y-16">
              {foundation.map(({ stage, levels }) => (
                <StageSection
                  key={stage.id}
                  stage={stage}
                  levels={levels}
                  progress={progress}
                  nextLessonId={nextLessonId}
                  onStart={start}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═════════════════════════════ mistake mechanics — green slab */}
      {/* The differentiator gets its own slab and its own register: nothing
          else on the page is green, so the eye lands here. */}
      {featured.length > 0 && (
        <section className="on-dark slab slab-green">
          <div className="mx-auto w-full max-w-content px-5 sm:px-8">
            <div className="max-w-2xl" data-reveal>
              <span className="chip chip-glow">Only here</span>
              <h2 className="mt-5 text-4xl sm:text-6xl">
                The stage nobody else <em>teaches</em>
              </h2>
              <p className="mt-6 max-w-xl text-lg text-lumen/75">
                Candidates rarely fail on speed. They fail on capitalisation,
                spacing, punctuation, transposed words and omitted figures —
                half and full mistakes they were never shown. This stage drills
                each one against the Commission&rsquo;s own rules.
              </p>
            </div>

            <div className="mt-14 space-y-16">
              {featured.map(({ stage, levels }) => (
                <StageSection
                  key={stage.id}
                  stage={stage}
                  levels={levels}
                  progress={progress}
                  nextLessonId={nextLessonId}
                  onStart={start}
                  onDark
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════ exam pressure — cream slab */}
      {advanced.length > 0 && (
        <section className="slab slab-cream">
          <div className="mx-auto w-full max-w-content px-5 sm:px-8">
            <div className="max-w-2xl" data-reveal>
              <p className="eyebrow">Stages 4–5</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">
                Then type it <em>under pressure</em>
              </h2>
              <p className="mt-5 max-w-xl text-lg text-vast/60">
                No highlighting, no backspace, full duration, scored against the
                bar for the post you picked above.
              </p>
            </div>

            <div className="mt-14 space-y-16">
              {advanced.map(({ stage, levels }) => (
                <StageSection
                  key={stage.id}
                  stage={stage}
                  levels={levels}
                  progress={progress}
                  nextLessonId={nextLessonId}
                  onStart={start}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════ cta — lilac slab */}
      <section className="slab slab-lilac">
        <div className="mx-auto w-full max-w-content px-5 text-center sm:px-8">
          <h2 className="mx-auto max-w-2xl text-4xl sm:text-6xl" data-reveal>
            Ready for the <em>real thing?</em>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-vast/70" data-reveal>
            Take a full-length mock under exam conditions and see whether you
            clear the bar for {post.shortName}.
          </p>
          <div className="mt-9 flex justify-center" data-reveal>
            <Link href="/exam" className="btn btn-ink btn-lg">
              Take a mock test
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
