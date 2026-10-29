"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sduiEngine = void 0;
const curriculumModules_1 = require("../data/curriculumModules");
const INITIAL_SHOP_ITEMS = [
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
    constructor() {
        this.listeners = new Set();
        this.state = {
            activeTab: 'workshop',
            activeModuleId: 'module_1_loops',
            completedModuleIds: [],
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
            selectedConversationOption: {
                module_1_loops: 'Közlenmiş Atölye Kahvesi',
                module_2_memory: 'Közde Buhar Kahvesi',
                module_3_structs: 'Kavrulmuş Arpa Kahvesi',
                module_4_testing: 'Bent Kulesi Buhar Kahvesi',
            },
            customConversationInput: {},
            showCustomInput: {},
            purchasedShopItems: [],
        };
    }
    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.toDeclarativeSDUI());
        return () => this.listeners.delete(listener);
    }
    notify() {
        const declarativeState = this.toDeclarativeSDUI();
        this.listeners.forEach((listener) => listener(declarativeState));
    }
    getDeclarativeState() {
        return this.toDeclarativeSDUI();
    }
    setActiveTab(tab) {
        this.state.activeTab = tab;
        this.notify();
    }
    selectModule(moduleId) {
        this.state.activeModuleId = moduleId;
        const bundle = curriculumModules_1.CURRICULUM_MODULES[moduleId];
        const isCompleted = this.state.completedModuleIds.includes(moduleId);
        this.state.selectedPatchId = null;
        this.state.inspectionStatus = isCompleted ? 'REPAIRED' : 'ANALYZING';
        this.state.hardwareTempC = isCompleted ? 35 : 44;
        this.state.jobStatus = isCompleted ? 'DELIVERED' : 'IN_WORKBENCH';
        this.state.terminalLogs = [
            `--- ${bundle.moduleData.deviceName} Yüklendi ---`,
            `Akademik Ünite: ${bundle.moduleData.academicUnit}`,
            `Arıza Tanısı: ${bundle.moduleData.physicalSymptom}`,
            isCompleted
                ? '[BİLGİ] Bu modül başarıyla çözüldü ve onaylandı.'
                : 'İşlem: Bozuk C bloğunu inceleyin ve düzeltme yamasını derleyin.',
        ];
        this.notify();
    }
    selectPatch(patchId) {
        this.state.selectedPatchId = patchId;
        const bundle = curriculumModules_1.CURRICULUM_MODULES[this.state.activeModuleId];
        const patch = bundle.moduleData.patchOptions.find((p) => p.id === patchId);
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
    runCompileAndTest() {
        const bundle = curriculumModules_1.CURRICULUM_MODULES[this.state.activeModuleId];
        if (!this.state.selectedPatchId) {
            return { success: false, message: 'Lütfen önce incelenecek bir yama seçin!', tempC: this.state.hardwareTempC };
        }
        const patch = bundle.moduleData.patchOptions.find((p) => p.id === this.state.selectedPatchId);
        if (!patch) {
            return { success: false, message: 'Geçersiz yama seçimi!', tempC: this.state.hardwareTempC };
        }
        const outcome = patch.compilerOutcome;
        this.state.hardwareTempC = outcome.hardwareTempC;
        this.state.lastTestSuccess = outcome.success;
        // Terminal loglarını besle
        this.state.terminalLogs = [
            '==================================================',
            `[MAGITEK DERLEYİCİ] ${bundle.moduleData.deviceCode} test ediliyor...`,
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
        }
        else {
            this.state.inspectionStatus = 'OVERHEATING_FAILED';
            this.notify();
            return {
                success: false,
                message: outcome.feedbackMessage,
                tempC: outcome.hardwareTempC,
            };
        }
    }
    deliverJob() {
        const currentModuleId = this.state.activeModuleId;
        const bundle = curriculumModules_1.CURRICULUM_MODULES[currentModuleId];
        const isAlreadyCompleted = this.state.completedModuleIds.includes(currentModuleId);
        let rewardGold = bundle.moduleData.rewardGold;
        let rewardExp = bundle.moduleData.rewardExp;
        if (!isAlreadyCompleted) {
            this.state.completedModuleIds = [...this.state.completedModuleIds, currentModuleId];
            this.state.gold += rewardGold;
            this.state.exp = Math.min(100, this.state.exp + rewardExp);
            this.state.day += 1;
        }
        else {
            rewardGold = 0;
            rewardExp = 0;
        }
        this.state.jobStatus = 'DELIVERED';
        // Sıradaki açılmamış modülü belirle
        const currentIndex = curriculumModules_1.MODULE_ORDER.indexOf(currentModuleId);
        let nextModuleId;
        if (currentIndex >= 0 && currentIndex < curriculumModules_1.MODULE_ORDER.length - 1) {
            nextModuleId = curriculumModules_1.MODULE_ORDER[currentIndex + 1];
        }
        this.notify();
        return { rewardGold, rewardExp, nextModuleId };
    }
    advanceToNextModule() {
        const currentIndex = curriculumModules_1.MODULE_ORDER.indexOf(this.state.activeModuleId);
        if (currentIndex >= 0 && currentIndex < curriculumModules_1.MODULE_ORDER.length - 1) {
            const nextId = curriculumModules_1.MODULE_ORDER[currentIndex + 1];
            this.selectModule(nextId);
            this.state.activeTab = 'workshop';
            this.notify();
        }
    }
    setConversationOption(option) {
        const modId = this.state.activeModuleId;
        if (option === 'Diğer...') {
            this.state.selectedConversationOption[modId] = 'Diğer...';
            this.state.showCustomInput[modId] = true;
        }
        else {
            this.state.selectedConversationOption[modId] = option;
            this.state.showCustomInput[modId] = false;
        }
        this.notify();
    }
    setCustomConversationInput(text) {
        const modId = this.state.activeModuleId;
        this.state.customConversationInput[modId] = text;
        this.notify();
    }
    buyShopItem(itemId) {
        const item = INITIAL_SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item)
            return false;
        if (this.state.purchasedShopItems.includes(itemId))
            return false;
        if (this.state.gold < item.costGold)
            return false;
        this.state.gold -= item.costGold;
        this.state.purchasedShopItems = [...this.state.purchasedShopItems, itemId];
        this.notify();
        return true;
    }
    /**
     * SDUI Şema Üreticisi (Declarative Engine Output)
     */
    toDeclarativeSDUI() {
        const currentBundle = curriculumModules_1.CURRICULUM_MODULES[this.state.activeModuleId];
        const completedCount = this.state.completedModuleIds.length;
        const totalModules = curriculumModules_1.MODULE_ORDER.length;
        // Seviye Unvanı
        let levelTitle = 'Lv.1 Bağımsız Mühendis';
        if (completedCount === 1)
            levelTitle = 'Lv.1 Atölye Çırağı';
        else if (completedCount === 2)
            levelTitle = 'Lv.1 Kıdemli Teknisyen';
        else if (completedCount === 3)
            levelTitle = 'Lv.1 Sistem Mühendisi';
        else if (completedCount >= 4)
            levelTitle = 'Lv.2 Mezun Mühendis (1. Sınıf Tamamlandı)';
        const hudState = {
            levelTitle,
            expPercentage: this.state.exp,
            classTitle: '1. Sınıf: Algoritmalar, C & Donanım Temelleri',
            gold: this.state.gold,
            day: this.state.day,
            academicProgress: `1. Sınıf İlerlemesi: ${completedCount}/${totalModules} Modül Onaylandı`,
        };
        // Workshop State
        const teaConfig = currentBundle.teaConversation;
        const currentModId = this.state.activeModuleId;
        const workshopState = {
            customer: currentBundle.customer,
            jobStatus: this.state.jobStatus,
            activeModuleId: currentModId,
            conversation: {
                isUnlocked: this.state.jobStatus === 'DELIVERED',
                prompt: teaConfig.prompt,
                options: teaConfig.options,
                selectedOption: this.state.selectedConversationOption[currentModId] || teaConfig.defaultOption,
                customInput: this.state.customConversationInput[currentModId] || '',
                showCustomInput: !!this.state.showCustomInput[currentModId],
            },
        };
        // Available modules navigation list for Workbench
        const availableModules = curriculumModules_1.MODULE_ORDER.map((id) => {
            const b = curriculumModules_1.CURRICULUM_MODULES[id];
            return {
                id,
                title: b.moduleData.deviceName,
                isCompleted: this.state.completedModuleIds.includes(id),
                isCurrent: id === this.state.activeModuleId,
            };
        });
        const isPendingWorkbench = this.state.jobStatus === 'IN_WORKBENCH' || this.state.jobStatus === 'AVAILABLE';
        // Workbench State
        const workbenchState = {
            activeModule: currentBundle.moduleData,
            availableModules,
            selectedPatchId: this.state.selectedPatchId,
            inspectionStatus: this.state.inspectionStatus,
            hasPendingWork: isPendingWorkbench,
            hardwareTelemetry: {
                temperatureC: this.state.hardwareTempC,
                voltageV: this.state.hardwareVoltage,
                clockMhz: 16.0,
                statusText: this.state.hardwareTempC > 75
                    ? 'AŞIRI ISINMA (OVERHEAT CRITICAL)'
                    : this.state.inspectionStatus === 'REPAIRED'
                        ? 'NOMİNAL & TEST BAŞARILI'
                        : 'İNCELEME BEKLİYOR',
            },
            terminalLogs: this.state.terminalLogs,
            lastTestSuccess: this.state.lastTestSuccess,
        };
        // Skills State
        const nodes = curriculumModules_1.MODULE_ORDER.map((id) => {
            const b = curriculumModules_1.CURRICULUM_MODULES[id];
            const isUnlocked = this.state.completedModuleIds.includes(id) || id === this.state.activeModuleId;
            return {
                ...b.skillNode,
                status: (isUnlocked ? 'UNLOCKED' : 'LOCKED'),
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
            status: (this.state.purchasedShopItems.includes(item.id) ? 'UNLOCKED' : 'LOCKED'),
        }));
        const shopState = {
            items: shopItems,
        };
        // Room State (Dynamic Unlocked Gadgets based on completed modules + shop items)
        const unlockedGadgets = curriculumModules_1.MODULE_ORDER.map((id) => {
            const b = curriculumModules_1.CURRICULUM_MODULES[id];
            const isCompleted = this.state.completedModuleIds.includes(id);
            return {
                ...b.gadget,
                isUnlocked: isCompleted,
            };
        });
        const roomState = {
            roomName: 'Mühendisin Arka Odası & Çalışma Masası',
            ambianceText: completedCount === 0
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
exports.sduiEngine = new SDUIEngineService();
