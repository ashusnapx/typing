import { APP, EXAM_MODES, FOOTER, LEGAL } from '@/lib/config';
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
      /* `</script>` inside a JSON string ends the block early, and everything
         after it is parsed as markup. Nothing here is user-authored today, but
         it is all built from curriculum and config that people edit, and one
         stray angle bracket should not be able to turn a data island into an
         injection point. Escaping the opening bracket is invisible to a JSON
         parser and disarms the whole class. */
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

const ORG_ID = `${APP.url}/#organisation`;
const SITE_ID = `${APP.url}/#website`;
const OPERATOR_ID = `${LEGAL.operatorUrl}/#organisation`;

export function SiteStructuredData() {
  /* The house that publishes this site, as its own entity.
   *
   * This site named its operator in three metadata fields and nowhere a
   * crawler could act on: a string in `creator` is a label, not a link between
   * two things. Someone who knows the teaching brand and searches for it was
   * never going to be shown this product, because nothing on the page said the
   * two were related.
   *
   * A parent node with its own `@id` and `url` says it outright, and
   * `sameAs`/`subOrganization` give the claim something to hang on: the
   * channels below are the operator's own accounts, which is the evidence a
   * search engine reconciles an entity against. The link runs both ways —
   * `subOrganization` here, `parentOrganization` on the node below — because
   * one direction alone reads as a mention. */
  const operator = {
    '@type': 'EducationalOrganization',
    '@id': OPERATOR_ID,
    name: LEGAL.operator,
    url: LEGAL.operatorUrl,
    /* The same accounts the footer links. They belong to the house, so they
       identify the house — claiming them for this site instead would put two
       entities on one profile and reconcile as neither. */
    sameAs: FOOTER.socialLinks.map((link) => link.href),
    areaServed: { '@type': 'Country', name: 'India' },
    subOrganization: { '@id': ORG_ID },
  };

  const organisation = {
    '@type': 'EducationalOrganization',
    '@id': ORG_ID,
    name: APP.fullName,
    /* Both the bare product name and the name someone would use who knows the
       house but not this product. */
    alternateName: [APP.name, `${LEGAL.operator} Typing Test`],
    url: APP.url,
    logo: `${APP.url}${APP.logo}`,
    description: APP.description,
    areaServed: { '@type': 'Country', name: 'India' },
    parentOrganization: { '@id': OPERATOR_ID },
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
      data={{ '@context': 'https://schema.org', '@graph': [operator, organisation, website, app] }}
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
