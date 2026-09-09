import type { Metadata } from 'next';
import { CourseStructuredData } from '@/components/seo/structured-data';

export const metadata: Metadata = {
  title: 'Learn Typing for SSC — Free Course from Zero',
  description:
    'A free typing course for SSC aspirants, written for someone who has never used a keyboard properly. Home row to full exam passages, with the finger for every key drawn out.',
  alternates: { canonical: '/learn' },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CourseStructuredData />
      {children}
    </>
  );
}
