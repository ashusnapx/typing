'use client';

import Image from 'next/image';

export function LoadingLogo() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-paper">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <Image
            src="/images/logo.jpg"
            alt="Loading"
            width={64}
            height={64}
            className="w-16 h-16 border-2 border-pencil shadow-hard-sm"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          />
        </div>
        <p className="text-lg text-pencil/60 font-hand">Loading...</p>
      </div>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <Image
            src="/images/logo.jpg"
            alt="Loading"
            width={64}
            height={64}
            className="w-16 h-16 border-2 border-pencil shadow-hard-sm"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          />
        </div>
        <p className="text-lg text-pencil/60 font-hand">Loading...</p>
      </div>
    </div>
  );
}
