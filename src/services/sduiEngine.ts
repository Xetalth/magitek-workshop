import {
  SDUIState,
  TabType,
  ModuleId,
  ShopItem,
  WorkbenchModuleData,
  CustomerIssue,
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
  activeModuleId: ModuleId;
  currentWorkshopModuleId: ModuleId;
  completedModuleIds: ModuleId[];
  moduleTaskCounts: Record<string, number>;
  modulePoolIndices: Record<string, number>; // Hangi modülde tohum havuzunun hangi görevinin aktif olduğu
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
  public async advanceToNextModule(): Promise<void> {
    const currentModuleId = this.state.currentWorkshopModuleId;
    const currentCount = this.state.moduleTaskCounts[currentModuleId] || 0;
    const thresholdReached = currentCount >= REQUIRED_TASKS_PER_MODULE;
    const currentIndex = CURRICULUM_MODULE_ORDER.indexOf(currentModuleId as CurriculumModuleId);

    if (thresholdReached) {
      // Modül tamamlandı -> Sıradaki modüle geç
      if (currentIndex >= 0 && currentIndex < CURRICULUM_MODULE_ORDER.length - 1) {
        const nextId = CURRICULUM_MODULE_ORDER[currentIndex + 1];
        this.state.currentWorkshopModuleId = nextId;

        // Sıradaki modülün görevini tohum havuzundan hemen hazırla (Sıradaki alternatif tohum görevi)
        const nextPoolIdx = this.getPoolIndex(nextId);
        this.dynamicTasks[nextId] = geminiTaskService.getStaticFallbackTask(nextId, nextPoolIdx);
        this.selectModule(nextId);
        this.state.activeTab = 'workshop';
        this.notify();

        // Canlı mod açıksa arka planda API'yi dene
        if (USE_LIVE_AI) {
          await this.fetchAndApplyDynamicTask(nextId, false);
        }
      } else {
        // Tüm 4 modül tamamlandı (1. Sınıf Mezuniyeti)
        this.selectModule(currentModuleId);
        this.state.activeTab = 'workbench';
        this.notify();
      }
    } else {
      // Eşik dolmadı (Örn: REQUIRED_TASKS_PER_MODULE = 4):
      // AYNI modül için sıradaki tohum görevini havuzdan getir (Devir sayacı -> Buhar regülatörü -> Termostat)
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
    const completedCount = this.state.completedModuleIds.length;
    const totalModules = CURRICULUM_MODULE_ORDER.length; // 4

    // Seviye Unvanı
    let levelTitle = 'Lv.1 Çırak Mühendis';
    if (completedCount === 1) levelTitle = 'Lv.1 Kontrol Mühendisi';
    else if (completedCount === 2) levelTitle = 'Lv.1 Dizi & Tampon Uzmanı';
    else if (completedCount === 3) levelTitle = 'Lv.1 Gösterici & Bellek Mimarı';
    else if (completedCount >= totalModules) levelTitle = 'Lv.2 Mezun Mühendis';

    // 4. modül tamamlandığında arayüzdeki "1. Sınıf İlerlemesi" sayacı:
    // '4/4 Modül Onaylandı - 1. Sınıf Mezuniyeti Tamamlandı'
    let academicProgress = `1. Sınıf İlerlemesi: ${completedCount}/${totalModules} Modül Onaylandı`;
    if (completedCount >= totalModules) {
      academicProgress = '4/4 Modül Onaylandı - 1. Sınıf Mezuniyeti Tamamlandı';
    }

    const hudState = {
      levelTitle,
      expPercentage: this.state.exp,
      classTitle: 'Samsun Üniv. Yazılım Müh. // 1. Sınıf Çekirdek Müfredatı',
      gold: this.state.gold,
      day: this.state.day,
      academicProgress,
    };

    // Workshop State: Her zaman aktif atölye görevine bağlı kalır
    const workshopModId = this.state.currentWorkshopModuleId;
    const workshopCustomer = this.getCustomerData(workshopModId);
    const workshopModData = this.getModuleData(workshopModId);
    const currentTasksInMod = this.state.moduleTaskCounts[workshopModId] || 0;
    const hasNextModule = completedCount < totalModules || currentTasksInMod < REQUIRED_TASKS_PER_MODULE;

    const workshopState = {
      customer: workshopCustomer,
      jobStatus: this.state.jobStatus,
      activeModuleId: workshopModId,
      rewardReport: {
        gold: workshopModData.rewardGold,
        exp: workshopModData.rewardExp,
        deviceName: workshopModData.deviceName,
        deviceCode: workshopModData.deviceCode,
        statusText: `Stabil // Saha Testinde (${Math.min(currentTasksInMod, REQUIRED_TASKS_PER_MODULE)}/${REQUIRED_TASKS_PER_MODULE} Görev)`,
      },
      hasNextModule,
    };

    // Tezgâh Görev Listesi: YALNIZCA tamamlanan görevler ve mevcut aktif görev gösterilir!
    const unlockedLimit = CURRICULUM_MODULE_ORDER.indexOf(this.state.currentWorkshopModuleId as CurriculumModuleId);
    const availableModules = CURRICULUM_MODULE_ORDER.slice(0, unlockedLimit + 1).map((id) => {
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
        clockMhz: 16.0,
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
    };

    // Skills State: Düğümler sırayla aktifleşsin
    const nodes = CURRICULUM_MODULE_ORDER.map((id) => {
      const b = CURRICULUM_MODULES[id] || CURRICULUM_MODULES.module_1_control;
      const ped = PEDAGOGICAL_MODULES[id];
      const isCompleted = this.state.completedModuleIds.includes(id);
      const isCurrent = id === this.state.currentWorkshopModuleId;
      const isUnlocked = isCompleted || isCurrent;
      const tasksDone = this.state.moduleTaskCounts[id] || 0;

      return {
        ...b.skillNode,
        id: ped.id,
        name: ped.title,
        tier: ped.tier,
        status: (isUnlocked ? 'UNLOCKED' : 'LOCKED') as 'UNLOCKED' | 'LOCKED',
        description: ped.description,
        academicCredit: ped.academicCredit,
        curriculumTopic: ped.curriculumTopic,
        isCompleted,
        isCurrent,
        taskProgress: `${Math.min(tasksDone, REQUIRED_TASKS_PER_MODULE)}/${REQUIRED_TASKS_PER_MODULE} Görev`,
        allowedTopics: ped.allowedTopics,
        forbiddenTopics: ped.forbiddenTopics,
      };
    });

    const skillsState = {
      treeTitle: 'Samsun Üniversitesi Yazılım Mühendisliği 1. Sınıf Yetenekler Ağacı',
      semesterTitle: '1. Sınıf (YZM101, YZM105, YZM102, YZM104) Pedagojik İlerleme Omurgası',
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
    const unlockedGadgets = CURRICULUM_MODULE_ORDER.map((id) => {
      const b = CURRICULUM_MODULES[id] || CURRICULUM_MODULES.module_1_control;
      const isCompleted = this.state.completedModuleIds.includes(id);
      return {
        ...b.gadget,
        isUnlocked: isCompleted,
      };
    });

    const roomState = {
      roomName: 'Mühendisin Arka Odası & Çalışma Masası',
      ambianceText:
        completedCount === 0
          ? 'Oda henüz sade ve sessiz. Masada tek tük pirinç tamir aletleri duruyor.'
          : completedCount === 4
          ? 'Oda tıkır tıkır çalışan gömülü aygıtlar, osiloskop yeşili ekranlar ve 1. Sınıf Mezuniyet Beratıyla dolu bir magitek üssüne dönüştü!'
          : `Tamamlanan modüllerle odaya ${completedCount} yeni donanım ve teşhis aparatı eklendi.`,
      systemSpecs: {
        arch: 'x86_64 POSIX Sandbox // Magitek AVR Core',
        kernel: 'Magitek Linux 6.8.0-primer',
        compiler: 'avr-gcc 13.2.0 (Embedded Toolchain)',
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
