import Link from 'next/link';
import { APP, HERO_STATS, EXAM_MODES, FEATURES, SSC_RULES, WOBBLY_RADII, PAIN_POINTS, TESTIMONIALS } from '@/lib/config';
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
  Monitor,
  Calculator,
  EyeOff,
  GraduationCap,
  Star,
  Quote,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

const SECTION_ICONS: Record<string, any> = {
  ScrollText, Brain, Award, BookOpen, Target, Keyboard, Play, BarChart3, Sparkles, Monitor, Calculator, EyeOff, GraduationCap,
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-20 pb-12 text-center relative">
          <div className="absolute -top-4 right-12 hidden md:block animate-bounce-gentle">
            <div className="w-6 h-6 rounded-full border-[3px] border-pencil bg-accent" />
          </div>

          <div className="inline-flex items-center space-x-2 bg-accent/10 border-2 border-accent/30 rounded-full px-5 py-2 mb-6 rotate-[-1deg]">
            <AlertTriangle className="w-4 h-4 text-accent" strokeWidth={3} />
            <span className="text-sm font-hand text-accent font-bold">
              90% typing mocks use wrong formula — aapka bhi?
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-pencil font-marker leading-tight -rotate-1">
            <span className="text-accent inline-block rotate-1">SSC Typing</span>{' '}
            <span className="inline-block -rotate-1">Mock Jo Exam Se</span>
            <br />
            <span className="inline-block rotate-1 text-5xl md:text-6xl">Bilkul Match Karta Hai</span>
            <span className="inline-block text-accent animate-wiggle text-6xl">!</span>
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-pencil/70 font-hand max-w-3xl mx-auto rotate-[0.5deg]">
            Zyada tar typing mocks <strong className="text-pencil">Gross WPM</strong> dikhate hain ya
            interface hi alag hota hai. Maths Mania woh platform hai jo <strong className="text-pencil">exact SSC
             Net WPM formula</strong> aur <strong className="text-pencil">Ediquity replica</strong> dono deta hai.
            Practice real jaisi, result real jaisa.
          </p>

          <div className="hidden md:block absolute -left-12 top-1/2 text-pencil/30 text-6xl font-marker -rotate-12 select-none">
            &rarr;
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/learn" className="btn-hand text-xl px-10 py-4">
              <BookOpen className="w-5 h-5 mr-2" strokeWidth={3} />
              Free Typing Course
            </Link>
            <Link href="/exam/mock" className="btn-hand-secondary text-xl px-10 py-4">
              <Target className="w-5 h-5 mr-2" strokeWidth={3} />
              Real Mock Test Try Karein
            </Link>
          </div>

          <p className="mt-4 text-sm text-pencil/40 font-hand">
            No registration required • 100% Free • Exact SSC Evaluation
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12">
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

        {/* Exam Modes — top of content */}
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

        {/* Pain Points — Problem vs Solution */}
        <section className="pb-16">
          <div className="bg-white border-2 border-pencil shadow-hard-sm p-8 md:p-10 -rotate-[0.5deg] hover:rotate-0 transition-transform duration-100 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-400 rounded-full border-2 border-pencil shadow-hard-sm" />

            <div className="flex items-center space-x-4 mb-8">
              <AlertTriangle className="w-8 h-8 text-red-400" strokeWidth={3} />
              <h2 className="text-3xl md:text-4xl font-bold text-pencil font-marker">
                Yeh Problems Hai Kya?
              </h2>
            </div>

            <p className="text-lg text-pencil/70 font-hand mb-8 -rotate-[0.5deg]">
              Har year hazaron aspirants typing test mein fail ho jaate hain. Reason?
              Ghar pe practice karte hain galat platforms par. Yeh 6 problems sabse common hain — aur humne
              har ek ka solution banaya hai.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {PAIN_POINTS.map((item, i) => {
                const rotations = ['-rotate-1', 'rotate-1', '-rotate-1', 'rotate-1', '-rotate-1', 'rotate-1'];
                return (
                  <div key={item.problemShort}
                       className={`border-2 p-5 ${rotations[i]} hover:rotate-0 transition-all duration-100`}
                       style={{ borderRadius: WOBBLY_RADII.sm }}>
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center border-2 border-red-300 bg-red-50"
                           style={{ borderRadius: WOBBLY_RADII.sm }}>
                        <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={3} />
                      </div>
                      <div>
                        <span className="text-xs font-hand text-red-400 uppercase tracking-wider">Problem</span>
                        <h3 className="text-base font-bold text-pencil font-marker">{item.problem}</h3>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center border-2 border-green-300 bg-green-50"
                           style={{ borderRadius: WOBBLY_RADII.sm }}>
                        <CheckCircle2 className="w-5 h-5 text-green-500" strokeWidth={3} />
                      </div>
                      <div>
                        <span className="text-xs font-hand text-green-500 uppercase tracking-wider">Maths Mania Fix</span>
                        <p className="text-sm text-pencil/70 font-hand mt-0.5">{item.solution}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="pb-16">
          <div className="flex items-center space-x-4 mb-10 rotate-1">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" strokeWidth={3} />
            <h2 className="text-4xl font-bold text-pencil font-marker">Kya Kehte Hain Log?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => {
              const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-1'];
              return (
                <div key={t.name}
                     className={`bg-white border-2 border-pencil shadow-hard-sm p-6 ${rotations[i]} hover:rotate-0 transition-all duration-100 relative`}
                     style={{ borderRadius: WOBBLY_RADII.md }}>
                  <Quote className="w-8 h-8 text-pencil/10 absolute top-3 right-3" strokeWidth={2} />
                  <p className="text-base text-pencil/80 font-hand mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-pencil font-marker">{t.name}</p>
                      <p className="text-xs text-pencil/50 font-hand">{t.role}</p>
                    </div>
                    <div className="text-sm font-bold text-accent font-marker bg-accent/10 px-3 py-1 border-2 border-accent/20"
                         style={{ borderRadius: WOBBLY_RADII.sm }}>
                      {t.wpm}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                        <span>{rule.split(/(\d+)/).map((part, j) => /^\d+$/.test(part) ? <strong key={j}>{part}</strong> : part)}</span>
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
