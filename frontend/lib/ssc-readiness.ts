import { getAllLessonProgress, getOverallProgress } from './lesson-storage';
import { loadMasteryData } from './mastery-engine';

export interface SSCReadinessBreakdown {
  readinessScore: number; // 0-100
  speedScore: number;     // 0-100
  accuracyScore: number;  // 0-100
  enduranceScore: number; // 0-100
  curriculumProgress: number; // 0-100
  avgWpm: number;
  avgAccuracy: number;
  qualifiedLessonsCount: number;
  weakFingerZones: string[];
}

export function calculateSSCReadiness(): SSCReadinessBreakdown {
  const progress = getOverallProgress();
  const allLessons = getAllLessonProgress();
  
  // Total lessons in our new curriculum is 45 lessons
  const TOTAL_LESSONS = 45;
  const completedLessons = Object.values(allLessons).filter(l => l.bestWpm > 0);
  const completedCount = completedLessons.length;
  const qualifiedCount = completedLessons.filter(l => l.qualified).length;

  // 1. Speed Score
  // SSC English typing target is 35 WPM. Let's compute average speed from completed lessons.
  // We place higher weight on the later levels (Level 8 to 12) if completed.
  const latestLessons = Object.values(allLessons)
    .filter(l => l.lessonId.startsWith('l8') || l.lessonId.startsWith('l9') || l.lessonId.startsWith('l10') || l.lessonId.startsWith('l11') || l.lessonId.startsWith('l12'));
  
  let representativeWpm = progress.avgWpm;
  if (latestLessons.length > 0) {
    const latestSum = latestLessons.reduce((sum, l) => sum + l.bestWpm, 0);
    representativeWpm = (progress.avgWpm + (latestSum / latestLessons.length)) / 2;
  }

  // Speed score is 0-100. Qualifying target is 35 WPM, but we scale it such that 40+ WPM is a 100.
  const speedScore = Math.max(0, Math.min(100, Math.round((representativeWpm / 35) * 100)));

  // 2. Accuracy Score
  // SSC requires 95% accuracy (for UR). Below 90% is highly penalized.
  let representativeAccuracy = progress.avgAccuracy;
  if (latestLessons.length > 0) {
    const latestAccSum = latestLessons.reduce((sum, l) => sum + l.bestAccuracy, 0);
    representativeAccuracy = (progress.avgAccuracy + (latestAccSum / latestLessons.length)) / 2;
  }

  let accuracyScore = 100;
  if (representativeAccuracy < 95) {
    // 95% = 100, 90% = 50, 85% or below = 0
    accuracyScore = Math.max(0, Math.round(100 - (95 - representativeAccuracy) * 10));
  } else {
    // 95-100% scales between 100 and 105 (bonus for perfect accuracy)
    accuracyScore = Math.min(105, Math.round(100 + (representativeAccuracy - 95) * 1));
  }

  // 3. Endurance Score (based on long passages completed)
  // Level 10 (l10), Level 11 (l11), Level 12 (l12) lessons completion percentage
  const longPassageLessonIds = [
    // Level 10 Passage Endurance
    'l10-p1', 'l10-p2', 'l10-p3', 'l10-p4',
    // Level 11 Speed Building
    'l11-s1', 'l11-s2', 'l11-s3', 'l11-s4',
    // Level 12 Exam Simulation
    'l12-m1', 'l12-m2', 'l12-m3', 'l12-m4'
  ];

  const longPassagesCompleted = longPassageLessonIds.filter(id => allLessons[id] && allLessons[id].bestWpm > 0).length;
  const enduranceScore = TOTAL_LESSONS > 0 
    ? Math.round((longPassagesCompleted / longPassageLessonIds.length) * 100) 
    : 0;

  // 4. Curriculum Progress
  const curriculumProgress = Math.round((completedCount / TOTAL_LESSONS) * 100);

  // 5. Weak Finger Zones (derived from key accuracy)
  const masteryData = loadMasteryData();
  const fingerAccuracy: Record<string, { correct: number; total: number }> = {};
  
  Object.values(masteryData.keys).forEach(km => {
    // simple finger mapping fallback
    const key = km.key.toLowerCase();
    let finger = 'unknown';
    if ('asdfg'.includes(key)) finger = 'Left Hand (Home Row)';
    else if ('hjkl;'.includes(key)) finger = 'Right Hand (Home Row)';
    else if ('qwert'.includes(key)) finger = 'Left Hand (Top Row)';
    else if ('yuiop'.includes(key)) finger = 'Right Hand (Top Row)';
    else if ('zxcvb'.includes(key)) finger = 'Left Hand (Bottom Row)';
    else if ('nm,./'.includes(key)) finger = 'Right Hand (Bottom Row)';
    else if (key === ' ') finger = 'Thumbs';

    if (finger !== 'unknown') {
      if (!fingerAccuracy[finger]) fingerAccuracy[finger] = { correct: 0, total: 0 };
      fingerAccuracy[finger].correct += km.correctCount;
      fingerAccuracy[finger].total += km.attempts;
    }
  });

  const weakFingerZones: string[] = [];
  Object.entries(fingerAccuracy).forEach(([zone, stats]) => {
    const acc = stats.total > 0 ? (stats.correct / stats.total) * 100 : 100;
    if (acc < 92 && stats.total >= 5) {
      weakFingerZones.push(zone);
    }
  });

  // Calculate overall readiness score:
  // 40% Speed, 40% Accuracy, 10% Endurance, 10% Curriculum progress
  const readinessScore = Math.round(
    speedScore * 0.4 +
    accuracyScore * 0.4 +
    enduranceScore * 0.1 +
    curriculumProgress * 0.1
  );

  return {
    readinessScore: Math.max(0, Math.min(100, readinessScore)),
    speedScore,
    accuracyScore,
    enduranceScore,
    curriculumProgress,
    avgWpm: Math.round(representativeWpm),
    avgAccuracy: Math.round(representativeAccuracy * 10) / 10,
    qualifiedLessonsCount: qualifiedCount,
    weakFingerZones
  };
}
