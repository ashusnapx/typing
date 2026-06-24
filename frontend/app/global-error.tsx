'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-paper">
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="bg-white border-2 border-pencil p-8 max-w-lg text-center">
            <h2 className="text-xl font-bold font-marker text-pencil mb-2">
              Something went wrong
            </h2>
            <p className="text-pencil/60 font-hand mb-4">
              {error.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={reset}
              className="px-6 py-2 bg-pencil text-white font-bold font-hand border-2 border-pencil hover:bg-pencil/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
