import type { Metadata } from 'next';
import { TypingExam } from '@/components/exam/typing-exam';
import { getPassagePool } from '@/lib/passages/server';


export const metadata: Metadata = {
  title: "SSC DEO Grade 'A' Skill Test — 15,000 KDPH Practice",
  description: "Free practice for the SSC CHSL DEO Grade 'A' (CAG) skill test: 15,000 key depressions per hour over 15 minutes, 3,700–4,000 depressions.",
  alternates: { canonical: '/exam/chsl-deo-grade-a' },
};


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
