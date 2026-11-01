import {
  PedagogicalModule,
  CurriculumModuleId,
  Stage1ModuleId,
  Stage2ModuleId,
  Stage3ModuleId,
  Stage4ModuleId,
} from '../types/curriculum';

export {
  CurriculumModuleId,
  PedagogicalModule,
  Stage1ModuleId,
  Stage2ModuleId,
  Stage3ModuleId,
  Stage4ModuleId,
};

/**
 * Modül tamamlama eşiği:
 * Sunum/demo modu için 1, ölçeklenebilir oyun için 4
 */
export const REQUIRED_TASKS_PER_MODULE = 1;

/**
 * Samsun Üniversitesi Yazılım Mühendisliği Müfredatı
 * 1. Sınıf (YZM101..105), 2. Sınıf (YZM201..203) & 3. Sınıf (YZM301..307)
 * Pedagojik İlerleme Modülleri
 */
export const PEDAGOGICAL_MODULES: Record<CurriculumModuleId, PedagogicalModule> = {
  // =========================================================================
  // 1. AŞAMA // KÖY ATÖLYESİ (YZM101, YZM105, YZM102, YZM104)
  // =========================================================================
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
    tier: '1. Aşama - Modül 1',
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
    tier: '1. Aşama - Modül 2',
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
    tier: '1. Aşama - Modül 3',
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
    tier: '1. Aşama - Modül 4',
  },

  // =========================================================================
  // 2. AŞAMA // MAHALLE DÜKKANI (YZM201, YZM202, YZM203)
  // =========================================================================
  stage2_module_1_oop_classes: {
    id: 'stage2_module_1_oop_classes',
    title: 'Sınıflar & Kurucu İlklendirmesi (YZM203 - Nesne Yönelimli Programlama)',
    courseCode: 'YZM203',
    allowedTopics: [
      'Constructor ilklendirme listesi (initializer list)',
      'default constructor eksikliği',
      'private veri üyesi erişim koruması',
      'kapsülleme ve RAII',
    ],
    forbiddenTopics: [
      'Çoklu kalıtım (multiple inheritance)',
      'şablon metaprogramlama (template metaprogramming)',
      'grafik kütüphaneleri',
    ],
    description: 'C++ sınıf yapıları, kurucu metotlarda ilklendirme listesi hataları ve pnömatik kargo sınıfı nesne bütünlüğü.',
    academicCredit: 'YZM203 - 5 AKTS',
    curriculumTopic: 'Nesne Yönelimli Programlama: Sınıflar, Kurucular & Kapsülleme',
    tier: '2. Aşama - Modül 1',
  },
  stage2_module_2_oop_polymorphism: {
    id: 'stage2_module_2_oop_polymorphism',
    title: 'Kalıtım, Sanal Metotlar & Çok Biçimlilik (YZM201/203)',
    courseCode: 'YZM201/203',
    allowedTopics: [
      'virtual anahtar kelimesi eksikliği',
      'vtable dispatch hatası',
      'override belirteci',
      'saf sanal fonksiyon (pure virtual)',
      'sanal yıkıcı (virtual destructor)',
    ],
    forbiddenTopics: [
      'Ham bitwise yazmaçlar',
      'derleyici iç fonksiyonları (compiler intrinsics)',
    ],
    description: 'Temel ve türetilmiş sınıflar, sanal fonksiyon tablosu (vtable), tramvay kontrol arabiriminde dinamik bağlama.',
    academicCredit: 'YZM201/YZM203 - 5 AKTS',
    curriculumTopic: 'Kalıtım, Virtual Metotlar, Vtable & Çok Biçimlilik',
    tier: '2. Aşama - Modül 2',
  },
  stage2_module_3_linear_structures: {
    id: 'stage2_module_3_linear_structures',
    title: 'Doğrusal Veri Yapıları: Yığın (Stack) & Dairesel Kuyruk (YZM202)',
    courseCode: 'YZM202',
    allowedTopics: [
      'Dairesel kuyruk (circular queue) baş/son indis sarımı (modulo % CAP)',
      'kuyruk dolu/boş ayrımı',
      'stack overflow / underflow',
      'dinamik dizi tamponu',
    ],
    forbiddenTopics: [
      'Ağaç ve graf algoritmaları',
      'B-Tree',
    ],
    description: 'Rehin dükkanı envanter kütüğü, FIFO/LIFO tampon sınırları ve dairesel kuyruk indisi sarma (modulo) optimizasyonu.',
    academicCredit: 'YZM202 - 5 AKTS',
    curriculumTopic: 'Veri Yapıları: Stack, Queue & Circular Buffer Yönetimi',
    tier: '2. Aşama - Modül 3',
  },
  stage2_module_4_trees_indexing: {
    id: 'stage2_module_4_trees_indexing',
    title: 'Ağaç Yapıları & İkili Arama Ağacı (BST) İndeksleme (YZM202)',
    courseCode: 'YZM202',
    allowedTopics: [
      'BST düğüm ekleme kuralları (sol küçük, sağ büyük)',
      'NULL sol/sağ işaretçi kontrolü',
      'ağaçta arama (search)',
      'düğüm silmede ata işaretçisi güncelleme',
    ],
    forbiddenTopics: [
      'Kırmızı-Siyah ağaç rotasyonları',
      'B+ Tree disk indeksleme',
    ],
    description: 'Mahalle barikat giriş kütüğü, kimlik sicil BST düğüm hiyerarşisi ve yaprak/dal bağlantı bütünlüğü.',
    academicCredit: 'YZM202 - 5 AKTS',
    curriculumTopic: 'Veri Yapıları: Binary Search Tree (BST), Düğüm Ekleme & Arama',
    tier: '2. Aşama - Modül 4',
  },

  // =========================================================================
  // 3. AŞAMA // BAŞKENT MAĞAZASI (YZM301, YZM303, YZM306, YZM307)
  // =========================================================================
  stage3_module_1_databases: {
    id: 'stage3_module_1_databases',
    title: 'Veri Tabanı & Transaction Yönetimi (YZM307)',
    courseCode: 'YZM307',
    allowedTopics: [
      'ACID transaction atomikliği',
      'rollback ve commit mekanizması',
      'deadlock analizi ve kilit sıralaması',
      'foreign key bütünlük kısıtları',
    ],
    forbiddenTopics: [
      'NoSQL belge veritabanları',
      'graf veritabanı sorgulama dilleri',
    ],
    description: 'Banka defteri ve altın transferlerinde transaction bütünlüğü, commit/rollback ve kilitlenme (deadlock) önleme mantığı.',
    academicCredit: 'YZM307 - 5 AKTS',
    curriculumTopic: 'Veritabanı Yönetim Sistemleri: ACID, İşlemler (Transactions) & Kilitlenme',
    tier: '3. Aşama - Modül 1',
  },
  stage3_module_2_networking: {
    id: 'stage3_module_2_networking',
    title: 'Ağ Protokolleri & TCP İletişimi (YZM303)',
    courseCode: 'YZM303',
    allowedTopics: [
      'TCP sequence / acknowledgment numarası',
      'checksum doğrulama',
      'paket sıralama (packet reordering)',
      'sliding window ve akış denetimi',
    ],
    forbiddenTopics: [
      'Kriptografik TLS sertifika zinciri',
      'ham Ethernet sürücü donanımı',
    ],
    description: 'Başkent telgraf ağı paket akışı, bozuk sağlama toplamı (checksum) tespiti ve kayıp paket yeniden iletimi.',
    academicCredit: 'YZM303 - 3 AKTS',
    curriculumTopic: 'Bilgisayar Ağları: Taşıma Katmanı (TCP), Sıralama & Checksum',
    tier: '3. Aşama - Modül 2',
  },
  stage3_module_3_software_testing: {
    id: 'stage3_module_3_software_testing',
    title: 'Yazılım Doğrulama & Birim Test (YZM301)',
    courseCode: 'YZM301',
    allowedTopics: [
      'Assertion doğrulama',
      'boundary value analizi',
      'mocking ve stubbing',
      'regresyon testi ve TDD',
    ],
    forbiddenTopics: [
      'Kullanıcı kabul testleri (UAT)',
      'yük testi (load testing)',
    ],
    description: 'Kraliyet otomat hareket kontrolünde sınır durum assertion başarısızlığı ve birim test doğrulama disiplini.',
    academicCredit: 'YZM301 - 3 AKTS',
    curriculumTopic: 'Yazılım Gerçekleme & Test: Birim Testleri & Assertion Tasarımı',
    tier: '3. Aşama - Modül 3',
  },
  stage3_module_4_os_concurrency: {
    id: 'stage3_module_4_os_concurrency',
    title: 'İşletim Sistemleri & Eşzamanlılık (YZM306)',
    courseCode: 'YZM306',
    allowedTopics: [
      'Race condition tespiti',
      'mutex ve semafor kilitleme',
      'kritik bölge (critical section) koruması',
      'deadlock koşulları (Coffman)',
    ],
    forbiddenTopics: [
      'Dağıtık mutabakat algoritmaları (Raft, Paxos)',
      'donanım mikroişlemci tasarımı',
    ],
    description: 'Kraliyet mekanize zırh güç çekirdeğinde eşzamanlı iş parçacığı (multithreading) yarış durumu ve mutex kilidi onarımı.',
    academicCredit: 'YZM306 - 3 AKTS',
    curriculumTopic: 'İşletim Sistemleri: Süreç Senkronizasyonu, Mutex & Yarış Durumları',
    tier: '3. Aşama - Modül 4',
  },

  // =========================================================================
  // 4. AŞAMA // KRALİYET LABORATUVARI (YZM374, YZM401, YZM371, YZM362, YZM366, YZM376, YZM357)
  // =========================================================================
  stage4_module_1_software_architecture: {
    id: 'stage4_module_1_software_architecture',
    title: 'Yazılım Mimarisi, Tasarım Kalıpları & Bitirme Projesi (YZM374 & YZM401)',
    courseCode: 'YZM374/401',
    allowedTopics: [
      'Thread-Safe Singleton',
      'Double-Checked Locking Pattern',
      'std::atomic ve bellek bariyerleri (Memory Barrier / Acquire-Release)',
      'Gevşek bağlılık (Loose Coupling) ve bağımlılık enjeksiyonu',
    ],
    forbiddenTopics: [
      'Ham mikroişlemci mikrostateleri',
      'grafik motoru gölgelendiricileri',
    ],
    description: 'Kraliyet Magitek Çekirdek Sisteminde çoklu iş parçacığı güvenli Singleton tasarımı, çift kontrollü kilit (Double-Checked Locking) ve donanımsal bellek bariyeri (acquire-release) onarımı.',
    academicCredit: 'YZM374/YZM401 - 6 AKTS',
    curriculumTopic: 'Yazılım Mimarisi & Bitirme II: Thread-Safe Singleton & Bellek Bariyerleri',
    tier: '4. Aşama - Modül 1',
  },
  stage4_module_2_machine_learning: {
    id: 'stage4_module_2_machine_learning',
    title: 'Makine Öğrenmesi & Derin Öğrenme (YZM371 & YZM362)',
    courseCode: 'YZM371/362',
    allowedTopics: [
      'Öğrenme oranı (Learning Rate) ayarlama',
      'Gradyan inişi ve kayıp fonksiyonu (Loss Divergence / NaN)',
      'Özellik ölçekleme ve normalizasyon (Min-Max / Z-Score)',
      'Aşırı öğrenme (Overfitting) & Ağırlık regülarizasyonu',
    ],
    forbiddenTopics: [
      'Büyük Dil Modelleri RLHF',
      'Kuantum kubit simülasyonu',
    ],
    description: 'Mana Reaktörü sıcaklık tahminleme matrisinde yüksek öğrenme oranı sebebiyle ıraksayan gradyan inişi (Gradient Descent) ve özellik normalizasyonunun onarımı.',
    academicCredit: 'YZM371/YZM362 - 6 AKTS',
    curriculumTopic: 'Makine Öğrenmesi & Derin Öğrenme: Gradyan İnişi, Öğrenme Oranı & Normalizasyon',
    tier: '4. Aşama - Modül 2',
  },
  stage4_module_3_system_simulation: {
    id: 'stage4_module_3_system_simulation',
    title: 'Sistem Modelleme & Ayrık Olay Simülasyonu (YZM366)',
    courseCode: 'YZM366',
    allowedTopics: [
      'Kayan nokta hassasiyeti (Floating Point Epsilon / std::abs)',
      'Ayrık olay kuyruğu (Event Queue) zaman sıralaması',
      'Delta-zaman (dt) entegrasyonu',
      'Sayısal kararsızlık (Numerical Instability)',
    ],
    forbiddenTopics: [
      'Fiziksel donanım mercek taşlama',
      'optik kuantum interferometre',
    ],
    description: 'Kraliyet Gözlemevi göksel yörünge simülatöründe kayan nokta doğrudan eşitlik karşılaştırmasının (==) epsilon toleransı ve olay zaman kuyruğu önceliği ile düzeltilmesi.',
    academicCredit: 'YZM366 - 6 AKTS',
    curriculumTopic: 'Sistem Modelleme & Simülasyon: Kayan Nokta Epsilon, Olay Kuyruğu & Sayısal Kararlılık',
    tier: '4. Aşama - Modül 3',
  },
  stage4_module_4_cryptography_security: {
    id: 'stage4_module_4_cryptography_security',
    title: 'Kriptografi & Ağ ve Bilgi Güvenliği (YZM376 & YZM357)',
    courseCode: 'YZM376/357',
    allowedTopics: [
      'Sabit zamanlı karşılaştırma (Constant-Time Comparison / CRYPTO_memcmp)',
      'Zamanlama yan kanal saldırısı (Timing Attack / Side-Channel)',
      'Nonce tekrarı ve sayaç bütünlüğü (Nonce Reuse / Collision)',
      'Kriptografik özet (HMAC/SHA) doğrulama',
    ],
    forbiddenTopics: [
      'Kuantum şifre kırma donanımı',
      'sosyal mühendislik protokolleri',
    ],
    description: 'Kraliyet Şifreli Telgrafında erken dönen (early-exit) string karşılaştırmasının sabit zamanlı (constant-time) memcmp ile değiştirilip zamanlama analizine (timing attack) ve nonce çakışmasına karşı korunması.',
    academicCredit: 'YZM376/YZM357 - 6 AKTS',
    curriculumTopic: 'Kriptografi & Güvenlik: Sabit Zamanlı Karşılaştırma, Nonce Bütünlüğü & Yan Kanal Koruması',
    tier: '4. Aşama - Modül 4',
  },
};

export const STAGE_1_MODULE_ORDER: Stage1ModuleId[] = [
  'module_1_control',
  'module_2_arrays',
  'module_3_pointers',
  'module_4_structs_bits',
];

export const STAGE_2_MODULE_ORDER: Stage2ModuleId[] = [
  'stage2_module_1_oop_classes',
  'stage2_module_2_oop_polymorphism',
  'stage2_module_3_linear_structures',
  'stage2_module_4_trees_indexing',
];

export const STAGE_3_MODULE_ORDER: Stage3ModuleId[] = [
  'stage3_module_1_databases',
  'stage3_module_2_networking',
  'stage3_module_3_software_testing',
  'stage3_module_4_os_concurrency',
];

export const STAGE_4_MODULE_ORDER: Stage4ModuleId[] = [
  'stage4_module_1_software_architecture',
  'stage4_module_2_machine_learning',
  'stage4_module_3_system_simulation',
  'stage4_module_4_cryptography_security',
];

export const CURRICULUM_MODULE_ORDER: CurriculumModuleId[] = [
  ...STAGE_1_MODULE_ORDER,
  ...STAGE_2_MODULE_ORDER,
  ...STAGE_3_MODULE_ORDER,
  ...STAGE_4_MODULE_ORDER,
];
