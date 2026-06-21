import { WOBBLY_RADII } from '@/lib/config';

const FAQ_ITEMS = [
  {
    q: 'Is the SSC CGL typing test 10 or 15 minutes?',
    a: 'The typing test for SSC CGL Data Entry Operator (DEO) posts is typically 15 minutes with a target of 8,000 key depressions per hour (KDPH), which equals approximately 26-27 WPM.',
  },
  {
    q: 'What is KDPH in SSC CGL DEO typing test?',
    a: '8,000 KDPH (Key Depressions Per Hour) is required for SSC CGL DEO posts. This translates to roughly 1 keystroke every 0.45 seconds, or approximately 26-27 net WPM.',
  },
  {
    q: 'Can I use Ctrl+Z (undo) in TCS iON typing test?',
    a: 'No, Ctrl+Z and other keyboard shortcuts are disabled in the TCS iON exam interface. Only basic typing keys and backspace work.',
  },
  {
    q: 'What is blind mode in typing test?',
    a: 'Blind mode hides all error highlights during the test, exactly like real TCS iON exams. Errors are only revealed at the end with the detailed SSC evaluation report.',
  },
  {
    q: 'What passage length is used in SSC typing tests?',
    a: 'SSC passages are approximately 1750–2625 keystrokes for 10-minute and 15-minute tests respectively, targeting 35 WPM (net) qualifying speed.',
  },
  {
    q: 'How do I improve my SSC CGL typing speed?',
    a: 'Practice daily for 30 minutes: 10 min warm-up, 15 min full test in blind mode, 5 min error review. Focus on accuracy first — speed follows naturally after 2-3 weeks.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-pencil font-marker -rotate-1 mb-8">
          Frequently Asked Questions
        </h1>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="bg-white border-2 border-pencil shadow-hard-sm group open:pb-4"
              style={{ borderRadius: WOBBLY_RADII.md }}
            >
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none text-base font-bold text-pencil font-marker hover:bg-muted transition-colors [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span className="text-pencil/30 group-open:rotate-180 transition-transform text-lg font-mono">
                  ▾
                </span>
              </summary>
              <div className="px-6 pt-2 text-base font-hand text-pencil/70 leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </main>
    </div>
  );
}
