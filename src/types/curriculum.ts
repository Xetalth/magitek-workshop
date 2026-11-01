export type Stage1ModuleId =
  | 'module_1_control'
  | 'module_2_arrays'
  | 'module_3_pointers'
  | 'module_4_structs_bits';

export type Stage2ModuleId =
  | 'stage2_module_1_oop_classes'
  | 'stage2_module_2_oop_polymorphism'
  | 'stage2_module_3_linear_structures'
  | 'stage2_module_4_trees_indexing';

export type Stage3ModuleId =
  | 'stage3_module_1_databases'
  | 'stage3_module_2_networking'
  | 'stage3_module_3_software_testing'
  | 'stage3_module_4_os_concurrency';

export type Stage4ModuleId =
  | 'stage4_module_1_software_architecture'
  | 'stage4_module_2_machine_learning'
  | 'stage4_module_3_system_simulation'
  | 'stage4_module_4_cryptography_security';

export type CurriculumModuleId =
  | Stage1ModuleId
  | Stage2ModuleId
  | Stage3ModuleId
  | Stage4ModuleId;

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
