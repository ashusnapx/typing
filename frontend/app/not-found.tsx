import Link from 'next/link';
import { CSS, ROUTES } from '@/lib/config';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-paper flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div
          className="inline-flex items-center justify-center w-28 h-28 border-[3px] border-pencil bg-postit mb-6"
          style={{ borderRadius: CSS.radii.sm }}
        >
          <span className="text-5xl font-bold text-pencil font-marker">404</span>
        </div>

        <h1 className="text-3xl font-bold text-pencil font-marker mb-2">
          Page Not Found
        </h1>

        <p className="text-lg text-pencil/60 font-hand mb-8 leading-relaxed">
          This page seems to have wandered off like a distracted student.
          <br />
          Let&apos;s get you back on track.
        </p>

        <div
          className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-white border-2 border-pencil shadow-hard-sm mb-8"
          style={{ borderRadius: CSS.radii.md }}
        >
          <Link
            href={ROUTES.home}
            className={`inline-flex items-center px-6 py-3 border-[3px] border-pencil bg-white text-pencil font-hand text-lg ${CSS.shadows.md} hover:bg-accent hover:text-white hover:${CSS.shadows.hover} transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none`}
            style={{ borderRadius: CSS.radii.sm }}
          >
            Go Home
          </Link>
          <Link
            href={ROUTES.examPractice}
            className={`inline-flex items-center px-6 py-3 border-[3px] border-pencil bg-muted text-pencil font-hand text-lg ${CSS.shadows.md} hover:bg-blue-pen hover:text-white hover:${CSS.shadows.hover} transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none`}
            style={{ borderRadius: CSS.radii.sm }}
          >
            Start Typing
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-pencil/40 font-hand">Try these instead:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: '/exam/chsl', label: 'SSC CHSL' },
              { href: '/exam/cgl-dest', label: 'SSC CGL DEST' },
              { href: '/learn', label: 'Learn Typing' },
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/coach', label: 'AI Coach' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 border-2 border-pencil/20 text-sm text-pencil/50 font-hand hover:text-pencil hover:border-pencil/50 transition-colors"
                style={{ borderRadius: CSS.radii.sm }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
