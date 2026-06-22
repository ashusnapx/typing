const CONSONANTS: Record<string, string> = {
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
  'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ', 'ny': 'ञ',
  't': 'ट', 'th': 'ठ', 'd': 'ड', 'dh': 'ढ', 'N': 'ण',
  'T': 'त', 'Th': 'थ', 'D': 'द', 'Dh': 'ध', 'n': 'न',
  'p': 'प', 'ph': 'फ', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
  'sh': 'श', 'Sh': 'ष', 's': 'स', 'h': 'ह',
  'x': 'क्ष', 'X': 'त्र', 'z': 'ज्ञ',
  'q': 'क़', 'Q': 'ख़',
}

const VOWELS: Record<string, string> = {
  'a': 'अ', 'aa': 'आ', 'A': 'आ',
  'i': 'इ', 'ee': 'ई', 'I': 'ई',
  'u': 'उ', 'oo': 'ऊ', 'U': 'ऊ',
  'e': 'ए', 'ai': 'ऐ',
  'o': 'ओ', 'au': 'औ',
  'Ri': 'ऋ',
}

const MATRAS: Record<string, string> = {
  'a': '', 'aa': 'ा', 'A': 'ा',
  'i': 'ि', 'ee': 'ी', 'I': 'ी',
  'u': 'ु', 'oo': 'ू', 'U': 'ू',
  'e': 'े', 'ai': 'ै',
  'o': 'ो', 'au': 'ौ',
  'Ri': 'ृ',
}

const VOWEL_KEYS = ['a', 'aa', 'A', 'i', 'ee', 'I', 'u', 'oo', 'U', 'e', 'ai', 'o', 'au', 'Ri']
const CONSONANT_KEYS = ['chh', 'ch', 'kh', 'gh', 'ng', 'jh', 'ny', 'Th', 'Dh', 'sh', 'Sh', 'kh', 'gh', 'ph', 'bh', 'dh', 'th', 'nh', 'rh', 'lh']
const ALL_CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length)
const ALL_VOWEL_KEYS = VOWEL_KEYS.sort((a, b) => b.length - a.length)

function isVowelKey(s: string): boolean {
  return ALL_VOWEL_KEYS.includes(s)
}

function isConsonantKey(s: string): boolean {
  return ALL_CONSONANT_KEYS.includes(s)
}

function getConsonant(s: string): string | undefined {
  return CONSONANTS[s]
}

function getMatra(s: string): string | undefined {
  return MATRAS[s]
}

function getVowel(s: string): string | undefined {
  return VOWELS[s]
}

export function transliterateEnglishToHindi(english: string): string {
  if (!english) return ''

  let i = 0
  let result = ''
  let pendingConsonant = ''

  while (i < english.length) {
    const char = english[i]
    const rest = english.slice(i)

    let matched = false

    for (const key of ALL_CONSONANT_KEYS) {
      if (rest.startsWith(key)) {
        if (pendingConsonant) {
          result += CONSONANTS[pendingConsonant] + '्'
          pendingConsonant = ''
        }
        pendingConsonant = key
        i += key.length
        matched = true
        break
      }
    }
    if (matched) continue

    for (const key of ALL_VOWEL_KEYS) {
      if (rest.startsWith(key)) {
        if (pendingConsonant) {
          const matra = getMatra(key)
          if (matra !== undefined) {
            result += CONSONANTS[pendingConsonant] + matra
          } else {
            result += CONSONANTS[pendingConsonant] + '्'
          }
          pendingConsonant = ''
        } else {
          const vowel = getVowel(key)
          if (vowel) result += vowel
        }
        i += key.length
        matched = true
        break
      }
    }
    if (matched) continue

    if (/^[a-zA-Z]$/.test(char)) {
      if (pendingConsonant) {
        result += CONSONANTS[pendingConsonant]
        pendingConsonant = ''
      }
      if (char === char.toUpperCase() && char.toLowerCase() !== char) {
        result += CONSONANTS[char.toLowerCase()] || char
      } else {
        result += char
      }
      i++
      continue
    }

    if (pendingConsonant) {
      result += CONSONANTS[pendingConsonant]
      pendingConsonant = ''
    }

    if (char === ' ') {
      result += ' '
    } else if (char === '.' || char === ',' || char === '?' || char === '!' ||
               char === ':' || char === ';' || char === '"' || char === "'" ||
               char === '(' || char === ')' || char === '-' || char === '\n') {
      result += char
    }

    i++
  }

  if (pendingConsonant) {
    result += CONSONANTS[pendingConsonant]
  }

  return result
}
