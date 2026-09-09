import type { Metadata } from 'next';
import { TypingExam } from '@/components/exam/typing-exam';
import { getPassagePool } from '@/lib/passages/server';


export const metadata: Metadata = {
  title: 'SSC CHSL DEO Skill Test — Free 8,000 KDPH Practice',
  description: 'Free SSC CHSL Data Entry Operator skill test practice. 15 minutes, 8,000 key depressions per hour, 20% error allowance for unreserved candidates.',
  alternates: { canonical: '/exam/chsl-deo' },
};


// Passages change only when we ship a migration, so the page is cached rather
// than rebuilt per request.
export const revalidate = 3600;

export default async function SSCChslDeoPage() {
  const passagePool = await getPassagePool();

  return (
    <TypingExam
      mode="ssc_chsl_deo"
      durationSeconds={900}
      wpmTarget={0}
      passagePool={passagePool}
    />
  );
}
