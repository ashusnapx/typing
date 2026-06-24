import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, doublePrecision, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const passageLanguage = {
  english: 'english',
  hindi: 'hindi',
} as const;

export const passageCategory = {
  ssc_chsl: 'ssc_chsl',
  ssc_cgl: 'ssc_cgl',
  banking: 'banking',
  railway: 'railway',
  general: 'general',
} as const;

export const passageDifficulty = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
} as const;

export const passages = pgTable('passages', {
  id: uuid('id').default(sql`generate_uuid_v7()`).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  contentHindi: text('content_hindi'),
  language: varchar('language', { length: 20 }).default('english').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).default('medium').notNull(),
  exactKeyDepressions: integer('exact_key_depressions').notNull(),
  wordCount: integer('word_count').notNull(),
  estimatedDifficultyScore: doublePrecision('estimated_difficulty_score'),
  topic: varchar('topic', { length: 255 }),
  source: varchar('source', { length: 255 }),
  sscExamYear: varchar('ssc_exam_year', { length: 20 }),
  readabilityScore: doublePrecision('readability_score'),
  avgCharacterFrequency: jsonb('avg_character_frequency'),
  weakWordDensity: jsonb('weak_word_density'),
  isVerified: boolean('is_verified').default(false).notNull(),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  isActive: boolean('is_active').default(true).notNull(),
  timesUsed: integer('times_used').default(0).notNull(),
  practiceSet: integer('practice_set'),
  isExamLength: boolean('is_exam_length').default(false).notNull(),
  embedding: jsonb('embedding'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('passage_category_idx').on(table.category),
  languageIdx: index('passage_language_idx').on(table.language),
  activeIdx: index('passage_active_idx').on(table.isActive),
}));
