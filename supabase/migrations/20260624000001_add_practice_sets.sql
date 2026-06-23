-- ======================================================================
-- Add practice_set column and organize passages into 5 sets per category
-- Each set contains 1 passage (can hold more in future)
-- ======================================================================

ALTER TABLE passages ADD COLUMN IF NOT EXISTS practice_set SMALLINT;

-- SSC CHSL passages: 10 passages → 5 sets (2 passages per set for variety)
UPDATE passages SET practice_set = 1 WHERE id = 'a0000000-0000-0000-0000-000000000200'; -- Digital Transformation
UPDATE passages SET practice_set = 1 WHERE id = 'a0000000-0000-0000-0000-000000000201'; -- Water Conservation
UPDATE passages SET practice_set = 2 WHERE id = 'a0000000-0000-0000-0000-000000000202'; -- National Education Policy
UPDATE passages SET practice_set = 2 WHERE id = 'a0000000-0000-0000-0000-000000000203'; -- Renewable Energy
UPDATE passages SET practice_set = 3 WHERE id = 'a0000000-0000-0000-0000-000000000205'; -- Healthcare Reforms
UPDATE passages SET practice_set = 3 WHERE id = 'a0000000-0000-0000-0000-000000000207'; -- Women Empowerment
UPDATE passages SET practice_set = 4 WHERE id = 'a0000000-0000-0000-0000-000000000208'; -- Space Exploration
UPDATE passages SET practice_set = 4 WHERE id = 'a0000000-0000-0000-0000-000000000210'; -- Climate Change
UPDATE passages SET practice_set = 5 WHERE id = 'a0000000-0000-0000-0000-000000000211'; -- Skill Development
UPDATE passages SET practice_set = 5 WHERE id = 'a0000000-0000-0000-0000-000000000212'; -- Urban Development

-- SSC CGL passages: 4 passages → 5 sets (1 per set, add 1 new passage)
UPDATE passages SET practice_set = 1 WHERE id = 'a0000000-0000-0000-0000-000000000204'; -- Financial Inclusion
UPDATE passages SET practice_set = 2 WHERE id = 'a0000000-0000-0000-0000-000000000206'; -- Infrastructure Development
UPDATE passages SET practice_set = 3 WHERE id = 'a0000000-0000-0000-0000-000000000209'; -- Agricultural Reforms
UPDATE passages SET practice_set = 4 WHERE id = 'a0000000-0000-0000-0000-000000000213'; -- Startup Ecosystem

-- ======================================================================
-- NEW PASSAGE: SSC CGL Practice Set 5 - Cyber Security & Data Protection
-- ~2000 chars, authentic SSC-style topic
-- ======================================================================
INSERT INTO passages (id, title, content, language, category, difficulty, exact_key_depressions, word_count, topic, source, ssc_exam_year, is_exam_length, practice_set)
VALUES (
  'a0000000-0000-0000-0000-000000000214',
  'SSC CGL Set 5 - Cyber Security',
  $$Cyber security has become a critical concern for governments and organizations across the world as the frequency and sophistication of cyber attacks continue to increase. India has been proactive in strengthening its cyber security framework through a combination of policy initiatives, technological interventions, and international cooperation. The National Cyber Security Policy provides a comprehensive framework for securing the nation cyber space against various threats. The Indian Computer Emergency Response Team known as CERT In serves as the national nodal agency for responding to cyber security incidents and coordinating crisis management efforts. The government has also established the National Critical Information Infrastructure Protection Centre to safeguard critical infrastructure sectors such as power, banking, telecommunications, and transportation from cyber threats. The increasing adoption of digital payments and online services has made it essential to protect the personal data and privacy of citizens. The Personal Data Protection Bill aims to establish a robust legal framework for the processing of personal data and to provide individuals with greater control over their own data. Cyber security awareness campaigns have been launched to educate citizens about safe online practices including the use of strong passwords, two factor authentication, and the prevention of phishing attacks. The government has also invested in building indigenous cyber security capabilities through research and development initiatives. International cooperation has been strengthened through bilateral agreements and participation in global forums focused on cyber security. The growing importance of cyber security in the digital age requires continuous vigilance and adaptation to emerging threats and challenges.$$,
  'english', 'ssc_cgl', 'hard', 1996, 308,
  'Cyber Security', 'SSC CGL PYQ Pattern', '2024', true, 5
);

-- ======================================================================
-- NEW PASSSAGE: SSC CHSL Practice Set 5 alternative - Yoga & Wellness
-- ~2000 chars
-- ======================================================================
INSERT INTO passages (id, title, content, language, category, difficulty, exact_key_depressions, word_count, topic, source, ssc_exam_year, is_exam_length, practice_set)
VALUES (
  'a0000000-0000-0000-0000-000000000215',
  'SSC PYQ 2024 - Yoga and Wellness',
  $$Yoga is an ancient Indian practice that has gained global recognition for its numerous physical and mental health benefits. The United Nations has recognized the significance of yoga by declaring the twenty first of June as the International Day of Yoga following a proposal made by India. Yoga is a holistic discipline that combines physical postures, breathing techniques, meditation, and ethical principles to promote overall well being. The practice of yoga has been shown to improve flexibility, strength, and balance while also reducing stress, anxiety, and depression. The government has launched several initiatives to promote yoga and traditional wellness practices across the country. The Ministry of Ayurveda, Yoga and Naturopathy, Unani, Siddha, and Homeopathy commonly known as AYUSH has been working to integrate these traditional systems of medicine into the mainstream healthcare framework. Yoga has been included in school curricula to help students develop healthy habits and coping mechanisms from an early age. The common yoga protocol developed by the Ministry of AYUSH provides a standardized set of yoga practices that can be practiced by people of all age groups and fitness levels. The growing popularity of yoga worldwide has also contributed to the wellness tourism industry in India attracting visitors from different countries who seek authentic yoga experiences. The scientific validation of the health benefits of yoga has led to its increasing acceptance in healthcare settings as a complementary therapy for various chronic conditions. The practice of yoga represents the timeless wisdom of ancient Indian traditions and its relevance in the modern world continues to grow as people seek holistic approaches to health and well being.$$,
  'english', 'ssc_chsl', 'hard', 1994, 304,
  'Yoga and Wellness', 'SSC CHSL PYQ 2024', '2024', true, 5
);

-- ======================================================================
-- Update indexes
-- ======================================================================
CREATE INDEX IF NOT EXISTS idx_passages_practice_set ON passages(practice_set);

-- ======================================================================
-- Refresh exact_key_depressions
-- ======================================================================
UPDATE passages SET
  exact_key_depressions = LENGTH(content),
  word_count = COALESCE(array_length(string_to_array(TRIM(content), ' '), 1), 0)
WHERE practice_set IS NOT NULL;
