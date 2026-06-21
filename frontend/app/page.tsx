import Link from 'next/link';
import { APP, HERO_STATS, EXAM_MODES, FEATURES, SSC_RULES, WOBBLY_RADII } from '@/lib/config';
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
  BookOpen,
} from 'lucide-react';

const SECTION_ICONS: Record<string, any> = {
  ScrollText, Brain, Award, BookOpen, Target, Keyboard, Play, BarChart3, Sparkles,
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-20 pb-16 text-center relative">
          <div className="absolute -top-4 right-12 hidden md:block animate-bounce-gentle">
            <div className="w-6 h-6 rounded-full border-[3px] border-pencil bg-accent" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-pencil font-marker leading-tight -rotate-1">
            {APP.tagLineFull.split('SSC')[0]}
            <span className="text-accent inline-block rotate-1">SSC Typing</span>{' '}
            <span className="inline-block -rotate-1">Simulator</span>
            <span className="inline-block text-accent animate-wiggle text-6xl">!</span>
          </h1>
          <p
            className="mt-6 text-xl md:text-2xl text-pencil/70 font-hand max-w-2xl mx-auto rotate-[0.5deg]"
          >
            Bilkul zero se typing sikhein. Exact SSC evaluation logic. TCS iON exam replica.
            AI-powered personalized coaching. Practice like the real exam, qualify with confidence.
          </p>

          <div className="hidden md:block absolute -left-12 top-1/2 text-pencil/30 text-6xl font-marker -rotate-12 select-none">
            &rarr;
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/learn" className="btn-hand text-xl px-10 py-4">
              <BookOpen className="w-5 h-5 mr-2" strokeWidth={3} />
              Learn from Scratch
            </Link>
            <Link href="/exam/mock" className="btn-hand-secondary text-xl px-10 py-4">
              <Target className="w-5 h-5 mr-2" strokeWidth={3} />
              Take Mock Test
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-16">
          {HERO_STATS.map((stat, i) => {
            const IconComp = SECTION_ICONS[stat.icon] || Award;
            const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-1'];
            return (
              <div key={stat.label}
                   className="bg-white border-2 border-pencil shadow-hard-sm p-6 text-center hover:shadow-hard transition-all duration-100"
                   style={{ borderRadius: WOBBLY_RADII.md, transform: `rotate(${rotations[i]})` }}>
                <div className="flex justify-center mb-2 text-pencil">
                  <IconComp className="w-6 h-6" strokeWidth={3} />
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label mt-1">{stat.label}</div>
              </div>
            );
          })}
        </section>

        {/* From Scratch CTA */}
        <section className="pb-16">
          <Link href="/learn"
                className="card-postit p-8 block -rotate-1 hover:rotate-0 transition-all duration-100 hover:shadow-hard group">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/10 rotate-[-3deg]" />
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 flex items-center justify-center border-2 border-pencil bg-white shrink-0"
                   style={{ borderRadius: WOBBLY_RADII.sm }}>
                <BookOpen className="w-8 h-8 text-pencil" strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-pencil font-marker">Typing Bilkul Zero se Seekhein</h2>
                <p className="text-lg text-pencil/70 font-hand mt-1">
                  Kabhi computer nahi chhua? Koi baat nahi. 10 levels mein home row se lekar SSC exam tak.
                  Har lesson ke saath guide aur practice text.
                </p>
                <span className="inline-flex items-center mt-2 text-base font-hand text-pencil/50 group-hover:text-pencil transition-colors">
                  Start Learning <ArrowRight className="w-4 h-4 ml-1" strokeWidth={3} />
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* Exam Modes */}
        <section className="pb-16">
          <div className="flex items-center space-x-4 mb-10 -rotate-1">
            <ScrollText className="w-8 h-8 text-accent" strokeWidth={3} />
            <h2 className="text-4xl font-bold text-pencil font-marker">Exam Modes</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXAM_MODES.map((mode, i) => {
              const IconComp = SECTION_ICONS[mode.icon] || Target;
              const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1'];
              return (
                <Link key={mode.id} href={mode.href}
                      className={`bg-white border-2 border-pencil shadow-hard-sm p-6 ${rotations[i]} hover:rotate-0 transition-all duration-100 hover:shadow-hard group relative`}>
                  {i === 0 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/10 rotate-[-3deg]" />}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center border-2 border-pencil bg-postit"
                         style={{ borderRadius: WOBBLY_RADII.sm }}>
                      <IconComp className="w-5 h-5" strokeWidth={3} />
                    </div>
                    <h3 className="text-xl font-bold text-pencil font-marker">{mode.title}</h3>
                  </div>
                  <p className="text-base text-pencil/70 font-hand">{mode.description}</p>
                  <div className="mt-3 flex items-center text-sm font-hand text-pencil/50 group-hover:text-pencil transition-colors">
                    Start now <ArrowRight className="w-4 h-4 ml-1" strokeWidth={3} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Features */}
        <section className="pb-16">
          <div className="flex items-center space-x-4 mb-10 rotate-1">
            <Brain className="w-8 h-8 text-blue-pen" strokeWidth={3} />
            <h2 className="text-4xl font-bold text-pencil font-marker">Why Typing Mania?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const IconComp = SECTION_ICONS[feature.icon] || Award;
              const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-2'];
              return (
                <div key={feature.title}
                     className={`bg-white border-2 border-pencil shadow-hard-sm p-6 ${rotations[i]} hover:rotate-0 transition-all duration-100 hover:shadow-hard`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center border-2 border-pencil bg-muted"
                         style={{ borderRadius: WOBBLY_RADII.sm }}>
                      <IconComp className="w-5 h-5" strokeWidth={3} />
                    </div>
                    <h3 className="text-lg font-bold text-pencil font-marker">{feature.title}</h3>
                  </div>
                  <p className="text-base text-pencil/70 font-hand">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SSC Rules */}
        <section className="pb-16">
          <div className="bg-postit border-2 border-pencil shadow-hard p-8 -rotate-1 hover:rotate-0 transition-transform duration-100 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-accent rounded-full border-2 border-pencil shadow-hard-sm" />
            <h2 className="text-2xl font-bold text-pencil font-marker mb-6">
              SSC Official Rules Implemented
            </h2>
            <div className="grid sm:grid-cols-2 gap-8">
              {Object.values(SSC_RULES).map((section) => (
                <div key={section.title}>
                  <h3 className="text-xl font-bold text-pencil font-hand underline decoration-accent decoration-2 underline-offset-4 mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-2 text-base text-pencil font-hand">
                    {section.rules.map((rule, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-accent mt-1">&rarr;</span>
                        <span dangerouslySetInnerHTML={{ __html: rule.replace(/(\d+)/g, '<strong>$1</strong>') }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
