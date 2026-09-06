'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import LEVELS from '@/lib/typing-curriculum';
import { LessonExam } from '@/components/exam/lesson-exam';
import { FullPageLoader } from '@/components/ui/loading-logo';

export default function LessonExamPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { lesson, levelName } = useMemo(() => {
    for (const level of LEVELS) {
      for (const l of level.lessons) {
        if (l.id === id) return { lesson: l, levelName: `Level ${level.id}: ${level.name}` };
      }
    }
    return { lesson: null, levelName: '' };
  }, [id]);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold text-pencil/30 font-marker mb-4">404</div>
          <p className="text-lg text-pencil/60 font-hand mb-4">Lesson not found</p>
          <button onClick={() => router.push('/learn')} className="btn btn-primary btn-md">
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  return <LessonExam lesson={lesson} levelName={levelName} />;
}
