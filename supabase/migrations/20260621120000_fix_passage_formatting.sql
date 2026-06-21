-- Fix passage formatting: convert word-list passages to proper sentence-based content
-- following standard typing test conventions (punctuation, sentence case)

-- Common English Words → proper paragraph with punctuation and sentence case
UPDATE passages SET
  content = 'The world is full of wonderful places and people. Time is one of the most valuable things one can have. Water is essential for life on this planet. Work hard every day and you can achieve all your goals. Education is the key to a better future for every child and person. There are many ways to make the world a better place for everyone.'
WHERE id = 'a0000000-0000-0000-0000-000000000010';

-- Government Terms → proper paragraph on government functions
UPDATE passages SET
  content = 'The government provides essential public services to all citizens through its various departments. The secretary of each ministry is responsible for the administration of government policies. The annual budget includes both revenue and expenditure for development and welfare schemes. The development of rural and urban infrastructure is a priority for the finance department. Education and health services are vital for the welfare of the people of the nation.'
WHERE id = 'a0000000-0000-0000-0000-000000000011';

-- Economic Terms → proper paragraph on economic concepts
UPDATE passages SET
  content = 'The economy grows through continuous development and innovation across various sectors. The government manages inflation through careful budget planning and effective fiscal policy. A budget deficit occurs when government expenditure exceeds its revenue in a financial year. Savings and investments are crucial for maintaining a stable banking system. Trade and industry play a vital role in the growth of the commerce sector. Economic policy planning helps achieve sustainable development for the entire nation.'
WHERE id = 'a0000000-0000-0000-0000-000000000012';

-- Practice Passage 1 → fix to proper sentence case and punctuation
UPDATE passages SET
  content = 'The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. Practice typing this sentence again and again to improve your speed and accuracy. Keep your fingers on the home row and type without looking at the keyboard.'
WHERE id = 'f0000000-0000-0000-0000-000000000001';

-- Update the derived fields
UPDATE passages SET exact_key_depressions = LENGTH(content), word_count = array_length(string_to_array(content, ' '), 1)
WHERE id IN (
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000012',
  'f0000000-0000-0000-0000-000000000001'
);
