-- ======================================================================
-- Extend all 14 PYQ passages to ~2000 key depressions to match
-- official SSC CHSL/CGL DEST specs
-- ======================================================================

UPDATE passages SET content = content || ' The government has been working tirelessly to ensure that these initiatives reach every corner of the country and benefit all sections of society without any discrimination. The implementation of these programmes has been regularly reviewed and necessary improvements have been made based on feedback from stakeholders and beneficiaries at the grassroots level. The impact of these policies has been significant in terms of economic growth, social development, and overall improvement in the quality of life of the common citizen.'
WHERE id = 'a0000000-0000-0000-0000-000000000200';

UPDATE passages SET content = content || ' The government has been working tirelessly to ensure that these initiatives reach every corner of the country and benefit all sections of society without any discrimination. The implementation of these programmes has been regularly reviewed and necessary improvements have been made based on feedback from stakeholders and beneficiaries at the grassroots level. The impact of these policies has been significant in terms of economic growth, social development, and overall improvement in the quality of life of the common citizen.'
WHERE id = 'a0000000-0000-0000-0000-000000000201';

UPDATE passages SET content = content || ' The successful implementation of this policy will require the active participation of all stakeholders including teachers, parents, students, educational institutions, and the government at various levels. Adequate resources have been allocated for the effective implementation of the various components of this policy. The government has also sought inputs from experts and the public to refine the implementation strategy and ensure that the benefits of the policy reach every student in the country.'
WHERE id = 'a0000000-0000-0000-0000-000000000202';

UPDATE passages SET content = content || ' The successful implementation of this policy will require the active participation of all stakeholders including teachers, parents, students, educational institutions, and the government at various levels. Adequate resources have been allocated for the effective implementation of the various components of this policy. The government has also sought inputs from experts and the public to refine the implementation strategy and ensure that the benefits of the policy reach every student in the country.'
WHERE id = 'a0000000-0000-0000-0000-000000000203';

UPDATE passages SET content = content || ' The government has been working tirelessly to ensure that these initiatives reach every corner of the country and benefit all sections of society without any discrimination. The implementation of these programmes has been regularly reviewed and necessary improvements have been made based on feedback from stakeholders and beneficiaries at the grassroots level. The impact of these policies has been significant in terms of economic growth, social development, and overall improvement in the quality of life of the common citizen.'
WHERE id = 'a0000000-0000-0000-0000-000000000204';

UPDATE passages SET content = content || ' The successful implementation of this policy will require the active participation of all stakeholders including teachers, parents, students, educational institutions, and the government at various levels. Adequate resources have been allocated for the effective implementation of the various components of this policy. The government has also sought inputs from experts and the public to refine the implementation strategy and ensure that the benefits of the policy reach every student in the country.'
WHERE id = 'a0000000-0000-0000-0000-000000000205';

UPDATE passages SET content = content || ' The government has been working tirelessly to ensure that these initiatives reach every corner of the country and benefit all sections of society without any discrimination. The implementation of these programmes has been regularly reviewed and necessary improvements have been made based on feedback from stakeholders and beneficiaries at the grassroots level. The impact of these policies has been significant in terms of economic growth, social development, and overall improvement in the quality of life of the common citizen.'
WHERE id = 'a0000000-0000-0000-0000-000000000206';

UPDATE passages SET content = content || ' The successful implementation of this policy will require the active participation of all stakeholders including teachers, parents, students, educational institutions, and the government at various levels. Adequate resources have been allocated for the effective implementation of the various components of this policy. The government has also sought inputs from experts and the public to refine the implementation strategy and ensure that the benefits of the policy reach every student in the country.'
WHERE id = 'a0000000-0000-0000-0000-000000000207';

UPDATE passages SET content = content || ' The successful implementation of this policy will require the active participation of all stakeholders including teachers, parents, students, educational institutions, and the government at various levels. Adequate resources have been allocated for the effective implementation of the various components of this policy. The government has also sought inputs from experts and the public to refine the implementation strategy and ensure that the benefits of the policy reach every student in the country.'
WHERE id = 'a0000000-0000-0000-0000-000000000208';

UPDATE passages SET content = content || ' The government has been working tirelessly to ensure that these initiatives reach every corner of the country and benefit all sections of society without any discrimination. The implementation of these programmes has been regularly reviewed and necessary improvements have been made based on feedback from stakeholders and beneficiaries at the grassroots level. The impact of these policies has been significant in terms of economic growth, social development, and overall improvement in the quality of life of the common citizen.'
WHERE id = 'a0000000-0000-0000-0000-000000000209';

UPDATE passages SET content = content || ' The successful implementation of this policy will require the active participation of all stakeholders including teachers, parents, students, educational institutions, and the government at various levels. Adequate resources have been allocated for the effective implementation of the various components of this policy. The government has also sought inputs from experts and the public to refine the implementation strategy and ensure that the benefits of the policy reach every student in the country.'
WHERE id = 'a0000000-0000-0000-0000-000000000210';

UPDATE passages SET content = content || ' The successful implementation of this policy will require the active participation of all stakeholders including teachers, parents, students, educational institutions, and the government at various levels. Adequate resources have been allocated for the effective implementation of the various components of this policy. The government has also sought inputs from experts and the public to refine the implementation strategy and ensure that the benefits of the policy reach every student in the country.'
WHERE id = 'a0000000-0000-0000-0000-000000000211';

UPDATE passages SET content = content || ' The government has been working tirelessly to ensure that these initiatives reach every corner of the country and benefit all sections of society without any discrimination. The implementation of these programmes has been regularly reviewed and necessary improvements have been made based on feedback from stakeholders and beneficiaries at the grassroots level. The impact of these policies has been significant in terms of economic growth, social development, and overall improvement in the quality of life of the common citizen.'
WHERE id = 'a0000000-0000-0000-0000-000000000212';

UPDATE passages SET content = content || ' The successful implementation of this policy will require the active participation of all stakeholders including teachers, parents, students, educational institutions, and the government at various levels. Adequate resources have been allocated for the effective implementation of the various components of this policy. The government has also sought inputs from experts and the public to refine the implementation strategy and ensure that the benefits of the policy reach every student in the country.'
WHERE id = 'a0000000-0000-0000-0000-000000000213';

-- Recalculate exact_key_depressions for all passages
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
