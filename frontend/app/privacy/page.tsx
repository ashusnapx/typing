import { APP, WOBBLY_RADII } from '@/lib/config';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-pencil font-marker -rotate-1 mb-8">Privacy Policy</h1>
        <div className="bg-white border-2 border-pencil shadow-hard-sm p-8 space-y-6"
             style={{ borderRadius: WOBBLY_RADII.md }}>
          <p className="text-sm font-hand text-pencil/40">Last updated: June 2026</p>
          <section>
            <h2 className="text-xl font-bold text-pencil font-marker mb-2">Data We Collect</h2>
            <p className="text-base font-hand text-pencil/70 leading-relaxed">
              We collect only the data necessary to provide the typing practice service: your name, email
              address, typing test results (WPM, accuracy, error patterns), and account preferences.
              Typing test content includes the text you type and per-character timings for replay and
              analysis.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-pencil font-marker mb-2">How We Use It</h2>
            <p className="text-base font-hand text-pencil/70 leading-relaxed">
              Your data is used to generate personalized feedback, track your progress over time, power
              the AI coaching features, and show leaderboard rankings. We never sell your data to third
              parties.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-pencil font-marker mb-2">Data Storage</h2>
            <p className="text-base font-hand text-pencil/70 leading-relaxed">
              Your data is stored on our secure servers in India. We use industry-standard encryption
              for data in transit and at rest. You can request deletion of your account and associated
              data at any time by contacting us.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-pencil font-marker mb-2">Contact</h2>
            <p className="text-base font-hand text-pencil/70 leading-relaxed">
              For privacy-related queries, email us at support@mathsmania.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
