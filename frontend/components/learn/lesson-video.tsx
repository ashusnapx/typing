'use client';

import { useEffect, useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import type { LessonVideo as LessonVideoData } from '@/lib/typing-curriculum';

/**
 * A chapter's video, in the language the learner reads in, credited to
 * whoever made it.
 *
 * Embedded, never re-hosted. The only thing that makes using someone else's
 * video lawful is YouTube's own player plus the creator's embedding setting —
 * if they have turned embedding off, this simply will not play, which is the
 * system working. The credit below is courtesy and good practice; it is not
 * what grants the right, and it would not rescue a copy we served ourselves.
 *
 * Nothing loads until it is asked for. A bare iframe contacts Google and sets
 * cookies the moment the page renders, for every learner who never presses
 * play — on a site with an Indian audience and a published privacy policy that
 * is a disclosure we would have to make on every chapter. A thumbnail and a
 * button cost one image, and the embed appears only once someone chooses it.
 */

/* The same key the marking scheme writes, so a learner who picked Hinglish to
   read the rules is offered the Hindi video without asking for it twice. */
const LANG_KEY = 'tm-lang';

type Lang = 'en' | 'hi';

const LABEL: Record<Lang, string> = { en: 'English', hi: 'Hindi' };

export function LessonVideo({ videos }: { videos: LessonVideoData[] }) {
  const available = videos.filter(Boolean);
  const [lang, setLang] = useState<Lang>(available[0]?.lang ?? 'en');
  const [playing, setPlaying] = useState(false);

  /* Read the stored preference after mount rather than during render: the
     server has no localStorage, and seeding state from it would hand the
     client a different first paint than the HTML it was sent. */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if ((saved === 'en' || saved === 'hi') && available.some((v) => v.lang === saved)) {
        setLang(saved);
      }
    } catch {
      /* Private windows and blocked site data throw on access. The default
         stands; a remembered language is a convenience, not a requirement. */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (available.length === 0) return null;

  const video = available.find((v) => v.lang === lang) ?? available[0];

  const choose = (next: Lang) => {
    setLang(next);
    /* Switching language switches video, so the old frame has to go: leaving
       it mounted would keep the previous language playing under the new
       label. */
    setPlaying(false);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      /* Not being able to remember it is not a reason to refuse the switch. */
    }
  };

  /* youtube-nocookie is YouTube's privacy-enhanced host: it defers its
     tracking cookies until playback actually begins. */
  const src =
    `https://www.youtube-nocookie.com/embed/${video.youtubeId}` +
    '?autoplay=1&rel=0&modestbranding=1';

  /* The thumbnail comes from YouTube's image host, which img-src already
     allows. hqdefault exists for every video; maxres does not. */
  const poster = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <figure className="card flex flex-col overflow-hidden">
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-vast bg-lumen-dark px-4 py-2.5">
        <span className="eyebrow">Watch it done</span>
        {available.length > 1 && (
          <div role="radiogroup" aria-label="Video language" className="segment">
            {available.map((v) => (
              <button
                key={v.lang}
                type="button"
                role="radio"
                aria-checked={v.lang === lang}
                data-active={v.lang === lang}
                onClick={() => choose(v.lang)}
                className="segment-item text-sm"
              >
                {LABEL[v.lang]}
              </button>
            ))}
          </div>
        )}
      </figcaption>

      <div className="relative aspect-video bg-vast">
        {playing ? (
          <iframe
            /* Keyed by id so switching language mounts a new frame rather
               than reusing the old one's player state. */
            key={video.youtubeId}
            src={src}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play: ${video.title}`}
          >
            {/* Plain <img>: this is a third-party host and the file is a fixed
                thumbnail, so Next's optimiser would add a round trip and a
                remote-pattern entry for nothing. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster}
              alt=""
              className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-95"
              loading="lazy"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-vast bg-accent transition-transform group-hover:scale-105">
                <Play className="ml-0.5 h-6 w-6" strokeWidth={2.5} fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>

      {/* The credit, and a way to reach the creator's own channel. */}
      <div className="mt-auto border-t-2 border-vast px-4 py-3">
        <p className="text-[15px] font-medium leading-snug">{video.title}</p>
        <p className="mt-1 text-sm text-vast/60">
          Video by{' '}
          <a
            href={video.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-vast"
          >
            {video.creator}
            <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
          </a>
          . Embedded from YouTube; all rights remain with the creator.
        </p>
      </div>
    </figure>
  );
}
