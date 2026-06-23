'use client';

import { CSS } from '@/lib/config';

const PHONETIC_MAP = [
  { eng: 'k', hin: 'क', eng2: 'kh', hin2: 'ख' },
  { eng: 'g', hin: 'ग', eng2: 'gh', hin2: 'घ' },
  { eng: 'ch', hin: 'च', eng2: 'chh', hin2: 'छ' },
  { eng: 'j', hin: 'ज', eng2: 'jh', hin2: 'झ' },
  { eng: 't', hin: 'त', eng2: 'th', hin2: 'थ' },
  { eng: 'd', hin: 'द', eng2: 'dh', hin2: 'ध' },
  { eng: 'n', hin: 'न', eng2: '', hin2: '' },
  { eng: 'p', hin: 'प', eng2: 'ph', hin2: 'फ' },
  { eng: 'b', hin: 'ब', eng2: 'bh', hin2: 'भ' },
  { eng: 'm', hin: 'म', eng2: '', hin2: '' },
  { eng: 'y', hin: 'य', eng2: 'r', hin2: 'र' },
  { eng: 'l', hin: 'ल', eng2: 'v', hin2: 'व' },
  { eng: 's', hin: 'स', eng2: 'sh', hin2: 'श' },
  { eng: 'h', hin: 'ह', eng2: '', hin2: '' },
];

const VOWELS = [
  { eng: 'a', hin: 'अ' },
  { eng: 'aa', hin: 'आ' },
  { eng: 'i', hin: 'इ' },
  { eng: 'ee', hin: 'ई' },
  { eng: 'u', hin: 'उ' },
  { eng: 'oo', hin: 'ऊ' },
  { eng: 'e', hin: 'ए' },
  { eng: 'ai', hin: 'ऐ' },
  { eng: 'o', hin: 'ओ' },
  { eng: 'au', hin: 'औ' },
  { eng: 'am', hin: 'अं' },
  { eng: 'ah', hin: 'अ:' },
];

const MATRA = [
  { eng: 'aa', hin: 'ा' },
  { eng: 'i', hin: 'ि' },
  { eng: 'ee', hin: 'ी' },
  { eng: 'u', hin: 'ु' },
  { eng: 'oo', hin: 'ू' },
  { eng: 'e', hin: 'े' },
  { eng: 'ai', hin: 'ै' },
  { eng: 'o', hin: 'ो' },
  { eng: 'au', hin: 'ौ' },
  { eng: 'am', hin: 'ं' },
  { eng: 'ah', hin: 'ः' },
];

export default function HindiKeyboardGuide() {
  return (
    <div className="w-full rounded-xl overflow-hidden border-2 border-pencil/20 shadow-hard-sm bg-white/80">
      <div className="px-4 py-2 bg-pencil/5 border-b-2 border-pencil/10">
        <span className="text-sm font-hand text-pencil/60">
          Hindi Typing Guide — English keyboard par Hindi kaise type karein
        </span>
      </div>
      <div className="p-4 space-y-4 text-sm">
        <p className="text-pencil/70 font-hand text-base">
          Roman script mein type karein, Hindi characters automatically aa jayenge.
        </p>

        <div>
          <h4 className="font-bold text-pencil font-marker text-xs mb-2 uppercase tracking-wider">Vyanjan (Consonants)</h4>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {PHONETIC_MAP.map(({ eng, hin, eng2, hin2 }) => (
              <div key={eng} className="flex flex-col items-center bg-paper border border-pencil/10 rounded p-1.5">
                <span className="text-base font-bold text-pencil">{hin}</span>
                <span className="text-xs text-pencil/40 font-mono">= {eng}</span>
                {eng2 && (
                  <>
                    <span className="text-base font-bold text-pencil">{hin2}</span>
                    <span className="text-xs text-pencil/40 font-mono">= {eng2}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-pencil font-marker text-xs mb-2 uppercase tracking-wider">Swar (Vowels)</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {VOWELS.map(({ eng, hin }) => (
              <div key={eng} className="flex items-center space-x-2 bg-paper border border-pencil/10 rounded p-1.5">
                <span className="text-base font-bold text-pencil">{hin}</span>
                <span className="text-xs text-pencil/40 font-mono">= {eng}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-pencil font-marker text-xs mb-2 uppercase tracking-wider">Matra (Vowel Signs)</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {MATRA.map(({ eng, hin }) => (
              <div key={eng} className="flex items-center space-x-2 bg-paper border border-pencil/10 rounded p-1.5">
                <span className="text-xl font-bold text-pencil">क{hin}</span>
                <span className="text-xs text-pencil/40 font-mono">का = k{eng}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-postit border-2 border-pencil p-3 rounded text-pencil/70 font-hand text-sm leading-relaxed"
             style={{ borderRadius: CSS.radii.sm }}>
          <p className="font-bold text-pencil font-marker text-xs mb-1 uppercase tracking-wider">Tip</p>
          <p>
            Example: &quot;namaste&quot; type karein → <span className="font-bold text-pencil">नमस्ते</span>
          </p>
          <p>
            Example: &quot;bharat&quot; type karein → <span className="font-bold text-pencil">भारत</span>
          </p>
          <p>
            Example: &quot;hindi typing&quot; type karein → <span className="font-bold text-pencil">हिंदी टाइपिंग</span>
          </p>
        </div>
      </div>
    </div>
  );
}
