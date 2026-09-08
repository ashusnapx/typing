import { describe, it, expect } from 'vitest';
import { levelFromXp, getLevelFromXP, getLevelIndex, LEVEL_NAMES } from './utils';
import { getFlatLessons, getLessonById } from './typing-curriculum';
import { profileSchema } from './schemas';
import { TEST_MODES } from '@/types';
import { EXAM_MODES } from './config';
import { getModeDisplayName } from './utils';
import { judgeLesson, lessonXpFor } from './lesson-scoring';

/**
 * XP regression suite.
 *
 * Lesson XP was silently lost: the lesson screen reported it through
 * `updateProfile`, whose schema accepts only a name and an email, so the call
 * failed validation and threw — and because the store update sat in the
 * mutation's onSuccess, the XP vanished from the server *and* the client.
 * These tests pin the pieces that made that possible.
 */

describe('levelFromXp', () => {
  it('agrees with the rank actually shown to the user', () => {
    // The stored level column had three different formulas — floor(xp/100)+1
    // in the lesson screen, floor(sqrt(xp/100))+1 at submission, and the
    // LEVEL_NAMES thresholds on screen. Only one can be right, and it is the
    // one the user reads.
    for (const [i, level] of LEVEL_NAMES.entries()) {
      expect(levelFromXp(level.minXp)).toBe(i + 1);
      expect(getLevelFromXP(level.minXp)).toBe(level.name);
    }
  });

  it('is 1-based and never below the first rank', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(-50)).toBe(1);
  });

  it('holds a rank until the next threshold is actually reached', () => {
    const second = LEVEL_NAMES[1];
    expect(levelFromXp(second.minXp - 1)).toBe(1);
    expect(levelFromXp(second.minXp)).toBe(2);
  });

  it('caps at the highest rank', () => {
    const top = LEVEL_NAMES[LEVEL_NAMES.length - 1];
    expect(levelFromXp(top.minXp * 100)).toBe(LEVEL_NAMES.length);
    expect(getLevelIndex(top.minXp * 100)).toBe(LEVEL_NAMES.length - 1);
  });
});

describe('lesson rewards', () => {
  const lessons = getFlatLessons();

  it('gives every lesson a positive reward', () => {
    // The server resolves the award from the lesson id. A lesson with no
    // reward would credit 0 XP and look exactly like the bug being fixed.
    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      expect(lesson.xpReward, `${lesson.id} has no xpReward`).toBeGreaterThan(0);
    }
  });

  it('gives every lesson a unique id the server can resolve', () => {
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(getLessonById(id), `${id} does not resolve`).toBeDefined();
    }
  });

  it('rejects an unknown lesson id rather than guessing a reward', () => {
    expect(getLessonById('no-such-lesson')).toBeUndefined();
  });

  it('awards the full reward when cleared and a quarter when not', () => {
    // Mirrors user.awardLessonXp. Both the screen and the server apply this
    // rule, so it has to be stated once and asserted.
    const award = (reward: number, qualified: boolean) =>
      qualified ? reward : Math.round(reward * 0.25);

    const lesson = getLessonById(lessons[0].id)!;
    expect(award(lesson.xpReward, true)).toBe(lesson.xpReward);
    expect(award(lesson.xpReward, false)).toBe(Math.round(lesson.xpReward * 0.25));
    // A partial award is still an award — rounding must not wipe it out.
    for (const l of lessons) {
      expect(award(l.xpReward, false)).toBeGreaterThan(0);
    }
  });
});

describe('profileSchema', () => {
  it('cannot carry XP — which is why lessons must not report through it', () => {
    // This is the exact call the lesson screen used to make. It fails, and it
    // has always failed; the test exists so nobody reintroduces the path.
    const asXpUpdate = profileSchema.safeParse({ xp: 250, level: 3 });
    expect(asXpUpdate.success).toBe(false);

    // And a legitimate profile update still passes.
    const real = profileSchema.safeParse({
      full_name: 'Test Candidate',
      email: 'candidate@example.com',
    });
    expect(real.success).toBe(true);
  });
});

describe('judgeLesson', () => {
  /** A drill calibrated so the passage fills the duration. */
  const base = {
    passageChars: 200,
    durationSec: 180,
    targetWpm: 10,
    minAccuracy: 85,
  };

  it('does not clear a lesson abandoned halfway, however fast', () => {
    // The reported bug: ~50% of the passage typed, Finish pressed, and the
    // screen said "Lesson cleared" with full XP — because WPM is a rate over
    // the time spent and accuracy only counts keys pressed, so neither one
    // notices the half that was never typed.
    const v = judgeLesson({
      ...base,
      typedChars: 100,
      elapsedSeconds: 40,
      wpm: 44,
      accuracy: 93,
    });
    expect(v.qualified).toBe(false);
    expect(v.wentTheDistance).toBe(false);
    expect(v.completionPct).toBe(50);
  });

  it('clears a finished passage', () => {
    const v = judgeLesson({
      ...base,
      typedChars: 200,
      elapsedSeconds: 90,
      wpm: 44,
      accuracy: 93,
    });
    expect(v.qualified).toBe(true);
    expect(v.completionPct).toBe(100);
  });

  it('clears an unfinished passage if the clock ran out', () => {
    // Running the full duration is honest effort, and the WPM it produces is
    // already computed over that whole duration — so it needs no extra guard.
    const v = judgeLesson({
      ...base,
      typedChars: 140,
      elapsedSeconds: 180,
      wpm: 12,
      accuracy: 90,
    });
    expect(v.wentTheDistance).toBe(true);
    expect(v.qualified).toBe(true);
  });

  it('still fails a finished passage that misses either bar', () => {
    const slow = judgeLesson({ ...base, typedChars: 200, elapsedSeconds: 180, wpm: 8, accuracy: 99 });
    expect(slow.qualified).toBe(false);
    const sloppy = judgeLesson({ ...base, typedChars: 200, elapsedSeconds: 180, wpm: 40, accuracy: 60 });
    expect(sloppy.qualified).toBe(false);
  });

  it('lets a self-reporting drill clear without a passage', () => {
    // The mouse lesson ends on three gestures, not on characters. Holding it
    // to a character count would make it impossible to clear.
    const v = judgeLesson({
      ...base,
      typedChars: 3,
      elapsedSeconds: 10,
      wpm: 0,
      accuracy: 100,
      targetWpm: 0,
      selfReported: true,
    });
    expect(v.qualified).toBe(true);
  });
});

describe('lessonXpFor', () => {
  it('pays the full reward only for a pass', () => {
    expect(lessonXpFor(100, true)).toBe(100);
    expect(lessonXpFor(100, false)).toBe(25);
    expect(lessonXpFor(15, false)).toBe(4);
  });
});

describe('test modes', () => {
  it('covers every exam route the app offers', () => {
    // `typing_tests.mode` is a Postgres enum. When this list and the routes
    // drifted apart, three exam variants existed that no attempt could be
    // saved against — the candidate finished the test and the submission
    // failed on an enum violation.
    for (const mode of EXAM_MODES) {
      expect(TEST_MODES as readonly string[], mode.id).toContain(mode.id);
    }
  });

  it('covers the lesson mode lesson attempts are stored under', () => {
    expect(TEST_MODES as readonly string[]).toContain('lesson');
  });

  it('has a display name for every mode', () => {
    for (const mode of TEST_MODES) {
      // A missing name falls through to the raw key, which is what the XP
      // breakdown used to print.
      expect(getModeDisplayName(mode), mode).not.toBe(mode);
    }
  });
});
