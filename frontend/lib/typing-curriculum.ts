import { FingerZone } from '@/components/learn/keyboard-layout';

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
  fingerZones: FingerZone[];
  newKeys: string[];
  drillType: 'letters' | 'bigrams' | 'trigrams' | 'words' | 'sentences' | 'passage' | 'exam';
  psychTip: string;
  warmupText: string;
}

export interface Level {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  lessons: Lesson[];
}

export const LEVELS: Level[] = [
  // ─── Level 0: Computer Parichay ───────────────────────────────────────────
  {
    id: 0,
    name: "Computer Parichay",
    subtitle: "Computer kaise chalayein?",
    description: "Agar aapne kabhi computer nahi chhua hai, to pehle yeh seekhein — mouse kaise chalayein, keyboard kaise pakdein, aur posture kaisa hona chahiye.",
    icon: "Monitor",
    lessons: [
      {
        id: "l0-mouse",
        title: "Mouse Chalana Seekhein",
        instruction: "Mouse ko right hand se pakdein. Index finger left button par, middle finger right button par. Buttons click aur scroll kijiye.",
        keys: ["left-click", "right-click", "scroll"],
        sampleText: "Click karein. Double-click karein. Scroll karein.",
        targetWpm: 0,
        minAccuracy: 0,
        durationSec: 60,
        xpReward: 10,
        fingerZones: ['ri', 'rm'],
        newKeys: [],
        drillType: 'letters',
        psychTip: "Mouse pakadne me muscles ko bilkul dheela rakhein, haath me tanaav na hone dein.",
        warmupText: "Click click scroll."
      },
      {
        id: "l0-posture",
        title: "Sahi Posture aur Hand Alignment",
        instruction: "Seedhe baitho. Elbows ko 90 degree par rakho. Ungliyaan home row par rakhein bina dabaye.",
        keys: ["A", "S", "D", "F", "J", "K", "L", ";"],
        sampleText: "ASDF JKL; ASDF JKL;",
        targetWpm: 0,
        minAccuracy: 60,
        durationSec: 90,
        xpReward: 10,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'],
        newKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
        drillType: 'letters',
        psychTip: "Screen ko thoda door rakhein taaki aankhon par zor na pade. Har 20 minute me door dekhein.",
        warmupText: "asdf jkl;"
      },
      {
        id: "l0-keys",
        title: "Home Row Par Ungliyaan Set Karein",
        instruction: "Apni left index finger ko 'F' par aur right index finger ko 'J' par rakhein (bumpy ridges feel karein). Baki ungliyaan side keys par rakhein.",
        keys: ["A", "S", "D", "F", "J", "K", "L", ";"],
        sampleText: "f j f j a s d f j k l ; f j",
        targetWpm: 0,
        minAccuracy: 70,
        durationSec: 120,
        xpReward: 10,
        fingerZones: ['li', 'ri', 'lp', 'lr', 'lm', 'rm', 'rr', 'rp'],
        newKeys: [],
        drillType: 'letters',
        psychTip: "Key F aur J par bane chote bumps aapko bina dekhe keyboard alignment check karne me madad karte hain.",
        warmupText: "ff jj asdf jkl;"
      }
    ]
  },

  // ─── Level 1: Home Row — Left Hand ────────────────────────────────────────
  {
    id: 1,
    name: "Home Row — Left Hand",
    subtitle: "Left hand ki muscle memory",
    description: "Apne baayein haath ki ungliyon ko active karein. A, S, D, F aur G keys par control haasil karein.",
    icon: "ChevronLeft",
    lessons: [
      {
        id: "l1-left-intro",
        title: "A S D F Introduction",
        instruction: "Left hand fingers: pinky se A, ring se S, middle se D, index se F dabayein.",
        keys: ["a", "s", "d", "f"],
        sampleText: "a s d f a s d f asdf asdf a s d f",
        targetWpm: 10,
        minAccuracy: 85,
        durationSec: 120,
        xpReward: 20,
        fingerZones: ['lp', 'lr', 'lm', 'li'],
        newKeys: ['a', 's', 'd', 'f'],
        drillType: 'letters',
        psychTip: "Bina dekhe dabane ki koshish karein. Har key dabane ke baad ungli ko halka rakhein.",
        warmupText: "aaaa ssss dddd ffff"
      },
      {
        id: "l1-g-key",
        title: "G Key and Spacebar",
        instruction: "Fingers ko home position par rakhein. F finger ko right shift karke G dabayein aur wapas F par layein. Thumb se Spacebar.",
        keys: ["g", " "],
        sampleText: "f g f g a f g a s d f g g a s d f g",
        targetWpm: 12,
        minAccuracy: 85,
        durationSec: 120,
        xpReward: 20,
        fingerZones: ['li', 'thumb'],
        newKeys: ['g', ' '],
        drillType: 'letters',
        psychTip: "G dabane ke baad index finger ko wapas F index ridge par laana zaroori hai.",
        warmupText: "fg fg a s d f g"
      },
      {
        id: "l1-left-words",
        title: "Left Hand Words",
        instruction: "Sirf left hand keys se bane words ko type karein. Space dabana na bhulein.",
        keys: ["a", "s", "d", "f", "g"],
        sampleText: "sad dad fad gas gag add fads dads gags",
        targetWpm: 15,
        minAccuracy: 90,
        durationSec: 150,
        xpReward: 25,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "Aksharon ko dimaag me pronounce karein taaki unki position muscle memory me absorb ho sake.",
        warmupText: "sad dad gas add"
      }
    ]
  },

  // ─── Level 2: Home Row — Right Hand ───────────────────────────────────────
  {
    id: 2,
    name: "Home Row — Right Hand",
    subtitle: "Right hand ki muscle memory",
    description: "Apne daayein haath ki ungliyon ko active karein. J, K, L, Semicolon aur H keys par grip banayein.",
    icon: "ChevronRight",
    lessons: [
      {
        id: "l2-right-intro",
        title: "J K L Sem-Colon",
        instruction: "Right hand fingers: index se J, middle se K, ring se L, pinky se semicolon (;) dabayein.",
        keys: ["j", "k", "l", ";"],
        sampleText: "j k l ; j k l ; jkl; jkl; j k l ;",
        targetWpm: 10,
        minAccuracy: 85,
        durationSec: 120,
        xpReward: 20,
        fingerZones: ['ri', 'rm', 'rr', 'rp'],
        newKeys: ['j', 'k', 'l', ';'],
        drillType: 'letters',
        psychTip: "Bina keyboard dekhe apne right pinky se semicolon (;) press karein.",
        warmupText: "jjkk ll;;"
      },
      {
        id: "l2-h-key",
        title: "H Key Introduction",
        instruction: "J index finger ko left side shift karke H dabayein aur wapas J index position par layein.",
        keys: ["h"],
        sampleText: "j h j h j h j k l h j h k l h ;",
        targetWpm: 12,
        minAccuracy: 85,
        durationSec: 120,
        xpReward: 20,
        fingerZones: ['ri'],
        newKeys: ['h'],
        drillType: 'letters',
        psychTip: "G aur H dono center keys hain, left index G par aur right index H par stretch hoti hai.",
        warmupText: "jh jh jklh"
      },
      {
        id: "l2-right-words",
        title: "Right Hand Words",
        instruction: "Right hand se type hone wale words ki practice karein.",
        keys: ["j", "k", "l", ";", "h"],
        sampleText: "all hall hill lill kild kill halls hills",
        targetWpm: 15,
        minAccuracy: 90,
        durationSec: 150,
        xpReward: 25,
        fingerZones: ['ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "Kild aur hill jaise shabdon me right ring aur middle finger ki alternate speed badhayein.",
        warmupText: "hall hill kill all"
      }
    ]
  },

  // ─── Level 3: Home Row — Combined ─────────────────────────────────────────
  {
    id: 3,
    name: "Home Row — Combined",
    subtitle: "Dono haath ek sath",
    description: "Ab dono haatho ki home row keys ko milakar poore words aur simple sentences banana seekhein.",
    icon: "Keyboard",
    lessons: [
      {
        id: "l3-combined-intro",
        title: "Home Row Coordination",
        instruction: "Left aur Right haath ki keys ko coordinate karein. Sahi ungli se sahi key hit karein.",
        keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
        sampleText: "a j s k d l f ; g h a s d f g h j k l ;",
        targetWpm: 15,
        minAccuracy: 90,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'],
        newKeys: [],
        drillType: 'letters',
        psychTip: "Dono haathon ka coordination typing me fluency aur balance laata hai.",
        warmupText: "asdfg hjkl;"
      },
      {
        id: "l3-combined-words",
        title: "Home Row Full Words",
        instruction: "Home row ke sabhi aksharon se bane mixed words type karein.",
        keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
        sampleText: "ash dash flash glad slag glass slash salad hash",
        targetWpm: 18,
        minAccuracy: 92,
        durationSec: 150,
        xpReward: 30,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "Glad aur salad type karte samay rhythm banayein, speed slow na hone dein.",
        warmupText: "glad salad glass dash"
      },
      {
        id: "l3-combined-sentences",
        title: "Home Row Sentences",
        instruction: "Sahi spaces ke sath home row se bane short phrases type karein.",
        keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
        sampleText: "a sad dad, a glad lad, a glass flask, slag glass",
        targetWpm: 20,
        minAccuracy: 92,
        durationSec: 180,
        xpReward: 35,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'sentences',
        psychTip: "Comma (,) aur spaces ke time coordination par dhyaan dein.",
        warmupText: "a sad dad glad lad"
      }
    ]
  },

  // ─── Level 4: Top Row — Introduction ──────────────────────────────────────
  {
    id: 4,
    name: "Top Row — Introduction",
    subtitle: "High frequency keys",
    description: "Top row par finger reaches ki shuruat karein, sabse pehle sabse zyada use hone wale akshar E, T, I, O aur U seekhein.",
    icon: "ArrowUpLeft",
    lessons: [
      {
        id: "l4-et-intro",
        title: "E and T Keys (Left Reach)",
        instruction: "Home F finger ko upper left slide karke T aur D finger ko slide karke E dabayein.",
        keys: ["e", "t"],
        sampleText: "d e d e f t f t e t e t d e f t e t e t",
        targetWpm: 15,
        minAccuracy: 90,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['lm', 'li'],
        newKeys: ['e', 't'],
        drillType: 'letters',
        psychTip: "E aur T English me sabse common letters hain. In par grip sabse solid honi chahiye.",
        warmupText: "dede ftft etet"
      },
      {
        id: "l4-io-intro",
        title: "I and O Keys (Right Reach)",
        instruction: "K finger se up slide karke I aur L finger se up slide karke O dabayein.",
        keys: ["i", "o"],
        sampleText: "k i k i l o l o i o i o k i l o i o i o",
        targetWpm: 15,
        minAccuracy: 90,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['rm', 'rr'],
        newKeys: ['i', 'o'],
        drillType: 'letters',
        psychTip: "I aur O dabane ke baad ungliyon ko waapas home keys K aur L par aane ka aabhyaas karayein.",
        warmupText: "kiki lolo ioio"
      },
      {
        id: "l4-u-key",
        title: "U Key Introduction",
        instruction: "J index finger ko upper left slide karke U dabayein aur wapas home J position par layein.",
        keys: ["u"],
        sampleText: "j u j u j u j u j u t u t u i u i u j u u i u",
        targetWpm: 18,
        minAccuracy: 90,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['ri'],
        newKeys: ['u'],
        drillType: 'letters',
        psychTip: "U key index finger ke extension control par chalte hain, strict muscle placement rakhein.",
        warmupText: "juju tutu iuiu"
      },
      {
        id: "l4-high-freq-words",
        title: "High Frequency Words",
        instruction: "E, T, I, O, U aur home row keys se bane words type karein.",
        keys: ["e", "t", "i", "o", "u"],
        sampleText: "the to it he you she oil site tilt kite auto suit tie toe",
        targetWpm: 22,
        minAccuracy: 92,
        durationSec: 150,
        xpReward: 30,
        fingerZones: ['lm', 'li', 'rm', 'rr', 'ri', 'lp', 'lr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "The, you, she jaise small words me spacing double na hone dein.",
        warmupText: "the to he you it"
      }
    ]
  },

  // ─── Level 5: Top Row — Mastery ───────────────────────────────────────────
  {
    id: 5,
    name: "Top Row — Mastery",
    subtitle: "Complete Top Row",
    description: "Q, W, R, Y aur P keys ko introduce karein taaki aapki top row mastery complete ho sake.",
    icon: "ArrowUpRight",
    lessons: [
      {
        id: "l5-qw-intro",
        title: "Q and W Keys (Left Pinky & Ring)",
        instruction: "Left Pinky (A) se slide karke Q aur Left Ring (S) se slide karke W press karein.",
        keys: ["q", "w"],
        sampleText: "a q a q s w s w q w q w a q s w q w",
        targetWpm: 15,
        minAccuracy: 88,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['lp', 'lr'],
        newKeys: ['q', 'w'],
        drillType: 'letters',
        psychTip: "Q aur W ke liye pinky aur ring finger ka movement thoda ajeeb lag sakta hai. Dheere badhein.",
        warmupText: "aqaq swsw qwqw"
      },
      {
        id: "l5-ryp-intro",
        title: "R, Y and P Keys",
        instruction: "F se R, J se Y aur right pinky (;) se slide karke P dabayein.",
        keys: ["r", "y", "p"],
        sampleText: "f r f y j y j p p y r r p y y r p",
        targetWpm: 18,
        minAccuracy: 90,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['li', 'ri', 'rp'],
        newKeys: ['r', 'y', 'p'],
        drillType: 'letters',
        psychTip: "P dabate samay hand position twist na karein, sirf pinky finger slide karein.",
        warmupText: "fr jyp ryp"
      },
      {
        id: "l5-top-words",
        title: "Top Row Vocabulary",
        instruction: "Top row aur Home row ke combination se bane shabdon ka abhyas karein.",
        keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        sampleText: "type query write power quiet route proud youth proper priority",
        targetWpm: 22,
        minAccuracy: 92,
        durationSec: 150,
        xpReward: 30,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "Quiet, write, power jaise commonly misspelled shabdon par vishesh dhyan dein.",
        warmupText: "type query write power"
      }
    ]
  },

  // ─── Level 6: Bottom Row ──────────────────────────────────────────────────
  {
    id: 6,
    name: "Bottom Row",
    subtitle: "Inward curls and reaches",
    description: "Z, X, C, V, B, N aur M keys ko seekhein. Yeh ungliyon ko andar ki taraf modkar (curl) type hoti hain.",
    icon: "ArrowDown",
    lessons: [
      {
        id: "l6-zxcv-intro",
        title: "Z X C V Keys (Left Hand)",
        instruction: "Left pinky se Z, ring se X, middle se C, index se V press karein. Har key andar curl hoti hai.",
        keys: ["z", "x", "c", "v"],
        sampleText: "a z a z s x s x d c d c f v f v z x c v z x c v",
        targetWpm: 15,
        minAccuracy: 88,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['lp', 'lr', 'lm', 'li'],
        newKeys: ['z', 'x', 'c', 'v'],
        drillType: 'letters',
        psychTip: "Z aur X dabaate samay wrist ko desktop par rest karne dein taaki fingers easily curl ho sakein.",
        warmupText: "azax sdcv zxcv"
      },
      {
        id: "l6-bnm-intro",
        title: "B N M Keys (Right Hand reaches)",
        instruction: "Left index se V ke baad stretch karke B, right index se N aur M, comma/dot ring and pinky fingers se seekhein.",
        keys: ["b", "n", "m", ",", "."],
        sampleText: "f b f n j n j m j m j n j b m , m . n , m .",
        targetWpm: 18,
        minAccuracy: 90,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['li', 'ri', 'rm', 'rr', 'rp'],
        newKeys: ['b', 'n', 'm', ',', '.'],
        drillType: 'letters',
        psychTip: "B aur N center positions hain. Index fingers ko stretching alignment me set rakhein.",
        warmupText: "fbn jnm bnm"
      },
      {
        id: "l6-bottom-words",
        title: "Bottom Row Words",
        instruction: "Bottom row keys aur other row keys se mix words type karein.",
        keys: ["z", "x", "c", "v", "b", "n", "m", ",", "."],
        sampleText: "zinc box cat van ban net man zone zero come back menu next",
        targetWpm: 22,
        minAccuracy: 90,
        durationSec: 150,
        xpReward: 30,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "Come, back, net shabdon ko type karte samay speed normal rakhein.",
        warmupText: "zinc box cat net man"
      },
      {
        id: "l6-all-rows-combined",
        title: "All Rows Combined",
        instruction: "Teenon rows se bane short sentences type karein.",
        keys: ["a", "q", "z", "s", "w", "x", "d", "e", "c", "f", "r", "v", "j", "u", "m"],
        sampleText: "the quick brown fox jumps over the lazy dog.",
        targetWpm: 25,
        minAccuracy: 92,
        durationSec: 180,
        xpReward: 35,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'sentences',
        psychTip: "Yeh pan-gram hai, isme A se Z tak ke sabhi letters aate hain. Accurately type karein.",
        warmupText: "the quick brown fox"
      }
    ]
  },

  // ─── Level 7: Numbers & Symbols ───────────────────────────────────────────
  {
    id: 7,
    name: "Numbers, Symbols & Shift",
    subtitle: "Complete keyboard coverage",
    description: "Numbers (0-9), saari punctuation marks, brackets, special characters, aur Shift key (uppercase) ki comprehensive practice — koi bhi key chhootni nahi chahiye.",
    icon: "Hash",
    lessons: [
      {
        id: "l7-num-left",
        title: "Left Hand Numbers (1-5)",
        instruction: "Pinky se 1, ring se 2, middle se 3, index se 4 aur 5 dabayein. Top-row ke upar wali line.",
        keys: ["1", "2", "3", "4", "5"],
        sampleText: "a 1 s 2 d 3 f 4 f 5 1 2 3 4 5 132 453 542",
        targetWpm: 15,
        minAccuracy: 85,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['lp', 'lr', 'lm', 'li'],
        newKeys: ['1', '2', '3', '4', '5'],
        drillType: 'letters',
        psychTip: "Numbers dabane ke baad ungliyon ko home row par lana mat bhulein.",
        warmupText: "1 2 3 4 5"
      },
      {
        id: "l7-num-right",
        title: "Right Hand Numbers (6-0)",
        instruction: "Index se 6 aur 7, middle se 8, ring se 9, pinky se 0 dabayein.",
        keys: ["6", "7", "8", "9", "0"],
        sampleText: "j 6 j 7 k 8 l 9 ; 0 6 7 8 9 0 786 908 679",
        targetWpm: 15,
        minAccuracy: 85,
        durationSec: 120,
        xpReward: 25,
        fingerZones: ['ri', 'rm', 'rr', 'rp'],
        newKeys: ['6', '7', '8', '9', '0'],
        drillType: 'letters',
        psychTip: "Right hand numeric placement thoda high stretching demand karta hai, relax and stretch.",
        warmupText: "6 7 8 9 0"
      },
      {
        id: "l7-symbols",
        title: "Common Symbols and Punctuation",
        instruction: "Shift key ke sath aur bhi symbols type karein: colon (:), apostrophe ('), quotes (\"), underscore (_), plus (+), caret (^), asterisk (*).",
        keys: ["-", "=", "?", "/", "!", ":", "'", "\"", "_", "+", "^", "*"],
        sampleText: "name: 'India' + $100. 100%_pass? a^b*c. date: 01/01/2026!",
        targetWpm: 18,
        minAccuracy: 88,
        durationSec: 150,
        xpReward: 30,
        fingerZones: ['rp', 'lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'thumb'],
        newKeys: [':', "'", '"', '_', '+', '^', '*'],
        drillType: 'sentences',
        psychTip: "Colon (:) right pinky se Shift+semicolon dabayein. Apostrophe (') bina Shift ke right pinky. Underscore (_) Shift+minus.",
        warmupText: "name: 'text' _under +plus"
      },
      {
        id: "l7-ssc-symbols",
        title: "SSC Special Format Exercises",
        instruction: "SSC exams me aane wale date, currency, aur percentage formats ki practice karein.",
        keys: ["%", "(", ")", "/", "@", "#", "$", "&"],
        sampleText: "date: 24/06/2026, price: $45.00, tax: 18%, mail: info@ssc.in",
        targetWpm: 20,
        minAccuracy: 90,
        durationSec: 180,
        xpReward: 35,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: ['%', '(', ')', '@', '#', '$', '&'],
        drillType: 'sentences',
        psychTip: "Special formats me keyboard par glance le sakte hain agar muscle memory weak lag rahi ho.",
        warmupText: "date 24/06/2026 18%"
      },
      {
        id: "l7-brackets",
        title: "Brackets, Braces and Special Keys",
        instruction: "Square brackets [], curly braces {}, backslash (\\), pipe (|), angle brackets <>, aur tilde (~) type karein.",
        keys: ["[", "]", "{", "}", "\\", "|", "<", ">", "~"],
        sampleText: "file [data] {name} path\\to\\file. a<b | c>d. ~tilde~ [nested {brackets}]",
        targetWpm: 18,
        minAccuracy: 88,
        durationSec: 150,
        xpReward: 35,
        fingerZones: ['lp', 'rp', 'li', 'ri', 'rm', 'rr', 'thumb'],
        newKeys: ['[', ']', '{', '}', '\\', '|', '<', '>', '~'],
        drillType: 'sentences',
        psychTip: "Square brackets left pinky se, curly braces Shift+dono se. Backslash (\\) right pinky ke upar, Shift se pipe (|).",
        warmupText: "[data] {name} file\\path"
      },
      {
        id: "l7-shift-uppercase",
        title: "Shift Key and Uppercase Letters",
        instruction: "Shift key daba kar uppercase letters (A-Z) type karein. Proper nouns, sentence starts, aur abbreviations me ye zaroori hai.",
        keys: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
        sampleText: "The Government of India Act was passed in 1935. Mr. Sharma and Dr. Patel attended the SSC CHSL Exam in New Delhi on Monday.",
        targetWpm: 20,
        minAccuracy: 88,
        durationSec: 150,
        xpReward: 35,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
        drillType: 'sentences',
        psychTip: "Left Shift right-hand keys ke liye, Right Shift left-hand keys ke liye. Dono haath ka coordination zaroori hai — ek haath Shift dabaaye, dusra letter hit kare.",
        warmupText: "The India Act SSC CHSL"
      }
    ]
  },

  // ─── Level 8: Common Word Fluency ─────────────────────────────────────────
  {
    id: 8,
    name: "Common Word Fluency",
    subtitle: "Speed and bigram automaticity",
    description: "English language ke top 200 high-frequency words aur essential bigrams/trigrams seekhein.",
    icon: "Zap",
    lessons: [
      {
        id: "l8-top-50",
        title: "Top 50 English Words",
        instruction: "Top 50 words ko bina soche automatic flow me type karein.",
        keys: [],
        sampleText: "the of to and a in is it you that he was for on are as with his they I",
        targetWpm: 25,
        minAccuracy: 92,
        durationSec: 120,
        xpReward: 30,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "Chote words ko letter by letter padhne ke bajaye ek poore unit ke roop me type karein.",
        warmupText: "the of to and a"
      },
      {
        id: "l8-top-100",
        title: "Top 100 English Words",
        instruction: "Fluency badhane ke liye next tier high-frequency words type karein.",
        keys: [],
        sampleText: "at be this have from or one had by word but not what all were we when your can said",
        targetWpm: 28,
        minAccuracy: 94,
        durationSec: 150,
        xpReward: 35,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "WPM target thoda high hai. Apne normal rhythm se thoda faster push karein.",
        warmupText: "at be this have from"
      },
      {
        id: "l8-bigrams",
        title: "Bigram Muscle Focus",
        instruction: "Common letter-pairs (th, he, in, er, an, re, on, at, en, es) par speed badhayein.",
        keys: [],
        sampleText: "that then there health here enter and clean trend other line when send standard",
        targetWpm: 30,
        minAccuracy: 94,
        durationSec: 120,
        xpReward: 35,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'bigrams',
        psychTip: "Bigrams physical combinations hain. Jab 'th' likhein to dono ungliyan lagatar act karni chahiye.",
        warmupText: "th he in er an"
      },
      {
        id: "l8-trigrams",
        title: "Trigram Master Flow",
        instruction: "Common letter-triplets (the, and, ing, ent, ion, her, for, tha) ki practice karein.",
        keys: [],
        sampleText: "there another standing standard client nation option other force that think interface",
        targetWpm: 32,
        minAccuracy: 94,
        durationSec: 150,
        xpReward: 40,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'trigrams',
        psychTip: "'ing' aur 'ion' jaise suffixes ke liye fingers ready positions me rakhein.",
        warmupText: "the and ing ent ion"
      }
    ]
  },

  // ─── Level 9: SSC Vocabulary ──────────────────────────────────────────────
  {
    id: 9,
    name: "SSC Vocabulary",
    subtitle: "Official exam vocabulary",
    description: "SSC typing tests (CGL, CHSL, Steno) me aksar aane wale sarkari aur administrative shabdon ki practice karein.",
    icon: "Award",
    lessons: [
      {
        id: "l9-official",
        title: "Administrative Terminology",
        instruction: "Government offices me use hone wale terms ko bina galti ke type karein.",
        keys: [],
        sampleText: "government department administration authority application document section circular notification register general",
        targetWpm: 25,
        minAccuracy: 95,
        durationSec: 150,
        xpReward: 35,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "SSC exam me 95% accuracy mandatory hai, isliye speed se zyada focus zero-mistakes par karein.",
        warmupText: "government department administration"
      },
      {
        id: "l9-legal",
        title: "Constitutional and Legal Words",
        instruction: "Sambaadhadhik aur nyayik shabdon par haath tez karein.",
        keys: [],
        sampleText: "constitution parliament committee commission article schedule act regulation judicial court order judgment petitioner",
        targetWpm: 28,
        minAccuracy: 95,
        durationSec: 150,
        xpReward: 35,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "Parliament aur constitution type karte samay capital letters (Shift) ka use carefully karein.",
        warmupText: "constitution parliament committee"
      },
      {
        id: "l9-finance",
        title: "Financial and Budgetary Terms",
        instruction: "Finance, audit aur accounts se related terms ki practice karein.",
        keys: [],
        sampleText: "finance budget revenue expenditure audit account transaction pension payment salary allowance treasury ledger",
        targetWpm: 28,
        minAccuracy: 95,
        durationSec: 150,
        xpReward: 40,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "Expenditure aur transaction long words hain, inko divide karke smooth rhythm me likhein.",
        warmupText: "finance budget revenue audit"
      },
      {
        id: "l9-combined-ssc",
        title: "SSC Complex Paragraph Words",
        instruction: "Official correspondences me use hone wale high-level vocabularies seekhein.",
        keys: [],
        sampleText: "implementation correspondence memorandum representations qualifications candidates appointments verification eligibility criteria instruction guidelines",
        targetWpm: 30,
        minAccuracy: 95,
        durationSec: 180,
        xpReward: 40,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'words',
        psychTip: "Bade shabdon me spelling mistake hone ke chances high hote hain. Patience se har key check karein.",
        warmupText: "implementation candidates verification"
      }
    ]
  },

  // ─── Level 10: Passage Endurance ──────────────────────────────────────────
  {
    id: 10,
    name: "Passage Endurance",
    subtitle: "Endurance and mental stamina",
    description: "Apna focus aur endurance badhayein. Long passages bina thake aur bina focus loose kiye type karein.",
    icon: "ShieldAlert",
    lessons: [
      {
        id: "l10-p1",
        title: "Medium Passage 1 — Governance",
        instruction: "Sarkari governance se related passage type karein. Strict accuracy maintiain karein.",
        keys: [],
        sampleText: "The administration of the state is carried out through various departments. Each department is headed by an officer who ensures that the rules and regulations are followed. The circulars issued by the government must be registered and stored in the main office database for future reference.",
        targetWpm: 28,
        minAccuracy: 95,
        durationSec: 180,
        xpReward: 40,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'passage',
        psychTip: "Endurance build karne ke liye elbows ko physical stress na dein, posture correct rakhein.",
        warmupText: "The administration of the state"
      },
      {
        id: "l10-p2",
        title: "Medium Passage 2 — Public Service",
        instruction: "Public service commission reports se related paragraph type karein.",
        keys: [],
        sampleText: "Candidates who qualify in the preliminary examinations are eligible to appear for the mains. The verification of documents is done at the local district centers. The commission has issued strict guidelines regarding the verification process to avoid any discrepancies or delay in appointment.",
        targetWpm: 30,
        minAccuracy: 95,
        durationSec: 180,
        xpReward: 40,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'passage',
        psychTip: "Dheere-dheere aapki muscles paragraph read karke automatic key hits coordinate karne lagengi.",
        warmupText: "Candidates who qualify"
      },
      {
        id: "l10-p3",
        title: "Long Passage 1 — India's Judiciary",
        instruction: "Indian Judiciary system par ek lamba paragraph. Strict SSC accuracy targets.",
        keys: [],
        sampleText: "The Supreme Court of India is the highest judicial forum and final court of appeal under the Constitution. It consists of the Chief Justice and other judges appointed by the President. The High Courts are the principal civil courts of original jurisdiction in each state. The judicial system is responsible for protecting the fundamental rights of every citizen.",
        targetWpm: 30,
        minAccuracy: 95,
        durationSec: 240,
        xpReward: 50,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'passage',
        psychTip: "Bade passage me break mat lein. Apne breathing flow ko normalized rakhein.",
        warmupText: "The Supreme Court of India"
      },
      {
        id: "l10-p4",
        title: "Long Passage 2 — Economic Development",
        instruction: "Desh ke economic systems aur budgets par passage. Punctuation aur numerals mixed.",
        keys: [],
        sampleText: "The Union Budget is presented every year in the Parliament on the first day of February. It contains the estimates of government revenue and expenditure for the upcoming fiscal year. In 2026, the government focused heavily on infrastructure development, allocation of funds for rural employment schemes, and digitizing rural treasury systems.",
        targetWpm: 32,
        minAccuracy: 95,
        durationSec: 240,
        xpReward: 50,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'passage',
        psychTip: "Numeric figures (2026, first) type karte samay normal typing speed se scroll down na karein.",
        warmupText: "The Union Budget is presented"
      }
    ]
  },

  // ─── Level 11: Speed Building ─────────────────────────────────────────────
  {
    id: 11,
    name: "Speed Building",
    subtitle: "Milestones and speed run challenges",
    description: "Alag-alag milestones (30 WPM, 35 WPM, 40 WPM) ko target karke apni raw speed badhayein.",
    icon: "Gauge",
    lessons: [
      {
        id: "l11-s1",
        title: "30 WPM Speed Challenge",
        instruction: "Is lesson me WPM 30 cross karna zaroori hai. Simple but fast vocabulary.",
        keys: [],
        sampleText: "we should make sure that all the systems are working in a proper way to get the best result from our team.",
        targetWpm: 30,
        minAccuracy: 93,
        durationSec: 90,
        xpReward: 40,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'passage',
        psychTip: "Pehle 10-15 seconds accuracy high rakhein. Jab flow ban jaye to fingers ko slip hone dein.",
        warmupText: "we should make sure that"
      },
      {
        id: "l11-s2",
        title: "35 WPM SSC CHSL Target",
        instruction: "SSC CHSL qualifying speed target (35 WPM). Accuracy target: 95%.",
        keys: [],
        sampleText: "The department had issued a new circular containing instructions regarding the appointments of qualified candidates for this project.",
        targetWpm: 35,
        minAccuracy: 95,
        durationSec: 100,
        xpReward: 45,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'passage',
        psychTip: "Ye target clear karne par aap SSC CHSL typing pass kar sakte hain! Focus 100%!",
        warmupText: "The department had issued"
      },
      {
        id: "l11-s3",
        title: "40 WPM CGL Buffer Challenge",
        instruction: "SSC CGL me pass hone ke liye 35+ high speed buffer ki zaroorat hoti hai. 40 WPM achieve karein.",
        keys: [],
        sampleText: "The central committee has recommended standard updates in the verification protocols to ensure complete transparency across all judicial audits.",
        targetWpm: 40,
        minAccuracy: 95,
        durationSec: 120,
        xpReward: 50,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'passage',
        psychTip: "40 WPM lane ke liye spacebar aur next key ke beech ka delay zero hona chahiye.",
        warmupText: "The central committee has recommended"
      },
      {
        id: "l11-s4",
        title: "45 WPM Elite Speed Master",
        instruction: "High level speed run. 45 WPM reach karein aur master certificate unlock karein.",
        keys: [],
        sampleText: "It is essential to understand the basic requirements of the official examination system to prepare effectively and achieve maximum speed without losing accuracy.",
        targetWpm: 45,
        minAccuracy: 96,
        durationSec: 120,
        xpReward: 60,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'passage',
        psychTip: "Apne fingers ko lightweight feel karayein. Keyboard hits bilkul smooth taps hone chahiye.",
        warmupText: "It is essential to understand"
      }
    ]
  },

  // ─── Level 12: Exam Simulation ────────────────────────────────────────────
  {
    id: 12,
    name: "Exam Simulation",
    subtitle: "Real SSC Mock Tests",
    description: "Pure CGL/CHSL pattern par full-length mock tests type karein. Strict SSC calculations applicable.",
    icon: "FileText",
    lessons: [
      {
        id: "l12-m1",
        title: "SSC CGL Mock Test 1",
        instruction: "SSC CGL strict mock test. Net Speed target 35 WPM, Max mistakes 5%.",
        keys: [],
        sampleText: "The Constitution of India is the supreme law of the land. It lays down the framework that defines the fundamental political principles, structures, procedures, powers, and duties of government institutions. It also sets out the fundamental rights, directive principles, and duties of citizens. It is the longest written constitution of any country. The drafting committee was headed by Dr. B. R. Ambedkar, who is widely regarded as the chief architect of the Indian Constitution. The document was approved on twenty-six November nineteen forty-nine and came into force on twenty-six January nineteen fifty, making India a republic.",
        targetWpm: 35,
        minAccuracy: 95,
        durationSec: 300,
        xpReward: 80,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'exam',
        psychTip: "Real exam environment target! Ek corner me timer tick ho raha hoga, calmly focus karein.",
        warmupText: "The Constitution of India is the supreme"
      },
      {
        id: "l12-m2",
        title: "SSC CHSL Mock Test 2",
        instruction: "CHSL replica mock. Special characters aur punctuation density zyada hai.",
        keys: [],
        sampleText: "The Reserve Bank of India (RBI) is India's central bank and regulatory body responsible for regulation of the Indian banking system. It is under the ownership of the Ministry of Finance. It commenced operations on one April nineteen thirty-five under the RBI Act, 1934. The bank controls the monetary policy of the Indian rupee. In its latest credit policy review, the RBI maintained the repo rate at six percent to keep inflation within the target band. The committee noted that while global growth remains sluggish, domestic economic activity is showing resilience, supported by public investment and robust consumer demand in urban areas.",
        targetWpm: 35,
        minAccuracy: 95,
        durationSec: 300,
        xpReward: 80,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'exam',
        psychTip: "Numbers (1934, 1935, six) aur brackets type karte samay special concentration rakhein.",
        warmupText: "The Reserve Bank of India"
      },
      {
        id: "l12-m3",
        title: "SSC CGL Mock Test 3 (Premium Passage)",
        instruction: "Previous Year Question (PYQ) based mock test. Strict evaluation.",
        keys: [],
        sampleText: "India's digital public infrastructure, commonly known as the India Stack, has revolutionized the country's financial landscape. It includes Aadhaar for identity verification, United Payments Interface (UPI) for instant payments, and DigiLocker for digital storage of documents. These systems have enabled the government to transfer welfare benefits directly to citizens' bank accounts, eliminating leakages and reducing administrative costs. In the fiscal year 2025-26, digital transactions accounted for over eighty percent of all retail payments, marking a significant milestone in India's journey towards a digital and cashless economy.",
        targetWpm: 35,
        minAccuracy: 95,
        durationSec: 300,
        xpReward: 100,
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'],
        newKeys: [],
        drillType: 'exam',
        psychTip: "Aadhaar, DigiLocker, UPI jaise proper names me capitalization and spellings check karke hi enter karein.",
        warmupText: "India's digital public infrastructure"
      }
    ]
  }
];

export interface FlatLesson {
  id: string;
  title: string;
  levelId: number;
  levelName: string;
  order: number;
}

export function getFlatLessons(): FlatLesson[] {
  const all: FlatLesson[] = [];
  let order = 0;
  for (const level of LEVELS) {
    for (const lesson of level.lessons) {
      all.push({ id: lesson.id, title: lesson.title, levelId: level.id, levelName: level.name, order });
      order++;
    }
  }
  return all;
}

export function getNextLessonId(currentId: string): string | null {
  const all = getFlatLessons();
  const idx = all.findIndex((l) => l.id === currentId);
  if (idx === -1 || idx >= all.length - 1) return null;
  return all[idx + 1].id;
}

export function isLessonUnlocked(_lessonId: string, _progress: Record<string, any>): boolean {
  return true;
}

export const LEVEL_NAMES = [
  { name: 'Rookie', minXp: 0 },
  { name: 'Novice', minXp: 250 },
  { name: 'Amateur', minXp: 750 },
  { name: 'Expert', minXp: 2000 },
  { name: 'Candidate Master', minXp: 4500 },
  { name: 'Master', minXp: 7500 },
  { name: 'Grandmaster', minXp: 11000 },
  { name: 'Goated', minXp: 16000 },
] as const;

export function getLevelName(xp: number): string {
  let name: string = LEVEL_NAMES[0].name;
  for (const l of LEVEL_NAMES) {
    if (xp >= l.minXp) name = l.name;
  }
  return name;
}

export function getLevelIndex(xp: number): number {
  let idx = 0;
  for (let i = 0; i < LEVEL_NAMES.length; i++) {
    if (xp >= LEVEL_NAMES[i].minXp) idx = i;
  }
  return idx;
}

export function getLevelProgress(xp: number): { current: string; next: string | null; currentXp: number; nextXp: number; progress: number } {
  const idx = getLevelIndex(xp);
  const current = LEVEL_NAMES[idx];
  const next = idx < LEVEL_NAMES.length - 1 ? LEVEL_NAMES[idx + 1] : null;
  const range = next ? next.minXp - current.minXp : 1;
  const progress = next ? ((xp - current.minXp) / range) * 100 : 100;
  return {
    current: current.name,
    next: next?.name || null,
    currentXp: current.minXp,
    nextXp: next?.minXp || current.minXp,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

export default LEVELS;
