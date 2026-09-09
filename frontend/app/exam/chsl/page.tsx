import type { Metadata } from 'next';
import { TypingExam } from '@/components/exam/typing-exam';
import { getPassagePool } from '@/lib/passages/server';


export const metadata: Metadata = {
  title: 'SSC CHSL Typing Test — Free 35 WPM Practice (LDC / JSA)',
  description: 'Free SSC CHSL typing test practice. 10 minutes, 35 WPM in English, 7% error limit, marked with full and half mistakes exactly as the Commission marks them. No sign-up.',
  alternates: { canonical: '/exam/chsl' },
};


// Passages change only when we ship a migration, so the page is cached rather
// than rebuilt per request. This route previously used `force-dynamic`, which
// opted every exam out of caching AND still left the passage fetch to run in
// the browser after hydration.
export const revalidate = 3600;

export default async function SSCChslPage() {
  // Fetched here so the client starts with the passage already in hand.
  const passagePool = await getPassagePool();

  return (
    <TypingExam
      mode="ssc_chsl"
      durationSeconds={600}
      wpmTarget={35}
      passagePool={passagePool}
    />
  );
}
