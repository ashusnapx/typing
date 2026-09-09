import type { Metadata } from 'next';
import { MarkingScheme } from '@/components/marking-scheme/marking-scheme';

/**
 * The page is a server shell so it keeps its metadata; the content is a client
 * component because it carries an English / Hinglish toggle, and the choice is
 * remembered per reader.
 */
export const metadata: Metadata = {
  title: 'Marking scheme',
  description:
    'How the SSC typing test and DEST are marked, in plain English or Hinglish: what a key depression is, every full and half mistake with worked examples, how net speed is calculated, and the exact speed and error limit for every post.',
  alternates: { canonical: '/marking-scheme' },
  robots: { index: true, follow: true },
};

export default function MarkingSchemePage() {
  return <MarkingScheme />;
}
