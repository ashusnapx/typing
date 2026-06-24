import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { aiCoach } from '../../services/ai-coach';
import { qualificationPredictor } from '../../services/qualification-predictor';
import { typingTests } from '../../db/schema/typing-tests';
import { db } from '../../db/client';
import { eq, desc } from 'drizzle-orm';

export const aiCoachRouter = router({
  feedback: protectedProcedure
    .input(z.object({ testId: z.string() }))
    .query(async ({ input, ctx }) => {
      const [test] = await db
        .select()
        .from(typingTests)
        .where(
          eq(typingTests.id, input.testId) &&
          eq(typingTests.userId, ctx.user.id)
        )
        .limit(1);

      if (!test) {
        return { error: 'Test not found' };
      }

      const recentTests = await db
        .select()
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id))
        .orderBy(desc(typingTests.createdAt))
        .limit(20);

      const testData = {
        accuracy: test.accuracy,
        net_wpm: test.netWpm,
        gross_wpm: test.grossWpm,
        backspace_count: 0,
        pause_count: 0,
        total_pause_duration_seconds: 0,
        time_taken_seconds: test.durationSeconds,
        weak_words: [],
        consistency_score: 100,
        typed_content: '',
        original_content: '',
        space_errors: test.spaceErrors,
        time_utilization_percentage: 100,
      };

      const recentData = recentTests.map(t => ({
        net_wpm: t.netWpm,
        accuracy: t.accuracy,
        consistency_score: 100,
      }));

      return aiCoach.generateFeedback(testData, recentData);
    }),

  qualification: protectedProcedure
    .input(z.object({
      language: z.string().default('english'),
    }))
    .query(async ({ input, ctx }) => {
      const recentTests = await db
        .select()
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id))
        .orderBy(desc(typingTests.createdAt))
        .limit(20);

      const formatted = recentTests.map(t => ({
        net_wpm: t.netWpm,
        accuracy: t.accuracy,
        consistency_score: 100,
      }));

      return {
        chsl: qualificationPredictor.predictChslQualification(formatted, input.language),
        cgl_dest: qualificationPredictor.predictCglDestQualification(formatted),
      };
    }),

  drills: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const recentTests = await db
        .select()
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id))
        .orderBy(desc(typingTests.createdAt))
        .limit(10);

      if (recentTests.length === 0) {
        return {
          dailyDrills: [
            { name: 'Getting Started', description: 'Complete your first typing test to get personalized drills', durationMinutes: 5, type: 'assessment' },
          ],
          weakWordExercises: [],
          speedExercises: [],
          accuracyExercises: [],
        };
      }

      const [latest] = recentTests;
      const testData = {
        accuracy: latest.accuracy,
        net_wpm: latest.netWpm,
        backspace_count: 0,
        pause_count: 0,
        weak_words: [],
        consistency_score: 100,
        space_errors: latest.spaceErrors,
        time_utilization_percentage: 100,
      };

      const feedback = aiCoach.generateFeedback(testData, []);
      return {
        dailyDrills: feedback.dailyDrills,
        weakWordExercises: feedback.weakWordExercises,
        speedExercises: feedback.speedExercises,
        accuracyExercises: feedback.accuracyExercises,
      };
    }),
});
