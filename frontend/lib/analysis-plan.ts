import type { Finding } from '@/lib/exam-diagnosis';

/**
 * The last thing on the report: what to actually do next, said plainly.
 *
 * The page ended with two buttons and a citation. A candidate read seven
 * panels of numbers and then had to work out for themselves which one
 * mattered — and the honest answer is that most of them did not. Qualifying is
 * a conjunction of two bars, so on any given attempt there is exactly one
 * thing standing between the candidate and the post, and usually one kind of
 * mistake carrying most of the marks lost.
 *
 * So this reduces the whole report to a short list they can agree to. It is
 * written in Hinglish because that is the language the advice would actually
 * be given in — an English paragraph about "conjunctive requirements" is read
 * and forgotten; "speed ho gayi, ab sirf haath saaf karna hai" is not.
 *
 * Nothing here recomputes a verdict or a mark. It reads the figures that were
 * already decided and says which of them to work on.
 */

export interface PlanInput {
  qualified: boolean;
  speedMet: boolean;
  errorsMet: boolean;
  nature: 'speed_wpm' | 'kdph';
  netWpm: number;
  speedTarget: number;
  kdph: number;
  kdphTarget: number;
  errorPct: number;
  errorCap: number;
  findings: Finding[];
  /** Passage words after the last one typed. */
  wordsUnreached: number;
  hesitationCount: number;
}

export interface PlanStep {
  id: string;
  /** One line, Hinglish, second person. */
  text: string;
  /** The drill that fixes it, when there is one. */
  href?: string;
  hrefLabel?: string;
}

export interface Plan {
  /** The honest read, in two or three sentences. */
  headline: string;
  steps: PlanStep[];
  /** Which bar to work on. The sidebar marks it. */
  focus: 'speed' | 'mistakes' | 'both' | 'nothing';
}

const one = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const pct = (n: number) => `${n.toFixed(1)}%`;

/** How the speed reads for this post — WPM for a typing test, depressions per
 *  hour for a DEO paper. A candidate should see the unit their own paper uses. */
function speedPhrase(p: PlanInput): { you: string; need: string } {
  return p.nature === 'kdph'
    ? {
        you: `${p.kdph.toLocaleString('en-IN')} KDPH`,
        need: `${p.kdphTarget.toLocaleString('en-IN')} KDPH`,
      }
    : { you: `${one(p.netWpm)} WPM`, need: `${one(p.speedTarget)} WPM` };
}

function headlineFor(p: PlanInput): string {
  const s = speedPhrase(p);

  if (p.qualified) {
    return `Nikal gaya. ${s.you} speed aur ${pct(p.errorPct)} galti — dono bar cross. Ab ise ittefaq mat rehne de: yahi cheez teen baar aur dohra, tab maano ki aa gaya.`;
  }

  if (!p.speedMet && !p.errorsMet) {
    return `Dono cheezein reh gayin — speed ${s.you} hai jahan ${s.need} chahiye, aur galtiyaan ${pct(p.errorPct)} hain jahan ${p.errorCap}% tak chalti hain. Pehle galtiyaan pakad, speed baad mein. Tez haath galtiyon ko maaf nahi karvata, ulta galtiyaan speed kha jaati hain.`;
  }

  if (!p.errorsMet) {
    return `Speed to ho gayi teri — ${s.you}, aur chahiye tha ${s.need}. Ab bas haath saaf karna hai: galtiyaan ${pct(p.errorPct)} hain, ${p.errorCap}% tak allowed hain. Yehi ek cheez tere aur post ke beech mein khadi hai.`;
  }

  return `Galtiyaan control mein hain — ${pct(p.errorPct)}, limit ${p.errorCap}% hai. Sirf haath dheere hain: ${s.you} hai, ${s.need} chahiye. Accuracy mat girne dena speed badhane ke chakkar mein, warna dono chali jayengi.`;
}

/**
 * Two mistake kinds at most, plus one habit.
 *
 * A list of eight things to fix is a list of nothing to fix. The findings are
 * already ordered by marks lost, so the top two are where the marks actually
 * are, and everything below them is noise until those two are gone.
 */
export function buildPlan(p: PlanInput): Plan {
  const steps: PlanStep[] = [];

  for (const [i, f] of p.findings.slice(0, 2).entries()) {
    const cost = f.cost % 1 === 0 ? String(f.cost) : f.cost.toFixed(1);
    /* Says the weight out loud, not just the total. "12 baar, 12 mistake"
       tells a candidate nothing; that capitals cost half each and spelling
       costs a whole one is the thing that decides which to fix first. */
    const many = f.cost !== 1;
    const how =
      f.weight === 'full'
        ? `har ek poora mistake, ${cost} number seedh${many ? 'e gaye' : 'a gaya'}`
        : `aadhe-aadhe karke ${cost} mistake ban${many ? 'e' : 'a'}`;
    steps.push({
      id: `fix-${f.kind}`,
      text: `${f.label}, ${f.count} baar — ${how}. ${
        i === 0 ? 'Sabse bada cheed yahi hai' : 'Iske baad sabse zyada yahi khaata hai'
      }.`,
      href: f.href,
      hrefLabel: f.lessonTitle,
    });
  }

  if (!p.speedMet) {
    steps.push({
      id: 'speed',
      text:
        p.wordsUnreached > 0
          ? `Passage khatam nahi hua — ${p.wordsUnreached} shabd chhoot gaye. Roz ek poora test, ghadi ke saath, bina beech mein ruke.`
          : 'Roz ek poora test do, aur har baar pichhli baar se thoda tez. Speed ek din mein nahi aati, roz aati hai.',
    });
  }

  if (p.errorsMet && p.speedMet && p.findings.length === 0) {
    steps.push({
      id: 'repeat',
      text: 'Ek bhi galti nahi. Ab lamba passage utha aur wahi safai dohra — asli paper mein dus minute chalna hota hai.',
    });
  }

  if (p.hesitationCount > 0 && steps.length < 3) {
    steps.push({
      id: 'hesitation',
      text: `${p.hesitationCount} jagah haath ruka. Neeche wo shabd diye hain — unhe alag se dus baar likh, rukna khud band ho jayega.`,
    });
  }

  if (steps.length === 0) {
    steps.push({
      id: 'again',
      text: 'Is level pe aur test de, taaki ye score aadat ban jaye — ek accha attempt sirf ek accha din hota hai.',
    });
  }

  const focus: Plan['focus'] = p.qualified
    ? 'nothing'
    : !p.speedMet && !p.errorsMet
      ? 'both'
      : p.errorsMet
        ? 'speed'
        : 'mistakes';

  return { headline: headlineFor(p), steps, focus };
}
