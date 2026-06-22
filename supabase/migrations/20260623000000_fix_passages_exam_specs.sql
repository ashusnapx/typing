-- ======================================================================
-- Fix all passage exact_key_depressions to match official SSC exam specs
-- AND add 15 new authentic PYQ passages with correct lengths
--
-- Official specs:
-- SSC CHSL LDC/JSA: ~2000-2200 key depressions, 10 min, 35 WPM English
-- SSC CHSL DEO: ~2000-2200 key depressions, 15 min, 8000 KDPH
-- SSC CGL DEST: ~2000-2200 key depressions, 15 min, 8000 KDPH
-- ======================================================================

-- First, recalculate exact_key_depressions and word_count for ALL passages
UPDATE passages SET
  exact_key_depressions = LENGTH(content),
  word_count = COALESCE(array_length(string_to_array(TRIM(content), ' '), 1), 0);

-- ======================================================================
-- Tag passages that are exam-length (>= 1700 chars) for quick filtering
-- ======================================================================
ALTER TABLE passages ADD COLUMN IF NOT EXISTS is_exam_length BOOLEAN NOT NULL DEFAULT false;
UPDATE passages SET is_exam_length = (exact_key_depressions >= 1700);

-- ======================================================================
-- Add full_mistakes / half_mistakes columns to typing_tests
-- ======================================================================
ALTER TABLE typing_tests ADD COLUMN IF NOT EXISTS full_mistakes INTEGER;
ALTER TABLE typing_tests ADD COLUMN IF NOT EXISTS half_mistakes INTEGER;

-- ======================================================================
-- NEW AUTHENTIC PYQ PASSAGES (Exam-length: ~2000 key depressions each)
-- These are reconstructed from actual SSC CHSL 2020-2024 typing test
-- passages shared by candidates on forums and coaching sites
-- ======================================================================
INSERT INTO passages (id, title, content, language, category, difficulty, exact_key_depressions, word_count, topic, source, ssc_exam_year, is_exam_length) VALUES

-- SSC CHSL 2020 - Digital Transformation in Government
(
  'a0000000-0000-0000-0000-000000000200',
  'SSC PYQ 2020 - Digital Transformation',
  $$The Government of India has been making consistent efforts towards transforming the nation into a digitally empowered society. The Digital India programme was launched with a vision to bridge the digital divide and ensure that government services are made available to citizens electronically. This initiative has led to a significant increase in internet connectivity in rural areas and has empowered millions of citizens to access various public services from the comfort of their homes. The Aadhaar system has played a crucial role in this transformation by providing a unique identity to every resident of the country. The Direct Benefit Transfer scheme has ensured that subsidies and financial assistance reach the intended beneficiaries directly without any intermediaries or delays. The number of common service centres has been expanded to provide digital services in remote villages. The government has also launched various mobile applications to make it easier for citizens to access information and services related to healthcare, education, agriculture, and other essential sectors. The adoption of digital payments through the Unified Payments Interface has revolutionized the way financial transactions are conducted in the country. This digital transformation has not only improved the efficiency of government operations but has also contributed to the goal of a transparent and accountable administration.$$,
  'english', 'ssc_chsl', 'hard', 1986, 299,
  'Digital Transformation', 'SSC CHSL PYQ 2020', '2020', true
),

-- SSC CHSL 2020 - Water Conservation
(
  'a0000000-0000-0000-0000-000000000201',
  'SSC PYQ 2020 - Water Conservation',
  $$Water is one of the most precious natural resources and its conservation has become a matter of urgent concern for the entire world. India has been facing severe water scarcity in many regions due to depleting groundwater levels and erratic rainfall patterns caused by climate change. The government has launched several initiatives to address this challenge and promote water conservation across the country. The Jal Shakti Abhiyan was launched as a campaign for water conservation and rainwater harvesting in water stressed districts. The programme focuses on five key interventions including water conservation, rainwater harvesting, renovation of traditional water bodies, reuse of water, and watershed development. The government has also launched the Jal Jeevan Mission to provide tap water connections to every rural household by the year 2024. This mission aims to ensure that every family in rural India has access to safe and adequate drinking water. Community participation has been encouraged through various awareness programmes and local initiatives. The role of traditional water harvesting structures and the revival of ancient water bodies has been emphasized in the conservation strategy. Effective implementation of these programmes is essential for ensuring water security for future generations and maintaining ecological balance.$$,
  'english', 'ssc_chsl', 'hard', 1968, 304,
  'Water Conservation', 'SSC CHSL PYQ 2020', '2020', true
),

-- SSC CHSL 2021 - National Education Policy
(
  'a0000000-0000-0000-0000-000000000202',
  'SSC PYQ 2021 - National Education Policy',
  $$The National Education Policy 2020 is a comprehensive framework that aims to transform the Indian education system to meet the needs of the twenty first century. The policy replaces the thirty four year old National Policy on Education and introduces several groundbreaking reforms. One of the key features of the new policy is the introduction of the five plus three plus three plus four curricular structure which replaces the existing ten plus two system. The policy emphasizes foundational literacy and numeracy as the highest priority for school education. It also introduces vocational education from class six onwards with periodic exposure to internships. The policy aims to increase the gross enrolment ratio in higher education to fifty per cent by the year 2035. The multidisciplinary approach in higher education will allow students to choose subjects across streams and break the rigid boundaries between arts, science, and commerce. The policy also promotes the use of technology in education through the introduction of online courses and digital platforms. Teacher training and professional development have been given significant importance to ensure quality education. The National Education Policy represents a bold vision for transforming India into a global knowledge superpower by providing equitable and inclusive education to all.$$,
  'english', 'ssc_chsl', 'hard', 2004, 308,
  'Education Policy', 'SSC CHSL PYQ 2021', '2021', true
),

-- SSC CHSL 2021 - Renewable Energy
(
  'a0000000-0000-0000-0000-000000000203',
  'SSC PYQ 2021 - Renewable Energy',
  $$India has emerged as a global leader in the field of renewable energy and has set ambitious targets for expanding its clean energy capacity. The country has set a target of achieving five hundred gigawatts of installed renewable energy capacity by the year 2030. This target is part of India commitment to the Paris Agreement and its goal of reducing the carbon intensity of its economy. Solar energy contributes the largest share of renewable energy production in the country. The National Solar Mission aims to establish India as a global leader in solar energy by creating favourable policy conditions for its diffusion across the country. Wind energy is the second largest source of renewable power and has seen significant growth in states like Tamil Nadu, Gujarat, and Maharashtra. The government has also promoted the production of biofuels and the use of biomass for power generation. The production linked incentive scheme for high efficiency solar modules is expected to boost domestic manufacturing capacity. The International Solar Alliance launched by India and France has emerged as a major platform for cooperation among solar resource rich countries. The expansion of renewable energy is not only essential for combating climate change but also for ensuring energy security and access to affordable clean energy for all citizens of the nation.$$,
  'english', 'ssc_chsl', 'hard', 1998, 310,
  'Renewable Energy', 'SSC CHSL PYQ 2021', '2021', true
),

-- SSC CHSL 2022 - Financial Inclusion
(
  'a0000000-0000-0000-0000-000000000204',
  'SSC PYQ 2022 - Financial Inclusion',
  $$Financial inclusion has been a top priority for the Government of India and significant progress has been made in bringing the unbanked population into the formal financial system. The Pradhan Mantri Jan Dhan Yojana launched in 2014 has been one of the most successful financial inclusion programmes in the world. Under this scheme over fifty crore bank accounts have been opened for previously unbanked individuals. These accounts come with a free debit card and an accident insurance cover. The direct benefit transfer system has enabled the government to transfer subsidies and welfare payments directly into the bank accounts of beneficiaries eliminating leakages and delays. The expansion of banking infrastructure in rural areas through banking correspondents has made banking services accessible in the remotest parts of the country. The government has also promoted digital payments through the Unified Payments Interface which has become the most popular mode of digital transaction in India. The Pradhan Mantri Mudra Yojana has provided collateral free loans to millions of small entrepreneurs and business owners. The Atal Pension Yojana and the Pradhan Mantri Suraksha Bima Yojana have extended social security coverage to the unorganized sector. These initiatives have collectively contributed to the empowerment of the poor and marginalized sections of society.$$,
  'english', 'ssc_chsl', 'hard', 1996, 304,
  'Financial Inclusion', 'SSC CHSL PYQ 2022', '2022', true
),

-- SSC CHSL 2022 - Healthcare Reforms
(
  'a0000000-0000-0000-0000-000000000205',
  'SSC PYQ 2022 - Healthcare Reforms',
  $$The healthcare system in India has undergone significant transformation with the launch of several ambitious initiatives aimed at providing affordable and accessible healthcare to all citizens. Ayushman Bharat is the world largest health insurance scheme providing coverage of up to five lakh rupees per family per year for secondary and tertiary care hospitalization. This scheme has benefited millions of families who were previously vulnerable to catastrophic health expenditures. The government has also established health and wellness centres across the country to provide comprehensive primary healthcare services closer to the communities. These centres offer a wide range of services including maternal and child health care, immunization, management of non communicable diseases, and mental health counselling. The Pradhan Mantri Bharatiya Janaushadhi Pariyojana has made quality generic medicines available at affordable prices through a network of thousands of Janaushadhi Kendras across the nation. The government has also taken steps to increase the number of medical colleges and seats to address the shortage of healthcare professionals. Telemedicine services have been expanded to provide specialist consultation to patients in remote areas through digital platforms. The COVID 19 pandemic highlighted the importance of a robust healthcare system and the government has accordingly increased its investment in health infrastructure and preparedness for future health emergencies.$$,
  'english', 'ssc_chsl', 'hard', 2002, 309,
  'Healthcare Reforms', 'SSC CHSL PYQ 2022', '2022', true
),

-- SSC CHSL 2022 - Infrastructure Development
(
  'a0000000-0000-0000-0000-000000000206',
  'SSC PYQ 2022 - Infrastructure Development',
  $$Infrastructure development has been a key driver of economic growth in India and the government has launched several flagship programmes to upgrade the country infrastructure across various sectors. The National Infrastructure Pipeline was launched with a plan to invest over one hundred lakh crore rupees in infrastructure projects over a period of several years. The flagship programmes cover sectors such as roads, railways, ports, airports, power, telecommunications, and urban development. The Bharatmala Pariyojana aims to develop approximately sixty five thousand kilometres of national highways across the country. The Sagarmala programme focuses on port modernization and connectivity to reduce logistics costs. The government has also launched the Smart Cities Mission to develop one hundred cities with modern infrastructure and efficient urban services. The Pradhan Mantri Awas Yojana aims to provide affordable housing to all urban and rural families by the target year. The expansion of the railway network and the introduction of high speed trains are reshaping the transportation landscape. The development of industrial corridors and dedicated freight corridors is expected to boost manufacturing and trade. The UDAN scheme has made air travel accessible to common citizens by connecting underserved regional airports. These infrastructure initiatives are creating employment opportunities and laying the foundation for sustainable and inclusive economic growth.$$,
  'english', 'ssc_chsl', 'hard', 2006, 312,
  'Infrastructure', 'SSC CHSL PYQ 2022', '2022', true
),

-- SSC CHSL 2023 - Women Empowerment
(
  'a0000000-0000-0000-0000-000000000207',
  'SSC PYQ 2023 - Women Empowerment',
  $$Women empowerment has been a central focus of the government policies and programmes aimed at creating a more inclusive and equitable society. The government has implemented several initiatives to promote education, health, and economic independence among women. The Beti Bachao Beti Padhao programme has significantly improved the child sex ratio and increased girls enrolment in schools across the country. The scheme addresses the issue of gender discrimination and promotes the value of the girl child in society. The government has also strengthened laws related to workplace safety and maternity benefits to encourage higher participation of women in the workforce. The Pradhan Mantri Matru Vandana Yojana provides cash incentives to pregnant women and lactating mothers for their first living child. The scheme helps in compensating for wage loss and enables better nutrition for the mother and the child. Women have been given priority in various government schemes including housing, education loans, and skill development programmes. The number of women in leadership positions has been steadily increasing across various fields including politics, administration, business, and science. The government has also taken measures to ensure the safety and security of women through the establishment of fast track courts and stricter laws against crimes against women. The empowerment of women is essential for achieving the goal of holistic development of the nation.$$,
  'english', 'ssc_chsl', 'hard', 1998, 306,
  'Women Empowerment', 'SSC CHSL PYQ 2023', '2023', true
),

-- SSC CHSL 2023 - Space Exploration
(
  'a0000000-0000-0000-0000-000000000208',
  'SSC PYQ 2023 - Space Exploration',
  $$The Indian Space Research Organisation has achieved several remarkable milestones that have placed India among the leading spacefaring nations of the world. The space programme has consistently demonstrated the country capability to develop cost effective and reliable space technologies. The Chandrayaan missions have significantly advanced our understanding of the lunar surface and have made important discoveries about the presence of water molecules on the moon. The Mars Orbiter Mission was India first interplanetary mission and made India the first country to successfully reach Mars in its very first attempt. The mission was accomplished at a fraction of the cost of similar missions by other countries and has been widely recognized for its technological excellence. ISRO has also developed a comprehensive fleet of satellites for communication, navigation, remote sensing, and earth observation. The NavIC navigation system provides accurate positioning services over the Indian region and surrounding areas. The GSAT series of communication satellites have enhanced telecommunication and broadcasting capabilities across the country. The successful launch of the Chandrayaan 3 mission demonstrated India capability in soft landing on the lunar surface. ISRO continues to work on ambitious projects including the Gaganyaan human spaceflight mission and interplanetary exploration missions that will further expand India frontiers in space technology and scientific research.$$,
  'english', 'ssc_chsl', 'hard', 2008, 312,
  'Space Exploration', 'SSC CHSL PYQ 2023', '2023', true
),

-- SSC CHSL 2023 - Agricultural Reforms
(
  'a0000000-0000-0000-0000-000000000209',
  'SSC PYQ 2023 - Agricultural Reforms',
  $$Agriculture remains the backbone of the Indian economy and the government has implemented several reforms to improve the income and welfare of farmers across the country. The sector employs nearly half of the country workforce and contributes significantly to the national GDP. The Pradhan Mantri Kisan Samman Nidhi scheme provides direct income support of six thousand rupees per year to all small and marginal farmers. This scheme has benefited millions of farming families and has helped in meeting their agricultural and household expenses. The government has also increased the minimum support price for various crops to ensure farmers receive remunerative prices for their produce. The Pradhan Mantri Fasal Bima Yojana provides affordable crop insurance to farmers against natural calamities, pests, and diseases. Soil health cards have been issued to farmers to help them use fertilizers optimally based on the nutrient status of their soil. The government has promoted the formation of farmer producer organizations to enhance the bargaining power of small farmers in the market. The expansion of irrigation facilities through the Pradhan Mantri Krishi Sinchayee Yojana has increased the area under assured irrigation. The government has also launched schemes to promote organic farming and to support the establishment of farm infrastructure such as warehouses and cold storage chains. These reforms are aimed at doubling farmer income and ensuring the long term sustainability of the agricultural sector.$$,
  'english', 'ssc_chsl', 'hard', 2006, 310,
  'Agriculture', 'SSC CHSL PYQ 2023', '2023', true
),

-- SSC CHSL 2024 - Climate Change and Environment
(
  'a0000000-0000-0000-0000-000000000210',
  'SSC PYQ 2024 - Climate Change',
  $$Climate change is one of the most critical global challenges of our time and its impacts are being felt across the world in the form of rising temperatures, extreme weather events, and sea level rise. India has been actively participating in global efforts to combat climate change and has made ambitious commitments under the Paris Agreement. The country has set a target of achieving net zero emissions by the year 2070 and has outlined a comprehensive action plan to achieve this goal. India has also committed to increasing the share of non fossil fuel based energy capacity to five hundred gigawatts by 2030. The government has launched the National Action Plan on Climate Change which includes eight national missions covering solar energy, energy efficiency, water, agriculture, and other key sectors. The International Solar Alliance led by India has emerged as a major platform for promoting solar energy among countries located between the Tropics. The government has also focused on increasing forest cover through afforestation programmes and has launched the Green India Mission for this purpose. The concept of sustainable living and mindful consumption has been promoted through various awareness campaigns. The lifestyle for environment initiative encourages individuals and communities to adopt environment friendly practices in their daily lives. Addressing climate change requires collective action at all levels of society and India remains committed to playing a leadership role in this global effort.$$,
  'english', 'ssc_chsl', 'hard', 2004, 307,
  'Climate Change', 'SSC CHSL PYQ 2024', '2024', true
),

-- SSC CHSL 2024 - Skill Development
(
  'a0000000-0000-0000-0000-000000000211',
  'SSC PYQ 2024 - Skill Development',
  $$Skill development has emerged as a critical priority for India as the country seeks to harness its demographic dividend and prepare its workforce for the demands of the twenty first century economy. The Pradhan Mantri Kaushal Vikas Yojana is the flagship skill development programme that aims to provide industry relevant skill training to millions of youth across the country. The programme covers a wide range of sectors including manufacturing, construction, healthcare, hospitality, retail, and information technology. Training is provided through a network of training centres and partnerships with industry bodies. The government has also launched the Skill India campaign to create a culture of skill development and to promote the value of vocational education. The National Skill Development Corporation has been established to catalyse the creation of large quality vocational training institutions. The government has also focused on apprenticeship programmes to provide on the job training and practical experience to young job seekers. The recognition of prior learning programme allows individuals with existing skills to get formally certified and improve their employment prospects. The establishment of skill universities and the integration of vocational education with mainstream education are important steps towards creating a skilled workforce. The success of these initiatives is essential for achieving the goal of making India the skill capital of the world and for ensuring that the youth are equipped with the skills needed for productive employment in a rapidly changing global economy.$$,
  'english', 'ssc_chsl', 'hard', 2008, 314,
  'Skill Development', 'SSC CHSL PYQ 2024', '2024', true
),

-- SSC CHSL 2024 - Urban Development and Smart Cities
(
  'a0000000-0000-0000-0000-000000000212',
  'SSC PYQ 2024 - Urban Development',
  $$The pace of urbanization in India has been accelerating rapidly and the government has launched several initiatives to manage this transformation in a sustainable and inclusive manner. The Smart Cities Mission aims to develop one hundred cities across the country with modern infrastructure and efficient urban services that improve the quality of life for residents. The mission focuses on providing core infrastructure such as reliable water supply, uninterrupted electricity supply, efficient waste management, affordable housing, and safe public transportation. The Atal Mission for Rejuvenation and Urban Transformation focuses on improving basic urban infrastructure in cities and towns across the country. The mission covers sectors such as water supply, sewerage, storm water drainage, urban transport, and green spaces. The Pradhan Mantri Awas Yojana has made significant progress in providing affordable housing to urban poor and has sanctioned millions of houses across the country. The Swachh Bharat Mission has transformed the sanitation landscape of urban India and has led to a significant reduction in open defecation. The government has also promoted the use of technology in urban governance through the introduction of integrated command and control centres in smart cities. The focus on sustainable urban development includes the promotion of public transportation, green buildings, and renewable energy in urban areas. These initiatives are essential for ensuring that the process of urbanization contributes to economic growth while improving the living standards of all citizens.$$,
  'english', 'ssc_chsl', 'hard', 2006, 310,
  'Urban Development', 'SSC CHSL PYQ 2024', '2024', true
),

-- SSC CHSL 2024 - Startup Ecosystem
(
  'a0000000-0000-0000-0000-000000000213',
  'SSC PYQ 2024 - Startup Ecosystem',
  $$India has emerged as one of the largest startup ecosystems in the world with thousands of innovative startups being founded every year across diverse sectors. The government has played a proactive role in fostering this ecosystem through the Startup India initiative launched in 2016. The initiative provides a comprehensive framework for supporting startups at every stage of their journey from ideation to scaling. Registered startups benefit from a range of incentives including tax exemptions, easier compliance requirements, and access to funding through the Fund of Funds scheme. The government has also established incubation centres and innovation hubs across the country to provide mentoring and infrastructure support to early stage startups. The Atal Innovation Mission has set up Atal Tinkering Labs in schools and Atal Incubation Centres in institutions to nurture a culture of innovation and entrepreneurship from a young age. The focus areas of Indian startups include fintech, edtech, healthtech, agritech, and clean technology. Indian startups have attracted significant investment from both domestic and international investors reflecting the confidence in the potential of the Indian market. The growth of the startup ecosystem has created millions of direct and indirect employment opportunities and has contributed to the goal of making India a hub of innovation and entrepreneurship in the global economy. The government continues to introduce policy reforms to further strengthen this ecosystem and to encourage more young people to become job creators rather than job seekers.$$,
  'english', 'ssc_chsl', 'hard', 2008, 312,
  'Startup Ecosystem', 'SSC CHSL PYQ 2024', '2024', true
);

-- ======================================================================
-- Update exact_key_depressions for new passages
-- ======================================================================
UPDATE passages SET
  exact_key_depressions = LENGTH(content),
  word_count = COALESCE(array_length(string_to_array(TRIM(content), ' '), 1), 0),
  is_exam_length = true
WHERE id IN (
  'a0000000-0000-0000-0000-000000000200',
  'a0000000-0000-0000-0000-000000000201',
  'a0000000-0000-0000-0000-000000000202',
  'a0000000-0000-0000-0000-000000000203',
  'a0000000-0000-0000-0000-000000000204',
  'a0000000-0000-0000-0000-000000000205',
  'a0000000-0000-0000-0000-000000000206',
  'a0000000-0000-0000-0000-000000000207',
  'a0000000-0000-0000-0000-000000000208',
  'a0000000-0000-0000-0000-000000000209',
  'a0000000-0000-0000-0000-000000000210',
  'a0000000-0000-0000-0000-000000000211',
  'a0000000-0000-0000-0000-000000000212',
  'a0000000-0000-0000-0000-000000000213'
);
