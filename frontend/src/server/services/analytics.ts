import { db } from '../db/client';
import { userAnalytics } from '../db/schema/user-analytics';
import { errorPatterns } from '../db/schema/error-patterns';
import { users } from '../db/schema/users';
import { eq, and, desc } from 'drizzle-orm';

export class AnalyticsService {
  async getUserAnalytics(userId: string) {
    const [analytics] = await db
      .select()
      .from(userAnalytics)
      .where(eq(userAnalytics.userId, userId))
      .limit(1);

    if (!analytics) return null;

    return {
      totalTests: analytics.totalTests,
      totalTimeSeconds: analytics.totalTimeSeconds,
      avgWpm: analytics.avgWpm,
      avgAccuracy: analytics.avgAccuracy,
      bestWpm: analytics.bestWpm,
      bestAccuracy: analytics.bestAccuracy,
      consistencyScore: analytics.consistencyScore,
      weakWords: analytics.weakWords,
      leftHandErrorRate: analytics.leftHandErrorRate,
      rightHandErrorRate: analytics.rightHandErrorRate,
      shiftKeyErrorRate: analytics.shiftKeyErrorRate,
      numberRowErrorRate: analytics.numberRowErrorRate,
      commonMistypes: analytics.commonMistypes,
      fatigueStartTime: analytics.fatigueStartTime,
      wpmTrend: analytics.wpmTrend,
      accuracyTrend: analytics.accuracyTrend,
    };
  }

  async updateUserAnalytics(userId: string, testResult: Record<string, any>) {
    let [analytics] = await db
      .select()
      .from(userAnalytics)
      .where(eq(userAnalytics.userId, userId))
      .limit(1);

    if (!analytics) {
      [analytics] = await db
        .insert(userAnalytics)
        .values({
          userId,
          totalTests: 0,
          totalTimeSeconds: 0,
        })
        .returning();
    }

    const totalTests = analytics.totalTests + 1;
    const totalTimeSeconds = analytics.totalTimeSeconds + Math.round(testResult.time_taken_seconds ?? 0);

    let avgWpm = analytics.avgWpm;
    if (testResult.net_wpm != null) {
      avgWpm = avgWpm != null
        ? (avgWpm * (totalTests - 1) + testResult.net_wpm) / totalTests
        : testResult.net_wpm;
    }

    let avgAccuracy = analytics.avgAccuracy;
    if (testResult.accuracy != null) {
      avgAccuracy = avgAccuracy != null
        ? (avgAccuracy * (totalTests - 1) + testResult.accuracy) / totalTests
        : testResult.accuracy;
    }

    let bestWpm = analytics.bestWpm;
    if (testResult.net_wpm != null && (bestWpm == null || testResult.net_wpm > bestWpm)) {
      bestWpm = testResult.net_wpm;
    }

    let bestAccuracy = analytics.bestAccuracy;
    if (testResult.accuracy != null && (bestAccuracy == null || testResult.accuracy > bestAccuracy)) {
      bestAccuracy = testResult.accuracy;
    }

    let consistencyScore = analytics.consistencyScore;
    if (testResult.consistency_score != null) {
      consistencyScore = consistencyScore != null
        ? (consistencyScore * (totalTests - 1) + testResult.consistency_score) / totalTests
        : testResult.consistency_score;
    }

    let weakWords: string[] = (analytics.weakWords as string[]) ?? [];
    if (testResult.weak_words) {
      const combined = [...weakWords, ...(testResult.weak_words as string[])];
      const wordCounts = new Map<string, number>();
      for (const w of combined) {
        if (typeof w === 'string') {
          wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
        }
      }
      weakWords = [...wordCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([w]) => w);
    }

    const last20TestIds: string[] = (analytics.last20TestIds as string[]) ?? [];
    last20TestIds.push(testResult.id as string);
    const updatedLast20 = last20TestIds.slice(-20);

    const wpmTrend: any[] = (analytics.wpmTrend as any[]) ?? [];
    if (testResult.net_wpm != null) {
      wpmTrend.push({ test_id: testResult.id, wpm: testResult.net_wpm, date: new Date().toISOString() });
    }
    const updatedWpmTrend = wpmTrend.slice(-50);

    const accuracyTrend: any[] = (analytics.accuracyTrend as any[]) ?? [];
    if (testResult.accuracy != null) {
      accuracyTrend.push({ test_id: testResult.id, accuracy: testResult.accuracy, date: new Date().toISOString() });
    }
    const updatedAccuracyTrend = accuracyTrend.slice(-50);

    await db
      .update(userAnalytics)
      .set({
        totalTests,
        totalTimeSeconds,
        avgWpm,
        avgAccuracy,
        bestWpm,
        bestAccuracy,
        consistencyScore,
        weakWords,
        last20TestIds: updatedLast20,
        wpmTrend: updatedWpmTrend,
        accuracyTrend: updatedAccuracyTrend,
        updatedAt: new Date(),
      })
      .where(eq(userAnalytics.userId, userId));
  }

  async getLeaderboard(params: {
    scope?: string;
    period?: string;
    limit?: number;
    userId?: string;
    state?: string;
    district?: string;
  }) {
    const limit = params.limit ?? 100;
    let query = db
      .select({
        id: users.id,
        fullName: users.fullName,
        state: users.state,
        district: users.district,
        xp: users.xp,
        level: users.level,
      })
      .from(users)
      .orderBy(desc(users.xp))
      .limit(limit);

    const entries: any[] = [];
    let userRank: number | null = null;

    const result = await query;

    for (let idx = 0; idx < result.length; idx++) {
      const user = result[idx];
      const rank = idx + 1;
      entries.push({
        rank,
        userId: user.id,
        fullName: user.fullName,
        state: user.state,
        district: user.district,
        xp: user.xp,
        level: user.level,
      });
      if (params.userId && user.id === params.userId) {
        userRank = rank;
      }
    }

    return { entries, userRank, totalUsers: result.length };
  }

  async recordErrorPattern(userId: string, patternType: string, patternValue: string) {
    const [existing] = await db
      .select()
      .from(errorPatterns)
      .where(
        and(
          eq(errorPatterns.userId, userId),
          eq(errorPatterns.patternType, patternType),
          eq(errorPatterns.patternValue, patternValue),
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(errorPatterns)
        .set({
          frequency: existing.frequency + 1,
          lastOccurredAt: new Date(),
        })
        .where(eq(errorPatterns.id, existing.id));
    } else {
      await db.insert(errorPatterns).values({
        userId,
        patternType,
        patternValue,
        frequency: 1,
        lastOccurredAt: new Date(),
      });
    }
  }
}

export const analyticsService = new AnalyticsService();
