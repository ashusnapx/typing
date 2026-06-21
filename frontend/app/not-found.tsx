import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-paper flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div
          className="inline-flex items-center justify-center w-28 h-28 border-[3px] border-pencil bg-postit mb-6"
          style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
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
          style={{ borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px' }}
        >
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border-[3px] border-pencil bg-white text-pencil font-hand text-lg shadow-hard hover:bg-accent hover:text-white hover:shadow-hard-hover transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            Go Home
          </Link>
          <Link
            href="/exam/practice"
            className="inline-flex items-center px-6 py-3 border-[3px] border-pencil bg-muted text-pencil font-hand text-lg shadow-hard hover:bg-blue-pen hover:text-white hover:shadow-hard-hover transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
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
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/coach', label: 'AI Coach' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 border-2 border-pencil/20 text-sm text-pencil/50 font-hand hover:text-pencil hover:border-pencil/50 transition-colors"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
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
