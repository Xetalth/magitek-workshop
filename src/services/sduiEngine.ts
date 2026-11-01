import {
  SDUIState,
  TabType,
  ModuleId,
  ShopItem,
  WorkbenchModuleData,
  CustomerIssue,
  ModuleEvalMetrics,
} from '../types/sdui';
import {
  CURRICULUM_MODULES,
  getModuleTaskFromPool,
  MODULE_TASK_POOLS,
  shufflePatchOptions,
} from '../data/curriculumModules';
import {
  REQUIRED_TASKS_PER_MODULE,
  PEDAGOGICAL_MODULES,
  CURRICULUM_MODULE_ORDER,
  STAGE_1_MODULE_ORDER,
  STAGE_2_MODULE_ORDER,
  STAGE_3_MODULE_ORDER,
  STAGE_4_MODULE_ORDER,
} from '../data/curriculumData';
import { CurriculumModuleId } from '../types/curriculum';
import { geminiTaskService, GeminiTaskPayload } from './geminiTaskService';

/**
 * Canlı API / Saf Görev Havuzu Yapılandırması
 * false: Groq API'ye hiçbir HTTP isteği atılmaz, 12 görevlik kararlı tohum havuzu kullanılır (Demo/Test modu)
 * true: Canlı Groq API çağrıları aktif edilir
 */
export const USE_LIVE_AI = false; // Havuz testi ve kararlı demo modu

interface InternalState {
  activeTab: TabType;
  currentStage: number;
  maxUnlockedStage: number;
  currentViewStage: number;
  activeModuleId: ModuleId;
  currentWorkshopModuleId: ModuleId;
  completedModuleIds: ModuleId[];
  moduleTaskCounts: Record<string, number>;
  modulePoolIndices: Record<string, number>; // Hangi modülde tohum havuzunun hangi görevinin aktif olduğu
  taskAttempts: Record<string, number>; // Hatalı yama derleme deneme sayacı
  moduleTaskScores: Record<string, number[]>; // Modülde tamamlanan görevlerin başarı katsayıları
  dynamicModuleOrder: ModuleId[];
  gold: number;
  exp: number;
  day: number;
  jobStatus: 'AVAILABLE' | 'IN_WORKBENCH' | 'READY_TO_DELIVER' | 'DELIVERED';
  selectedPatchId: string | null;
  inspectionStatus: 'ANALYZING' | 'TESTING' | 'REPAIRED' | 'OVERHEATING_FAILED';
  hardwareTempC: number;
  hardwareVoltage: number;
  terminalLogs: string[];
  lastTestSuccess?: boolean;
  purchasedShopItems: string[];
  isLoadingDynamicTask: boolean;
}

const MODULE_VERIFICATION_PROTOCOLS: Record<string, string> = {
  module_1_control: 'GCC 13.2 -Werror -Wall',
  module_2_arrays: 'AddressSanitizer (ASan) v13',
  module_3_pointers: 'Valgrind Memcheck 3.22',
  module_4_structs_bits: 'AVR-GCC -Wextra -O2',
  stage2_module_1_oop_classes: 'Clang-Tidy Modernize-17',
  stage2_module_2_oop_polymorphism: 'G++ 13.2 -Wnon-virtual-dtor',
  stage2_module_3_linear_structures: 'UBSan UndefinedBehavior',
  stage2_module_4_trees_indexing: 'LeakSanitizer (LSan)',
  stage3_module_1_databases: 'ACID Transaction Invariant Test',
  stage3_module_2_networking: 'Wireshark RFC-793 Checksum Fuzz',
  stage3_module_3_software_testing: 'GoogleTest Boundary Asserts',
  stage3_module_4_os_concurrency: 'ThreadSanitizer (TSan) v4',
  stage4_module_1_software_architecture: 'ISO C++17 Acquire-Release Barrier',
  stage4_module_2_machine_learning: 'SGD Loss Convergence Gate (MSE < 0.02)',
  stage4_module_3_system_simulation: 'IEEE-754 Epsilon Precision Gate',
  stage4_module_4_cryptography_security: 'Constant-Time Side-Channel Auditor',
};

const INITIAL_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'music_box',
    name: 'Pirinç Mekanik Müzik Kutusu',
    costGold: 60,
    status: 'LOCKED',
    category: 'Oda Ambiyansı',
    description: 'Pirinç yaylı, odaya sakinleştirici lo-fi melodi ritimleri ve buhar harmonileri yayan geleneksel atölye kutusu.',
    iconName: 'musical-notes-outline',
  },
  {
    id: 'desk_lamp',
    name: 'Filament Çalışma Lambası',
    costGold: 40,
    status: 'LOCKED',
    category: 'Aydınlatma',
    description: 'Gece saatlerinde C kodlarını ve devre şemalarını aydınlatan sıcak amber ışıklı lambader.',
    iconName: 'bulb-outline',
  },
  {
    id: 'memory_poster',
    name: 'C Bellek Mimarisi Posteri',
    costGold: 50,
    status: 'LOCKED',
    category: 'Duvar Dekoru',
    description: 'Stack, Heap, BSS ve Text segmentlerinin fiziksel yerleşimini gösteren büyük mimari poster.',
    iconName: 'map-outline',
  },
  {
    id: 'tea_set',
    name: 'Pirinç Buhar & Kahve Demliği',
    costGold: 70,
    status: 'LOCKED',
    category: 'Konfor',
    description: 'Uzun derleme ve hata ayıklama seanslarında mekanik atölye için sıcak köz kahvesi ve buhar semaveri.',
    iconName: 'cafe-outline',
  },
];

class SDUIEngineService {
  private state: InternalState;
  private dynamicTasks: Partial<Record<ModuleId, GeminiTaskPayload>> = {};
  private taskQueue: Map<ModuleId, GeminiTaskPayload> = new Map();
  private isPrefetching: boolean = false;
  private lastPrefetchTime: number = 0;
  private listeners: Set<(state: SDUIState) => void> = new Set();

  constructor() {
    this.state = {
      activeTab: 'workshop',
      currentStage: 1,
      maxUnlockedStage: 1,
      currentViewStage: 1,
      activeModuleId: 'module_1_control',
      currentWorkshopModuleId: 'module_1_control',
      completedModuleIds: [],
      moduleTaskCounts: {
        module_1_control: 0,
        module_2_arrays: 0,
        module_3_pointers: 0,
        module_4_structs_bits: 0,
      },
      modulePoolIndices: {
        module_1_control: 0,
        module_2_arrays: 0,
        module_3_pointers: 0,
        module_4_structs_bits: 0,
      },
      taskAttempts: {},
      moduleTaskScores: {},
      dynamicModuleOrder: [...CURRICULUM_MODULE_ORDER],
      gold: 150,
      exp: 20,
      day: 3,
      jobStatus: 'IN_WORKBENCH',
      selectedPatchId: null,
      inspectionStatus: 'ANALYZING',
      hardwareTempC: 42,
      hardwareVoltage: 3.3,
      terminalLogs: [
        '--- Magitek Gömülü Tezgâh Başlatıldı ---',
        'Müfredat: Samsun Üniversitesi YZM101/105 // Modül 1',
        'Cihaz Algılandı: MCU-HT8 (Hydro-Tick 8)',
        'ROM: 32KB Flash // RAM: 2KB SRAM',
        'Durum: HATA_KODU_0x0F (Döngü Sınır Hatası / Off-by-One)',
        'İpucu: Tezgâhta arızalı C kodunu inceleyip uygun yamayı seçin.',
      ],
      lastTestSuccess: undefined,
      purchasedShopItems: [],
      isLoadingDynamicTask: false,
    };

    // İlk görev için (module_1_control) tohum havuzundan hemen hazırla ve şıkları karıştır
    const initialPoolIdx = this.state.modulePoolIndices['module_1_control'] || 0;
    this.dynamicTasks['module_1_control'] = geminiTaskService.getStaticFallbackTask('module_1_control', initialPoolIdx);
    if (USE_LIVE_AI) {
      this.fetchAndApplyDynamicTask('module_1_control', true);
    }
  }

  /**
   * Modül için havuzdaki sıradaki / alternatif görevin indisini döngüsel olarak artırıp döndürür
   */
  public getNextPoolIndex(moduleId: ModuleId): number {
    const baseKey = CURRICULUM_MODULE_ORDER.includes(moduleId as CurriculumModuleId)
      ? (moduleId as CurriculumModuleId)
      : 'module_1_control';
    const pool = MODULE_TASK_POOLS[baseKey] || MODULE_TASK_POOLS.module_1_control;
    const poolLength = pool.length || 3;
    const current = this.state.modulePoolIndices[moduleId] ?? 0;
    const next = (current + 1) % poolLength;
    this.state.modulePoolIndices[moduleId] = next;
    return next;
  }

  /**
   * Modül için geçerli havuz indisini döndürür
   */
  public getPoolIndex(moduleId: ModuleId): number {
    return this.state.modulePoolIndices[moduleId] ?? 0;
  }

  /**
   * Modül verisini alır (Canlı Gemini/Groq çıktısı varsa onu, yoksa tohum görev havuzunu kullanır)
   */
  private getModuleData(moduleId: ModuleId): WorkbenchModuleData {
    const dynamic = this.dynamicTasks[moduleId];
    if (dynamic) {
      return {
        id: moduleId,
        academicUnit: dynamic.academicUnit,
        deviceName: dynamic.deviceName,
        deviceCode: dynamic.deviceCode,
        physicalSymptom: dynamic.customer.physicalSymptom,
        engineerDiagnosis: dynamic.customer.engineerDiagnosis,
        brokenCode: dynamic.brokenCode,
        brokenCodeLines: dynamic.brokenCodeLines,
        patchOptions: dynamic.patchOptions,
        rewardGold: dynamic.rewardGold,
        rewardExp: dynamic.rewardExp,
        rewardItemName: dynamic.rewardItemName,
      };
    }
    const poolIdx = this.getPoolIndex(moduleId);
    const bundle = getModuleTaskFromPool(moduleId, poolIdx);
    return {
      ...bundle.moduleData,
      patchOptions: shufflePatchOptions(bundle.moduleData.patchOptions),
    };
  }

  /**
   * Müşteri / Görev veren verisini alır (Karakter ve NPC tutarlılığı korunur)
   */
  private getCustomerData(moduleId: ModuleId): CustomerIssue {
    const poolIdx = this.getPoolIndex(moduleId);
    const baseBundle = getModuleTaskFromPool(moduleId, poolIdx);
    const dynamic = this.dynamicTasks[moduleId];
    if (dynamic) {
      return {
        customerName: baseBundle.customer.customerName,
        customerRole: baseBundle.customer.customerRole,
        avatarKey: baseBundle.customer.avatarKey,
        dialogText: dynamic.customer?.dialogText || baseBundle.customer.dialogText,
        physicalSymptom: dynamic.customer?.physicalSymptom || baseBundle.customer.physicalSymptom,
        engineerDiagnosis: dynamic.customer?.engineerDiagnosis || baseBundle.customer.engineerDiagnosis,
      };
    }
    return baseBundle.customer;
  }

  public subscribe(listener: (state: SDUIState) => void): () => void {
    this.listeners.add(listener);
    listener(this.toDeclarativeSDUI());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const declarativeState = this.toDeclarativeSDUI();
    this.listeners.forEach((listener) => listener(declarativeState));
  }

  public getDeclarativeState(): SDUIState {
    return this.toDeclarativeSDUI();
  }

  public setActiveTab(tab: TabType): void {
    this.state.activeTab = tab;
    this.notify();
  }

  /**
   * Pedagojik guardrail kuralları ile Groq API veya tohum havuzundan görev yükler
   */
  public async fetchAndApplyDynamicTask(moduleId: ModuleId, silent: boolean = false): Promise<void> {
    // Tamamlanmış modüller için yeniden çekme
    if (this.state.completedModuleIds.includes(moduleId)) {
      return;
    }

    const poolIndex = this.getPoolIndex(moduleId);

    // Kuyrukta hazır bekleyen arıza varsa anında devreye al (Zero-Latency)
    if (this.taskQueue.has(moduleId)) {
      const queued = this.taskQueue.get(moduleId)!;
      this.dynamicTasks[moduleId] = queued;
      this.taskQueue.delete(moduleId);
      this.notify();
      return;
    }

    // Çevrimdışı / Tohum Havuzu güvencesi: Eğer görev henüz yoksa hemen havuzdan ata
    if (!this.dynamicTasks[moduleId]) {
      this.dynamicTasks[moduleId] = geminiTaskService.getStaticFallbackTask(moduleId, poolIndex);
      this.notify();
    }

    // Saf Görev Havuzu (Offline Task Pool) Modu: Canlı API kapalıysa hiçbir HTTP isteği atma
    if (!USE_LIVE_AI) {
      this.state.isLoadingDynamicTask = false;
      const pedModule = geminiTaskService.resolvePedagogicalModule(moduleId);
      const poolTask = geminiTaskService.getStaticFallbackTask(moduleId, poolIndex);
      this.dynamicTasks[moduleId] = poolTask;

      if (this.state.activeModuleId === moduleId) {
        this.state.terminalLogs = [
          ...this.state.terminalLogs,
          `⚙️ Makina Şebekesinden Telemetri Alındı [DOĞRULANMIŞ GÖREV HAVUZU]`,
          `Pedagojik Modül: ${pedModule.title}`,
          `Cihaz: ${poolTask.deviceName} (${poolTask.deviceCode})`,
          `Belirti: ${poolTask.customer.physicalSymptom}`,
        ];
      }
      this.notify();
      return;
    }

    if (!silent) {
      this.state.isLoadingDynamicTask = true;
      this.notify();
    }

    try {
      this.lastPrefetchTime = Date.now();
      const pedModule = geminiTaskService.resolvePedagogicalModule(moduleId);
      const payload = await geminiTaskService.fetchDynamicTask(moduleId, pedModule, 1, poolIndex);

      this.dynamicTasks[moduleId] = payload;

      // Terminale telemetri bilgisi ekle
      if (this.state.activeModuleId === moduleId) {
        this.state.terminalLogs = [
          ...this.state.terminalLogs,
          `⚙️ Makina Şebekesinden Telemetri Alındı [${payload.isDynamic ? 'CANLI AI // GROQ' : 'DOĞRULANMIŞ GÖREV HAVUZU'}]`,
          `Pedagojik Modül: ${pedModule.title}`,
          `Cihaz: ${payload.deviceName} (${payload.deviceCode})`,
          `Belirti: ${payload.customer.physicalSymptom}`,
        ];
      }
    } catch (err) {
      console.warn('[SDUIEngine] Canlı API hatası (Kota 429 vb.), tohum görev havuzu devrede:', err);
      this.dynamicTasks[moduleId] = geminiTaskService.getStaticFallbackTask(moduleId, poolIndex);
    } finally {
      if (!silent) {
        this.state.isLoadingDynamicTask = false;
      }
      this.notify();
    }
  }

  public selectModule(moduleId: ModuleId): void {
    const isSameModule = this.state.activeModuleId === moduleId;
    this.state.activeModuleId = moduleId;

    if (this.taskQueue.has(moduleId) && !this.dynamicTasks[moduleId]) {
      this.dynamicTasks[moduleId] = this.taskQueue.get(moduleId)!;
      this.taskQueue.delete(moduleId);
    }

    const isCompleted = this.state.completedModuleIds.includes(moduleId);

    // Eğer aynı modül tekrar seçildiyse havuzdaki alternatif göreve geç (Döngüsel rotasyon)
    if (isSameModule && !isCompleted) {
      const nextPoolIdx = this.getNextPoolIndex(moduleId);
      this.dynamicTasks[moduleId] = geminiTaskService.getStaticFallbackTask(moduleId, nextPoolIdx);
    } else if (!this.dynamicTasks[moduleId]) {
      const poolIdx = this.getPoolIndex(moduleId);
      this.dynamicTasks[moduleId] = geminiTaskService.getStaticFallbackTask(moduleId, poolIdx);
    }

    const modData = this.getModuleData(moduleId);

    this.state.selectedPatchId = null;
    this.state.inspectionStatus = isCompleted ? 'REPAIRED' : 'ANALYZING';
    this.state.hardwareTempC = isCompleted ? 35 : 44;
    this.state.jobStatus = isCompleted ? 'DELIVERED' : 'IN_WORKBENCH';
    this.state.terminalLogs = [
      `--- ${modData.deviceName} Yüklendi ---`,
      `Akademik Ünite: ${modData.academicUnit}`,
      `Arıza Tanısı: ${modData.physicalSymptom}`,
      isCompleted
        ? '[BİLGİ] Bu modül başarıyla çözüldü ve onaylandı.'
        : 'İşlem: Bozuk C bloğunu inceleyin ve uygun düzeltme yamasını derleyin.',
    ];
    this.notify();

    if (!isCompleted && USE_LIVE_AI && this.dynamicTasks[moduleId]?.isDynamic === false) {
      this.fetchAndApplyDynamicTask(moduleId, true);
    }
  }

  public selectPatch(patchId: string): void {
    this.state.selectedPatchId = patchId;
    const modData = this.getModuleData(this.state.activeModuleId);
    const patch = modData.patchOptions.find((p) => p.id === patchId);

    if (patch) {
      this.state.terminalLogs = [
        ...this.state.terminalLogs.slice(-6),
        `[YAMA SEÇİLDİ] -> ${patch.title}`,
        `Teknik Not: ${patch.authorNote}`,
        'Derlemek ve test harness koşmak için "Derle & Test Et" butonuna basın.',
      ];
    }
    this.notify();
  }

  public runCompileAndTest(): { success: boolean; message: string; tempC: number } {
    const modData = this.getModuleData(this.state.activeModuleId);
    if (!this.state.selectedPatchId) {
      return { success: false, message: 'Lütfen önce incelenecek bir yama seçin!', tempC: this.state.hardwareTempC };
    }

    const patch = modData.patchOptions.find((p) => p.id === this.state.selectedPatchId);
    if (!patch) {
      return { success: false, message: 'Geçersiz yama seçimi!', tempC: this.state.hardwareTempC };
    }

    const outcome = patch.compilerOutcome;
    this.state.hardwareTempC = outcome.hardwareTempC;
    this.state.lastTestSuccess = outcome.success;

    this.state.terminalLogs = [
      '==================================================',
      `[MAGITEK DERLEYİCİ] ${modData.deviceCode} test ediliyor...`,
      ...outcome.terminalOutput,
      `[SONUÇ] Donanım Sıcaklığı: ${outcome.hardwareTempC}°C (${outcome.hardwareStatus})`,
      '==================================================',
    ];

    if (outcome.success) {
      this.state.inspectionStatus = 'REPAIRED';
      this.state.jobStatus = 'READY_TO_DELIVER';
      this.notify();
      return {
        success: true,
        message: outcome.feedbackMessage,
        tempC: outcome.hardwareTempC,
      };
    } else {
      const currentModId = this.state.activeModuleId;
      this.state.taskAttempts[currentModId] = (this.state.taskAttempts[currentModId] || 0) + 1;
      this.state.inspectionStatus = 'OVERHEATING_FAILED';
      this.notify();
      return {
        success: false,
        message: outcome.feedbackMessage,
        tempC: outcome.hardwareTempC,
      };
    }
  }

  /**
   * Görevi teslim eder ve tek parametreli REQUIRED_TASKS_PER_MODULE kilit sistemine göre modülü onaylar
   */
  public deliverJob(): { rewardGold: number; rewardExp: number; nextModuleId?: ModuleId } {
    const currentModuleId = this.state.currentWorkshopModuleId;
    const modData = this.getModuleData(currentModuleId);

    // Mevcut modüldeki çözülen görev sayısını artır
    const currentCount = (this.state.moduleTaskCounts[currentModuleId] || 0) + 1;
    this.state.moduleTaskCounts[currentModuleId] = currentCount;

    // Hatalı deneme sayısına göre başarı katsayısını belirle:
    // 1. Denemede Doğru (Hatasız): 1.0 (Tam Puan - %100)
    // 2. Denemede Doğru (1 Hatalı Deneme Sonrası): 0.75 (%75)
    // 3. Denemede Doğru veya Daha Fazla Hata: 0.25 (%25)
    const failedAttempts = this.state.taskAttempts[currentModuleId] || 0;
    let earnedCoeff = 1.0;
    if (failedAttempts === 1) {
      earnedCoeff = 0.75;
    } else if (failedAttempts >= 2) {
      earnedCoeff = 0.25;
    }

    const currentScores = this.state.moduleTaskScores[currentModuleId] || [];
    this.state.moduleTaskScores[currentModuleId] = [...currentScores, earnedCoeff];

    // Bir sonraki görev için deneme sayacını sıfırla
    this.state.taskAttempts[currentModuleId] = 0;
    if (this.state.activeModuleId) {
      this.state.taskAttempts[this.state.activeModuleId] = 0;
    }

    const isAlreadyCompleted = this.state.completedModuleIds.includes(currentModuleId);
    let rewardGold = modData.rewardGold;
    let rewardExp = modData.rewardExp;

    if (!isAlreadyCompleted) {
      this.state.gold += rewardGold;
      this.state.exp = Math.min(100, this.state.exp + rewardExp);
      this.state.day += 1;
    } else {
      rewardGold = 0;
      rewardExp = 0;
    }

    this.state.jobStatus = 'DELIVERED';

    // Eşik kontrolü: Çözülen görev sayısı REQUIRED_TASKS_PER_MODULE değerine ulaştı mı?
    const thresholdReached = currentCount >= REQUIRED_TASKS_PER_MODULE;
    let nextModuleId: ModuleId | undefined;

    if (thresholdReached && !isAlreadyCompleted) {
      this.state.completedModuleIds = [...this.state.completedModuleIds, currentModuleId];

      const currentIndex = CURRICULUM_MODULE_ORDER.indexOf(currentModuleId as CurriculumModuleId);
      if (currentIndex >= 0 && currentIndex < CURRICULUM_MODULE_ORDER.length - 1) {
        nextModuleId = CURRICULUM_MODULE_ORDER[currentIndex + 1];
      }
    }

    this.notify();
    return { rewardGold, rewardExp, nextModuleId };
  }

  /**
   * Bir sonraki göreve / modüle ilerler
   * REQUIRED_TASKS_PER_MODULE eşiğine ulaşıldığında sıradaki modülün kilidini açar ve görevi ona geçirir.
   * Eşiğe henüz ulaşılmadıysa aynı modülde bir sonraki görevi üretir.
   * Pedagojik Kural: Modül 1 bitmeden Modül 2'nin görevleri üretilmez!
   */
  /**
   * Aşama Geçişi (Stage 1 -> Stage 2: Mahalle Dükkanı)
   */
  public advanceToStage(stage: number): void {
    this.state.currentStage = stage;
    this.state.maxUnlockedStage = Math.max(this.state.maxUnlockedStage || 1, stage);
    this.state.currentViewStage = stage;
    this.state.exp = 0; // Seviye atlandığında XP barı %0'dan başlar

    // Önceki aşamaların tamamlanmış modüllerini güvenceye al ve geçmiş başarılarını seed et
    const prevStagesModules = stage === 4
      ? [...STAGE_1_MODULE_ORDER, ...STAGE_2_MODULE_ORDER, ...STAGE_3_MODULE_ORDER]
      : stage === 3
      ? [...STAGE_1_MODULE_ORDER, ...STAGE_2_MODULE_ORDER]
      : stage === 2
      ? [...STAGE_1_MODULE_ORDER]
      : [];

    for (const modId of prevStagesModules) {
      if (!this.state.completedModuleIds.includes(modId)) {
        this.state.completedModuleIds.push(modId);
      }
      if (!this.state.moduleTaskScores[modId] || this.state.moduleTaskScores[modId].length === 0) {
        this.state.moduleTaskScores[modId] = [1.0, 1.0, 1.0, 1.0];
        this.state.moduleTaskCounts[modId] = REQUIRED_TASKS_PER_MODULE;
      }
    }

    if (stage === 2) {
      this.state.activeModuleId = 'stage2_module_1_oop_classes';
      this.state.currentWorkshopModuleId = 'stage2_module_1_oop_classes';
      this.state.selectedPatchId = null;
      this.state.inspectionStatus = 'ANALYZING';
      this.state.jobStatus = 'IN_WORKBENCH';
      this.state.hardwareTempC = 44;
      this.state.hardwareVoltage = 5.0;

      // Kurye Jax'in ilk arıza görevini tohum havuzundan doğrudan yükle
      const initialPoolIdx = this.getPoolIndex('stage2_module_1_oop_classes');
      this.dynamicTasks['stage2_module_1_oop_classes'] = geminiTaskService.getStaticFallbackTask(
        'stage2_module_1_oop_classes',
        initialPoolIdx
      );

      this.state.terminalLogs = [
        '--- 2. Aşama Başlatıldı: Mahalle Dükkanı ---',
        'Mekân: Mahalle Dükkanı // Varoş Kademesi',
        'Unvan: Lv.2 Deneyimli Mühendis',
        'Müfredat: Samsun Üniversitesi YZM203 // Modül 1 (OOP & Sınıflar)',
        'Müşteri Geldi: Kurye Jax (Varoş Pnömatik Hat Kuryesi)',
        'Cihaz Algılandı: MCU-OOP-101 (Aero-Parcel v2)',
        'Arıza: Constructor (Kurucu) ilklendirme eksikliği',
        'İpucu: Tezgâhta arızalı C++ sınıfını inceleyip uygun yamayı seçin.',
      ];
    } else if (stage === 3) {
      this.state.activeModuleId = 'stage3_module_1_databases';
      this.state.currentWorkshopModuleId = 'stage3_module_1_databases';
      this.state.selectedPatchId = null;
      this.state.inspectionStatus = 'ANALYZING';
      this.state.jobStatus = 'IN_WORKBENCH';
      this.state.hardwareTempC = 42;
      this.state.hardwareVoltage = 5.0;

      // Leydi Aurelia'nın ilk arıza görevini tohum havuzundan doğrudan yükle (Tebrik/Placeholder NPC yok!)
      const initialPoolIdx = this.getPoolIndex('stage3_module_1_databases');
      this.dynamicTasks['stage3_module_1_databases'] = geminiTaskService.getStaticFallbackTask(
        'stage3_module_1_databases',
        initialPoolIdx
      );

      this.state.terminalLogs = [
        '--- 3. Aşama Başlatıldı: Başkent Mağazası ---',
        'Mekân: Başkent Mağazası // Merkez Kademe',
        'Unvan: Lv.3 Tanınan Mühendis',
        'Müfredat: Samsun Üniversitesi YZM307 // Modül 1 (Veritabanı & ACID İşlemleri)',
        'Müşteri Geldi: Leydi Aurelia (Başkent Bankeri & Hazine Denetçisi)',
        'Cihaz Algılandı: MCU-DB-301 (Aurum Ledger Matrix)',
        'Arıza: Deadlock (Kilitlenme) & Eksik Rollback Mekanizması',
        'İpucu: Tezgâhta transfer fonksiyonundaki kilit sıralamasını ve atomik geri alma mantığını onarın.',
      ];
    } else if (stage === 4) {
      this.state.activeModuleId = 'stage4_module_1_software_architecture';
      this.state.currentWorkshopModuleId = 'stage4_module_1_software_architecture';
      this.state.selectedPatchId = null;
      this.state.inspectionStatus = 'ANALYZING';
      this.state.jobStatus = 'IN_WORKBENCH';
      this.state.hardwareTempC = 38;
      this.state.hardwareVoltage = 5.0;

      // Baş Bilgin Alistair'in ilk arıza görevini tohum havuzundan doğrudan yükle (Tebrik NPC yok!)
      const initialPoolIdx = this.getPoolIndex('stage4_module_1_software_architecture');
      this.dynamicTasks['stage4_module_1_software_architecture'] = geminiTaskService.getStaticFallbackTask(
        'stage4_module_1_software_architecture',
        initialPoolIdx
      );

      this.state.terminalLogs = [
        '--- 4. Aşama Başlatıldı: Kraliyet Laboratuvarı ---',
        'Mekân: Kraliyet Laboratuvarı // Saray Kademesi',
        'Unvan: Lv.4 Kraliyet Mühendisi',
        'Müfredat: Samsun Üniversitesi YZM374 & YZM401 // Modül 1 (Yazılım Mimarisi & Bitirme)',
        'Müşteri Geldi: Baş Bilgin Alistair (Kraliyet Baş Bilgini & Saray Başmühendisi)',
        'Cihaz Algılandı: MCU-ROYAL-ARCH-01 (Kraliyet Magitek Çekirdek Matrisi)',
        'Arıza: Thread-Safe Singleton / Çift Kontrollü Kilit ve Bellek Bariyeri Hatası',
        'İpucu: Tezgâhta çift kontrollü kilit (Double-Checked Locking) ve donanımsal bellek bariyerini onarın.',
      ];
    }
    this.notify();
  }

  /**
   * Tezgâhta incelenecek sınıfı / aşamayı değiştirir (Geçmiş ve açık sınıfları inceleme)
   */
  public switchViewStage(stageNumber: number): void {
    if (stageNumber < 1 || stageNumber > 4) return;
    const maxUnlocked = Math.max(this.state.maxUnlockedStage || 1, this.state.currentStage);
    if (stageNumber > maxUnlocked) return; // Kilitli aşamaya geçilemez

    this.state.currentViewStage = stageNumber;

    const targetOrder: string[] = stageNumber === 4
      ? STAGE_4_MODULE_ORDER
      : stageNumber === 3
      ? STAGE_3_MODULE_ORDER
      : stageNumber === 2
      ? STAGE_2_MODULE_ORDER
      : STAGE_1_MODULE_ORDER;

    // Eğer şu anki aktif tezgâh modülü bu sınıfta değilse, bu sınıfın uygun modülüne odaklan
    if (!targetOrder.includes(this.state.activeModuleId)) {
      const uncompleted = targetOrder.find((id) => !this.state.completedModuleIds.includes(id));
      const targetModId = uncompleted || targetOrder[0];
      this.selectModule(targetModId);
    }

    const stageTitles: Record<number, string> = {
      1: '1. Sınıf: Algoritmalar & C Programlama',
      2: '2. Sınıf: Veri Yapıları & C++',
      3: '3. Sınıf: Sistemler & İşletim Sistemleri',
      4: '4. Sınıf: Kraliyet Mimarisi & İleri Sistemler',
    };

    this.state.terminalLogs = [
      ...this.state.terminalLogs.slice(-6),
      `--- Mühendislik Sınıfı Değiştirildi ---`,
      `[AKTİF GÖRÜNÜM] ${stageTitles[stageNumber] || stageNumber + '. Sınıf'} modülleri tezgâha yüklendi.`,
      `İpucu: Bu sınıfa ait modülleri inceleyebilir ve derleyebilirsiniz.`,
    ];

    this.notify();
  }

  public inspectStage(stageNumber: number): void {
    this.switchViewStage(stageNumber);
  }

  public async advanceToNextModule(): Promise<void> {
    const isStage4 = this.state.currentStage === 4;
    const isStage3 = this.state.currentStage === 3;
    const isStage2 = this.state.currentStage === 2;
    const activeOrder: string[] = isStage4
      ? STAGE_4_MODULE_ORDER
      : isStage3
      ? STAGE_3_MODULE_ORDER
      : isStage2
      ? STAGE_2_MODULE_ORDER
      : STAGE_1_MODULE_ORDER;
    const currentModuleId = this.state.currentWorkshopModuleId;
    const currentCount = this.state.moduleTaskCounts[currentModuleId] || 0;
    const thresholdReached = currentCount >= REQUIRED_TASKS_PER_MODULE;
    const currentIndex = activeOrder.indexOf(currentModuleId);

    if (thresholdReached) {
      // Modül tamamlandı -> Sıradaki modüle geç
      if (currentIndex >= 0 && currentIndex < activeOrder.length - 1) {
        const nextId = activeOrder[currentIndex + 1];
        this.state.currentWorkshopModuleId = nextId;

        const nextPoolIdx = this.getPoolIndex(nextId);
        this.dynamicTasks[nextId] = geminiTaskService.getStaticFallbackTask(nextId, nextPoolIdx);
        this.selectModule(nextId);
        this.state.activeTab = 'workshop';
        this.notify();

        if (USE_LIVE_AI) {
          await this.fetchAndApplyDynamicTask(nextId, false);
        }
      } else {
        // Bu aşamadaki tüm modüller tamamlandı
        if (this.state.currentStage === 1) {
          this.advanceToStage(2);
          return;
        }
        if (this.state.currentStage === 2) {
          this.advanceToStage(3);
          return;
        }
        if (this.state.currentStage === 3) {
          this.advanceToStage(4);
          return;
        }
        this.selectModule(currentModuleId);
        this.state.activeTab = 'workbench';
        this.notify();
      }
    } else {
      // Eşik dolmadı:
      this.state.activeTab = 'workbench';
      this.state.selectedPatchId = null;
      this.state.inspectionStatus = 'ANALYZING';
      this.state.jobStatus = 'IN_WORKBENCH';

      const nextPoolIdx = this.getNextPoolIndex(currentModuleId);
      this.dynamicTasks[currentModuleId] = geminiTaskService.getStaticFallbackTask(currentModuleId, nextPoolIdx);
      this.notify();

      if (USE_LIVE_AI) {
        await this.fetchAndApplyDynamicTask(currentModuleId, false);
      }
    }
  }

  /**
   * Tezgâhta incelenmek üzere aktif modülün bir sonraki alternatif tohum görevini yükler
   */
  public cycleAlternativeTask(): void {
    const currentId = this.state.activeModuleId;
    const isCompleted = this.state.completedModuleIds.includes(currentId);

    const nextPoolIdx = this.getNextPoolIndex(currentId);
    this.dynamicTasks[currentId] = geminiTaskService.getStaticFallbackTask(currentId, nextPoolIdx);
    this.state.selectedPatchId = null;
    this.state.inspectionStatus = isCompleted ? 'REPAIRED' : 'ANALYZING';
    this.state.jobStatus = isCompleted ? 'DELIVERED' : 'IN_WORKBENCH';

    const modData = this.getModuleData(currentId);
    this.state.terminalLogs = [
      `--- Alternatif Görev Yüklendi (${modData.deviceName}) ---`,
      `Akademik Ünite: ${modData.academicUnit}`,
      `Arıza Tanısı: ${modData.physicalSymptom}`,
      'İşlem: Yeni C kodunu inceleyip uygun yamayı seçin.',
    ];
    this.notify();
  }

  /**
   * Otonom Arka Plan Görev Kuyruğu (Task Prefetching)
   * Pedagojik Kural: Modül 1 bitmeden Modül 2 görevleri ASLA prefetch edilmez!
   */
  public async prefetchNextTask(): Promise<void> {
    // Canlı AI kapalıysa prefetch yapma (Saf Görev Havuzu Modu)
    if (!USE_LIVE_AI) return;
    if (this.isPrefetching) return;

    const now = Date.now();
    if (now - this.lastPrefetchTime < 6000) {
      return;
    }

    const currentModuleId = this.state.currentWorkshopModuleId;
    const currentCount = this.state.moduleTaskCounts[currentModuleId] || 0;

    let targetId: ModuleId;
    if (currentCount >= REQUIRED_TASKS_PER_MODULE) {
      const currentIndex = CURRICULUM_MODULE_ORDER.indexOf(currentModuleId as CurriculumModuleId);
      if (currentIndex >= 0 && currentIndex < CURRICULUM_MODULE_ORDER.length - 1) {
        targetId = CURRICULUM_MODULE_ORDER[currentIndex + 1];
      } else {
        return;
      }
    } else {
      // Mevcut modül henüz bitmedi; sıradaki modül çekilemez
      targetId = currentModuleId;
    }

    if (this.taskQueue.has(targetId) || this.dynamicTasks[targetId]) {
      return;
    }

    this.isPrefetching = true;
    try {
      this.lastPrefetchTime = Date.now();
      const pedModule = geminiTaskService.resolvePedagogicalModule(targetId);
      const payload = await geminiTaskService.fetchDynamicTask(
        targetId,
        pedModule,
        1,
        currentCount
      );

      this.taskQueue.set(targetId, payload);
      this.dynamicTasks[targetId] = payload;
    } catch (err) {
      console.warn('[SDUIEngine] Prefetch hatası:', err);
    } finally {
      this.isPrefetching = false;
    }
  }

  /**
   * Geriye dönük uyumluluk için alias metot
   */
  public async createAndLoadDynamicTask(): Promise<ModuleId> {
    await this.advanceToNextModule();
    this.state.activeTab = 'workbench';
    this.notify();
    return this.state.activeModuleId;
  }

  public buyShopItem(itemId: string): boolean {
    const item = INITIAL_SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;
    if (this.state.purchasedShopItems.includes(itemId)) return false;
    if (this.state.gold < item.costGold) return false;

    this.state.gold -= item.costGold;
    this.state.purchasedShopItems = [...this.state.purchasedShopItems, itemId];
    this.notify();
    return true;
  }

  /**
   * SDUI Şema Üreticisi (Declarative Engine Output)
   */
  private toDeclarativeSDUI(): SDUIState {
    const activeModData = this.getModuleData(this.state.activeModuleId);
    const isStage4 = this.state.currentStage === 4;
    const isStage3 = this.state.currentStage === 3;
    const isStage2 = this.state.currentStage === 2;
    const activeOrder: string[] = isStage4
      ? STAGE_4_MODULE_ORDER
      : isStage3
      ? STAGE_3_MODULE_ORDER
      : isStage2
      ? STAGE_2_MODULE_ORDER
      : STAGE_1_MODULE_ORDER;
    const totalModules = activeOrder.length; // 4
    const completedCount = activeOrder.filter((id) => this.state.completedModuleIds.includes(id)).length;

    // Seviye Unvanı
    let levelTitle = 'Lv.1 Acemi Mühendis';
    if (isStage4) {
      if (completedCount === 0) levelTitle = 'Lv.4 Kraliyet Mühendisi';
      else if (completedCount === 1) levelTitle = 'Lv.4 Kraliyet Sistem Mimarı';
      else if (completedCount === 2) levelTitle = 'Lv.4 Makine Öğrenmesi & Bilişsel Simyacı';
      else if (completedCount === 3) levelTitle = 'Lv.4 Göksel Simülasyon Şefi';
      else if (completedCount >= totalModules) levelTitle = 'Lv.4 Yüce Kraliyet Magitek Mimarı';
    } else if (isStage3) {
      if (completedCount === 0) levelTitle = 'Lv.3 Tanınan Mühendis';
      else if (completedCount === 1) levelTitle = 'Lv.3 Veritabanı & İşlem Mimarı';
      else if (completedCount === 2) levelTitle = 'Lv.3 Ağ & Protokol Uzmanı';
      else if (completedCount === 3) levelTitle = 'Lv.3 Kalite & Test Başmühendisi';
      else if (completedCount >= totalModules) levelTitle = 'Lv.4 Başmühendis & Lonca Lideri';
    } else if (isStage2) {
      if (completedCount === 0) levelTitle = 'Lv.2 Deneyimli Mühendis';
      else if (completedCount === 1) levelTitle = 'Lv.2 OOP & Nesne Mimarı';
      else if (completedCount === 2) levelTitle = 'Lv.2 Polimorfizm Uzmanı';
      else if (completedCount === 3) levelTitle = 'Lv.2 Veri Yapıları Mimarı';
      else if (completedCount >= totalModules) levelTitle = 'Lv.3 Usta Mühendis';
    } else {
      if (completedCount === 1) levelTitle = 'Lv.1 Kontrol Mühendisi';
      else if (completedCount === 2) levelTitle = 'Lv.1 Dizi & Tampon Uzmanı';
      else if (completedCount === 3) levelTitle = 'Lv.1 Gösterici & Bellek Mimarı';
      else if (completedCount >= totalModules) levelTitle = 'Lv.2 Mezun Mühendis';
    }

    // İlerleme Sayacı
    let academicProgress = isStage4
      ? `4. Aşama İlerlemesi: ${completedCount}/${totalModules} Modül Onaylandı`
      : isStage3
      ? `3. Aşama İlerlemesi: ${completedCount}/${totalModules} Modül Onaylandı`
      : isStage2
      ? `2. Aşama İlerlemesi: ${completedCount}/${totalModules} Modül Onaylandı`
      : `1. Aşama İlerlemesi: ${completedCount}/${totalModules} Modül Onaylandı`;

    if (completedCount >= totalModules) {
      academicProgress = isStage4
        ? '4/4 Modül Onaylandı - 4. Aşama Mezuniyeti Tamamlandı'
        : isStage3
        ? '4/4 Modül Onaylandı - 3. Aşama Mezuniyeti Tamamlandı'
        : isStage2
        ? '4/4 Modül Onaylandı - 2. Aşama Mezuniyeti Tamamlandı'
        : '4/4 Modül Onaylandı - 1. Aşama Mezuniyeti Tamamlandı';
    }

    const currentBgKey: 'village' | 'suburb' | 'capital' | 'royal' = isStage4
      ? 'royal'
      : isStage3
      ? 'capital'
      : isStage2
      ? 'suburb'
      : 'village';

    const currentClassTitle = isStage4
      ? 'Kraliyet Laboratuvarı // Saray Kademesi'
      : isStage3
      ? 'Başkent Mağazası // Merkez Kademe'
      : isStage2
      ? 'Mahalle Dükkanı // Varoş Kademesi'
      : 'Köy Atölyesi // Kırsal Kademe';

    const hudState = {
      levelTitle,
      expPercentage: this.state.exp,
      classTitle: currentClassTitle,
      gold: this.state.gold,
      day: this.state.day,
      academicProgress,
      stage: this.state.currentStage,
      bgKey: currentBgKey,
    };

    // Workshop State: Aktif atölye modülüne doğrudan bağlanır (Placeholder Dorian kaldırıldı!)
    const workshopModId = this.state.currentWorkshopModuleId;
    const workshopCustomer = this.getCustomerData(workshopModId);
    const workshopModData = this.getModuleData(workshopModId);
    const currentTasksInMod = this.state.moduleTaskCounts[workshopModId] || 0;
    const isStageComplete = completedCount >= totalModules;
    const hasNextModule = !isStageComplete && (completedCount < totalModules || currentTasksInMod < REQUIRED_TASKS_PER_MODULE);

    const jobStatus = this.state.jobStatus;
    const rewardReport = {
      gold: workshopModData.rewardGold,
      exp: workshopModData.rewardExp,
      deviceName: workshopModData.deviceName,
      deviceCode: workshopModData.deviceCode,
      statusText: `Stabil // Saha Testinde (${Math.min(currentTasksInMod, REQUIRED_TASKS_PER_MODULE)}/${REQUIRED_TASKS_PER_MODULE} Görev)`,
    };

    const workshopState = {
      customer: workshopCustomer,
      jobStatus,
      activeModuleId: workshopModId,
      rewardReport,
      hasNextModule,
      stage: this.state.currentStage,
      bgKey: currentBgKey,
      isStageCompleted: isStageComplete,
    };

    // Tezgâh Görev Listesi: Aktif aşamanın açık modülleri gösterilir
    const viewStage = this.state.currentViewStage || this.state.currentStage;
    const viewOrder: string[] = viewStage === 4
      ? STAGE_4_MODULE_ORDER
      : viewStage === 3
      ? STAGE_3_MODULE_ORDER
      : viewStage === 2
      ? STAGE_2_MODULE_ORDER
      : STAGE_1_MODULE_ORDER;

    let unlockedLimit: number;
    if (viewStage < this.state.currentStage) {
      unlockedLimit = viewOrder.length - 1;
    } else {
      unlockedLimit = viewOrder.indexOf(this.state.currentWorkshopModuleId);
      if (unlockedLimit === -1) {
        unlockedLimit = viewOrder.length - 1;
      }
    }
    const availableModules = viewOrder.slice(0, Math.max(0, unlockedLimit) + 1).map((id) => {
      const b = this.getModuleData(id);
      return {
        id,
        title: b.deviceName,
        isCompleted: this.state.completedModuleIds.includes(id),
        isCurrent: id === this.state.activeModuleId,
        isActiveWorkshopJob: id === this.state.currentWorkshopModuleId,
      };
    });

    const isPendingWorkbench = this.state.jobStatus === 'IN_WORKBENCH' || this.state.jobStatus === 'AVAILABLE';

    // Workbench State
    const workbenchState = {
      activeModule: activeModData,
      availableModules,
      selectedPatchId: this.state.selectedPatchId,
      inspectionStatus: this.state.inspectionStatus,
      hasPendingWork: isPendingWorkbench,
      hardwareTelemetry: {
        temperatureC: this.state.hardwareTempC,
        voltageV: this.state.hardwareVoltage,
        clockMhz: viewStage === 4 ? 128.0 : viewStage === 3 ? 64.0 : viewStage === 2 ? 32.0 : 16.0,
        statusText:
          this.state.hardwareTempC > 75
            ? 'AŞIRI ISINMA (OVERHEAT CRITICAL)'
            : this.state.inspectionStatus === 'REPAIRED'
            ? 'NOMİNAL & TEST BAŞARILI'
            : 'İNCELEME BEKLİYOR',
      },
      terminalLogs: this.state.terminalLogs,
      lastTestSuccess: this.state.lastTestSuccess,
      isLoadingDynamicTask: this.state.isLoadingDynamicTask,
      maxUnlockedStage: Math.max(this.state.maxUnlockedStage || 1, this.state.currentStage),
      currentViewStage: viewStage,
    };

    // Skills State: Aktif aşamaya göre yetenek ağacı
    const nodes = activeOrder.map((id) => {
      const b = CURRICULUM_MODULES[id] || CURRICULUM_MODULES.module_1_control;
      const ped = PEDAGOGICAL_MODULES[id as CurriculumModuleId];
      const isCompleted = this.state.completedModuleIds.includes(id);
      const isCurrent = id === this.state.currentWorkshopModuleId;
      const isUnlocked = isCompleted || isCurrent;
      const tasksDone = this.state.moduleTaskCounts[id] || 0;

      // Mühendislik Eval & Telemetri Karnesi Hesabı
      let evalMetrics: ModuleEvalMetrics | undefined = undefined;
      if (isUnlocked) {
        const protocol = MODULE_VERIFICATION_PROTOCOLS[id] || 'GCC 13.2 -Werror';
        const scores = this.state.moduleTaskScores[id] || [];
        const solvedCount = scores.length;

        // Bir modüldeki genel oran, o modüle ait çözülmüş görevlerin toplam katsayısının çözülen görev sayısına bölünmesiyle hesaplanır:
        // Hesaplanan Yüzde = Math.round((Toplam Kazanılan Katsayı / Çözülen Görev Sayısı) * 100)
        // Henüz hiçbir görevi tamamlanmamış (veya hiç çözülmemiş) modüllerde oran sayısal bir değer yerine null olarak tutulur.
        const calculatedPercentage =
          solvedCount > 0
            ? Math.round((scores.reduce((sum, s) => sum + s, 0) / solvedCount) * 100)
            : null;

        const firstPassRate: number | null =
          isCompleted && calculatedPercentage !== null
            ? calculatedPercentage
            : null;

        const evalScore = isCompleted
          ? (firstPassRate ?? 100)
          : calculatedPercentage !== null
          ? calculatedPercentage
          : 0;

        const failedAttempts = this.state.taskAttempts[id] || 0;
        const regressionRisk: 'DÜŞÜK' | 'ORTA' | 'SIFIR' =
          isCompleted
            ? (firstPassRate ?? 100) >= 95
              ? 'SIFIR'
              : (firstPassRate ?? 100) >= 70
              ? 'DÜŞÜK'
              : 'ORTA'
            : failedAttempts > 0
            ? 'DÜŞÜK'
            : 'SIFIR';

        evalMetrics = {
          firstPassRate,
          regressionRisk,
          evalScore,
          verificationProtocol: protocol,
        };
      }

      return {
        ...b.skillNode,
        id: ped?.id || id,
        name: ped?.title || b.skillNode.name,
        tier: ped?.tier || b.skillNode.tier,
        status: (isUnlocked ? 'UNLOCKED' : 'LOCKED') as 'UNLOCKED' | 'LOCKED',
        description: ped?.description || '',
        academicCredit: ped?.academicCredit || '',
        curriculumTopic: ped?.curriculumTopic || '',
        isCompleted,
        isCurrent,
        taskProgress: `${Math.min(tasksDone, REQUIRED_TASKS_PER_MODULE)}/${REQUIRED_TASKS_PER_MODULE} Görev`,
        allowedTopics: ped?.allowedTopics || [],
        forbiddenTopics: ped?.forbiddenTopics || [],
        evalMetrics,
      };
    });

    const skillsState = {
      treeTitle: isStage4
        ? 'Samsun Üniversitesi Yazılım Mühendisliği 4. Sınıf Yetenekler Ağacı'
        : isStage3
        ? 'Samsun Üniversitesi Yazılım Mühendisliği 3. Sınıf Yetenekler Ağacı'
        : isStage2
        ? 'Samsun Üniversitesi Yazılım Mühendisliği 2. Sınıf Yetenekler Ağacı'
        : 'Samsun Üniversitesi Yazılım Mühendisliği 1. Sınıf Yetenekler Ağacı',
      semesterTitle: isStage4
        ? '4. Sınıf (YZM374, YZM401, YZM371, YZM362, YZM366, YZM376, YZM357) Pedagojik İlerleme Omurgası'
        : isStage3
        ? '3. Sınıf (YZM301, YZM303, YZM306, YZM307) Pedagojik İlerleme Omurgası'
        : isStage2
        ? '2. Sınıf (YZM201, YZM202, YZM203) Pedagojik İlerleme Omurgası'
        : '1. Sınıf (YZM101, YZM105, YZM102, YZM104) Pedagojik İlerleme Omurgası',
      nodes,
    };

    // Shop State
    const shopItems = INITIAL_SHOP_ITEMS.map((item) => ({
      ...item,
      status: (this.state.purchasedShopItems.includes(item.id) ? 'UNLOCKED' : 'LOCKED') as 'UNLOCKED' | 'LOCKED',
    }));

    const shopState = {
      items: shopItems,
    };

    // Room State
    const unlockedGadgets = activeOrder.map((id) => {
      const b = CURRICULUM_MODULES[id] || CURRICULUM_MODULES.module_1_control;
      const isCompleted = this.state.completedModuleIds.includes(id);
      return {
        ...b.gadget,
        isUnlocked: isCompleted,
      };
    });

    const roomState = {
      roomName: isStage4
        ? 'Kraliyet Magitek Araştırma Laboratuvarı'
        : isStage3
        ? 'Başkent Mağazası Başmühendislik Laboratuvarı'
        : isStage2
        ? 'Mahalle Dükkanı Arka Ofisi'
        : 'Mühendisin Arka Odası & Çalışma Masası',
      ambianceText: isStage4
        ? 'Sarayın zirvesinde yer alan Kraliyet Laboratuvarı; göksel pirinç teleskoplar, mana kristali reaktörleri, yapay zeka matrisleri ve şifreli telgraf konsollarıyla ışıldıyor.'
        : isStage3
        ? 'Başkent Mağazası arkasındaki yüksek teknoloji laboratuvarı; telgraf rezonatörleri, veritabanı kütükleri ve zırh çekirdeği telemetrisiyle parıldıyor.'
        : isStage2
        ? 'Mahalle Dükkanı arkasındaki ofis; pnomatik boru hatları, tramvay makas şemaları ve C++ veri yapısı kataloglarıyla donatılmış.'
        : completedCount === 0
        ? 'Oda henüz sade ve sessiz. Masada tek tük pirinç tamir aletleri duruyor.'
        : completedCount === 4
        ? 'Oda tıkır tıkır çalışan gömülü aygıtlar, osiloskop yeşili ekranlar ve 1. Aşama Mezuniyet Beratıyla dolu bir magitek üssüne dönüştü!'
        : `Tamamlanan modüllerle odaya ${completedCount} yeni donanım ve teşhis aparatı eklendi.`,
      systemSpecs: {
        arch: isStage4
          ? 'x86_64 POSIX // Magitek Royal Architecture & Cognitive Core'
          : isStage3
          ? 'x86_64 POSIX // Magitek Enterprise & Concurrency Core'
          : isStage2
          ? 'x86_64 POSIX // Magitek C++20 Core'
          : 'x86_64 POSIX Sandbox // Magitek AVR Core',
        kernel: 'Magitek Linux 6.8.0-primer',
        compiler: isStage4
          ? 'g++ 14.2.0 (Royal Enterprise & Deep Systems Toolchain)'
          : isStage3
          ? 'g++ 14.1.0 (Enterprise Systems & POSIX Toolchain)'
          : isStage2
          ? 'g++ 13.2.0 (Modern C++ OOP Toolchain)'
          : 'avr-gcc 13.2.0 (Embedded Toolchain)',
      },
      unlockedGadgets,
    };

    return {
      activeTab: this.state.activeTab,
      hud: hudState,
      workshop: workshopState,
      workbench: workbenchState,
      skills: skillsState,
      shop: shopState,
      room: roomState,
    };
  }
}

export const sduiEngine = new SDUIEngineService();
