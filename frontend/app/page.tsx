"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  EXAM_MODES,
  WOBBLY_RADII,
} from "@/lib/config";
import {
  ArrowRight,
  BookOpen,
  Target,
  Keyboard,
  Play,
  Sparkles,
  Award,
  GraduationCap,
  Calculator,
  Clock,
  ScrollText,
} from "lucide-react";

const TYPEWRITER_WORDS = [
  "SSC CHSL",
  "SSC CGL DEST",
  "SSC MTS",
  "SSC JE",
  "SSC STENO",
];

// ── Feature illustrations ────────────────────────────────────────
function FeatureSVG({ type }: { type: string }) {
  const base = "w-full h-full";
  switch (type) {
    case "formula":
      return (
        <svg viewBox="0 0 120 120" className={base}>
          <circle cx="60" cy="60" r="50" fill="#fdfbf7" stroke="#2d2d2d" strokeWidth="3" />
          <text x="60" y="45" textAnchor="middle" fontSize="10" fill="#2d2d2d" fontFamily="monospace" fontWeight="bold">NET WPM</text>
          <text x="60" y="62" textAnchor="middle" fontSize="8" fill="#ff4d4d" fontFamily="monospace">(KD/5 - FM - HM/2)</text>
          <text x="60" y="78" textAnchor="middle" fontSize="8" fill="#2d2d2d" fontFamily="monospace">/ Time</text>
          <line x1="20" y1="85" x2="100" y2="85" stroke="#2d2d2d" strokeWidth="2" strokeDasharray="4 2" />
        </svg>
      );
    case "curriculum":
      return (
        <svg viewBox="0 0 120 120" className={base}>
          <rect x="15" y="15" width="90" height="90" rx="8" fill="#fdfbf7" stroke="#2d2d2d" strokeWidth="3" />
          <rect x="25" y="22" width="70" height="12" rx="3" fill="#ff4d4d" fillOpacity="0.2" stroke="#2d2d2d" strokeWidth="1.5" />
          <rect x="25" y="40" width="55" height="12" rx="3" fill="#2d5da1" fillOpacity="0.2" stroke="#2d2d2d" strokeWidth="1.5" />
          <rect x="25" y="58" width="65" height="12" rx="3" fill="#ff4d4d" fillOpacity="0.2" stroke="#2d2d2d" strokeWidth="1.5" />
          <rect x="25" y="76" width="45" height="12" rx="3" fill="#2d5da1" fillOpacity="0.2" stroke="#2d2d2d" strokeWidth="1.5" />
          <circle cx="97" cy="95" r="8" fill="#4caf50" stroke="#2d2d2d" strokeWidth="2" />
          <path d="M93 95l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "replay":
      return (
        <svg viewBox="0 0 120 120" className={base}>
          <circle cx="60" cy="60" r="45" fill="#fdfbf7" stroke="#2d2d2d" strokeWidth="3" />
          <circle cx="60" cy="60" r="15" fill="none" stroke="#2d2d2d" strokeWidth="2" strokeDasharray="4 3" />
          <path d="M60 45v15l10 8" stroke="#2d5da1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M38 38l-8 8 8 8" stroke="#ff4d4d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M82 38l8 8-8 8" stroke="#ff4d4d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="25" y="90" width="70" height="4" rx="2" fill="#e5e0d8" />
          <circle cx="40" cy="92" r="3" fill="#4caf50" />
          <circle cx="55" cy="92" r="3" fill="#ff4d4d" />
          <circle cx="70" cy="92" r="3" fill="#4caf50" />
          <circle cx="85" cy="92" r="3" fill="#4caf50" />
        </svg>
      );
    case "coach":
      return (
        <svg viewBox="0 0 120 120" className={base}>
          <rect x="15" y="25" width="90" height="70" rx="8" fill="#fdfbf7" stroke="#2d2d2d" strokeWidth="3" />
          <line x1="25" y1="40" x2="60" y2="40" stroke="#4caf50" strokeWidth="3" strokeLinecap="round" />
          <line x1="25" y1="55" x2="80" y2="55" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" />
          <line x1="25" y1="70" x2="50" y2="70" stroke="#2d5da1" strokeWidth="3" strokeLinecap="round" />
          <circle cx="90" cy="85" r="15" fill="#fdfbf7" stroke="#2d2d2d" strokeWidth="2.5" />
          <circle cx="90" cy="92" r="3" fill="#ff4d4d" />
          <circle cx="90" cy="80" r="3" fill="#4caf50" />
          <path d="M86 70l-8 15h24l-8-15" stroke="#2d2d2d" strokeWidth="1.5" fill="none" />
        </svg>
      );
    default:
      return null;
  }
}

// ── Study desk for CTA ──────────────────────────────────────────
function StudyDeskSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 140" fill="none" className={className}>
      <rect x="10" y="90" width="160" height="10" rx="3" stroke="#2d2d2d" strokeWidth="2.5" fill="#fdfbf7" />
      <line x1="25" y1="100" x2="20" y2="135" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="155" y1="100" x2="160" y2="135" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="20" y="60" width="30" height="28" rx="2" stroke="#2d2d2d" strokeWidth="2" fill="#fdfbf7" transform="rotate(-5 35 74)" />
      <line x1="35" y1="64" x2="35" y2="84" stroke="#2d2d2d" strokeWidth="1.5" transform="rotate(-5 35 74)" />
      <rect x="42" y="65" width="25" height="24" rx="2" stroke="#ff4d4d" strokeWidth="2" fill="#fdfbf7" transform="rotate(3 54 77)" />
      <rect x="85" y="30" width="55" height="45" rx="5" stroke="#2d2d2d" strokeWidth="2.5" fill="#fdfbf7" />
      <rect x="92" y="37" width="41" height="28" rx="3" stroke="#2d2d2d" strokeWidth="1.5" fill="#e5e0d8" />
      <line x1="100" y1="44" x2="125" y2="44" stroke="#2d5da1" strokeWidth="2" strokeLinecap="round" />
      <line x1="100" y1="52" x2="115" y2="52" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round" />
      <rect x="105" y="75" width="15" height="15" stroke="#2d2d2d" strokeWidth="2" fill="#fdfbf7" rx="2" />
      <rect x="150" y="72" width="18" height="18" rx="3" stroke="#2d2d2d" strokeWidth="2" fill="#fdfbf7" />
      <path d="M168 76 Q174 76 174 81 Q174 86 168 86" stroke="#2d2d2d" strokeWidth="2" fill="none" />
      <path d="M156 69 Q157 65 155 61" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M162 68 Q163 64 161 60" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  );
}

// ── Divider ──────────────────────────────────────────────────────
function Divider() {
  return (
    <svg viewBox="0 0 1200 30" className="w-full h-6 mb-4 opacity-20" preserveAspectRatio="none">
      <path d="M0 15 Q300 0 600 15 Q900 30 1200 15" stroke="#2d2d2d" strokeWidth="2" fill="none" />
    </svg>
  );
}

// ── Section reveal (opacity only, no y shift) ────────────────────
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ── Real features ────────────────────────────────────────────────
const REAL_FEATURES = [
  {
    svg: "formula",
    title: "SSC Net WPM Formula",
    desc: "Official SSC error engine. Levenshtein diff, full/half mistake classification, category-wise qualifying standards.",
  },
  {
    svg: "curriculum",
    title: "13-Level Typing Course",
    desc: "39 lessons from home row to exam-ready. Interactive keyboard, finger zones, spaced repetition, key mastery tracking.",
  },
  {
    svg: "replay",
    title: "Keystroke Replay & Analysis",
    desc: "Every keystroke, correction, and pause replayed. Word-timing heatmaps, slow word detection, error classification.",
  },
  {
    svg: "coach",
    title: "AI Coach & Qualification Prediction",
    desc: "Personalised weakness analysis after every test. Predicts CHSL/CGL qualification probability with trends.",
  },
];

const MODE_ICONS: Record<string, React.ReactNode> = {
  Target: <Target className="w-5 h-5" strokeWidth={3} />,
  Keyboard: <Keyboard className="w-5 h-5" strokeWidth={3} />,
  Play: <Play className="w-5 h-5" strokeWidth={3} />,
  Sparkles: <Sparkles className="w-5 h-5" strokeWidth={3} />,
  Award: <Award className="w-5 h-5" strokeWidth={3} />,
};

// ── Typewriter ──────────────────────────────────────────────────
function TypewriterHeading() {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = TYPEWRITER_WORDS[wordIndex];
    let timeout: NodeJS.Timeout;
    if (!isDeleting) {
      if (text.length < currentWord.length) {
        timeout = setTimeout(() => setText(currentWord.slice(0, text.length + 1)), 75);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 1800);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, -1)), 35);
      } else {
        setIsDeleting(false);
        setWordIndex((i) => (i + 1) % TYPEWRITER_WORDS.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex]);

  return (
    <span className="inline-flex items-baseline">
      <span className="whitespace-nowrap">{text}</span>
      <span className="inline-block w-[3px] h-[0.85em] bg-accent ml-0.5 rounded-full animate-blink" />
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="bg-paper">
      <main className="max-w-5xl mx-auto px-6">

        {/* HERO */}
        <section className="relative min-h-screen flex flex-col items-center justify-center py-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 border-2 border-accent/30 rounded-full px-5 py-2 mb-6 rotate-[-1deg]">
              <Calculator className="w-4 h-4 text-accent" strokeWidth={3} />
              <span className="text-sm font-hand text-accent font-bold">
                90% mocks use wrong formula — aapka bhi?
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pencil font-marker leading-tight">
              Practice for
            </h1>

            <div className="mt-1">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-accent font-marker">
                <TypewriterHeading />
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pencil font-marker mt-2 leading-tight">
              Jo Exam Se Bilkul Match Karta Hai
            </h2>

            <p className="mt-5 text-lg md:text-xl text-pencil/60 font-hand max-w-xl mx-auto leading-relaxed">
              Exact SSC Net WPM formula. Ediquity replica interface.
              13-level curriculum from absolute beginner to exam-ready.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/learn" className="btn-hand text-lg px-8 py-3">
                <BookOpen className="w-5 h-5 mr-2" strokeWidth={3} />
                Free Typing Course
              </Link>
              <Link href="/exam/mock" className="btn-hand-secondary text-lg px-8 py-3">
                <Target className="w-5 h-5 mr-2" strokeWidth={3} />
                Real Mock Test
              </Link>
            </div>
          </motion.div>
        </section>

        <Divider />

        {/* EXAM MODES */}
        <Section className="pb-16">
          <div className="flex items-center gap-3 mb-8">
            <ScrollText className="w-7 h-7 text-accent shrink-0" strokeWidth={3} />
            <h2 className="text-3xl font-bold text-pencil font-marker">Exam Modes</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXAM_MODES.map((mode, i) => {
              const minutes = Math.floor(mode.duration / 60);
              const wpmLabel = mode.wpmTarget > 0 ? `${mode.wpmTarget} WPM` : "KDPH";
              const isHindi = mode.lang === "hindi";
              return (
                <Link
                  key={mode.id}
                  href={mode.href}
                  className="group bg-white border-2 border-pencil p-4 hover:shadow-hard transition-all block"
                  style={{
                    borderRadius: WOBBLY_RADII.md,
                    transform: `rotate(${i % 2 === 0 ? "-0.5" : "0.5"}deg)`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 flex items-center justify-center border-2 border-pencil bg-paper shrink-0"
                      style={{ borderRadius: WOBBLY_RADII.sm }}>
                      {MODE_ICONS[mode.icon] || <Target className="w-5 h-5" strokeWidth={3} />}
                    </div>
                    <h3 className="font-marker text-base text-pencil">
                      {mode.title}{isHindi ? <span className="ml-2 text-[10px] bg-accent text-white font-bold px-2 py-0.5" style={{ borderRadius: WOBBLY_RADII.sm }}>HINDI</span> : ""}
                    </h3>
                  </div>
                  <p className="font-hand text-sm text-pencil/60 mb-2">{mode.description}</p>
                  <div className="flex items-center gap-3 text-xs font-hand text-pencil/40">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={2.5} />{minutes} min</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" strokeWidth={2.5} />{wpmLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-pencil/20 group-hover:text-pencil/60 transition-colors" strokeWidth={3} />
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>

        <Divider />

        {/* WHY TYPING MANIA */}
        <Section className="pb-16">
          <div className="flex items-center gap-3 mb-8">
            <GraduationCap className="w-7 h-7 text-accent shrink-0" strokeWidth={3} />
            <h2 className="text-3xl font-bold text-pencil font-marker">Why Typing Mania?</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {REAL_FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="bg-white border-2 border-pencil p-5 hover:shadow-hard transition-all flex items-start gap-5"
                style={{
                  borderRadius: WOBBLY_RADII.md,
                  transform: `rotate(${i % 2 === 0 ? "-0.3" : "0.3"}deg)`,
                }}
              >
                <div className="w-24 h-24 shrink-0 hidden sm:block">
                  <FeatureSVG type={f.svg} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-marker text-lg text-pencil mb-1">{f.title}</h3>
                  <p className="font-hand text-sm text-pencil/60 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Divider />

        {/* CTA */}
        <Section className="pb-20">
          <div className="bg-white border-2 border-pencil p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 hover:shadow-hard transition-all"
            style={{ borderRadius: WOBBLY_RADII.md }}
          >
            <StudyDeskSVG className="w-40 h-32 shrink-0" />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-pencil font-marker">
                Typing Bilkul Zero se Seekhein
              </h2>
              <p className="text-base text-pencil/60 font-hand mt-2 leading-relaxed">
                Kabhi computer nahi chhua? Koi baat nahi. Home row se lekar SSC exam final tak — har lesson ke saath practice text aur interactive keyboard guide.
              </p>
              <Link href="/learn" className="inline-flex items-center mt-4 btn-hand text-base px-6 py-2.5">
                Start Learning <ArrowRight className="w-4 h-4 ml-2" strokeWidth={3} />
              </Link>
            </div>
          </div>
        </Section>

      </main>
    </div>
  );
}
