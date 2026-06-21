import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import {
  ArrowRight,
  Target,
  Brain,
  BarChart3,
  Play,
  ScrollText,
  Keyboard,
  Award,
  Sparkles,
} from 'lucide-react';

const wobblyStyle = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };
const wobblyMd = { borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px' };

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-20 pb-16 text-center relative">
          <div className="absolute -top-4 right-12 hidden md:block animate-bounce-gentle">
            <div className="w-6 h-6 rounded-full border-[3px] border-pencil bg-accent" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-pencil font-marker leading-tight -rotate-1">
            India&apos;s Most Accurate{' '}
            <span className="text-accent inline-block rotate-1">SSC Typing</span>{' '}
            <span className="inline-block -rotate-1">Simulator</span>
            <span className="inline-block text-accent animate-wiggle text-6xl">!</span>
          </h1>
          <p
            className="mt-6 text-xl md:text-2xl text-pencil/70 font-hand max-w-2xl mx-auto rotate-[0.5deg]"
          >
            Exact SSC evaluation logic. TCS iON exam replica. AI-powered personalized coaching.
            Practice like the real exam, qualify with confidence.
          </p>

          {/* Hand-drawn arrow pointing to CTA */}
          <div className="hidden md:block absolute -left-12 top-1/2 text-pencil/30 text-6xl font-marker -rotate-12 select-none">
            &rarr;
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/exam/chsl"
              className="btn-hand text-xl px-10 py-4"
            >
              <Play className="w-5 h-5 mr-2" strokeWidth={3} fill="currentColor" />
              Start SSC CHSL Practice
            </Link>
            <Link
              href="/exam/mock"
              className="btn-hand-secondary text-xl px-10 py-4"
            >
              <Target className="w-5 h-5 mr-2" strokeWidth={3} />
              Take Mock Test
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-16">
          {[
            { value: '2M+', label: 'Students', icon: <Award className="w-6 h-6" strokeWidth={3} />, rotate: '-rotate-1' },
            { value: '99.9%', label: 'Uptime', icon: <BarChart3 className="w-6 h-6" strokeWidth={3} />, rotate: 'rotate-1' },
            { value: '50K+', label: 'Tests Daily', icon: <Keyboard className="w-6 h-6" strokeWidth={3} />, rotate: '-rotate-2' },
            { value: '95%', label: 'Accuracy Match', icon: <Target className="w-6 h-6" strokeWidth={3} />, rotate: 'rotate-1' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`card-hand p-6 text-center ${stat.rotate} hover:rotate-0 transition-transform duration-100`}
            >
              <div className="flex justify-center mb-2 text-pencil">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label mt-1">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Exam Modes */}
        <section className="pb-16">
          <div className="flex items-center space-x-4 mb-10 -rotate-1">
            <ScrollText className="w-8 h-8 text-accent" strokeWidth={3} />
            <h2 className="text-4xl font-bold text-pencil font-marker">Exam Modes</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'SSC CHSL Mode',
                desc: 'Exact SSC CHSL typing simulation. 35 WPM English, 10 minutes, qualifying nature.',
                link: '/exam/chsl',
                icon: <Target className="w-5 h-5" strokeWidth={3} />,
                rotate: '-rotate-1',
              },
              {
                title: 'SSC CGL DEST',
                desc: 'SSC CGL Data Entry Skill Test. 15 minutes, ~2000 key depressions.',
                link: '/exam/cgl-dest',
                icon: <Keyboard className="w-5 h-5" strokeWidth={3} />,
                rotate: 'rotate-1',
              },
              {
                title: 'SSC Hindi Typing',
                desc: 'Full Unicode Hindi support. 30 WPM requirement with exact evaluation.',
                link: '/exam/hindi',
                icon: <Keyboard className="w-5 h-5" strokeWidth={3} />,
                rotate: '-rotate-2',
              },
              {
                title: 'Practice Mode',
                desc: 'Learn at your own pace with real-time feedback and guidance.',
                link: '/exam/practice',
                icon: <Play className="w-5 h-5" strokeWidth={3} />,
                rotate: 'rotate-1',
              },
              {
                title: 'Blind Mode',
                desc: 'Advanced practice without seeing the keyboard output.',
                link: '/exam/blind',
                icon: <Sparkles className="w-5 h-5" strokeWidth={3} />,
                rotate: '-rotate-1',
              },
              {
                title: 'Mock Test',
                desc: 'Full real examination environment with timer and proctoring.',
                link: '/exam/mock',
                icon: <Target className="w-5 h-5" strokeWidth={3} />,
                rotate: 'rotate-2',
              },
              {
                title: 'TCS iON Replica',
                desc: 'Exact replica of TCS iON exam environment. Same layout, fonts, and experience.',
                link: '/exam/tcs-ion',
                icon: <Award className="w-5 h-5" strokeWidth={3} />,
                rotate: '-rotate-1',
              },
            ].map((mode, i) => (
              <Link
                key={mode.title}
                href={mode.link}
                className={`card-hand p-6 ${mode.rotate} hover:rotate-0 transition-all duration-100 hover:shadow-hard group relative`}
              >
                {/* Tape decoration on first card */}
                {i === 0 && <div className="tape" />}
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center border-2 border-pencil bg-postit"
                    style={wobblyStyle}
                  >
                    {mode.icon}
                  </div>
                  <h3 className="text-xl font-bold text-pencil font-marker">{mode.title}</h3>
                </div>
                <p className="text-base text-pencil/70 font-hand">{mode.desc}</p>
                <div className="mt-3 flex items-center text-sm font-hand text-pencil/50 group-hover:text-pencil transition-colors">
                  Start now <ArrowRight className="w-4 h-4 ml-1" strokeWidth={3} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="pb-16">
          <div className="flex items-center space-x-4 mb-10 rotate-1">
            <Brain className="w-8 h-8 text-blue-pen" strokeWidth={3} />
            <h2 className="text-4xl font-bold text-pencil font-marker">Why Maths Mania?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'SSC Error Engine v1', desc: 'Levenshtein Distance, Character-Level Diff, Word-Level Mapping. Not naive word matching.', icon: <Brain className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-1' },
              { title: 'Keystroke Intelligence', desc: 'Every keystroke analyzed. Heatmaps, error zones, typing rhythm graphs.', icon: <Keyboard className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
              { title: 'AI Typing Coach', desc: 'Personalized feedback after every test. Identifies weaknesses, suggests drills.', icon: <Sparkles className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-2' },
              { title: 'Qualification Prediction', desc: 'Predicts your SSC CHSL/CGL qualification probability with 93%+ confidence.', icon: <BarChart3 className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
              { title: 'Typing Replay', desc: 'Like Chess.com game review. Replay every keystroke, correction, and pause.', icon: <Play className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-1' },
              { title: 'TCS iON Replica', desc: 'Same layout, fonts, timer placement, instructions, and typing area as real exam.', icon: <Award className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-2' },
              { title: 'Smart Practice Generator', desc: 'If you struggle with words, generates passages focused on your weak areas.', icon: <Target className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-1' },
              { title: 'Leaderboards', desc: 'Global, State, District, City, College, and Friends leaderboards.', icon: <BarChart3 className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
              { title: 'Enterprise Grade', desc: '99.99% uptime, Kubernetes, Redis cluster, horizontal scaling.', icon: <Award className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-2' },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`card-hand p-6 ${feature.rotate} hover:rotate-0 transition-all duration-100 hover:shadow-hard`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center border-2 border-pencil bg-muted"
                    style={wobblyStyle}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-pencil font-marker">{feature.title}</h3>
                </div>
                <p className="text-base text-pencil/70 font-hand">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SSC Rules */}
        <section className="pb-16">
          <div
            className="card-postit p-8 -rotate-1 hover:rotate-0 transition-transform duration-100"
          >
            <div className="tack" />
            <h2 className="text-2xl font-bold text-pencil font-marker mb-6">
              SSC Official Rules Implemented
            </h2>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-pencil font-hand underline decoration-accent decoration-2 underline-offset-4 mb-3">
                  SSC CHSL Typing Test
                </h3>
                <ul className="space-y-2 text-base text-pencil font-hand">
                  <li className="flex items-start space-x-2">
                    <span className="text-accent mt-1">&rarr;</span>
                    <span>English: <strong>35 WPM</strong></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-accent mt-1">&rarr;</span>
                    <span>Hindi: <strong>30 WPM</strong></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-accent mt-1">&rarr;</span>
                    <span>Duration: <strong>10 Minutes</strong></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-accent mt-1">&rarr;</span>
                    <span>Nature: <strong>Qualifying</strong></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-accent mt-1">&rarr;</span>
                    <span>Evaluation: <strong>Speed + Accuracy</strong></span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-pencil font-hand underline decoration-blue-pen decoration-2 underline-offset-4 mb-3">
                  SSC CGL DEST
                </h3>
                <ul className="space-y-2 text-base text-pencil font-hand">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-pen mt-1">&rarr;</span>
                    <span>Duration: <strong>15 Minutes</strong></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-pen mt-1">&rarr;</span>
                    <span>~2000 Key Depressions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-pen mt-1">&rarr;</span>
                    <span>Nature: <strong>Qualifying</strong></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-pen mt-1">&rarr;</span>
                    <span>Environment: SSC Computer Based Skill Test</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-pencil py-8 mt-8">
        <div className="max-w-5xl mx-auto px-6 text-center font-hand text-base text-pencil/60">
          <p>&copy; 2026 Maths Mania. India&apos;s Most Accurate SSC Typing Exam Simulator.</p>
          <p className="mt-1">Not affiliated with SSC or TCS iON. This is a practice platform.</p>
        </div>
      </footer>
    </div>
  );
}
