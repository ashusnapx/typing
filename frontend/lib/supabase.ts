import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awfqpmgshuicrfiwyvhy.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ZyW74xCjHX9PqnggeI_Gsw_Xdy16hYr';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PassageCategory = 'ssc_chsl' | 'ssc_cgl' | 'banking' | 'railway' | 'general';

export interface Passage {
  id: string;
  title: string;
  content: string;
  content_hindi: string | null;
  language: 'english' | 'hindi';
  category: PassageCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  exact_key_depressions: number;
  word_count: number;
  topic: string | null;
  source: string | null;
  ssc_exam_year: string | null;
  practice_set?: number | null;
}

export async function getRandomPassage(
  category?: PassageCategory,
  difficulty?: string,
  language: string = 'english',
  practiceSet?: number,
): Promise<Passage | null> {
  const isSscMode = category === 'ssc_chsl' || category === 'ssc_cgl';

  let query = supabase
    .from('passages')
    .select('*')
    .eq('is_active', true)
    .eq('language', language)
    .limit(20);

  if (category) query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (isSscMode) query = query.eq('is_exam_length', true);
  if (practiceSet) query = query.eq('practice_set', practiceSet);

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    if (practiceSet) {
      console.warn(`No passages found for practice_set=${practiceSet}, falling back to any passage`);
      return getRandomPassage(category, difficulty, language);
    }
    if (isSscMode) {
      let fallbackQuery = supabase
        .from('passages')
        .select('*')
        .eq('is_active', true)
        .eq('language', language)
        .limit(20);
      if (category) fallbackQuery = fallbackQuery.eq('category', category);
      if (difficulty) fallbackQuery = fallbackQuery.eq('difficulty', difficulty);
      const { data: fallbackData } = await fallbackQuery;
      if (fallbackData && fallbackData.length > 0) {
        return fallbackData[Math.floor(Math.random() * fallbackData.length)];
      }
    }
    if (difficulty) {
      return getRandomPassage(category, undefined, language);
    }
    return null;
  }

  return data[Math.floor(Math.random() * data.length)];
}
