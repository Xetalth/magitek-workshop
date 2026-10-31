import { PedagogicalModule, CurriculumModuleId } from '../types/curriculum';

export { CurriculumModuleId, PedagogicalModule };

/**
 * Modül tamamlama eşiği:
 * Sunum/demo modu için 1, ölçeklenebilir oyun için 4
 */
export const REQUIRED_TASKS_PER_MODULE = 1;

/**
 * Samsun Üniversitesi Yazılım Mühendisliği 1. Sınıf Müfredatı (YZM101, YZM105, YZM102, YZM104)
 * Pedagojik İlerleme Modülleri
 */
export const PEDAGOGICAL_MODULES: Record<CurriculumModuleId, PedagogicalModule> = {
  module_1_control: {
    id: 'module_1_control',
    title: 'Temel Kontrol Yapıları & Döngü Sınırları (YZM101/105)',
    courseCode: 'YZM101/105',
    allowedTopics: [
      'if-else mantık hataları',
      'while/for döngü sınırları',
      'sonsuz döngüler',
      'off-by-one hataları',
    ],
    forbiddenTopics: [
      'Pointer',
      'malloc',
      'struct',
      'bitwise yazmaçlar',
    ],
    description: 'Koşullu dallanmalar, döngü sonlandırma koşulları, off-by-one sınır analizi ve CPU donma önleme.',
    academicCredit: 'YZM101/105 - 4 AKTS',
    curriculumTopic: 'C Dili Kontrol Yapıları & Döngü Sınırları',
    tier: '1. Sınıf - Modül 1',
  },
  module_2_arrays: {
    id: 'module_2_arrays',
    title: 'Diziler, Fonksiyonlar & Buffer Sınırları (YZM101/102)',
    courseCode: 'YZM101/102',
    allowedTopics: [
      'Tek/çok boyutlu dizi indeks aşımı',
      'string null-terminator (\\0) eksikliği',
      'fonksiyon parametre aktarımı',
    ],
    forbiddenTopics: [
      'Ham pointer aritmetiği',
      'dinamik bellek',
      'bitwise işlemler',
    ],
    description: 'Tek/çok boyutlu dizi indisleme, karakter dizisi (string) \\0 sonlandırıcı denetimi ve fonksiyon parametreleri.',
    academicCredit: 'YZM101/102 - 4 AKTS',
    curriculumTopic: 'Diziler, Karakter Katarı & Fonksiyonlar',
    tier: '1. Sınıf - Modül 2',
  },
  module_3_pointers: {
    id: 'module_3_pointers',
    title: 'İşaretçiler (Pointers) & Bellek Adresleme (YZM102)',
    courseCode: 'YZM102',
    allowedTopics: [
      'NULL pointer dereference',
      'adres operatörleri (& ve *)',
      'temel pointer aritmetiği',
      'bellek sızıntısı (malloc/free dengesi)',
    ],
    forbiddenTopics: [
      'Donanım yazmaçları',
      'bitwise maskeleme',
    ],
    description: 'İşaretçi adresleme (& ve *), NULL gösterici koruması, heap tahsisi (malloc/free) ve bellek sızıntısı engelleme.',
    academicCredit: 'YZM102 - 5 AKTS',
    curriculumTopic: 'İşaretçiler (Pointers) & Dinamik Bellek',
    tier: '1. Sınıf - Modül 3',
  },
  module_4_structs_bits: {
    id: 'module_4_structs_bits',
    title: 'Yapılar (Struct) & Bit Düzeyi İşlemler (YZM102/104)',
    courseCode: 'YZM102/104',
    allowedTopics: [
      'Struct alan erişimi/hizalaması',
      'bit maskeleme (AND, OR, XOR)',
      'bit kaydırma (<<, >>)',
      'donanım durum bayrakları',
    ],
    forbiddenTopics: [
      'İleri düzey veri yapıları (bağlı liste, ağaç)',
      'işletim sistemi sistem çağrıları (syscall)',
      'çoklu iş parçacığı (multithreading)',
    ],
    description: 'C struct yapıları, bellek dolgusu (padding) optimizasyonu, bit maskeleme ve durum bayrağı yazmaçları.',
    academicCredit: 'YZM102/104 - 5 AKTS',
    curriculumTopic: 'C Yapıları (Structs) & Bit Düzeyi İşlemler',
    tier: '1. Sınıf - Modül 4',
  },
};

export const CURRICULUM_MODULE_ORDER: CurriculumModuleId[] = [
  'module_1_control',
  'module_2_arrays',
  'module_3_pointers',
  'module_4_structs_bits',
];
