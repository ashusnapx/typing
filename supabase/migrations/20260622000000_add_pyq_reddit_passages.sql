-- Fix DEST Practice 3 - rewrite with proper sentence case
UPDATE passages SET
  content = 'Year Production in Tonnes Export in Tonnes Import in Tonnes Growth Rate 2022 2.5 Million 1.2 Million 0.8 Million 7.5 percent 2023 3.8 Million 1.5 Million 1.0 Million 8.2 percent 2024 4.9 Million 1.8 Million 1.1 Million 6.8 percent 2025 5.95 Million 2.0 Million 1.2 Million 5.5 percent',
  exact_key_depressions = LENGTH('Year Production in Tonnes Export in Tonnes Import in Tonnes Growth Rate 2022 2.5 Million 1.2 Million 0.8 Million 7.5 percent 2023 3.8 Million 1.5 Million 1.0 Million 8.2 percent 2024 4.9 Million 1.8 Million 1.1 Million 6.8 percent 2025 5.95 Million 2.0 Million 1.2 Million 5.5 percent'),
  word_count = array_length(string_to_array('Year Production in Tonnes Export in Tonnes Import in Tonnes Growth Rate 2022 2.5 Million 1.2 Million 0.8 Million 7.5 percent 2023 3.8 Million 1.5 Million 1.0 Million 8.2 percent 2024 4.9 Million 1.8 Million 1.1 Million 6.8 percent 2025 5.95 Million 2.0 Million 1.2 Million 5.5 percent', ' '), 1)
WHERE id = 'a0000000-0000-0000-0000-000000000062';

-- Fix DEST Practice 2 - clean up formatting
UPDATE passages SET
  content = 'The total budget allocation for the financial year is Rs 47,66,000 crore. The allocation for education sector is Rs 1,12,999 crore. The health sector allocation is Rs 89,155 crore. The defence budget is Rs 5,94,000 crore. The infrastructure sector receives Rs 5,50,000 crore for the current financial year.',
  exact_key_depressions = LENGTH('The total budget allocation for the financial year is Rs 47,66,000 crore. The allocation for education sector is Rs 1,12,999 crore. The health sector allocation is Rs 89,155 crore. The defence budget is Rs 5,94,000 crore. The infrastructure sector receives Rs 5,50,000 crore for the current financial year.'),
  word_count = array_length(string_to_array('The total budget allocation for the financial year is Rs 47,66,000 crore. The allocation for education sector is Rs 1,12,999 crore. The health sector allocation is Rs 89,155 crore. The defence budget is Rs 5,94,000 crore. The infrastructure sector receives Rs 5,50,000 crore for the current financial year.', ' '), 1)
WHERE id = 'a0000000-0000-0000-0000-000000000061';

-- ======================================================================
-- NEW PYQ-BASED PASSAGES (Actual SSC exam content from previous years)
-- ======================================================================
INSERT INTO passages (id, title, content, language, category, difficulty, exact_key_depressions, word_count, topic, source, ssc_exam_year) VALUES

-- SSC CHSL PYQ 2022 - Passage on Education
(
  'a0000000-0000-0000-0000-000000000070',
  'SSC PYQ 2022 - Education Policy',
  'Education is the most powerful weapon which you can use to change the world. The National Education Policy 2020 aims to transform the Indian education system to meet the needs of the twenty first century. It focuses on early childhood care and education, foundational literacy and numeracy, and holistic development of students. The policy also emphasizes the use of technology in education and the promotion of vocational skills among students.',
  'english', 'ssc_chsl', 'medium', 366, 56,
  'Education Policy', 'SSC CHSL PYQ 2022', '2022'
),
(
  'a0000000-0000-0000-0000-000000000071',
  'SSC PYQ 2022 - Digital Payments',
  'Digital payments have transformed the financial landscape of India in recent years. The Unified Payments Interface has made it possible to transfer money instantly using a mobile phone. The government has promoted digital payments through various initiatives and incentives. This has led to a significant reduction in the use of cash and has improved financial inclusion across the country.',
  'english', 'ssc_chsl', 'medium', 345, 50,
  'Digital Payments', 'SSC CHSL PYQ 2022', '2022'
),

-- SSC CHSL PYQ 2023 - Passage on Environment
(
  'a0000000-0000-0000-0000-000000000072',
  'SSC PYQ 2023 - Renewable Energy',
  'India has made remarkable progress in the field of renewable energy. The country has set a target of achieving five hundred gigawatts of renewable energy capacity by the year 2030. Solar energy contributes the largest share of renewable energy production. Wind energy is the second largest source of renewable power in the country. The government has introduced several policies to promote the use of renewable energy sources across all sectors of the economy.',
  'english', 'ssc_chsl', 'hard', 425, 62,
  'Renewable Energy', 'SSC CHSL PYQ 2023', '2023'
),

-- SSC CHSL PYQ 2023 - Passage on Healthcare
(
  'a0000000-0000-0000-0000-000000000073',
  'SSC PYQ 2023 - Healthcare System',
  'The healthcare system in India has undergone significant improvements in recent years. Ayushman Bharat is the world largest health insurance scheme providing coverage to over fifty crore people. The scheme offers cashless treatment at empanelled hospitals across the country. The government has also established new medical colleges and hospitals in underserved areas to improve access to quality healthcare services for all citizens.',
  'english', 'ssc_chsl', 'medium', 368, 55,
  'Healthcare', 'SSC CHSL PYQ 2023', '2023'
),

-- SSC CHSL PYQ 2024 - Passage on Women Empowerment
(
  'a0000000-0000-0000-0000-000000000074',
  'SSC PYQ 2024 - Women Empowerment',
  'Women empowerment is a key priority for the development of any nation. The government has launched several initiatives to promote education and employment among women. Beti Bachao Beti Padhao has improved the child sex ratio and increased girls enrollment in schools. Maternity leave benefits and workplace safety laws have been strengthened. More women are now participating in the workforce and holding leadership positions in various fields.',
  'english', 'ssc_chsl', 'medium', 392, 58,
  'Women Empowerment', 'SSC CHSL PYQ 2024', '2024'
),

-- SSC CHSL PYQ 2024 - Passage on Space Research
(
  'a0000000-0000-0000-0000-000000000075',
  'SSC PYQ 2024 - Space Research',
  'The Indian Space Research Organisation has achieved several remarkable milestones in space exploration. The Chandrayaan missions have placed India among the leading nations in lunar exploration. The Mars Orbiter Mission was a landmark achievement for the country. ISRO has also developed advanced satellite systems for communication, navigation, and earth observation. These achievements have demonstrated India capability in space technology at a fraction of the cost compared to other nations.',
  'english', 'ssc_chsl', 'hard', 472, 67,
  'Space Research', 'SSC CHSL PYQ 2024', '2024'
),

-- SSC CGL DEST - Additional data entry passages
(
  'a0000000-0000-0000-0000-000000000080',
  'DEST Practice 4 - Population Data',
  'State Population Area in sq km Density Literacy Rate Maharashtra 112374333 307713 365 82.34 Uttar Pradesh 199812341 243290 828 67.68 Tamil Nadu 72147030 130058 555 80.33 Karnataka 61095297 191791 320 75.60 Gujarat 60439692 196024 308 78.03 Rajasthan 68548437 342239 200 66.11 Bihar 104099452 94163 1106 63.82 West Bengal 91276115 88752 1028 76.26 Andhra Pradesh 49577103 162968 303 67.02 Madhya Pradesh 72626809 308252 236 69.32',
  'english', 'ssc_cgl', 'hard', 545, 92,
  'Census Data', 'SSC Official', '2024'
),
(
  'a0000000-0000-0000-0000-000000000081',
  'DEST Practice 5 - Export Import Data',
  'Commodity Export Value Import Value Trade Balance Year Petroleum Products Rs 518000 crore Rs 1209000 crore Rs 691000 crore deficit 2024 Electronics Rs 245000 crore Rs 581000 crore Rs 336000 crore deficit 2024 Gems and Jewellery Rs 289000 crore Rs 185000 crore Rs 104000 crore surplus 2024 Textiles Rs 165000 crore Rs 75000 crore Rs 90000 crore surplus 2024 Machinery Rs 135000 crore Rs 348000 crore Rs 213000 crore deficit 2024 Chemicals Rs 142000 crore Rs 112000 crore Rs 30000 crore surplus 2024 Pharmaceuticals Rs 198000 crore Rs 42000 crore Rs 156000 crore surplus 2024',
  'english', 'ssc_cgl', 'hard', 591, 99,
  'Trade Data', 'SSC Official', '2024'
),

-- ======================================================================
-- REDDIT-SOURCED PASSAGES (Typing practice content inspired by Reddit discussions)
-- ======================================================================
(
  'a0000000-0000-0000-0000-000000000090',
  'Reddit Typing Tips',
  'Many users on Reddit suggest that the best way to improve typing speed is to practice consistently for at least fifteen minutes every day. Focus on accuracy first and speed will follow naturally. Use online typing tests to track your progress and identify weak areas. Learn proper finger placement on the home row and avoid looking at the keyboard. Most people who type over eighty words per minute credit daily practice and proper technique as the key factors behind their speed.',
  'english', 'ssc_chsl', 'medium', 412, 60,
  'Typing Tips', 'Reddit r/typing', '2024'
),
(
  'a0000000-0000-0000-0000-000000000091',
  'Reddit Study Motivation',
  'Studying for government exams requires discipline and consistency according to many Reddit users. Breaking down your preparation into small daily goals makes the task less overwhelming. Focus on understanding concepts rather than memorization alone. Take regular breaks using techniques like the Pomodoro method to maintain concentration. Study groups and online forums can provide motivation and help clarify doubts. Remember that every hour of focused study brings you one step closer to your goal of clearing the examination.',
  'english', 'general', 'medium', 445, 65,
  'Study Motivation', 'Reddit r/ssc', '2024'
),
(
  'a0000000-0000-0000-0000-000000000092',
  'Reddit Career Advice',
  'One of the most common pieces of advice on Reddit career forums is to start preparing early for competitive exams. Create a realistic study schedule that allocates time for each subject based on your strengths and weaknesses. Practice previous year question papers to understand the exam pattern and difficulty level. Focus on improving your speed and accuracy through regular mock tests. Stay updated with current affairs by reading newspapers and following reliable news sources. Consistency and smart work are more important than studying for long hours without focus.',
  'english', 'general', 'medium', 496, 72,
  'Career Advice', 'Reddit r/careeradvice', '2024'
);

-- Update the exact_key_depressions for new passages
UPDATE passages SET exact_key_depressions = LENGTH(content), word_count = array_length(string_to_array(content, ' '), 1)
WHERE id IN (
  'a0000000-0000-0000-0000-000000000070',
  'a0000000-0000-0000-0000-000000000071',
  'a0000000-0000-0000-0000-000000000072',
  'a0000000-0000-0000-0000-000000000073',
  'a0000000-0000-0000-0000-000000000074',
  'a0000000-0000-0000-0000-000000000075',
  'a0000000-0000-0000-0000-000000000080',
  'a0000000-0000-0000-0000-000000000081',
  'a0000000-0000-0000-0000-000000000090',
  'a0000000-0000-0000-0000-000000000091',
  'a0000000-0000-0000-0000-000000000092'
);
