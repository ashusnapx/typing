import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { passageService } from '../../services/passage-service';

export const passagesRouter = router({
  get: publicProcedure
    .input(z.object({ passageId: z.string() }))
    .query(async ({ input }) => {
      return passageService.getPassage(input.passageId);
    }),

  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      difficulty: z.string().optional(),
      language: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return passageService.getPassages(input);
    }),

  random: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      difficulty: z.string().optional(),
      practiceSet: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return passageService.getRandomPassage(input);
    }),

  create: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      contentHindi: z.string().optional(),
      language: z.string().default('english'),
      category: z.string(),
      difficulty: z.string().default('medium'),
      exactKeyDepressions: z.number(),
      wordCount: z.number(),
      topic: z.string().optional(),
      source: z.string().optional(),
      sscExamYear: z.string().optional(),
      isExamLength: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      return passageService.createPassage(input);
    }),

  incrementUsage: publicProcedure
    .input(z.object({ passageId: z.string() }))
    .mutation(async ({ input }) => {
      await passageService.incrementUsage(input.passageId);
      return { success: true };
    }),
});
