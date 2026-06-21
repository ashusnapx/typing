-- Enable pgvector for future AI search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enum types
CREATE TYPE passage_language AS ENUM ('english', 'hindi');
CREATE TYPE passage_category AS ENUM ('ssc_chsl', 'ssc_cgl', 'banking', 'railway', 'general');
CREATE TYPE passage_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Passages table (Supabase managed UUIDs)
CREATE TABLE passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_hindi TEXT,
  language passage_language NOT NULL DEFAULT 'english',
  category passage_category NOT NULL DEFAULT 'general',
  difficulty passage_difficulty NOT NULL DEFAULT 'medium',
  exact_key_depressions INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 0,
  topic VARCHAR(255),
  source VARCHAR(255),
  ssc_exam_year VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_passages_category ON passages(category);
CREATE INDEX idx_passages_difficulty ON passages(difficulty);
CREATE INDEX idx_passages_language ON passages(language);
CREATE INDEX idx_passages_active ON passages(is_active);

-- RLS
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;

-- Everyone can read active passages
CREATE POLICY "Anyone can read active passages"
  ON passages FOR SELECT
  USING (is_active = true);

-- Only service_role can insert/update/delete
CREATE POLICY "Service role can manage passages"
  ON passages FOR ALL
  USING (auth.role() = 'service_role');

-- Seed passages
INSERT INTO passages (id, title, content, content_hindi, language, category, difficulty, exact_key_depressions, word_count, topic, source, ssc_exam_year) VALUES

-- ======================================================================
-- SSC CHSL ENGLISH (Level 0-1: Home Row basics)
-- ======================================================================
(
  'a0000000-0000-0000-0000-000000000001',
  'Home Row Basics',
  'as df gh jk kl as df gh jk kl as df gh jk kl as df gh jk kl as df gh jk kl as df gh jk kl as df gh jk kl as df gh jk kl',
  NULL,
  'english', 'ssc_chsl', 'easy', 176, 32,
  'Home Row Practice', 'SSC Typing Mania', '2024'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Top Row Practice',
  'qw er ty ui op qw er ty ui op qw er ty ui op qw er ty ui op qw er ty ui op qw er ty ui op',
  NULL,
  'english', 'ssc_chsl', 'easy', 132, 24,
  'Top Row Practice', 'SSC Typing Mania', '2024'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Bottom Row Practice',
  'zx cv bn m zx cv bn m zx cv bn m zx cv bn m zx cv bn m zx cv bn m',
  NULL,
  'english', 'ssc_chsl', 'easy', 72, 16,
  'Bottom Row Practice', 'SSC Typing Mania', '2024'
),

-- ======================================================================
-- SSC CHSL ENGLISH (Level 2-3: Common words)
-- ======================================================================
(
  'a0000000-0000-0000-0000-000000000010',
  'Common English Words',
  'the and for are but not you all can had her was one two three four five six seven eight nine ten time year people way day man thing water world place work part case',
  NULL,
  'english', 'ssc_chsl', 'easy', 188, 31,
  'Common Words', 'SSC Typing Mania', '2024'
),
(
  'a0000000-0000-0000-0000-000000000011',
  'Government Terms',
  'government public service officer department minister secretary committee authority administration policy scheme development welfare education health agriculture rural urban infrastructure finance budget revenue expenditure implementation',
  NULL,
  'english', 'ssc_chsl', 'medium', 272, 23,
  'Government Vocabulary', 'SSC Official', '2024'
),
(
  'a0000000-0000-0000-0000-000000000012',
  'Economic Terms',
  'economy growth development inflation budget deficit surplus revenue expenditure investment savings banking credit finance market trade industry commerce sector policy planning',
  NULL,
  'english', 'ssc_chsl', 'medium', 208, 21,
  'Economic Vocabulary', 'SSC Official', '2024'
),

-- ======================================================================
-- SSC CHSL ENGLISH (Level 4-5: Sentences)
-- ======================================================================
(
  'a0000000-0000-0000-0000-000000000020',
  'Constitutional Values',
  'India is a sovereign socialist secular democratic republic. The Constitution of India guarantees justice liberty equality and fraternity to all citizens. Every citizen has the right to vote and the right to equality before the law. The fundamental duties are enshrined in the Constitution.',
  NULL,
  'english', 'ssc_chsl', 'medium', 316, 42,
  'Constitution', 'SSC Official', '2023'
),
(
  'a0000000-0000-0000-0000-000000000021',
  'Indian Education System',
  'The education system in India has undergone significant changes in recent years. The National Education Policy 2020 focuses on holistic development and skill based learning. Digital initiatives have made education accessible to students in remote areas across the country.',
  NULL,
  'english', 'ssc_chsl', 'medium', 278, 38,
  'Education', 'SSC Official', '2023'
),
(
  'a0000000-0000-0000-0000-000000000022',
  'Digital India Initiative',
  'Digital India is a flagship programme of the Government of India with a vision to transform India into a digitally empowered society. The initiative aims to ensure that government services are made available to citizens electronically. It focuses on digital infrastructure digital literacy and digital delivery of services.',
  NULL,
  'english', 'ssc_chsl', 'medium', 352, 47,
  'Digital India', 'SSC Official', '2024'
),
(
  'a0000000-0000-0000-0000-000000000023',
  'Clean India Mission',
  'Swachh Bharat Mission was launched on 2nd October 2014 to achieve the vision of a clean India. The mission aims to eliminate open defecation and improve solid waste management. It has led to the construction of millions of toilets across rural and urban areas.',
  NULL,
  'english', 'ssc_chsl', 'medium', 278, 40,
  'Swachh Bharat', 'SSC Official', '2024'
),
(
  'a0000000-0000-0000-0000-000000000024',
  'Indian Economy Overview',
  'India is one of the fastest growing major economies in the world. The agriculture sector employs a large portion of the population. The services sector contributes significantly to the GDP. Manufacturing is growing steadily under the Make in India initiative. The government is focused on economic reforms and infrastructure development.',
  NULL,
  'english', 'ssc_chsl', 'medium', 344, 46,
  'Economy', 'SSC Official', '2024'
),

-- ======================================================================
-- SSC CHSL ENGLISH (Level 6-7: Paragraphs)
-- ======================================================================
(
  'a0000000-0000-0000-0000-000000000030',
  'Climate Change and India',
  'Climate change is one of the most pressing challenges facing the world today. India has been actively participating in global efforts to combat climate change. The country has set ambitious targets for renewable energy generation. Solar power capacity has increased significantly in recent years. The International Solar Alliance was launched by India to promote solar energy among nations. Afforestation programs are being implemented to increase forest cover and reduce carbon emissions.',
  NULL,
  'english', 'ssc_chsl', 'hard', 486, 69,
  'Environment', 'SSC Official', '2023'
),
(
  'a0000000-0000-0000-0000-000000000031',
  'Science and Technology in India',
  'India has made remarkable progress in the field of science and technology. The Indian Space Research Organisation has achieved several milestones including the successful Mars Orbiter Mission. India has also developed its own navigation system called NavIC. In the field of information technology Indian professionals are recognized worldwide for their expertise. The government has launched various initiatives to promote research and innovation in the country.',
  NULL,
  'english', 'ssc_chsl', 'hard', 476, 67,
  'Science & Tech', 'SSC Official', '2024'
),
(
  'a0000000-0000-0000-0000-000000000032',
  'Indian Heritage and Culture',
  'India is known for its rich cultural heritage that dates back thousands of years. The country is home to numerous UNESCO World Heritage sites. Indian classical music and dance forms are renowned across the globe. The festivals of India reflect its diversity and unity. Traditional art forms like pottery weaving and painting are being preserved through government schemes. Yoga which originated in ancient India is now practiced worldwide for its health benefits.',
  NULL,
  'english', 'ssc_chsl', 'hard', 494, 68,
  'Culture', 'SSC Official', '2024'
),

-- ======================================================================
-- SSC CHSL ENGLISH (Level 8-9: Full passages)
-- ======================================================================
(
  'a0000000-0000-0000-0000-000000000040',
  'Make in India Initiative',
  'Make in India was launched in 2014 as a major national programme designed to transform India into a global manufacturing hub. The initiative aims to encourage both multinational and domestic companies to manufacture their products in India. Several sectors have been opened up for foreign direct investment. The programme has led to significant improvements in the ease of doing business ranking of the country. Under this initiative special focus is given to job creation and skill development. The production linked incentive scheme has been introduced to boost manufacturing in key sectors like electronics automobiles and pharmaceuticals. The initiative has helped in reducing import dependence and strengthening the domestic supply chain.',
  NULL,
  'english', 'ssc_chsl', 'hard', 725, 109,
  'Make in India', 'SSC Official', '2024'
),
(
  'a0000000-0000-0000-0000-000000000041',
  'Banking Sector Reforms',
  'The banking sector in India has undergone comprehensive reforms over the past decade. The merger of public sector banks has created stronger and more efficient banking entities. Digital banking has transformed the way customers access financial services. The Unified Payments Interface has revolutionized digital transactions making India a global leader in real time payments. Financial inclusion initiatives like Jan Dhan Yojana have brought millions of people into the formal banking system. The Insolvency and Bankruptcy Code has improved the resolution of stressed assets. Credit growth has been supported by adequate liquidity measures taken by the central bank.',
  NULL,
  'english', 'ssc_chsl', 'hard', 668, 99,
  'Banking', 'SSC Official', '2024'
),
(
  'a0000000-0000-0000-0000-000000000042',
  'Indian Agricultural Sector',
  'Agriculture is the backbone of the Indian economy employing nearly half of the country workforce. The sector has shown remarkable resilience and growth over the years. The Green Revolution transformed India from a food deficient nation to a self sufficient one. Modern farming techniques and better irrigation facilities have increased crop yields. The government provides minimum support price for various crops to protect farmers income. Soil health cards are being issued to help farmers use fertilizers optimally. The PM Kisan scheme provides direct income support to small and marginal farmers. Digital platforms are being developed to connect farmers directly with markets. The agriculture sector continues to be a priority area for policy intervention and resource allocation.',
  NULL,
  'english', 'ssc_chsl', 'hard', 748, 113,
  'Agriculture', 'SSC Official', '2024'
),
(
  'a0000000-0000-0000-0000-000000000043',
  'Indian Railway System',
  'Indian Railways is one of the largest railway networks in the world. It operates thousands of trains every day carrying millions of passengers across the country. The network connects remote villages to major cities facilitating economic growth and social integration. Modernization efforts include the introduction of high speed trains and the modernization of railway stations. The dedicated freight corridor project aims to decongest the existing network. Electrification of railway lines is progressing rapidly towards the goal of net zero emissions. The introduction of WiFi services and better amenities has improved the passenger experience. Indian Railways continues to be the lifeline of the nation transportation system.',
  NULL,
  'english', 'ssc_chsl', 'hard', 716, 106,
  'Railways', 'SSC Official', '2024'
),

-- ======================================================================
-- SSC CHSL ENGLISH (SSC exam-specific, 10-minute / 35 WPM passages)
-- These are exact-length passages for exam simulation (~350 characters)
-- ======================================================================
(
  'a0000000-0000-0000-0000-000000000050',
  'SSC Sample Passage 1',
  'The Right to Information Act empowers citizens to access information from public authorities. This law promotes transparency and accountability in the working of government departments. Citizens can request information from any public body and get a response within thirty days. The Act has become a powerful tool for ensuring good governance.',
  NULL,
  'english', 'ssc_chsl', 'medium', 348, 55,
  'RTI Act', 'SSC Official Sample', '2024'
),
(
  'a0000000-0000-0000-0000-000000000051',
  'SSC Sample Passage 2',
  'The National Highway network in India has expanded significantly in recent years. Better road connectivity has reduced travel time and boosted economic activities. The government has launched several projects to improve road infrastructure in rural and urban areas. These projects are creating employment opportunities and improving access to markets and services.',
  NULL,
  'english', 'ssc_chsl', 'medium', 352, 53,
  'Infrastructure', 'SSC Official Sample', '2024'
),
(
  'a0000000-0000-0000-0000-000000000052',
  'SSC Sample Passage 3',
  'Financial literacy is essential for economic empowerment of individuals and communities. Understanding basic financial concepts helps people make informed decisions about savings investments and loans. Various government initiatives are promoting financial education among different sections of society. Banks and financial institutions are also conducting awareness programmes in rural areas.',
  NULL,
  'english', 'ssc_chsl', 'medium', 350, 52,
  'Financial Literacy', 'SSC Official Sample', '2024'
),
(
  'a0000000-0000-0000-0000-000000000053',
  'SSC Sample Passage 4',
  'The tourism sector contributes significantly to the Indian economy and employment generation. India offers diverse tourism experiences including cultural heritage wildlife and medical tourism. The government has launched campaigns to promote domestic and international tourism. Improved connectivity and infrastructure have made tourist destinations more accessible and comfortable for visitors from around the world.',
  NULL,
  'english', 'ssc_chsl', 'medium', 354, 53,
  'Tourism', 'SSC Official Sample', '2024'
),

-- ======================================================================
-- SSC CGL DEST (Data Entry Skill Test - 15 min, ~2000 key depressions)
-- Longer passages with more data-entry style content
-- ======================================================================
(
  'a0000000-0000-0000-0000-000000000060',
  'DEST Practice 1 - Census Data',
  'State Population Male Female Literacy Rate Sex Ratio Maharashtra One Hundred Twelve Million Three Hundred Seventy Four Thousand Three Hundred Thirty Three Fifty Eight Million Two Hundred Forty Three Thousand One Hundred Fifty Six Fifty Four Million One Hundred Thirty One Thousand One Hundred Seventy Seven Eighty Two Point Three Four Nine Twenty Nine Uttar Pradesh One Hundred Ninety Nine Million Eight Hundred Twelve Thousand Three Hundred Forty One One Hundred Four Million Four Hundred Eighty Thousand Five Hundred Ten Ninety Five Million Three Hundred Thirty One Thousand Eight Hundred Thirty One Sixty Seven Point Six Eight Nine Thirty Twelve',
  NULL,
  'english', 'ssc_cgl', 'medium', 488, 83,
  'Census Data Entry', 'SSC Official', '2023'
),
(
  'a0000000-0000-0000-0000-000000000061',
  'DEST Practice 2 - Budget Figures',
  'The total budget allocation for the financial year is forty seven lakh sixty six thousand crore rupees. The allocation for education sector is one lakh twelve thousand nine hundred ninety nine crore rupees. The health sector allocation is eighty nine thousand one hundred fifty five crore rupees. The defence budget is five lakh ninety four thousand crore rupees. The infrastructure sector receives five lakh fifty thousand crore rupees for the current financial year.',
  NULL,
  'english', 'ssc_cgl', 'medium', 412, 68,
  'Budget Data Entry', 'SSC Official', '2024'
),
(
  'a0000000-0000-0000-0000-000000000062',
  'DEST Practice 3 - Tables and Figures',
  'Year Production In Tonnes Export In Tonnes Import In Tonnes Growth Rate Two Thousand Twenty Two Point Five Million One Point Two Million Zero Point Eight Million Seven Point Five Percent Two Thousand Twenty Three Point Eight Million One Point Five Million One Point Zero Million Eight Point Two Percent Two Thousand Twenty Four Point Nine Million One Point Eight Million One Point One Million Six Point Eight Percent Two Thousand Twenty Five Zero Point Nine Five Million Two Point Zero Million One Point Two Million Five Point Five Percent',
  NULL,
  'english', 'ssc_cgl', 'hard', 452, 79,
  'Data Entry Tables', 'SSC Official', '2024'
),

-- ======================================================================
-- SSC HINDI (Hindi Typing Practice)
-- ======================================================================
(
  'b0000000-0000-0000-0000-000000000001',
  'हिंदी टाइपिंग अभ्यास १',
  'हिंदी भारत की प्रमुख भाषा है और यह देश के अधिकांश राज्यों में बोली जाती है। संविधान के अनुसार हिंदी राजभाषा है। सरकारी कार्यों में हिंदी का प्रयोग बढ़ावा दिया जा रहा है। हिंदी टाइपिंग की परीक्षा में छात्रों को तीस शब्द प्रति मिनट की गति से टाइप करना आवश्यक है। नियमित अभ्यास से टाइपिंग गति और सटीकता में सुधार किया जा सकता है।',
  'हिंदी भारत की प्रमुख भाषा है और यह देश के अधिकांश राज्यों में बोली जाती है। संविधान के अनुसार हिंदी राजभाषा है। सरकारी कार्यों में हिंदी का प्रयोग बढ़ावा दिया जा रहा है। हिंदी टाइपिंग की परीक्षा में छात्रों को तीस शब्द प्रति मिनट की गति से टाइप करना आवश्यक है। नियमित अभ्यास से टाइपिंग गति और सटीकता में सुधार किया जा सकता है।',
  'hindi', 'ssc_chsl', 'easy', 352, 48,
  'हिंदी अभ्यास', 'SSC Official', '2024'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'हिंदी टाइपिंग अभ्यास २',
  'भारत एक कृषि प्रधान देश है। यहाँ की अधिकांश जनसंख्या गाँवों में निवास करती है और कृषि पर निर्भर है। हरित क्रांति के बाद देश खाद्यान्न के मामले में आत्मनिर्भर बना है। सरकार किसानों की आय बढ़ाने के लिए अनेक योजनाएँ चला रही है। प्रधानमंत्री किसान सम्मान निधि योजना के तहत किसानों को प्रति वर्ष छह हजार रुपये की आर्थिक सहायता दी जाती है।',
  'भारत एक कृषि प्रधान देश है। यहाँ की अधिकांश जनसंख्या गाँवों में निवास करती है और कृषि पर निर्भर है। हरित क्रांति के बाद देश खाद्यान्न के मामले में आत्मनिर्भर बना है। सरकार किसानों की आय बढ़ाने के लिए अनेक योजनाएँ चला रही है। प्रधानमंत्री किसान सम्मान निधि योजना के तहत किसानों को प्रति वर्ष छह हजार रुपये की आर्थिक सहायता दी जाती है।',
  'hindi', 'ssc_chsl', 'medium', 392, 58,
  'कृषि अभ्यास', 'SSC Official', '2024'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'हिंदी टाइपिंग अभ्यास ३',
  'शिक्षा किसी भी समाज के विकास की नींव है। राष्ट्रीय शिक्षा नीति 2020 ने शिक्षा के क्षेत्र में महत्वपूर्ण बदलाव लाए हैं। नई नीति में बालवाटिका से लेकर स्नातक स्तर तक की शिक्षा को एकीकृत किया गया है। व्यावसायिक शिक्षा पर विशेष ध्यान दिया गया है। डिजिटल शिक्षा को भी बढ़ावा दिया जा रहा है ताकि दूरदराज के क्षेत्रों के छात्र भी गुणवत्तापूर्ण शिक्षा प्राप्त कर सकें।',
  'शिक्षा किसी भी समाज के विकास की नींव है। राष्ट्रीय शिक्षा नीति 2020 ने शिक्षा के क्षेत्र में महत्वपूर्ण बदलाव लाए हैं। नई नीति में बालवाटिका से लेकर स्नातक स्तर तक की शिक्षा को एकीकृत किया गया है। व्यावसायिक शिक्षा पर विशेष ध्यान दिया गया है। डिजिटल शिक्षा को भी बढ़ावा दिया जा रहा है ताकि दूरदराज के क्षेत्रों के छात्र भी गुणवत्तापूर्ण शिक्षा प्राप्त कर सकें।',
  'hindi', 'ssc_chsl', 'medium', 408, 62,
  'शिक्षा अभ्यास', 'SSC Official', '2024'
),
(
  'b0000000-0000-0000-0000-000000000004',
  'हिंदी टाइपिंग अभ्यास ४',
  'डिजिटल इंडिया कार्यक्रम के अंतर्गत देश में डिजिटल बुनियादी ढाँचे का विकास तीव्र गति से हो रहा है। आधार कार्ड ने पहचान प्रणाली को सरल बनाया है। यूपीआई ने डिजिटल भुगतान को आसान बना दिया है। सरकारी सेवाओं को ऑनलाइन माध्यम से उपलब्ध कराया जा रहा है। डिजिटल साक्षरता अभियान के तहत गाँवों में लोगों को कंप्यूटर और इंटरनेट का उपयोग सिखाया जा रहा है।',
  'डिजिटल इंडिया कार्यक्रम के अंतर्गत देश में डिजिटल बुनियादी ढाँचे का विकास तीव्र गति से हो रहा है। आधार कार्ड ने पहचान प्रणाली को सरल बनाया है। यूपीआई ने डिजिटल भुगतान को आसान बना दिया है। सरकारी सेवाओं को ऑनलाइन माध्यम से उपलब्ध कराया जा रहा है। डिजिटल साक्षरता अभियान के तहत गाँवों में लोगों को कंप्यूटर और इंटरनेट का उपयोग सिखाया जा रहा है।',
  'hindi', 'ssc_chsl', 'medium', 396, 60,
  'डिजिटल इंडिया', 'SSC Official', '2024'
),
(
  'b0000000-0000-0000-0000-000000000005',
  'हिंदी टाइपिंग अभ्यास ५',
  'भारतीय संविधान विश्व का सबसे बड़ा लिखित संविधान है। इसे 26 नवंबर 1949 को अपनाया गया था और 26 जनवरी 1950 को लागू किया गया। संविधान में नागरिकों को मौलिक अधिकार और मौलिक कर्तव्य प्रदान किए गए हैं। इसमें संघीय ढाँचे के साथ एकात्मक विशेषताओं का समावेश है। संविधान संशोधन की प्रक्रिया भी निर्धारित की गई है ताकि समय की माँग के अनुसार बदलाव किए जा सकें।',
  'भारतीय संविधान विश्व का सबसे बड़ा लिखित संविधान है। इसे 26 नवंबर 1949 को अपनाया गया था और 26 जनवरी 1950 को लागू किया गया। संविधान में नागरिकों को मौलिक अधिकार और मौलिक कर्तव्य प्रदान किए गए हैं। इसमें संघीय ढाँचे के साथ एकात्मक विशेषताओं का समावेश है। संविधान संशोधन की प्रक्रिया भी निर्धारित की गई है ताकि समय की माँग के अनुसार बदलाव किए जा सकें।',
  'hindi', 'ssc_chsl', 'hard', 468, 72,
  'संविधान अभ्यास', 'SSC Official', '2024'
),

-- ======================================================================
-- BANKING SECTOR
-- ======================================================================
(
  'c0000000-0000-0000-0000-000000000001',
  'Banking Awareness',
  'The Reserve Bank of India is the central banking institution that controls the monetary policy of the Indian rupee. It was established on 1st April 1935 under the Reserve Bank of India Act. The RBI plays a crucial role in the development strategy of the government. It regulates the issuance and supply of the rupee and manages the country main payment systems. The Monetary Policy Committee determines the policy interest rates to maintain price stability while keeping growth in mind.',
  NULL,
  'english', 'banking', 'medium', 482, 67,
  'RBI', 'Banking Exam', '2024'
),

-- ======================================================================
-- RAILWAY SECTOR
-- ======================================================================
(
  'd0000000-0000-0000-0000-000000000001',
  'Indian Railways Overview',
  'Indian Railways is the national railway system of India and is the fourth largest railway network in the world by size. It is owned and operated by the government through the Ministry of Railways. The network spans over sixty seven thousand kilometres of track. It runs more than thirteen thousand passenger trains and over nine thousand freight trains daily. Seven thousand stations serve as junctions connecting the entire country.',
  NULL,
  'english', 'railway', 'medium', 452, 63,
  'Railways Introduction', 'Railway Exam', '2024'
),

-- ======================================================================
-- GENERAL CATEGORY
-- ======================================================================
(
  'e0000000-0000-0000-0000-000000000001',
  'Health and Wellness',
  'Good health is essential for a productive and fulfilling life. Regular exercise balanced diet and adequate sleep are the foundations of good health. The government has launched several health initiatives to ensure access to affordable healthcare for all citizens. Ayushman Bharat is the world largest health insurance scheme providing coverage to millions of families. Preventive healthcare and awareness programmes are being promoted across the country.',
  NULL,
  'english', 'general', 'medium', 442, 63,
  'Health', 'General', '2024'
),
(
  'e0000000-0000-0000-0000-000000000002',
  'Environmental Conservation',
  'Environmental conservation has become a global priority in recent decades. Climate change deforestation and pollution are threatening the planet ecological balance. India has committed to reducing its carbon intensity and increasing renewable energy capacity. The concept of sustainable development guides our approach to economic growth. Community participation is essential for the success of environmental conservation programmes.',
  NULL,
  'english', 'general', 'medium', 392, 55,
  'Environment', 'General', '2024'
),

-- ======================================================================
-- SAMPLE PASSAGES FOR PRACTICE MODE - Mixed difficulty
-- ======================================================================
(
  'f0000000-0000-0000-0000-000000000001',
  'Practice Passage 1',
  'the quick brown fox jumps over the lazy dog the quick brown fox jumps over the lazy dog the quick brown fox jumps over the lazy dog the quick brown fox jumps over the lazy dog practice typing this sentence again and again to improve your speed and accuracy keep your fingers on the home row and type without looking at the keyboard',
  NULL,
  'english', 'general', 'easy', 354, 54,
  'Practice', 'SSC Typing Mania', '2024'
),
(
  'f0000000-0000-0000-0000-000000000002',
  'Practice Passage 2',
  'Typing is an essential skill for government job aspirants in India. Regular practice can help you achieve the required speed of thirty five words per minute for SSC CHSL exam. Focus on accuracy first then work on increasing your speed. Use the home row position and practice daily for best results. The more you practice the better your typing skills will become.',
  NULL,
  'english', 'general', 'easy', 356, 54,
  'Typing Tips', 'SSC Typing Mania', '2024'
),
(
  'f0000000-0000-0000-0000-000000000003',
  'Practice Passage 3',
  'Success in the SSC typing test depends on regular practice and proper technique. Start by learning the correct finger placement on the keyboard. Practice each row of keys separately before moving to full passages. Use online typing tools to track your progress. Set daily goals for speed and accuracy. Remember that consistency is more important than long practice sessions.',
  NULL,
  'english', 'general', 'easy', 388, 56,
  'Success Tips', 'SSC Typing Mania', '2024'
);

-- Update the exact_key_depressions (1 char = 1 key depression including spaces)
UPDATE passages SET exact_key_depressions = LENGTH(content), word_count = array_length(string_to_array(content, ' '), 1);
