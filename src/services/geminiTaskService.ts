import {
  ModuleId,
  CodePatchOption,
  CustomerIssue,
} from '../types/sdui';
import { CURRICULUM_MODULES } from '../data/curriculumModules';

// Expo ortam değişkenleri için process tanımı
declare const process: {
  env: {
    EXPO_PUBLIC_GEMINI_API_KEY?: string;
    [key: string]: string | undefined;
  };
};

/**
 * Gemini API Entegrasyonu için Dinamik Görev ve C Arıza Yükü
 */
export interface GeminiTaskPayload {
  moduleId: ModuleId;
  academicUnit: string;
  deviceName: string;
  deviceCode: string;
  customer: CustomerIssue;
  brokenCode: string;
  brokenCodeLines: { lineNumber: number; code: string; isFaulty?: boolean }[];
  patchOptions: CodePatchOption[];
  rewardGold: number;
  rewardExp: number;
  rewardItemName: string;
  isDynamic: boolean;
}

/**
 * Gemini AI Studio Gömülü C Arıza & Görev Üretici Servisi
 *
 * Ortam Değişkeni: EXPO_PUBLIC_GEMINI_API_KEY
 * - API Anahtarı mevcutsa: Google AI Studio Gemini API üzerinden dinamik C arızası ve test harness üretir.
 * - API Anahtarı eksik veya ağ hatası durumunda: Mevcut zengin Magitek müfredatına zarifçe geri döner (graceful fallback).
 */
class GeminiTaskService {
  private apiKey: string | undefined;
  private readonly modelName: string = 'gemini-1.5-flash';
  private readonly baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  }

  /**
   * Gemini API anahtarının tanımlı olup olmadığını denetler
   */
  public isApiKeyConfigured(): boolean {
    return typeof this.apiKey === 'string' && this.apiKey.trim().length > 0;
  }

  /**
   * Statik müfredat modülünü GeminiTaskPayload formatında döndürür (Fallback)
   */
  public getStaticFallbackTask(moduleId: ModuleId): GeminiTaskPayload {
    const bundle = CURRICULUM_MODULES[moduleId] || CURRICULUM_MODULES.module_1_loops;
    return {
      moduleId,
      academicUnit: bundle.moduleData.academicUnit,
      deviceName: bundle.moduleData.deviceName,
      deviceCode: bundle.moduleData.deviceCode,
      customer: bundle.customer,
      brokenCode: bundle.moduleData.brokenCode,
      brokenCodeLines: bundle.moduleData.brokenCodeLines,
      patchOptions: bundle.moduleData.patchOptions,
      rewardGold: bundle.moduleData.rewardGold,
      rewardExp: bundle.moduleData.rewardExp,
      rewardItemName: bundle.moduleData.rewardItemName,
      isDynamic: false,
    };
  }

  /**
   * Dinamik görev üretir ya da API anahtarı yoksa statik yedeğe döner
   */
  public async generateTask(
    moduleId: ModuleId,
    customTopicDirective?: string
  ): Promise<GeminiTaskPayload> {
    if (!this.isApiKeyConfigured()) {
      // Graceful Fallback: API anahtarı yoksa sessizce ve güvenle statik veriyi kullan
      return this.getStaticFallbackTask(moduleId);
    }

    try {
      const prompt = this.buildPrompt(moduleId, customTopicDirective);
      const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini API yanıtında metin içeriği bulunamadı.');
      }

      const parsedData = JSON.parse(rawText) as Partial<GeminiTaskPayload>;

      // Yanıtı doğrula ve eksik alanları statik şablonla tamamla
      const fallback = this.getStaticFallbackTask(moduleId);
      return {
        moduleId,
        academicUnit: parsedData.academicUnit || fallback.academicUnit,
        deviceName: parsedData.deviceName || fallback.deviceName,
        deviceCode: parsedData.deviceCode || fallback.deviceCode,
        customer: parsedData.customer || fallback.customer,
        brokenCode: parsedData.brokenCode || fallback.brokenCode,
        brokenCodeLines: parsedData.brokenCodeLines || fallback.brokenCodeLines,
        patchOptions: parsedData.patchOptions || fallback.patchOptions,
        rewardGold: parsedData.rewardGold || fallback.rewardGold,
        rewardExp: parsedData.rewardExp || fallback.rewardExp,
        rewardItemName: parsedData.rewardItemName || fallback.rewardItemName,
        isDynamic: true,
      };
    } catch (error) {
      console.warn(
        `[GeminiTaskService] API isteği başarısız oldu, yerel statik modüle dönülüyor (${moduleId}):`,
        error
      );
      return this.getStaticFallbackTask(moduleId);
    }
  }

  /**
   * Mühendislik modülüne uygun Magitek C istemi oluşturur
   */
  private buildPrompt(moduleId: ModuleId, directive?: string): string {
    const fallback = this.getStaticFallbackTask(moduleId);
    return `
Sen Magitek Workshop için 1. Sınıf Bilgisayar Mühendisliği ve Gömülü C programlama simülasyonu üreten bir yapay zekasın.
Tema: Cozy Magitek / Steampunk (Buhar, pirinç dişliler, analog osiloskoplar, AVR-GCC C11).
Modül Kimliği: "${moduleId}".
Akademik Konu: "${fallback.academicUnit}".
${directive ? `Ek Yönerge: "${directive}"` : ''}

Lütfen şu JSON şemasına BİREBİR uyan geçerli bir JSON nesnesi üret:
{
  "academicUnit": "${fallback.academicUnit}",
  "deviceName": "Cihazın Adı (Magitek temalı)",
  "deviceCode": "Seri Kodu (Örn: MCU-HT8)",
  "customer": {
    "customerName": "Usta / Makinist Adı",
    "customerRole": "Görevi",
    "dialogText": "Teknik arızayı anlatan diyalog",
    "physicalSymptom": "Fiziksel donanım belirtisi",
    "engineerDiagnosis": "Mühendislik kök neden analizi",
    "avatarKey": "${fallback.customer.avatarKey}"
  },
  "brokenCode": "C11 dilinde yazılmış, 10-15 satırlık bozuk gömülü C fonksiyonu",
  "brokenCodeLines": [
    { "lineNumber": 1, "code": "...", "isFaulty": false }
  ],
  "patchOptions": [
    {
      "id": "patch_correct",
      "title": "Doğru Yama Başlığı",
      "authorNote": "Teknik yazar notu",
      "isCorrect": true,
      "codeDiff": { "removed": ["..."], "added": ["..."] },
      "compilerOutcome": {
        "success": true,
        "exitCode": 0,
        "terminalOutput": ["[CC] gcc ...", "[TEST] ... [PASS]"],
        "hardwareTempC": 36,
        "hardwareStatus": "OPTIMAL",
        "feedbackMessage": "Tebrikler!"
      }
    },
    {
      "id": "patch_faulty",
      "title": "Hatalı Yama Başlığı",
      "authorNote": "Neden hatalı olduğunu açıklayan not",
      "isCorrect": false,
      "codeDiff": { "removed": ["..."], "added": ["..."] },
      "compilerOutcome": {
        "success": false,
        "exitCode": 139,
        "terminalOutput": ["[CC] gcc ...", "[HATA] SIGSEGV"],
        "hardwareTempC": 85,
        "hardwareStatus": "OVERHEATING",
        "feedbackMessage": "Aşırı ısındı!"
      }
    }
  ],
  "rewardGold": ${fallback.rewardGold},
  "rewardExp": ${fallback.rewardExp},
  "rewardItemName": "${fallback.rewardItemName}"
}
JSON dışında hiçbir metin, markdown veya açıklama yazma.
`;
  }
}

export const geminiTaskService = new GeminiTaskService();
