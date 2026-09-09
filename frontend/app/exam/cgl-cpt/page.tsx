import type { Metadata } from 'next';
import { TypingExam } from '@/components/exam/typing-exam';
import { getPassagePool } from '@/lib/passages/server';


export const metadata: Metadata = {
  title: 'SSC CGL CPT — DEST Module Practice (5% error cap)',
  description: 'Free practice for the DEST module of the SSC CGL Computer Proficiency Test, marked against the strict 5% error cap that applies to ASO and Inspector posts.',
  alternates: { canonical: '/exam/cgl-cpt' },
};


// Passages change only when we ship a migration, so the page is cached rather
// than rebuilt per request.
export const revalidate = 3600;

export default async function SSCCglCptPage() {
  const passagePool = await getPassagePool();

  return (
    <TypingExam
      mode="ssc_cgl_cpt"
      durationSeconds={900}
      wpmTarget={0}
      passagePool={passagePool}
    />
  );
}
