import type { Metadata } from 'next';
import { ExamsStructuredData } from '@/components/seo/structured-data';

/* The listing page is a client component and cannot export metadata itself, so
   the segment carries it. Each exam page below overrides this with its own. */
export const metadata: Metadata = {
  title: 'SSC Typing Test Online — Free CGL & CHSL Practice',
  description:
    'Pick SSC CHSL or SSC CGL and sit the paper. Free SSC typing test practice with the real DEST interface, full and half mistakes, and your post’s own speed and error limits.',
  alternates: { canonical: '/exam' },
};

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ExamsStructuredData />
      {children}
    </>
  );
}
