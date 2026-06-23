import { APP, WOBBLY_RADII } from '@/lib/config';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-pencil font-marker -rotate-1 mb-8">Terms of Service</h1>
        <div className="bg-white border-2 border-pencil shadow-hard-sm p-8 space-y-6"
             style={{ borderRadius: WOBBLY_RADII.md }}>
          <p className="text-sm font-hand text-pencil/40">Last updated: June 2026</p>
          <section>
            <h2 className="text-xl font-bold text-pencil font-marker mb-2">Service Description</h2>
            <p className="text-base font-hand text-pencil/70 leading-relaxed">
              {APP.fullName} provides a typing practice and exam simulation platform for SSC typing test
              preparation. The platform includes progressive typing lessons, mock tests with SSC-standard
              evaluation, AI-powered coaching, and performance analytics.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-pencil font-marker mb-2">User Responsibilities</h2>
            <p className="text-base font-hand text-pencil/70 leading-relaxed">
              Users agree to use the platform for lawful purposes only. Creating multiple accounts,
              manipulating test results, or attempting to reverse-engineer the evaluation engine is
              prohibited.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-pencil font-marker mb-2">Disclaimer</h2>
            <p className="text-base font-hand text-pencil/70 leading-relaxed">
              {APP.fullName} is a practice platform and is not affiliated with the Staff Selection
              Commission (SSC) or Ediquity. While our evaluation engine is designed to mirror SSC patterns,
              we do not guarantee exam results or qualification. Practice results are indicative and
              should be used as a learning tool.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-pencil font-marker mb-2">Contact</h2>
            <p className="text-base font-hand text-pencil/70 leading-relaxed">
              For questions about these terms, email us at support@mathsmania.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
