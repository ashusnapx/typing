import { TypingExam } from '@/components/exam/typing-exam';
import { getPassagePool } from '@/lib/passages/server';

// Passages change only when we ship a migration, so the page is cached rather
// than rebuilt per request.
export const revalidate = 3600;

export default async function SSCChslDeoGradeAPage() {
  const passagePool = await getPassagePool();

  return (
    <TypingExam
      mode="ssc_chsl_deo_grade_a"
      durationSeconds={900}
      wpmTarget={0}
      passagePool={passagePool}
    />
  );
}
