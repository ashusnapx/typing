"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import {
  APP,
  HERO_STATS,
  EXAM_MODES,
  FEATURES,
  SSC_RULES,
  WOBBLY_RADII,
  PAIN_POINTS,
  TESTIMONIALS,
} from "@/lib/config";
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
} from "lucide-react";

const SECTION_ICONS: Record<string, any> = {
  ScrollText,
  Brain,
  Award,
  BookOpen,
  Target,
  Keyboard,
  Play,
  BarChart3,
  Sparkles,
  Monitor,
  Calculator,
  EyeOff,
  GraduationCap,
};

const springEase = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  mass: 0.8,
};
const smoothEase: any = { duration: 0.7, ease: [0.16, 1, 0.3, 1] };

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const TYPEWRITER_WORDS = [
  "SSC CHSL",
  "SSC CGL DEST",
  "SSC MTS",
  "SSC JE",
  "SSC STENO",
  "ANY TYPING EXAM",
];

function TypewriterHeading() {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = TYPEWRITER_WORDS[wordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (text.length < currentWord.length) {
        timeout = setTimeout(
          () => setText(currentWord.slice(0, text.length + 1)),
          75,
        );
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
    <span className='inline-flex items-baseline'>
      <span>{text}</span>
      <span className="inline-block w-[3px] h-[0.85em] bg-accent ml-0.5 rounded-full animate-blink" />
    </span>
  );
}

function FloatingChars() {
  const chars = useMemo(
    () =>
      [
        "{",
        "}",
        "/",
        "\\",
        "*",
        "+",
        "-",
        "=",
        "|",
        "~",
        "@",
        "#",
        "_",
        "<",
        ">",
        "^",
      ].map((c, i) => ({
        char: c,
        x: Number((5 + Math.sin(i * 1.7) * 45).toFixed(4)),
        y: Number((8 + Math.cos(i * 2.3) * 35).toFixed(4)),
        size: 11 + (i % 3) * 5,
        delay: i * 0.4,
        opacity: Number((0.04 + (i % 4) * 0.015).toFixed(4)),
      })),
    [],
  );

  return (
    <div
      className='absolute inset-0 pointer-events-none overflow-hidden select-none'
      style={{ perspective: "800px" }}
    >
      {chars.map((item, i) => (
        <motion.div
          key={i}
          style={{
            fontSize: `${item.size}px`,
            left: `${item.x}%`,
            top: `${item.y}%`,
          }}
          className='absolute font-mono font-bold text-pencil'
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: item.opacity,
            scale: 1,
            y: [`${item.y}vh`, `${item.y + 4}vh`, `${item.y}vh`],
          }}
          transition={{
            opacity: { duration: 1, delay: item.delay },
            scale: { duration: 1, delay: item.delay },
            y: {
              duration: 8 + (i % 3) * 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          {item.char}
        </motion.div>
      ))}
    </div>
  );
}

function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: any;
  children: React.ReactNode;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className='flex items-center space-x-4 mb-10'
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ rotate: -15, scale: 0 }}
        animate={inView ? { rotate: 0, scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
      >
        <Icon className='w-8 h-8 text-accent' strokeWidth={3} />
      </motion.div>
      <h2 className='text-4xl font-bold text-pencil font-marker'>{children}</h2>
    </motion.div>
  );
}

function CountUp({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: any;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const num = parseInt(value.replace(/[^0-9.]/g, ""));
  const suffix = value.replace(/[0-9.]/g, "");
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    let current = 0;
    const increment = num / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setCount(num);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, num]);

  return (
    <motion.div
      ref={ref}
      className='bg-white border-2 border-pencil shadow-hard-sm p-6 text-center hover:shadow-hard'
      style={{ borderRadius: WOBBLY_RADII.md }}
      whileHover={{ y: -4, scale: 1.02, transition: springEase }}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className='flex justify-center mb-2 text-pencil'>
        <Icon className='w-6 h-6' strokeWidth={3} />
      </div>
      <div className='stat-value'>
        {count}
        {suffix}
      </div>
      <div className='stat-label mt-1'>{label}</div>
    </motion.div>
  );
}

function StaggerGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, margin: "-60px" }}
      className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
    >
      {children}
    </motion.div>
  );
}

function Card({ children, href, className, rotationIdx = 0, style }: any) {
  const rotations = [
    "-rotate-1",
    "rotate-1",
    "-rotate-2",
    "rotate-1",
    "-rotate-1",
    "rotate-2",
    "-rotate-1",
    "rotate-1",
    "-rotate-2",
  ];
  const rot = rotations[rotationIdx % rotations.length];

  const variants: Variants = {
    hidden: { opacity: 0, y: 40, rotate: parseFloat(rot) || 0 },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const content = (
    <motion.div
      variants={variants}
      whileHover={{ y: -5, scale: 1.02, rotate: 0, transition: springEase }}
      className={`bg-white border-2 border-pencil shadow-hard-sm p-6 ${className || ""} cursor-pointer group relative`}
      style={{ borderRadius: WOBBLY_RADII.md, ...(style || {}) }}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function HomePage() {
  return (
    <div className='min-h-screen bg-paper overflow-x-hidden'>
      <main className='max-w-5xl mx-auto px-6'>
        {/* Hero */}
        <section className='pt-20 pb-12 text-center relative min-h-[70vh] flex flex-col justify-center'>
          <FloatingChars />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className='relative z-10'
          >
            <div className='absolute -top-4 right-12 hidden md:block'>
              <motion.div
                className='w-6 h-6 rounded-full border-[3px] border-pencil bg-accent'
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            <motion.div
              className='inline-flex items-center space-x-2 bg-accent/10 border-2 border-accent/30 rounded-full px-5 py-2 mb-6 rotate-[-1deg]'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ scale: 1.03 }}
            >
              <AlertTriangle className='w-4 h-4 text-accent' strokeWidth={3} />
              <span className='text-sm font-hand text-accent font-bold'>
                90% typing mocks use wrong formula — aapka bhi?
              </span>
            </motion.div>

            <h1 className='text-5xl md:text-6xl font-bold text-pencil font-marker leading-tight'>
              <motion.span
                className='inline-block'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ...smoothEase }}
              >
                Practice for&nbsp;
              </motion.span>
              <motion.span
                className='text-accent inline-block'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <TypewriterHeading />
              </motion.span>
              <br />
              <motion.span
                className='inline-block'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, ...smoothEase }}
              >
                Jo Exam Se Bilkul Match Karta Hai
              </motion.span>
            </h1>

            <motion.p
              className='mt-6 text-xl md:text-2xl text-pencil/70 font-hand max-w-3xl mx-auto'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, ...smoothEase }}
            >
              Zyada tar typing mocks{" "}
              <strong className='text-pencil'>Gross WPM</strong> dikhate hain ya
              interface hi alag hota hai. Maths Mania woh platform hai jo{" "}
              <strong className='text-pencil'>exact SSC Net WPM formula</strong>{" "}
              aur <strong className='text-pencil'>Ediquity replica</strong> dono
              deta hai. Practice real jaisi, result real jaisa.
            </motion.p>

            <motion.div
              className='hidden md:block absolute -left-12 top-1/2 text-pencil/30 text-6xl font-marker -rotate-12 select-none'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, ...smoothEase }}
            >
              &rarr;
            </motion.div>

            <motion.div
              className='mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, ...smoothEase }}
            >
              <Link href='/learn' className='btn-hand text-xl px-10 py-4'>
                <BookOpen className='w-5 h-5 mr-2' strokeWidth={3} />
                Free Typing Course
              </Link>
              <Link
                href='/exam/mock'
                className='btn-hand-secondary text-xl px-10 py-4'
              >
                <Target className='w-5 h-5 mr-2' strokeWidth={3} />
                Real Mock Test Try Karein
              </Link>
            </motion.div>

            {/* <motion.p
              className='mt-4 text-sm text-pencil/40 font-hand'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              No registration required &bull; 100% Free &bull; Exact SSC
              Evaluation
            </motion.p> */}
          </motion.div>
        </section>

        {/* Stats */}
        <section className='grid grid-cols-2 md:grid-cols-4 gap-6 pb-12'>
          {HERO_STATS.map((stat, i) => (
            <CountUp
              key={stat.label}
              value={stat.value}
              label={stat.label}
              icon={SECTION_ICONS[stat.icon] || Award}
            />
          ))}
        </section>

        {/* Exam Modes */}
        <AnimatedSection className='pb-16'>
          <SectionHeading icon={ScrollText}>Exam Modes</SectionHeading>
          <StaggerGrid>
            {EXAM_MODES.map((mode, i) => {
              const IconComp = SECTION_ICONS[mode.icon] || Target;
              return (
                <Card key={mode.id} href={mode.href} rotationIdx={i}>
                  {i === 0 && (
                    <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/10 rotate-[-3deg]' />
                  )}
                  <div className='flex items-center space-x-3 mb-3'>
                    <div
                      className='w-10 h-10 flex items-center justify-center border-2 border-pencil bg-postit'
                      style={{ borderRadius: WOBBLY_RADII.sm }}
                    >
                      <IconComp className='w-5 h-5' strokeWidth={3} />
                    </div>
                    <h3 className='text-xl font-bold text-pencil font-marker'>
                      {mode.title}
                    </h3>
                  </div>
                  <p className='text-base text-pencil/70 font-hand'>
                    {mode.description}
                  </p>
                  <motion.div className='mt-3 flex items-center text-sm font-hand text-pencil/50 group-hover:text-pencil transition-colors'>
                    Start now{" "}
                    <ArrowRight className='w-4 h-4 ml-1' strokeWidth={3} />
                  </motion.div>
                </Card>
              );
            })}
          </StaggerGrid>
        </AnimatedSection>

        {/* Features */}
        <AnimatedSection className='pb-16' delay={0.1}>
          <SectionHeading icon={Brain}>Why Typing Mania?</SectionHeading>
          <StaggerGrid>
            {FEATURES.map((feature, i) => {
              const IconComp = SECTION_ICONS[feature.icon] || Award;
              return (
                <Card key={feature.title} rotationIdx={i}>
                  <div className='flex items-center space-x-3 mb-3'>
                    <div
                      className='w-10 h-10 flex items-center justify-center border-2 border-pencil bg-muted'
                      style={{ borderRadius: WOBBLY_RADII.sm }}
                    >
                      <IconComp className='w-5 h-5' strokeWidth={3} />
                    </div>
                    <h3 className='text-lg font-bold text-pencil font-marker'>
                      {feature.title}
                    </h3>
                  </div>
                  <p className='text-base text-pencil/70 font-hand'>
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </StaggerGrid>
        </AnimatedSection>

        {/* Pain Points */}
        <AnimatedSection className='pb-16' delay={0.1}>
          <motion.div
            className='bg-white border-2 border-pencil shadow-hard-sm p-8 md:p-10 relative'
            style={{ borderRadius: WOBBLY_RADII.md }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, transition: springEase }}
          >
            <motion.div
              className='absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-400 rounded-full border-2 border-pencil shadow-hard-sm'
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className='flex items-center space-x-4 mb-8'>
              <AlertTriangle className='w-8 h-8 text-red-400' strokeWidth={3} />
              <h2 className='text-3xl md:text-4xl font-bold text-pencil font-marker'>
                Yeh Problems Hai Kya?
              </h2>
            </div>
            <p className='text-lg text-pencil/70 font-hand mb-8'>
              Har year hazaron aspirants typing test mein fail ho jaate hain.
              Reason? Ghar pe practice karte hain galat platforms par. Yeh 6
              problems sabse common hain — aur humne har ek ka solution banaya
              hai.
            </p>
            <motion.div
              className='grid md:grid-cols-2 gap-6'
              variants={staggerContainer}
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true }}
            >
              {PAIN_POINTS.map((item, i) => {
                const rotations = [
                  "-rotate-1",
                  "rotate-1",
                  "-rotate-1",
                  "rotate-1",
                  "-rotate-1",
                  "rotate-1",
                ];
                return (
                  <motion.div
                    key={item.problemShort}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                      },
                    }}
                    className={`border-2 p-5 ${rotations[i]} hover:rotate-0 transition-all duration-100`}
                    style={{ borderRadius: WOBBLY_RADII.sm }}
                    whileHover={{ y: -3, scale: 1.01, transition: springEase }}
                  >
                    <div className='flex items-start space-x-3 mb-3'>
                      <div
                        className='w-10 h-10 shrink-0 flex items-center justify-center border-2 border-red-300 bg-red-50'
                        style={{ borderRadius: WOBBLY_RADII.sm }}
                      >
                        <AlertTriangle
                          className='w-5 h-5 text-red-400'
                          strokeWidth={3}
                        />
                      </div>
                      <div>
                        <span className='text-xs font-hand text-red-400 uppercase tracking-wider'>
                          Problem
                        </span>
                        <h3 className='text-base font-bold text-pencil font-marker'>
                          {item.problem}
                        </h3>
                      </div>
                    </div>
                    <div className='flex items-start space-x-3'>
                      <div
                        className='w-10 h-10 shrink-0 flex items-center justify-center border-2 border-green-300 bg-green-50'
                        style={{ borderRadius: WOBBLY_RADII.sm }}
                      >
                        <CheckCircle2
                          className='w-5 h-5 text-green-500'
                          strokeWidth={3}
                        />
                      </div>
                      <div>
                        <span className='text-xs font-hand text-green-500 uppercase tracking-wider'>
                          Maths Mania Fix
                        </span>
                        <p className='text-sm text-pencil/70 font-hand mt-0.5'>
                          {item.solution}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </AnimatedSection>

        {/* Testimonials */}
        <AnimatedSection className='pb-16' delay={0.1}>
          <SectionHeading icon={Star}>Kya Kehte Hain Log?</SectionHeading>
          <StaggerGrid>
            {TESTIMONIALS.map((t, i) => (
              <Card key={t.name} rotationIdx={i}>
                <Quote
                  className='w-8 h-8 text-pencil/10 absolute top-3 right-3'
                  strokeWidth={2}
                />
                <p className='text-base text-pencil/80 font-hand mb-4 leading-relaxed'>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-bold text-pencil font-marker'>
                      {t.name}
                    </p>
                    <p className='text-xs text-pencil/50 font-hand'>{t.role}</p>
                  </div>
                  <div
                    className='text-sm font-bold text-accent font-marker bg-accent/10 px-3 py-1 border-2 border-accent/20'
                    style={{ borderRadius: WOBBLY_RADII.sm }}
                  >
                    {t.wpm}
                  </div>
                </div>
              </Card>
            ))}
          </StaggerGrid>
        </AnimatedSection>

        {/* From Scratch CTA */}
        <AnimatedSection className='pb-16' delay={0.1}>
          <motion.div
            whileHover={{ y: -4, scale: 1.01, transition: springEase }}
          >
            <Link
              href='/learn'
              className='card-postit p-8 block group'
              style={{ borderRadius: WOBBLY_RADII.md }}
            >
              <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/10 rotate-[-3deg]' />
              <div className='flex items-center space-x-4'>
                <motion.div
                  className='w-16 h-16 flex items-center justify-center border-2 border-pencil bg-white shrink-0'
                  style={{ borderRadius: WOBBLY_RADII.sm }}
                  whileHover={{
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.3 },
                  }}
                >
                  <BookOpen className='w-8 h-8 text-pencil' strokeWidth={3} />
                </motion.div>
                <div>
                  <h2 className='text-2xl font-bold text-pencil font-marker'>
                    Typing Bilkul Zero se Seekhein
                  </h2>
                  <p className='text-lg text-pencil/70 font-hand mt-1'>
                    Kabhi computer nahi chhua? Koi baat nahi. 10 levels mein
                    home row se lekar SSC exam tak. Har lesson ke saath guide
                    aur practice text.
                  </p>
                  <span className='inline-flex items-center mt-2 text-base font-hand text-pencil/50 group-hover:text-pencil transition-colors'>
                    Start Learning{" "}
                    <ArrowRight className='w-4 h-4 ml-1' strokeWidth={3} />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </AnimatedSection>

        {/* SSC Rules */}
        <AnimatedSection className='pb-16' delay={0.1}>
          <motion.div
            className='bg-postit border-2 border-pencil shadow-hard p-8 relative'
            style={{ borderRadius: WOBBLY_RADII.md }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, transition: springEase }}
          >
            <motion.div
              className='absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-accent rounded-full border-2 border-pencil shadow-hard-sm'
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <h2 className='text-2xl font-bold text-pencil font-marker mb-6'>
              SSC Official Rules Implemented
            </h2>
            <div className='grid sm:grid-cols-2 gap-8'>
              {Object.values(SSC_RULES).map((section) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h3 className='text-xl font-bold text-pencil font-hand underline decoration-accent decoration-2 underline-offset-4 mb-3'>
                    {section.title}
                  </h3>
                  <ul className='space-y-2 text-base text-pencil font-hand'>
                    {section.rules.map((rule, i) => (
                      <motion.li
                        key={i}
                        className='flex items-start space-x-2'
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                      >
                        <span className='text-accent mt-1'>&rarr;</span>
                        <span>
                          {rule
                            .split(/(\d+)/)
                            .map((part, j) =>
                              /^\d+$/.test(part) ?
                                <strong key={j}>{part}</strong>
                              : part,
                            )}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatedSection>
      </main>
    </div>
  );
}
