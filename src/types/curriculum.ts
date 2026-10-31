export type CurriculumModuleId =
  | 'module_1_control'
  | 'module_2_arrays'
  | 'module_3_pointers'
  | 'module_4_structs_bits';

export interface PedagogicalModule {
  id: CurriculumModuleId;
  title: string;
  courseCode: string;
  allowedTopics: string[];
  forbiddenTopics: string[];
  description: string;
  academicCredit: string;
  curriculumTopic: string;
  tier: string;
}
