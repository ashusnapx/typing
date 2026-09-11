'use client';

import { notFound, useParams } from 'next/navigation';
import { useMemo } from 'react';
import LEVELS from '@/lib/typing-curriculum';
import { LessonExam } from '@/components/exam/lesson-exam';
import { FullPageLoader } from '@/components/ui/loading-logo';

export default function LessonExamPage() {
  const params = useParams();
  const id = params?.id as string;

  const { lesson, levelName } = useMemo(() => {
    for (const level of LEVELS) {
      for (const l of level.lessons) {
        if (l.id === id) return { lesson: l, levelName: `Level ${level.id}: ${level.name}` };
      }
    }
    return { lesson: null, levelName: '' };
  }, [id]);

  /* A real 404, not a page that looks like one.
     This rendered its own 404 panel and still answered 200, so every mistyped
     or retired lesson id was a live page as far as a crawler was concerned —
     indexable, and counted as real content. `notFound()` hands it to the app's
     own not-found boundary with the status to match. */
  if (!lesson) {
    notFound();
  }

  return <LessonExam lesson={lesson} levelName={levelName} />;
}
