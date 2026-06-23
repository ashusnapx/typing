export interface PracticeSet {
  number: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const PRACTICE_SETS: Record<string, PracticeSet[]> = {
  ssc_chsl: [
    { number: 1, title: 'Digital India & Governance', description: 'Digital transformation, e-governance, and water conservation initiatives', difficulty: 'hard' },
    { number: 2, title: 'Education & Renewable Energy', description: 'National Education Policy and renewable energy development', difficulty: 'hard' },
    { number: 3, title: 'Healthcare & Women Empowerment', description: 'Healthcare reforms, Ayushman Bharat, and women empowerment programmes', difficulty: 'hard' },
    { number: 4, title: 'Science & Environment', description: 'Space exploration, ISRO missions, and climate change action', difficulty: 'hard' },
    { number: 5, title: 'Skill Development & Smart Cities', description: 'Skill India mission, urban development, and smart city initiatives', difficulty: 'hard' },
  ],
  ssc_cgl: [
    { number: 1, title: 'Financial Inclusion', description: 'Banking, Jan Dhan Yojana, and financial literacy programmes', difficulty: 'hard' },
    { number: 2, title: 'Infrastructure & Connectivity', description: 'National highways, railways, ports, and industrial corridors', difficulty: 'hard' },
    { number: 3, title: 'Agriculture & Rural Development', description: 'Farm reforms, irrigation, MSP, and food security', difficulty: 'hard' },
    { number: 4, title: 'Startup & Innovation', description: 'Startup India, innovation ecosystem, and entrepreneurship', difficulty: 'hard' },
    { number: 5, title: 'Cyber Security & Data Protection', description: 'Digital security, data privacy, and cyber safety', difficulty: 'hard' },
  ],
  general: [
    { number: 1, title: 'General Awareness Set 1', description: 'General knowledge and current affairs passages', difficulty: 'medium' },
    { number: 2, title: 'General Awareness Set 2', description: 'General knowledge and current affairs passages', difficulty: 'medium' },
    { number: 3, title: 'General Awareness Set 3', description: 'General knowledge and current affairs passages', difficulty: 'medium' },
    { number: 4, title: 'General Awareness Set 4', description: 'General knowledge and current affairs passages', difficulty: 'medium' },
    { number: 5, title: 'General Awareness Set 5', description: 'General knowledge and current affairs passages', difficulty: 'medium' },
  ],
};

export function getPracticeSets(mode: string): PracticeSet[] {
  if (mode === 'ssc_chsl') return PRACTICE_SETS.ssc_chsl;
  if (mode === 'ssc_cgl_dest') return PRACTICE_SETS.ssc_cgl;
  return [];
}
