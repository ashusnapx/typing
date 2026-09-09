import { APP, EXAM_MODES } from '@/lib/config';
import { getFlatLessons } from '@/lib/typing-curriculum';

/**
 * What this site is, in the form a search engine reads.
 *
 * There was none of this: a crawler arriving here had a title, a paragraph and
 * nothing else to tell it that these pages are a free practice tool for a
 * named public examination. Structured data is what earns a result that shows
 * the price and the sub-links rather than a bare blue line.
 *
 * Every figure is read from the same config the product is scored against, so
 * a schema claiming 35 WPM cannot outlive a rule change.
 */

function Json({ id, data }: { id: string; data: unknown }) {
  return (
    <script
      type="application/ld+json"
      id={id}
      // Static, and built from our own config — no user input reaches it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const ORG_ID = `${APP.url}/#organisation`;
const SITE_ID = `${APP.url}/#website`;

export function SiteStructuredData() {
  const organisation = {
    '@type': 'EducationalOrganization',
    '@id': ORG_ID,
    name: APP.fullName,
    alternateName: APP.name,
    url: APP.url,
    logo: `${APP.url}${APP.logo}`,
    description: APP.description,
    areaServed: { '@type': 'Country', name: 'India' },
  };

  const website = {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: APP.url,
    name: APP.name,
    publisher: { '@id': ORG_ID },
    inLanguage: ['en-IN', 'hi-IN'],
  };

  /* The product itself: a free web application for a named exam. This is what
     lets a result say "Free" rather than leaving a searcher to guess. */
  const app = {
    '@type': 'WebApplication',
    name: `${APP.name} — SSC Typing Test`,
    url: `${APP.url}/exam`,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any modern browser',
    browserRequirements: 'Requires a physical keyboard',
    inLanguage: ['en-IN', 'hi-IN'],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@id': ORG_ID },
    featureList: [
      'SSC CGL DEST practice at 8,000 key depressions per hour',
      'SSC CHSL typing test practice at 35 WPM',
      'Hindi typing test at 30 WPM',
      'Full and half mistakes marked to the Commission’s rules',
      'Mistake-by-mistake report with the lesson that fixes each one',
      'Free typing course from the home row up',
    ],
  };

  return (
    <Json
      id="ld-site"
      data={{ '@context': 'https://schema.org', '@graph': [organisation, website, app] }}
    />
  );
}

/** The exams themselves, so a search for a post can surface the right page. */
export function ExamsStructuredData() {
  return (
    <Json
      id="ld-exams"
      data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'SSC typing and skill tests',
        itemListElement: EXAM_MODES.map((m, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${m.title} typing test practice`,
          url: `${APP.url}${m.href}`,
        })),
      }}
    />
  );
}

/** The course, so "learn typing for SSC" can find the free lessons. */
export function CourseStructuredData() {
  const lessons = getFlatLessons();
  return (
    <Json
      id="ld-course"
      data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'Typing for SSC exams — from the home row to a full passage',
        description: `A free ${lessons.length}-lesson typing course written for someone who has not used a keyboard properly, ending at SSC CGL and CHSL exam speed.`,
        url: `${APP.url}/learn`,
        inLanguage: ['en-IN', 'hi-IN'],
        isAccessibleForFree: true,
        provider: { '@id': ORG_ID },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', category: 'Free' },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: `PT${Math.round(
            lessons.reduce((s, l) => s + (l.durationSec ?? 0), 0) / 60,
          )}M`,
        },
      }}
    />
  );
}
