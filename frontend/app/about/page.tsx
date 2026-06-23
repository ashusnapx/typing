import { APP, WOBBLY_RADII } from '@/lib/config';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-pencil font-marker -rotate-1 mb-8">About Us</h1>
        <div className="bg-white border-2 border-pencil shadow-hard-sm p-8 space-y-6"
             style={{ borderRadius: WOBBLY_RADII.md }}>
          <section>
            <h2 className="text-2xl font-bold text-pencil font-marker mb-3">What is {APP.fullName}?</h2>
            <p className="text-base text-pencil/70 font-hand leading-relaxed">
              {APP.fullName} is India&apos;s most accurate SSC typing exam simulator. We help students
              prepare for SSC CHSL, CGL DEST, and other government typing exams with exact
              evaluation logic that mirrors the real Ediquity platform.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-pencil font-marker mb-3">Why we built this</h2>
            <p className="text-base text-pencil/70 font-hand leading-relaxed">
              Lakhs of SSC aspirants struggle with the typing test because there&apos;s no practice
              platform that accurately simulates the real exam environment and evaluation. Most
              platforms use naive word matching that doesn&apos;t reflect how SSC actually evaluates.
              We built the exact Levenshtein Distance-based engine that SSC uses, so every practice
              session gives you real feedback on your exam readiness.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-pencil font-marker mb-3">Our mission</h2>
            <p className="text-base text-pencil/70 font-hand leading-relaxed">
              Make high-quality typing education accessible to every SSC aspirant in India, regardless
              of their background. From absolute beginners who have never touched a computer to
              advanced typers aiming for 40+ WPM, we provide a progressive curriculum that
              takes you from zero to exam-ready.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
