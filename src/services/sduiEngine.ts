import {
  SDUIState,
  TabType,
  ModuleId,
  ShopItem,
  WorkbenchModuleData,
  CustomerIssue,
} from '../types/sdui';
import { CURRICULUM_MODULES, MODULE_ORDER } from '../data/curriculumModules';
import { geminiTaskService, GeminiTaskPayload } from './geminiTaskService';

interface InternalState {
  activeTab: TabType;
  activeModuleId: ModuleId;
  currentWorkshopModuleId: ModuleId;
  completedModuleIds: ModuleId[];
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
      activeModuleId: 'module_1_loops',
      currentWorkshopModuleId: 'module_1_loops',
      completedModuleIds: [],
      dynamicModuleOrder: [...MODULE_ORDER],
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
        'Cihaz Algılandı: MCU-HT8 (Hydro-Tick 8)',
        'ROM: 32KB Flash // RAM: 2KB SRAM',
        'Durum: HATA_KODU_0x0F (Tampon Taşması / Buffer Overflow)',
        'İpucu: Tezgâhta arızalı C kodunu inceleyip uygun yamayı seçin.',
      ],
      lastTestSuccess: undefined,
      purchasedShopItems: [],
      isLoadingDynamicTask: false,
    };

    // İlk görev için dinamik arka plan yüklemesini tetikle (sessiz)
    this.fetchAndApplyDynamicTask('module_1_loops', true);

    // Otonom Arka Plan Görev Kuyruğu: Sıradaki görevi (module_2_memory) önceden hazırla
    this.prefetchNextTask();
  }

  /**
   * Modül verisini alır (Canlı Gemini çıktısı varsa onu, yoksa statik müfredatı kullanır)
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
    return CURRICULUM_MODULES[moduleId]?.moduleData || CURRICULUM_MODULES.module_1_loops.moduleData;
  }

  /**
   * Müşteri / Görev veren verisini alır
   */
  private getCustomerData(moduleId: ModuleId): CustomerIssue {
    const dynamic = this.dynamicTasks[moduleId];
    if (dynamic) {
      return dynamic.customer;
    }
    return CURRICULUM_MODULES[moduleId]?.customer || CURRICULUM_MODULES.module_1_loops.customer;
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
   * Gemini API üzerinden dinamik görev yükler ve arayüzü günceller
   */
  public async fetchAndApplyDynamicTask(moduleId: ModuleId, silent: boolean = false): Promise<void> {
    // Tamamlanmış modüller için yeniden çekme
    if (this.state.completedModuleIds.includes(moduleId)) {
      return;
    }

    // Kuyrukta hazır bekleyen arıza varsa anında devreye al (Zero-Latency)
    if (this.taskQueue.has(moduleId)) {
      const queued = this.taskQueue.get(moduleId)!;
      this.dynamicTasks[moduleId] = queued;
      this.taskQueue.delete(moduleId);
      this.notify();
      return;
    }

    if (!silent) {
      this.state.isLoadingDynamicTask = true;
      this.notify();
    }

    try {
      this.lastPrefetchTime = Date.now();
      const classLevel = 1;
      const stageProgress = this.state.completedModuleIds.length;
      const payload = await geminiTaskService.fetchDynamicTask(moduleId, classLevel, stageProgress);

      this.dynamicTasks[moduleId] = payload;

      // Terminale telemetri bilgisi ekle
      if (this.state.activeModuleId === moduleId) {
        this.state.terminalLogs = [
          ...this.state.terminalLogs,
          `⚙️ Makina Şebekesinden Telemetri Alındı [${payload.isDynamic ? 'CANLI AI // GROQ' : 'STATİK KANAL'}]`,
          `Cihaz: ${payload.deviceName} (${payload.deviceCode})`,
          `Belirti: ${payload.customer.physicalSymptom}`,
        ];
      }
    } catch (err) {
      console.warn('[SDUIEngine] Dinamik görev yüklenirken hata:', err);
      if (!this.dynamicTasks[moduleId]) {
        this.dynamicTasks[moduleId] = geminiTaskService.getStaticFallbackTask(moduleId);
      }
    } finally {
      if (!silent) {
        this.state.isLoadingDynamicTask = false;
      }
      this.notify();
    }
  }

  public selectModule(moduleId: ModuleId): void {
    this.state.activeModuleId = moduleId;

    // Kuyrukta hazır bekleyen arıza varsa hemen aktar
    if (this.taskQueue.has(moduleId) && !this.dynamicTasks[moduleId]) {
      this.dynamicTasks[moduleId] = this.taskQueue.get(moduleId)!;
      this.taskQueue.delete(moduleId);
    }

    const modData = this.getModuleData(moduleId);
    const isCompleted = this.state.completedModuleIds.includes(moduleId);

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
        : 'İşlem: Bozuk C bloğunu inceleyin ve düzeltme yamasını derleyin.',
    ];
    this.notify();

    // Dinamik görev henüz çekilmediyse ve modül henüz tamamlanmadıysa çek
    if (!this.dynamicTasks[moduleId] && !isCompleted) {
      this.fetchAndApplyDynamicTask(moduleId, true);
    }

    // Kullanıcı bu modülü incelerken sıradaki görevi otonom olarak prefetch et
    this.prefetchNextTask();
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

    // Terminal loglarını besle
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

  public deliverJob(): { rewardGold: number; rewardExp: number; nextModuleId?: ModuleId } {
    const currentModuleId = this.state.activeModuleId;
    const modData = this.getModuleData(currentModuleId);

    const isAlreadyCompleted = this.state.completedModuleIds.includes(currentModuleId);
    let rewardGold = modData.rewardGold;
    let rewardExp = modData.rewardExp;

    if (!isAlreadyCompleted) {
      this.state.completedModuleIds = [...this.state.completedModuleIds, currentModuleId];
      this.state.gold += rewardGold;
      this.state.exp = Math.min(100, this.state.exp + rewardExp);
      this.state.day += 1;
    } else {
      rewardGold = 0;
      rewardExp = 0;
    }

    this.state.jobStatus = 'DELIVERED';

    // Sıradaki açılmamış modülü belirle
    const currentIndex = this.state.dynamicModuleOrder.indexOf(currentModuleId);
    let nextModuleId: ModuleId | undefined;
    if (currentIndex >= 0 && currentIndex < this.state.dynamicModuleOrder.length - 1) {
      nextModuleId = this.state.dynamicModuleOrder[currentIndex + 1];
    }

    this.notify();
    return { rewardGold, rewardExp, nextModuleId };
  }

  /**
   * Otonom Arka Plan Görev Kuyruğu (Task Prefetching)
   * Kullanıcı mevcut arızayı incelerken/çözerken sistem arka planda bir sonraki
   * dinamik arızayı Gemini API'den sessizce çeker ve kuyrukta hazır tutar.
   */
  public async prefetchNextTask(): Promise<void> {
    if (this.isPrefetching) return;

    // Rate-limit engelleyici: Son istek üzerinden en az 6 saniye geçmediyse bekle/pas geç
    const now = Date.now();
    if (now - this.lastPrefetchTime < 6000) {
      console.log(
        `[SDUIEngine: Prefetch] Cooldown devrede (${Math.round((6000 - (now - this.lastPrefetchTime)) / 1000)}s kaldı), yeni istek atılmadı.`
      );
      return;
    }

    const order = this.state.dynamicModuleOrder;
    const currentIndex = order.indexOf(this.state.currentWorkshopModuleId);
    let nextTargetId: ModuleId;

    if (currentIndex >= 0 && currentIndex < order.length - 1) {
      nextTargetId = order[currentIndex + 1];
    } else {
      const nextNumber = order.length + 1;
      nextTargetId = `dynamic_task_${nextNumber}`;
      if (!order.includes(nextTargetId)) {
        order.push(nextTargetId);
      }
    }

    // Zaten kuyrukta veya önbellekte varsa tekrar çekme
    if (this.taskQueue.has(nextTargetId) || this.dynamicTasks[nextTargetId]) {
      return;
    }

    this.isPrefetching = true;
    try {
      this.lastPrefetchTime = Date.now();
      const classLevel = 1;
      const stageProgress = this.state.completedModuleIds.length + 1;
      const payload = await geminiTaskService.fetchDynamicTask(
        nextTargetId,
        classLevel,
        stageProgress
      );

      if (nextTargetId.startsWith('dynamic_task_') || payload.isDynamic) {
        if (!payload.deviceName.includes('[CANLI AI]')) {
          payload.deviceName = `[CANLI AI] ${payload.deviceName}`;
        }
      }

      this.taskQueue.set(nextTargetId, payload);
      this.dynamicTasks[nextTargetId] = payload;
    } catch (err) {
      console.warn('[SDUIEngine] Sıradaki görev prefetch edilirken hata, fallback hazırlandı:', err);
      const fallback = geminiTaskService.getStaticFallbackTask(nextTargetId);
      this.taskQueue.set(nextTargetId, fallback);
      this.dynamicTasks[nextTargetId] = fallback;
    } finally {
      this.isPrefetching = false;
    }
  }

  public async advanceToNextModule(): Promise<void> {
    const order = this.state.dynamicModuleOrder;
    const currentIndex = order.indexOf(this.state.currentWorkshopModuleId);
    let nextId: ModuleId;

    if (currentIndex >= 0 && currentIndex < order.length - 1) {
      nextId = order[currentIndex + 1];
    } else {
      const nextNumber = order.length + 1;
      nextId = `dynamic_task_${nextNumber}`;
      if (!order.includes(nextId)) {
        order.push(nextId);
      }
    }

    // Sıfır gecikme (Zero-Latency): Kuyrukta hazır bekleyen arıza veya önbellek
    const prefetched = this.taskQueue.get(nextId) || this.dynamicTasks[nextId];
    if (prefetched) {
      this.dynamicTasks[nextId] = prefetched;
      this.taskQueue.delete(nextId);
    } else {
      // API gecikmesi veya internet kopmasında şeffaf yerel fallback
      const fallback = geminiTaskService.getStaticFallbackTask(nextId);
      this.dynamicTasks[nextId] = fallback;
    }

    this.state.currentWorkshopModuleId = nextId;
    this.selectModule(nextId);
    this.state.activeTab = 'workshop';
    this.notify();

    // Kullanıcı yeni göreve geçer geçmez sıradaki görevi otonom olarak arka planda hazırla
    this.prefetchNextTask();
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
    const totalModules = MODULE_ORDER.length;

    // Seviye Unvanı
    let levelTitle = 'Lv.1 Bağımsız Mühendis';
    if (completedCount === 1) levelTitle = 'Lv.1 Atölye Çırağı';
    else if (completedCount === 2) levelTitle = 'Lv.1 Kıdemli Teknisyen';
    else if (completedCount === 3) levelTitle = 'Lv.1 Sistem Mühendisi';
    else if (completedCount >= 4) levelTitle = 'Lv.2 Mezun Mühendis';

    let academicProgress = `1. Sınıf İlerlemesi: ${completedCount}/${totalModules} Modül Onaylandı`;
    if (completedCount >= totalModules) {
      academicProgress = `1. Sınıf Mezun // Saha Görevi: ${completedCount} Çözüldü`;
    }

    const hudState = {
      levelTitle,
      expPercentage: this.state.exp,
      classTitle: '1. Sınıf: Algoritmalar, C & Donanım Temelleri',
      gold: this.state.gold,
      day: this.state.day,
      academicProgress,
    };

    // Workshop State: Her zaman aktif atölye görevine (currentWorkshopModuleId) bağlı kalır
    const workshopModId = this.state.currentWorkshopModuleId;
    const workshopCustomer = this.getCustomerData(workshopModId);
    const workshopModData = this.getModuleData(workshopModId);
    // Sonsuz dinamik görev kuyruğu aktif olduğu için daima sıradaki görev mevcuttur
    const hasNextModule = true;

    const workshopState = {
      customer: workshopCustomer,
      jobStatus: this.state.jobStatus,
      activeModuleId: workshopModId,
      rewardReport: {
        gold: workshopModData.rewardGold,
        exp: workshopModData.rewardExp,
        deviceName: workshopModData.deviceName,
        deviceCode: workshopModData.deviceCode,
        statusText: 'Stabil // Saha Testinde',
      },
      hasNextModule,
    };

    // Tezgâh Görev Listesi: YALNIZCA tamamlanan görevler ve mevcut aktif görev gösterilir!
    const unlockedLimit = this.state.dynamicModuleOrder.indexOf(this.state.currentWorkshopModuleId);
    const availableModules = this.state.dynamicModuleOrder.slice(0, unlockedLimit + 1).map((id) => {
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

    // Skills State
    const nodes = MODULE_ORDER.map((id) => {
      const b = CURRICULUM_MODULES[id];
      const isUnlocked = this.state.completedModuleIds.includes(id) || id === this.state.activeModuleId;
      return {
        ...b.skillNode,
        status: (isUnlocked ? 'UNLOCKED' : 'LOCKED') as 'UNLOCKED' | 'LOCKED',
      };
    });

    const skillsState = {
      treeTitle: '1. Sınıf Yazılım Mühendisliği Müfredat Ağacı',
      semesterTitle: '1. Sınıf Güz / Bahar: Bilgisayar Mühendisliği Çekirdek Müfredat',
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
    const unlockedGadgets = MODULE_ORDER.map((id) => {
      const b = CURRICULUM_MODULES[id];
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
          ? 'Oda tıkır tıkır çalışan gömülü aygıtlar, osiloskop yeşili ekranlar ve altın başarı beratıyla dolu bir magitek üssüne dönüştü!'
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
