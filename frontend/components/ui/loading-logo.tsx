'use client';

import Image from 'next/image';

export function LoadingLogo() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-paper">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <Image
            src="/images/logo.png"
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

export function ButtonSpinner() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block animate-spin">
        <Image
          src="/images/logo.png"
          alt=""
          width={20}
          height={20}
          className="w-5 h-5 border border-pencil/30"
          style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        />
      </span>
      <span>Please wait...</span>
    </span>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <Image
            src="/images/logo.png"
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
