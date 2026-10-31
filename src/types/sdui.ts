export type TabType = 'shop' | 'skills' | 'workshop' | 'workbench' | 'room';

export type ModuleId = string;

export interface HudState {
  levelTitle: string; // "Lv.1 Bağımsız Mühendis"
  expPercentage: number; // 0 - 100
  classTitle: string; // "1. Sınıf - Algoritmalar & C Programlama"
  gold: number; // 🪙 Altın
  day: number; // Gün
  academicProgress: string; // "1. Sınıf: 2/4 Modül Tamamlandı"
}

export interface CustomerIssue {
  customerName: string;
  customerRole: string;
  dialogText: string;
  physicalSymptom: string;
  engineerDiagnosis: string;
  avatarKey: 'barnaby' | 'vane' | 'silas' | 'dorian';
}

export interface CodePatchOption {
  id: string;
  title: string;
  authorNote: string;
  isCorrect: boolean;
  codeDiff: {
    removed: string[];
    added: string[];
  };
  compilerOutcome: {
    success: boolean;
    exitCode: number;
    terminalOutput: string[];
    hardwareTempC: number;
    hardwareStatus: 'OPTIMAL' | 'OVERHEATING' | 'CRITICAL_FAULT';
    feedbackMessage: string;
  };
}

export interface WorkbenchModuleData {
  id: ModuleId;
  academicUnit: string; // "1. Sınıf // Ünite 1: Temel Mantık & Döngüler"
  deviceName: string; // "Pirinç Çark Devir Sayacı (Hydro-Tick 8)"
  deviceCode: string; // "MCU-HT8 // Seri #042"
  physicalSymptom: string;
  engineerDiagnosis: string;
  brokenCode: string;
  brokenCodeLines: { lineNumber: number; code: string; isFaulty?: boolean }[];
  patchOptions: CodePatchOption[];
  rewardGold: number;
  rewardExp: number;
  rewardItemName: string;
}

export interface WorkbenchState {
  activeModule: WorkbenchModuleData;
  availableModules: {
    id: ModuleId;
    title: string;
    isCompleted: boolean;
    isCurrent: boolean;
    isActiveWorkshopJob?: boolean;
  }[];
  selectedPatchId: string | null;
  inspectionStatus: 'ANALYZING' | 'TESTING' | 'REPAIRED' | 'OVERHEATING_FAILED';
  hasPendingWork: boolean;
  hardwareTelemetry: {
    temperatureC: number;
    voltageV: number;
    clockMhz: number;
    statusText: string;
  };
  terminalLogs: string[];
  lastTestSuccess?: boolean;
  isLoadingDynamicTask?: boolean;
}

export interface TaskRewardReport {
  gold: number;
  exp: number;
  deviceName: string;
  deviceCode: string;
  statusText: string;
}

export interface WorkshopState {
  customer: CustomerIssue;
  jobStatus: 'AVAILABLE' | 'IN_WORKBENCH' | 'READY_TO_DELIVER' | 'DELIVERED';
  activeModuleId: ModuleId;
  rewardReport: TaskRewardReport;
  hasNextModule: boolean;
}

export interface SkillNode {
  id: string;
  name: string;
  tier: string;
  status: 'UNLOCKED' | 'LOCKED';
  description: string;
  academicCredit: string;
  curriculumTopic: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
  taskProgress?: string;
  allowedTopics?: string[];
  forbiddenTopics?: string[];
}

export interface SkillsState {
  treeTitle: string;
  semesterTitle: string;
  nodes: SkillNode[];
}

export interface ShopItem {
  id: string;
  name: string;
  costGold: number;
  status: 'UNLOCKED' | 'LOCKED';
  category: string;
  description: string;
  iconName: string;
}

export interface ShopState {
  items: ShopItem[];
}

export interface RoomGadget {
  id: string;
  name: string;
  moduleId: ModuleId;
  isUnlocked: boolean;
  icon: string;
  description: string;
  hardwareSpec: string;
}

export interface RoomState {
  roomName: string;
  ambianceText: string;
  systemSpecs: {
    arch: string;
    kernel: string;
    compiler: string;
  };
  unlockedGadgets: RoomGadget[];
}

export interface SDUIState {
  activeTab: TabType;
  hud: HudState;
  workshop: WorkshopState;
  workbench: WorkbenchState;
  skills: SkillsState;
  shop: ShopState;
  room: RoomState;
}
