// =============================================================================
// TYPING CURRICULUM — Progressive Learning System
// =============================================================================
// White-paper backed methodology for teaching typing to absolute beginners.
//
// REFERENCES:
//   - West, L. J. (1969) "Acquisition of Typewriting Skills" — classic pedagogy
//   - Cooper, W. E. (1983) "Cognitive Aspects of Skilled Typewriting" — ERP/EMG
//   - Gentner, D. R. (1988) "Expertise in Typewriting" — CHI '88
//   - Feit, A. M. (2016) "How We Type" — CHI '16 (modern touch‑typing)
//   - Dhakal, V. (2018) "A Large‑Scale Analysis of Typing Skills" — CHI '18
//
// METHOD:
//   Phase 0 — Computer Familiarity (for students who have never touched a PC)
//   Phase 1 — Home Row (ASDF JKL;) — muscle‑memory anchoring
//   Phase 2 — Top Row (QWERTY UIOP) — outward finger reach
//   Phase 3 — Bottom Row (ZXCVBNM ,./) — inward finger curl
//   Phase 4 — Common Words — high‑frequency bigrams/trigrams
//   Phase 5 — SSC Vocabulary — domain‑specific administrative words
//   Phase 6 — Sentence Construction — punctuation + capitalization
//   Phase 7 — Passage Practice — fluency & endurance
//   Phase 8 — Speed Building — 25→35→45 WPM milestones
//   Phase 9 — Accuracy Polish — 95%+ zero‑error mindset
//   Phase 10 — Exam Simulation — TCS iON replica, mock tests
//
// PASS CRITERIA per lesson: accuracy ≥ 90%  OR  speed ≥ 80 % of target.
// =============================================================================

export interface Lesson {
  id: string;
  title: string;
  instruction: string;
  keys: string[];
  sampleText: string;
  targetWpm: number;
  minAccuracy: number;
  durationSec: number;
  xpReward: number;
}

export interface Level {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  lessons: Lesson[];
}

const LEVELS: Level[] = [
  // ─── Level 0: Computer Parichay ───────────────────────────────────────────
  {
    id: 0,
    name: 'Computer Parichay',
    subtitle: 'Computer kaise chalayein?',
    description:
      'Agar aapne kabhi computer nahi chhoda hai, to pehle yeh seekhein — mouse kaise chalayein, keyboard kaise pakdein, aur fingers kaise rakhein.',
    icon: 'Monitor',
    lessons: [
      {
        id: 'l0-mouse',
        title: 'Mouse Chalana Seekhein',
        instruction:
          'Mouse ko right hand se pakdein. Index finger left button par, middle finger right button par. Left button dabake word select karein.',
        keys: ['left-click', 'right-click', 'scroll'],
        sampleText: 'Click karein. Double-click karein. Scroll karein.',
        targetWpm: 0,
        minAccuracy: 0,
        durationSec: 120,
        xpReward: 10,
      },
      {
        id: 'l0-posture',
        title: 'Sahi Posture',
        instruction:
          'Seedhe baitho. Haath keyboard ke saamne rakho. Ungliyaan home row par rakho — ASDF (left) aur JKL; (right). Aankhein screen par rakho.',
        keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        sampleText: 'ASDF JKL; ASDF JKL;',
        targetWpm: 0,
        minAccuracy: 60,
        durationSec: 180,
        xpReward: 10,
      },
      {
        id: 'l0-keys',
        title: 'Keys Pehchano',
        instruction:
          'Dheere dheere har key dabake dekho. Dekho ki kaunsi ungli kis key ke liye sahi hai. Left hand: A-S-D-F, Right hand: J-K-L-;',
        keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'Enter', 'Space'],
        sampleText:
          'A S D F J K L ; A S D F J K L ; Space dabao. Enter dabao.',
        targetWpm: 0,
        minAccuracy: 70,
        durationSec: 300,
        xpReward: 10,
      },
    ],
  },

  // ─── Level 1: Home Row ────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Home Row',
    subtitle: 'Neechi wali line — ASDF JKL;',
    description:
      'Home row typing ki foundation hai. Ungliyaan hamesha yahin par tikti hain. Yeh line yaad karlo — kabhi dekho mat keyboard par.',
    icon: 'Keyboard',
    lessons: [
      {
        id: 'l1-home-basics',
        title: 'Home Row Basics',
        instruction:
          'Left hand: A (pinky), S (ring), D (middle), F (index). Right hand: J (index), K (middle), L (ring), ; (pinky). Thumbs: Space.',
        keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        sampleText: 'ASDF JKL; ASDF JKL; AAAA SSSS DDDD FFFF JJJJ KKKK LLLL',
        targetWpm: 5,
        minAccuracy: 80,
        durationSec: 300,
        xpReward: 15,
      },
      {
        id: 'l1-home-words',
        title: 'Home Row Words',
        instruction:
          'Home row keys se hi chhote chhote words banao. Keyboard mat dekho — screen par dekho.',
        keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        sampleText: 'as dad sad add ask fall jak ala flask lad',
        targetWpm: 8,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 15,
      },
      {
        id: 'l1-home-speed',
        title: 'Home Row Speed',
        instruction:
          'Ab thoda speed badhao. Pehle accuracy, phir speed. Galati hui to ruko nahi, aage badho.',
        keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        sampleText:
          'as dad sad add ask fall jak ala flask lad as dad sad add ask fall jak ala flask lad',
        targetWpm: 10,
        minAccuracy: 85,
        durationSec: 180,
        xpReward: 15,
      },
    ],
  },

  // ─── Level 2: Top Row ─────────────────────────────────────────────────────
  {
    id: 2,
    name: 'Top Row',
    subtitle: 'Uppar wali line — QWERTY UIOP',
    description:
      'Ab ungliyaan upar ki line par le jaao. Home row se upar utho, type karo, aur vapas home row par aa jao. Yahi professional typing ka raaz hai.',
    icon: 'ArrowUp',
    lessons: [
      {
        id: 'l2-top-basics',
        title: 'Top Row Basics',
        instruction:
          'Left: Q (pinky), W (ring), E (middle), R (index), T (index). Right: Y (index), U (index), I (middle), O (ring), P (pinky). Home row par vapas aana mat bhoolo.',
        keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        sampleText:
          'QWERT YUIOP QWERT YUIOP QQQQ WWWW EEEE RRRR TTTT YYYY UUUU IIII OOOO PPPP',
        targetWpm: 10,
        minAccuracy: 80,
        durationSec: 300,
        xpReward: 15,
      },
      {
        id: 'l2-top-words',
        title: 'Top Row Words',
        instruction:
          'Top row aur home row mix karo. Keyboard dekhne ki aadat chhodo. Ungliyaan khud jaan jaayengi.',
        keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'J', 'K', 'L'],
        sampleText:
          'we are top out put quit write quite power type further question',
        targetWpm: 12,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 15,
      },
      {
        id: 'l2-top-speed',
        title: 'Top Row Speed',
        instruction:
          'Speed round. Har shabd ko complete karo. Ruko mat. Galat ho to bhi aage badho.',
        keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'J', 'K', 'L'],
        sampleText:
          'we are top out put quit write quite power type further question we are top out put',
        targetWpm: 15,
        minAccuracy: 80,
        durationSec: 180,
        xpReward: 15,
      },
    ],
  },

  // ─── Level 3: Bottom Row ──────────────────────────────────────────────────
  {
    id: 3,
    name: 'Bottom Row',
    subtitle: 'Neeche wali line — ZXCVBNM',
    description:
      'Sabse mushkil line. Ungli ko neeche ki taraf modna padta hai. Home row se neeche jaao, type karo, vapas home row par aa jao.',
    icon: 'ArrowDown',
    lessons: [
      {
        id: 'l3-bottom-basics',
        title: 'Bottom Row Basics',
        instruction:
          'Left: Z (pinky), X (ring), C (middle), V (index). Right: B (index), N (index), M (middle). Comma aur period bhi index finger se.',
        keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
        sampleText:
          'ZXCV BNM ZXCV BNM ZZZZ XXXX CCCC VVVV BBBB NNNN MMMM ,.,.,.',
        targetWpm: 10,
        minAccuracy: 75,
        durationSec: 300,
        xpReward: 15,
      },
      {
        id: 'l3-bottom-words',
        title: 'Bottom Row Words',
        instruction:
          'Ab teeno lines mix karo. Yeh asli typing hai. Home row anchor hai — yahin vapas aana hai.',
        keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'J', 'K', 'L'],
        sampleText:
          'zebra box cat very big number come back word example move type quite question',
        targetWpm: 15,
        minAccuracy: 80,
        durationSec: 300,
        xpReward: 15,
      },
      {
        id: 'l3-bottom-speed',
        title: 'Bottom Row Speed',
        instruction:
          'Full keyboard speed round. Ungliyaan ghoomengi, par home row pakdi rahegi. Start!',
        keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'J', 'K', 'L'],
        sampleText:
          'zebra box cat very big number come back word example move type quite question',
        targetWpm: 18,
        minAccuracy: 80,
        durationSec: 180,
        xpReward: 15,
      },
    ],
  },

  // ─── Level 4: Common Words ─────────────────────────────────────────────────
  {
    id: 4,
    name: 'Common Words',
    subtitle: 'Roz bolne wale shabd',
    description:
      'Angrezi ke sabse common words — inhe bina soche type karna seekho. Yehi fluency ka raaz hai.',
    icon: 'BookOpen',
    lessons: [
      {
        id: 'l4-common-1',
        title: '100 Most Common Words — Part 1',
        instruction:
          'Yeh words rozana typing mein aate hain. Inhe itna practice karo ki ungliyaan khud chalne lagein.',
        keys: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'],
        sampleText:
          'the be to of and a in that have it for not on with as at by from or an',
        targetWpm: 18,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 20,
      },
      {
        id: 'l4-common-2',
        title: '100 Most Common Words — Part 2',
        instruction:
          'Speed不重要, accuracy重要. Pehle sahi type karo, phir tez karo.',
        keys: ['but', 'what', 'all', 'were', 'when', 'can', 'said', 'there', 'use', 'each'],
        sampleText:
          'but what all were when can said there use each which she do how their if will up',
        targetWpm: 20,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 20,
      },
      {
        id: 'l4-common-3',
        title: '100 Most Common Words — Part 3',
        instruction:
          'Tez typing ka matlab hai — bina soche type karna. Ab yeh karo.',
        keys: ['other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her'],
        sampleText:
          'other about out many then them these so some her would make like him into time has look two more write go see number',
        targetWpm: 22,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 20,
      },
    ],
  },

  // ─── Level 5: SSC Vocabulary ───────────────────────────────────────────────
  {
    id: 5,
    name: 'SSC Vocabulary',
    subtitle: 'SSC exam mein aane wale shabd',
    description:
      'SSC typing mein government, administration, department jaise shabd baar baar aate hain. Inhe type karna seekho.',
    icon: 'ScrollText',
    lessons: [
      {
        id: 'l5-admin',
        title: 'Administrative Words',
        instruction:
          'Yeh SSC ke sabse common words hain. Inhe roj practice karo.',
        keys: ['government', 'department', 'administration', 'development', 'education'],
        sampleText:
          'government department administration development education organization national commission secretary minister',
        targetWpm: 20,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 20,
      },
      {
        id: 'l5-constitutional',
        title: 'Constitutional Terms',
        instruction:
          'Constitution ke words — yeh SSC CGL mein aate hain. Spelling correct rakho.',
        keys: ['constitution', 'parliament', 'committee', 'authority', 'provision'],
        sampleText:
          'constitution parliament committee authority provision amendment regulation notification guideline legislation',
        targetWpm: 20,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 20,
      },
      {
        id: 'l5-economics',
        title: 'Economic Terms',
        instruction:
          'Economics ke common words. Budget, finance, revenue — yeh sab type karna aana chahiye.',
        keys: ['budget', 'finance', 'revenue', 'economic', 'development'],
        sampleText:
          'budget finance revenue economic development expenditure investment allocation taxation fiscal monetary policy',
        targetWpm: 22,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 20,
      },
    ],
  },

  // ─── Level 6: Sentence Construction ────────────────────────────────────────
  {
    id: 6,
    name: 'Sentence Construction',
    subtitle: 'Vakya banana seekhein',
    description:
      'Ab shabdon ko jodkar vakya banao. Capital letters, punctuation, spaces — sab kuch type karo.',
    icon: 'Type',
    lessons: [
      {
        id: 'l6-simple',
        title: 'Simple Sentences',
        instruction:
          'Capital letter se shuru karo, period par khatam. Space mat bhoolo.',
        keys: ['A', 'B', 'C', 'capital', 'period', 'space'],
        sampleText:
          'The government has announced a new policy. The department will implement it soon.',
        targetWpm: 18,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 25,
      },
      {
        id: 'l6-complex',
        title: 'Complex Sentences',
        instruction:
          'Commas, semi-colons, aur conjunctions ke saath sentences. Yeh SSC passages ki tarah hain.',
        keys: [',', ';', 'and', 'but', 'however', 'therefore'],
        sampleText:
          'The committee, however, recommended a different approach; therefore, the department revised its policy accordingly.',
        targetWpm: 20,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 25,
      },
      {
        id: 'l6-punctuation',
        title: 'Punctuation Mastery',
        instruction:
          'Colon, semi-colon, comma, period, apostrophe — sab ka sahi istemal karo.',
        keys: [',', ';', ':', '.', "'", '"'],
        sampleText:
          "The minister said: 'We must focus on education, health, and infrastructure.' The committee's report was approved.",
        targetWpm: 20,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 25,
      },
    ],
  },

  // ─── Level 7: Passage Practice ─────────────────────────────────────────────
  {
    id: 7,
    name: 'Passage Practice',
    subtitle: 'Purra passage type karo',
    description:
      'Ab real passage type karo — jaise SSC exam mein aata hai. Endurance build karo. 2000 key depressions ka target hai.',
    icon: 'FileText',
    lessons: [
      {
        id: 'l7-short',
        title: 'Short Passages (100 words)',
        instruction:
          'Chhote passages type karo. Pehle accuracy, phir speed. Har passage complete karo.',
        keys: [],
        sampleText:
          'The government has announced a comprehensive plan for the development of rural infrastructure. This initiative aims to improve the quality of life in villages across the country. The department of rural development will oversee the implementation of this project.',
        targetWpm: 20,
        minAccuracy: 88,
        durationSec: 300,
        xpReward: 30,
      },
      {
        id: 'l7-medium',
        title: 'Medium Passages (200 words)',
        instruction:
          'Thode bade passages. Speed maintain karo. Pauses kam karo.',
        keys: [],
        sampleText:
          'The education system in India has undergone significant changes in recent years. The introduction of the National Education Policy has brought about a paradigm shift in the way we approach learning. The policy emphasizes experiential learning, critical thinking, and holistic development of students. It also focuses on making education more inclusive and accessible to all sections of society. The implementation of this policy requires coordinated efforts from central and state governments.',
        targetWpm: 22,
        minAccuracy: 88,
        durationSec: 420,
        xpReward: 30,
      },
      {
        id: 'l7-long',
        title: 'Long Passages (500+ words)',
        instruction:
          'Yeh almost real exam jaisa hai. 10 minutes tak type karo. Fatigue handle karna seekho.',
        keys: [],
        sampleText:
          'The Indian economy has shown remarkable resilience in the face of global challenges. The government has implemented various structural reforms to boost economic growth and create employment opportunities. The manufacturing sector has been given a significant push through initiatives like Make in India. The services sector continues to be a major contributor to the GDP. The agricultural sector, which employs a large portion of the population, is being modernized through technological interventions. The government is also focusing on digital infrastructure to bridge the urban-rural divide. The success of these initiatives depends on effective implementation at the grassroots level.',
        targetWpm: 22,
        minAccuracy: 88,
        durationSec: 600,
        xpReward: 30,
      },
    ],
  },

  // ─── Level 8: Speed Building ──────────────────────────────────────────────
  {
    id: 8,
    name: 'Speed Building',
    subtitle: 'WPM badhao — 25 → 35 → 45',
    description:
      'Speed build karo. Target: 25 WPM → 35 WPM (SSC CHSL) → 45 WPM (expert). Har round mein speed 2 WPM badhao.',
    icon: 'Gauge',
    lessons: [
      {
        id: 'l8-speed-25',
        title: 'Target: 25 WPM',
        instruction:
          '25 WPM ka target. 10 minutes type karo. Har minute mein approx 125 characters type karne hain.',
        keys: [],
        sampleText:
          'The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.',
        targetWpm: 25,
        minAccuracy: 85,
        durationSec: 300,
        xpReward: 35,
      },
      {
        id: 'l8-speed-30',
        title: 'Target: 30 WPM',
        instruction:
          '30 WPM. Ab thoda pressure hai. Deep breathing karo. Consistent rhythm maintain karo.',
        keys: [],
        sampleText:
          'SSC typing test requires both speed and accuracy. The candidate must type at least 35 words per minute to qualify. Regular practice is the key to success. Focus on your weak areas and improve them consistently.',
        targetWpm: 30,
        minAccuracy: 85,
        durationSec: 360,
        xpReward: 35,
      },
      {
        id: 'l8-speed-35',
        title: 'Target: 35 WPM — SSC CHSL Ready!',
        instruction:
          '35 WPM — SSC CHSL ka minimum requirement. Agar yeh kar liya, to aap qualify kar sakte ho. Confidence laao!',
        keys: [],
        sampleText:
          'The Staff Selection Commission conducts the Combined Higher Secondary Level examination every year to recruit candidates for various posts in the government of India. The typing test is a qualifying nature test.',
        targetWpm: 35,
        minAccuracy: 88,
        durationSec: 360,
        xpReward: 35,
      },
      {
        id: 'l8-speed-40',
        title: 'Target: 40 WPM — Above Average',
        instruction:
          '40 WPM — aap average se upar ho. Ab aur push karo. 45 WPM tak jaana hai.',
        keys: [],
        sampleText:
          'The commission has introduced several reforms in the examination pattern to ensure transparency and efficiency. Candidates are advised to regularly check the official website for updates and notifications regarding the examination schedule.',
        targetWpm: 40,
        minAccuracy: 88,
        durationSec: 420,
        xpReward: 35,
      },
      {
        id: 'l8-speed-45',
        title: 'Target: 45 WPM — Expert Level',
        instruction:
          '45 WPM — expert level. Aap profession typist ke barabar ho. Ab accuracy bhi 95%+ rakhni hai.',
        keys: [],
        sampleText:
          'The government has implemented a comprehensive strategy to enhance the efficiency of public service delivery through digital transformation and process reengineering across all departments and ministries.',
        targetWpm: 45,
        minAccuracy: 88,
        durationSec: 420,
        xpReward: 35,
      },
    ],
  },

  // ─── Level 9: Accuracy Polish ──────────────────────────────────────────────
  {
    id: 9,
    name: 'Accuracy Polish',
    subtitle: 'Zero-error typing',
    description:
      'Speed aagayi. Ab accuracy perfect karo. 95%+ accuracy ke saath type karo. Ek bhi galati nahi — aisa target rakho.',
    icon: 'Target',
    lessons: [
      {
        id: 'l9-accuracy-95',
        title: '95% Accuracy Challenge',
        instruction:
          'Dheere type karo, lekin har shabd sahi type karo. Accuracy 95% se upar rakhni hai. Speed baad mein aayegi.',
        keys: [],
        sampleText:
          'Accuracy is more important than speed in the SSC typing test. A candidate with 95 percent accuracy and 30 WPM will qualify. But a candidate with 80 percent accuracy and 40 WPM will not qualify. Focus on accuracy first.',
        targetWpm: 25,
        minAccuracy: 95,
        durationSec: 300,
        xpReward: 40,
      },
      {
        id: 'l9-accuracy-98',
        title: '98% Accuracy Challenge',
        instruction:
          '98% accuracy. Har 100 words mein sirf 2 galati. Yeh SSC mein safe zone hai.',
        keys: [],
        sampleText:
          'The department of personnel and training has issued detailed guidelines for the conduct of the skill test. Candidates must ensure that they adhere to the instructions provided in the official notification.',
        targetWpm: 28,
        minAccuracy: 98,
        durationSec: 360,
        xpReward: 40,
      },
      {
        id: 'l9-zero-error',
        title: 'Zero Error Challenge',
        instruction:
          'Zero error — ek bhi galati nahi. Dheere chalo, lekin perfect jao. Real test mein yehi mindset chahiye.',
        keys: [],
        sampleText:
          'Hard work and dedication are the keys to success in any competitive examination. Regular practice and self assessment help in identifying areas that need improvement.',
        targetWpm: 25,
        minAccuracy: 100,
        durationSec: 180,
        xpReward: 40,
      },
    ],
  },

  // ─── Level 10: Exam Simulation ─────────────────────────────────────────────
  {
    id: 10,
    name: 'Exam Simulation',
    subtitle: 'Real exam jaisa experience',
    description:
      'Aap ready ho. Ab real exam jaisa mahaul mein type karo. TCS iON replica, strict timer, aur exact SSC evaluation.',
    icon: 'Award',
    lessons: [
      {
        id: 'l10-mock-chsl',
        title: 'Mock Test — SSC CHSL',
        instruction:
          '10 minutes. 35 WPM target. 95%+ accuracy. Real exam jaisa feel karo. All the best!',
        keys: [],
        sampleText:
          'The Staff Selection Commission will hold the Combined Higher Secondary Level Examination for recruitment to various posts. The typing test is a qualifying test. Candidates must type at least 35 words per minute in English or 30 words per minute in Hindi. The test duration is 10 minutes. The passage contains approximately 1800 key depressions. Errors are calculated based on omission, addition, substitution, and wrong word errors. The minimum accuracy required is 95 percent.',
        targetWpm: 35,
        minAccuracy: 95,
        durationSec: 600,
        xpReward: 50,
      },
      {
        id: 'l10-mock-cgl',
        title: 'Mock Test — SSC CGL DEST',
        instruction:
          '15 minutes. ~2000 key depressions. Data Entry Skill Test. Accuracy 95%+ chahiye.',
        keys: [],
        sampleText:
          'The Combined Graduate Level Examination is conducted by the Staff Selection Commission for recruitment to various Group B and Group C posts. The Data Entry Skill Test is a qualifying test. Candidates must demonstrate proficiency in data entry. The test duration is 15 minutes. The passage contains approximately 2000 key depressions. Accuracy is the primary criterion for qualification.',
        targetWpm: 30,
        minAccuracy: 95,
        durationSec: 900,
        xpReward: 50,
      },
      {
        id: 'l10-mock-full',
        title: 'Full Mock — TCS iON Replica',
        instruction:
          'Yeh asli exam hai. TCS iON ka exact layout. Same timer, same interface. Koi help nahi. Aap khud!',
        keys: [],
        sampleText:
          'The government has announced a comprehensive plan for digital transformation of the economy. This initiative aims to improve the ease of doing business and enhance the quality of life for citizens. The plan focuses on key areas such as digital infrastructure, digital literacy, and digital delivery of services. The implementation of this plan will be carried out in phases over the next five years.',
        targetWpm: 35,
        minAccuracy: 95,
        durationSec: 600,
        xpReward: 50,
      },
    ],
  },
];

export default LEVELS;
