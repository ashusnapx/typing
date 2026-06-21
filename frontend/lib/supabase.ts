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
}

export async function getRandomPassage(
  category?: PassageCategory,
  difficulty?: string,
  language: string = 'english',
): Promise<Passage | null> {
  let query = supabase
    .from('passages')
    .select('*')
    .eq('is_active', true)
    .eq('language', language)
    .limit(20);

  if (category) query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    // Fallback: try without difficulty filter
    if (difficulty) {
      return getRandomPassage(category, undefined, language);
    }
    return null;
  }

  return data[Math.floor(Math.random() * data.length)];
}
