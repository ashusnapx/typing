import type { Metadata } from 'next';
import { TypingExam } from '@/components/exam/typing-exam';
import { getPassagePool } from '@/lib/passages/server';


export const metadata: Metadata = {
  title: 'SSC Hindi Typing Test — Free 30 WPM Practice (Mangal)',
  description: 'Free SSC Hindi typing test practice at 30 WPM over 10 minutes, with matras, anusvara and nukta marked as spelling rather than punctuation. No sign-up.',
  alternates: { canonical: '/exam/hindi' },
};


// Passages change only when we ship a migration, so the page is cached rather
// than rebuilt per request. This route previously used `force-dynamic`, which
// opted every exam out of caching AND still left the passage fetch to run in
// the browser after hydration.
export const revalidate = 3600;

export default async function SSCHindiPage() {
  // Fetched here so the client starts with the passage already in hand.
  const passagePool = await getPassagePool();

  return (
    <TypingExam
      mode="ssc_hindi"
      durationSeconds={600}
      wpmTarget={30}
      lang="hindi"
      passagePool={passagePool}
    />
  );
}
