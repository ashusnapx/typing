import { db } from '../db/client';
import { passages } from '../db/schema/passages';
import { eq, and, desc, sql, count } from 'drizzle-orm';

export class PassageService {
  async getPassage(passageId: string) {
    const [passage] = await db
      .select()
      .from(passages)
      .where(and(eq(passages.id, passageId), eq(passages.isActive, true)))
      .limit(1);
    return passage ?? null;
  }

  async getPassages(params: {
    category?: string;
    difficulty?: string;
    language?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [eq(passages.isActive, true)];
    if (params.category) conditions.push(eq(passages.category, params.category));
    if (params.difficulty) conditions.push(eq(passages.difficulty, params.difficulty));
    if (params.language) conditions.push(eq(passages.language, params.language));

    return db
      .select()
      .from(passages)
      .where(and(...conditions))
      .orderBy(desc(passages.createdAt))
      .offset(params.offset ?? 0)
      .limit(params.limit ?? 50);
  }

  async getRandomPassage(params: {
    category?: string;
    difficulty?: string;
    practiceSet?: number;
  }) {
    const category = params.category ?? 'ssc_chsl';
    const difficulty = params.difficulty ?? 'medium';
    const practiceSet = params.practiceSet;
    const isSsc = ['ssc_chsl', 'ssc_cgl'].includes(category);

    if (isSsc && !practiceSet) {
      const conditions = [
        eq(passages.isActive, true),
        eq(passages.category, category),
        eq(passages.isExamLength, true),
      ];
      if (difficulty) conditions.push(eq(passages.difficulty, difficulty));

      const [{ total }] = await db
        .select({ total: count() })
        .from(passages)
        .where(and(...conditions));

      if (total > 0) {
        const offset = Math.floor(Math.random() * total);
        const [passage] = await db
          .select()
          .from(passages)
          .where(and(...conditions))
          .offset(offset)
          .limit(1);
        if (passage) return passage;
      }
    }

    const conditions = [
      eq(passages.isActive, true),
      eq(passages.category, category),
    ];
    if (difficulty) conditions.push(eq(passages.difficulty, difficulty));
    if (practiceSet) conditions.push(eq(passages.practiceSet, practiceSet));

    const [{ total }] = await db
      .select({ total: count() })
      .from(passages)
      .where(and(...conditions));

    if (total === 0) return null;

    const offset = Math.floor(Math.random() * total);
    const [passage] = await db
      .select()
      .from(passages)
      .where(and(...conditions))
      .offset(offset)
      .limit(1);

    return passage ?? null;
  }

  formatContent(content: string, language?: string): string {
    if (!content) return content;
    if (language === 'hindi') return content.trim();

    let text = content.trim();
    text = text.replace(/  +/g, ' ');

    const words = text.split(/\s+/);
    const titleCaseWords = words.filter(w => w && w[0] >= 'A' && w[0] <= 'Z' && w.length > 1).length;
    const totalWords = words.length;

    if (totalWords >= 5 && titleCaseWords > totalWords * 0.8) {
      text = words.map((w, i) => {
        if (i === 0) return w.length > 1 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase();
        return w.toLowerCase();
      }).join(' ');
    }

    if (text.length > 0 && text[0] >= 'a' && text[0] <= 'z') {
      text = text[0].toUpperCase() + text.slice(1);
    }

    const sentences = text.split(/(?<=[.!?])\s+/);
    text = sentences.map(s => {
      s = s.trim();
      if (s.length > 0 && !'.!?'.includes(s[s.length - 1])) {
        s += '.';
      }
      return s;
    }).join(' ');

    return text;
  }

  async createPassage(data: Record<string, any>) {
    const cleaned: Record<string, any> = {};
    for (const field of ['content', 'content_hindi', 'title']) {
      if (data[field]) {
        let val = String(data[field])
          .replace(/<[^>]*>/g, '')
          .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
          .replace(/javascript:/g, '')
          .replace(/data:/g, '')
          .replace(/vbscript:/g, '')
          .slice(0, 10000);
        cleaned[field] = val;
      }
    }

    const insertData = {
      title: cleaned.title ?? data.title,
      content: cleaned.content ?? data.content,
      contentHindi: cleaned.content_hindi ?? data.content_hindi,
      language: data.language ?? 'english',
      category: data.category,
      difficulty: data.difficulty ?? 'medium',
      exactKeyDepressions: data.exactKeyDepressions,
      wordCount: data.wordCount,
      topic: data.topic,
      source: data.source,
      sscExamYear: data.sscExamYear,
      isExamLength: data.isExamLength ?? false,
    };

    if (insertData.content) {
      insertData.content = this.formatContent(insertData.content, insertData.language);
    }

    const [passage] = await db.insert(passages).values(insertData).returning();
    return passage;
  }

  async incrementUsage(passageId: string) {
    const passage = await this.getPassage(passageId);
    if (passage) {
      await db
        .update(passages)
        .set({ timesUsed: (passage.timesUsed ?? 0) + 1 })
        .where(eq(passages.id, passageId));
    }
  }
}

export const passageService = new PassageService();
