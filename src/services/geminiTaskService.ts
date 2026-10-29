import {
  ModuleId,
  CodePatchOption,
  CustomerIssue,
} from '../types/sdui';
import { CURRICULUM_MODULES } from '../data/curriculumModules';

// Expo ortam değişkenleri için process tanımı
declare const process: {
  env: {
    EXPO_PUBLIC_GROQ_API_KEY?: string;
    EXPO_PUBLIC_GEMINI_API_KEY?: string;
    [key: string]: string | undefined;
  };
};

/**
 * Dinamik Görev ve C Arıza Yükü Arayüzü
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
 * Dinamik Saha Görevleri için Zengin Mühendislik Konu Havuzu
 * Statik 4 sorunun tekrar etmesini engeller, her seferinde özgün C arızaları üretir.
 */
const DYNAMIC_ENGINEERING_TOPICS = [
  {
    topic: 'UART Seri İletişim & Baud Rate Senkronizasyonu',
    faultHint: 'Baud rate bölücü yazmacı yanlış hesaplanmış veya framing error / parity uyuşmazlığı var.',
    sampleDevice: 'Buhar Basınçlı Telgraf Alıcısı (Tele-Telegraph MCU)',
  },
  {
    topic: 'Dairesel Tampon (Ring Buffer) & Pointer Wrap-around',
    faultHint: 'Kuyruk başı ve sonu (head/tail) işaretçisi modülo aritmetiği olmadan artırılmış; komşu RAM ezilmiş.',
    sampleDevice: 'Kristal Bellek Sıra Kaydedicisi (Chronos-FIFO 8)',
  },
  {
    topic: 'I2C Donanım Yolu Zaman Aşımı (Timeout & ACK Check)',
    faultHint: 'I2C slave ACK bayrağı bekleme döngüsünde sonsuz while döngüsüne girilmiş; timeout sayacı eksik.',
    sampleDevice: 'Kazan Sıcaklık Osiloskobu (Thermo-Gauge 4)',
  },
  {
    topic: 'Watchdog Timer & Donanım Reset Kilitlenmesi',
    faultHint: 'Uzun süren hesaplama döngüsünde watchdog reset (WDT_reset) çağrılmamış, MCU sürekli yeniden başlıyor.',
    sampleDevice: 'Tahrik Pistonu Emniyet Valfi (Safety-Trip Valve)',
  },
  {
    topic: 'Bitwise Bayrak Maskeleme (Bitmask) & Yazmaç Yapılandırması',
    faultHint: 'Yazmaç bitini set ederken |= yerine = kullanılmış ve komşu donanım kontrol bitleri sıfırlanmış.',
    sampleDevice: 'Pirinç Jiroskop Dengeleyici (Aero-Gyro Mk.II)',
  },
  {
    topic: 'ADC Voltaj Referans Sapması & Tamsayı Bölme Hatası',
    faultHint: 'Tamsayı bölme (integer division) nedeniyle 0.0 değeri üretilmiş ya da 10-bit ADC 8-bit kaydırılarak veri kırpılmış.',
    sampleDevice: 'Voltaik Enerji Dağıtım Debimetresi (Galvano-Meter)',
  },
  {
    topic: 'DMA Çift Tamponlama & Yarış Durumu (Race Condition)',
    faultHint: 'DMA transferi devam ederken CPU aktif tampona doğrudan yazmaya kalkmış ve veri bozulmuş.',
    sampleDevice: 'Akustik Sonar Frekans Algılayıcı (Echo-Pinger 16)',
  },
  {
    topic: 'SPI EEPROM Sayfa Sınırı Taşması (Page Boundary Overflow)',
    faultHint: 'EEPROM 32-byte sayfa sınırını aşan yazma işleminde adres başa sarmış ve eski kalibrasyon verisini ezmiş.',
    sampleDevice: 'Makinist Seyir Defteri Kartuşu (Log-Cartridge ROM)',
  },
];

/**
 * Groq API (openai/gpt-oss-120b) Gömülü C Arıza & Görev Üretici Servisi
 *
 * Uç Nokta: https://api.groq.com/openai/v1/chat/completions
 * Ortam Değişkeni: EXPO_PUBLIC_GROQ_API_KEY
 * Model: openai/gpt-oss-120b
 */
class GeminiTaskService {
  private readonly modelName: string = 'openai/gpt-oss-120b';
  private readonly baseUrl: string = 'https://api.groq.com/openai/v1/chat/completions';

  /**
   * API anahtarını alır (Öncelik: EXPO_PUBLIC_GROQ_API_KEY)
   */
  private getApiKey(): string | undefined {
    return process.env.EXPO_PUBLIC_GROQ_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  }

  /**
   * API anahtarının tanımlı olup olmadığını denetler
   */
  public isApiKeyConfigured(): boolean {
    const key = this.getApiKey();
    return typeof key === 'string' && key.trim().length > 0;
  }

  /**
   * Statik müfredat modülünü GeminiTaskPayload formatında döndürür (Zarif Fallback)
   */
  public getStaticFallbackTask(moduleId: ModuleId): GeminiTaskPayload {
    const baseKeys = ['module_1_loops', 'module_2_memory', 'module_3_structs', 'module_4_testing'];
    let templateKey = moduleId;
    if (!CURRICULUM_MODULES[moduleId]) {
      const match = moduleId.match(/\d+/);
      const idx = match ? (parseInt(match[0], 10) - 1) % baseKeys.length : 0;
      templateKey = baseKeys[idx] || 'module_1_loops';
    }
    const bundle = CURRICULUM_MODULES[templateKey] || CURRICULUM_MODULES.module_1_loops;

    const isDynamic = moduleId.startsWith('dynamic_task_');
    const deviceName = isDynamic
      ? `[CANLI AI] ${bundle.moduleData.deviceName} (Yedek Saha)`
      : bundle.moduleData.deviceName;

    return {
      moduleId,
      academicUnit: bundle.moduleData.academicUnit,
      deviceName,
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
   * Groq API üzerinden canlı dinamik görev üretir
   */
  public async fetchDynamicTask(
    moduleId: ModuleId,
    classLevel: number = 1,
    stageProgress: number = 0
  ): Promise<GeminiTaskPayload> {
    const apiKey = this.getApiKey();

    if (!apiKey || apiKey.trim().length === 0) {
      console.warn(
        `[TaskService: Groq] EXPO_PUBLIC_GROQ_API_KEY bulunamadı. Yerel statik modüle dönülüyor (${moduleId}).`
      );
      return this.getStaticFallbackTask(moduleId);
    }

    const fallback = this.getStaticFallbackTask(moduleId);
    const isDynamicTask = moduleId.startsWith('dynamic_task_');

    // Dinamik görevlerde statik 4 soruyu referans verme; özgün konu havuzundan seç
    const topicIndex = Math.floor(Math.random() * DYNAMIC_ENGINEERING_TOPICS.length);
    const selectedTopic = DYNAMIC_ENGINEERING_TOPICS[topicIndex];

    const systemPrompt = `Beklenen JSON Şablonu:
{"academicUnit": "...", "deviceName": "...", "deviceCode": "...", "customer": {"name":"...","role":"...","quote":"...","dialogue":"..."}, "brokenCode": "...", "brokenCodeLines": [{"lineNumber": 1, "code": "...", "isFaulty": false}], "patchOptions": [{"id": "patch_1", "title": "...", "explanation": "...", "diff": {"removed": ["while (rotation <= 64) {"], "added": ["while (rotation < 64) {"]}, "isCorrect": true, "telemetrySnippet": "..."}], "rewardGold": 75, "rewardExp": 25, "rewardItemName": "..."}

Sen Magitek Atölyesi'nin Kıdemli Baş Mühendisisin.
Görevin: 1. sınıf Bilgisayar Mühendisliği ve Gömülü C Programlama müfredatına (C11, AVR-GCC, mikrodenetleyici donanımları, yazmaçlar, işaretçiler, tamponlar, döngüler, bellek yönetimi) uygun, Steampunk ve Cozy Magitek estetiğine sahip arızalı gömülü C kodları ve 3 adet Git Diff yaması üreten bir sistem gibi çalışmaktır.
Daima ve SADECE yukarıdaki şablona uyan geçerli bir JSON nesnesi dönmelisin. Yanıtında JSON dışında hiçbir metin, markdown veya açıklama bulunmamalıdır.

DİL ZORUNLULUĞU: C kodunun değişken isimleri ve C standart kütüphane çağrıları hariç, ÜRETİLEN TÜM METİNLER (customer diyalogları, hata açıklamaları, C kodu içindeki yorum satırları //, 'patchOptions' altındaki 'title', 'explanation' ve 'telemetrySnippet' alanları) KESİNLİKLE VE İSTİSNASIZ TÜRKÇE OLMALIDIR. İngilizce açıklama yazmak KESİNLİKLE YASAKTIR.

DİKKAT: 'patchOptions' içindeki 'diff.removed' dizisi, 'brokenCode' içinde yer alan ve arızaya sebep olan gerçek C satırını/satırlarını birebir içermelidir. 'diff.added' dizisi ise bu hatayı gideren geçerli C kodunu içermelidir. '// Hatali satir', '// Duzeltilmis satir' gibi soyut yorumlar veya yer tutucu metinler yazmak KESİNLİKLE YASAKTIR.

DİKKAT: C kodunu JSON içine yerleştirirken string kaçışlarına (escaping) azami dikkat et. Çift tırnak yerine gerektiğinde tek tırnak kullan veya tırnakları standart JSON uyumlu kaçır. Asla fazladan çift ters eğik çizgi (\\\\) üretme. Yalnızca RFC 8259 uyumlu saf JSON üret.
DİKKAT: 'patchOptions' dizisi KESİNLİKLE tam olarak 3 elemandan oluşmalıdır. Şık başlıklarına (title) ASLA '(Doğru)', '(Yanlış)' gibi cevabı ele veren ibareler yazma; şıklar nötr teknik ifadeler olmalıdır.`;

    const userPrompt = isDynamicTask
      ? `
DİKKAT: Bize daha önceki statik görevlerden (Pirinç Çark, Su Türbini, Tahıl Ambarı vb.) TAMAMEN FARKLI, YEPYENİ VE ÖZGÜN bir gömülü sistem C arızası ve buna ait bozuk C kodu üret!
Statik eski cihazları ve konuları KESİNLİKLE tekrar etme.

- Görev Türü: SAHA MÜHENDİSLİĞİ DİNAMİK ARIZASI #${stageProgress || 5}
- Hedef Mühendislik Konusu: "${selectedTopic.topic}"
- Kök Neden / İpucu: "${selectedTopic.faultHint}"
- Cihaz İlhamı: "${selectedTopic.sampleDevice}" (veya benzeri yaratıcı bir Magitek cihazı adı uydur)
- Dil Standardı: C11 (AVR-GCC gömülü C)

DİL ZORUNLULUĞU: C kodunun değişken isimleri ve C standart kütüphane çağrıları hariç, ÜRETİLEN TÜM METİNLER (customer diyalogları, hata açıklamaları, C kodu içindeki yorum satırları //, 'patchOptions' altındaki 'title', 'explanation' ve 'telemetrySnippet' alanları) KESİNLİKLE VE İSTİSNASIZ TÜRKÇE OLMALIDIR. İngilizce açıklama yazmak KESİNLİKLE YASAKTIR.
- 'brokenCode': Kod içerisindeki yorum satırları (//) mutlaka TÜRKÇE olmalıdır.
- 'patchOptions': KESİNLİKLE tam olarak 3 elemandan oluşmalıdır. Şık başlıklarına (title) ASLA '(Doğru)', '(Yanlış)' gibi cevabı ele veren ibareler yazma; şıklar nötr teknik ifadeler olmalıdır.
  * 'explanation': Yamanın ne yaptığını anlatan 1-2 cümlelik TEKNİK TÜRKÇE açıklama (Örn: 'Dizi sınır kontrolü eklenerek taşma engellenir'). ASLA İngilizce yazma.
  * 'telemetrySnippet': Donanımın çalışma durumunu anlatan TÜRKÇE telemetri notu (Örn: 'Nominal döngü: Sıcaklık 36°C' veya 'Kritik aşırı ısınma: 84°C').
  * 'diff.removed': 'brokenCode' içindeki arızalı C kod satırını/satırlarını birebir içermelidir.
  * 'diff.added': Uygulanan gerçek C kodunu içermelidir.

DİKKAT: 'patchOptions' içindeki 'diff.removed' dizisi, 'brokenCode' içinde yer alan ve arızaya sebep olan gerçek C satırını/satırlarını birebir içermelidir. 'diff.added' dizisi ise bu hatayı gideren geçerli C kodunu içermelidir. '// Hatali satir', '// Duzeltilmis satir' gibi soyut yorumlar veya yer tutucu metinler yazmak KESİNLİKLE YASAKTIR.

DİKKAT: C kodunu JSON içine yerleştirirken string kaçışlarına (escaping) azami dikkat et. Çift tırnak yerine gerektiğinde tek tırnak kullan veya tırnakları standart JSON uyumlu kaçır. Asla fazladan çift ters eğik çizgi (\\\\) üretme. Yalnızca RFC 8259 uyumlu saf JSON üret.

Lütfen SADECE aşağıdaki JSON şemasına BİREBİR uyan geçerli bir JSON nesnesi döndür:
{
  "academicUnit": "Saha Mühendisliği // ${selectedTopic.topic}",
  "deviceName": "Magitek/Steampunk temalı özgün cihaz adı (Türkçe)",
  "deviceCode": "Seri Kodu (Örn: MCU-UART4, FIFO-CR8, ADC-VOLT1)",
  "customer": {
    "name": "Makinist veya Usta Adı (Türkçe)",
    "role": "Görevi (Türkçe, Örn: Kıdemli Buhar Teknisyeni)",
    "quote": "Fiziksel arıza belirtisi (Türkçe)",
    "dialogue": "Ayrıntılı teknik arıza diyalogu (Türkçe)"
  },
  "brokenCode": "10-15 satırlık, C11 standardında, arızayı içeren ve yorum satırları (//) kesinlikle Türkçe olan C fonksiyonu",
  "brokenCodeLines": [
    { "lineNumber": 1, "code": "...", "isFaulty": false },
    { "lineNumber": 2, "code": "...", "isFaulty": true }
  ],
  "patchOptions": [
    {
      "id": "patch_1",
      "title": "Döngü Koşulunu ve Sınır Kontrolünü Düzelt",
      "explanation": "Dizi sınır kontrolü eklenerek bellek taşması ve segmentasyon hatası engellenir.",
      "diff": {
        "removed": ["while (rotation <= 64) {"],
        "added": ["while (rotation < 64) {"]
      },
      "isCorrect": true,
      "telemetrySnippet": "Nominal çalışma parametresi: Basınç döngüsü kararlı (36°C)"
    },
    {
      "id": "patch_2",
      "title": "Zamanlayıcı Kesmesini Devre Dışı Bırak",
      "explanation": "Kesmenin kapatılması saat senkronizasyonunu bozar ve aşırı ısınmaya yol açar.",
      "diff": {
        "removed": ["TIMSK0 |= (1 << TOIE0);"],
        "added": ["TIMSK0 &= ~(1 << TOIE0);"]
      },
      "isCorrect": false,
      "telemetrySnippet": "Aşırı ısınma ve saat senkronizasyonu kaybı (84°C)"
    },
    {
      "id": "patch_3",
      "title": "Yazmaç Değerini Doğrudan Sıfırla",
      "explanation": "Yazmacın doğrudan sıfırlanması komşu donanım kontrol bitlerini siler ve kilitlenmeye neden olur.",
      "diff": {
        "removed": ["PORTB |= (1 << PB2);"],
        "added": ["PORTB = 0x00;"]
      },
      "isCorrect": false,
      "telemetrySnippet": "Segmentasyon hatası ve bellek erişim ihlali (SIGSEGV)"
    }
  ],
  "rewardGold": ${80 + (stageProgress % 5) * 10},
  "rewardExp": ${30 + (stageProgress % 3) * 5},
  "rewardItemName": "Pirinç Telemetri Kartı"
}
`
      : `
Lütfen aşağıdaki parametrelere göre arızalı bir Magitek gömülü cihazı ve C11 kodu üret:
- Modül Kimliği: "${moduleId}"
- Sınıf Düzeyi: ${classLevel}. Sınıf Bilgisayar Mühendisliği
- Mevcut İlerleme Aşaması: ${stageProgress}
- Referans Konu: "${fallback.academicUnit}"
- Referans Donanım: "${fallback.deviceName}" (${fallback.deviceCode})

DİL ZORUNLULUĞU: C kodunun değişken isimleri ve C standart kütüphane çağrıları hariç, ÜRETİLEN TÜM METİNLER (customer diyalogları, hata açıklamaları, C kodu içindeki yorum satırları //, 'patchOptions' altındaki 'title', 'explanation' ve 'telemetrySnippet' alanları) KESİNLİKLE VE İSTİSNASIZ TÜRKÇE OLMALIDIR. İngilizce açıklama yazmak KESİNLİKLE YASAKTIR.
- 'brokenCode': Kod içerisindeki yorum satırları (//) mutlaka TÜRKÇE olmalıdır.
- 'patchOptions': KESİNLİKLE tam olarak 3 elemandan oluşmalıdır. Şık başlıklarına (title) ASLA '(Doğru)', '(Yanlış)' gibi cevabı ele veren ibareler yazma; şıklar nötr teknik ifadeler olmalıdır.
  * 'explanation': Yamanın ne yaptığını anlatan 1-2 cümlelik TEKNİK TÜRKÇE açıklama (Örn: 'Dizi sınır kontrolü eklenerek taşma engellenir'). ASLA İngilizce yazma.
  * 'telemetrySnippet': Donanımın çalışma durumunu anlatan TÜRKÇE telemetri notu (Örn: 'Nominal döngü: Sıcaklık 36°C' veya 'Kritik aşırı ısınma: 84°C').
  * 'diff.removed': 'brokenCode' içindeki arızalı C kod satırını/satırlarını birebir içermelidir.
  * 'diff.added': Uygulanan gerçek C kodunu içermelidir.

DİKKAT: 'patchOptions' içindeki 'diff.removed' dizisi, 'brokenCode' içinde yer alan ve arızaya sebep olan gerçek C satırını/satırlarını birebir içermelidir. 'diff.added' dizisi ise bu hatayı gideren geçerli C kodunu içermelidir. '// Hatali satir', '// Duzeltilmis satir' gibi soyut yorumlar veya yer tutucu metinler yazmak KESİNLİKLE YASAKTIR.

DİKKAT: C kodunu JSON içine yerleştirirken string kaçışlarına (escaping) azami dikkat et. Çift tırnak yerine gerektiğinde tek tırnak kullan veya tırnakları standart JSON uyumlu kaçır. Asla fazladan çift ters eğik çizgi (\\\\) üretme. Yalnızca RFC 8259 uyumlu saf JSON üret.

Lütfen SADECE aşağıdaki JSON şemasına BİREBİR uyan geçerli bir JSON nesnesi döndür:
{
  "academicUnit": "${fallback.academicUnit}",
  "deviceName": "${fallback.deviceName}",
  "deviceCode": "${fallback.deviceCode}",
  "customer": {
    "name": "${fallback.customer.customerName}",
    "role": "${fallback.customer.customerRole}",
    "quote": "${fallback.customer.physicalSymptom}",
    "dialogue": "${fallback.customer.dialogText}"
  },
  "brokenCode": "10-15 satırlık, yorum satırları (//) kesinlikle Türkçe olan C11 fonksiyonu",
  "brokenCodeLines": [
    { "lineNumber": 1, "code": "...", "isFaulty": false }
  ],
  "patchOptions": [
    {
      "id": "patch_1",
      "title": "Bellek Ayrımını ve İşaretçiyi Güvenceye Al",
      "explanation": "İşaretçi sınırı denetlenerek bellek taşması engellenir ve güvenli adresleme sağlanır.",
      "diff": {
        "removed": ["char *ptr = buffer + len;"],
        "added": ["if (len >= MAX_LEN) return -1;", "char *ptr = buffer + len;"]
      },
      "isCorrect": true,
      "telemetrySnippet": "Nominal çalışma: Cihaz kararlı durumda (36°C)"
    },
    {
      "id": "patch_2",
      "title": "Giriş Tampon Kapasitesini İkiye Katla",
      "explanation": "Kapasite artışı dinamik RAM sınırını aştığından yığın taşmasına neden olur.",
      "diff": {
        "removed": ["#define BUF_SIZE 64"],
        "added": ["#define BUF_SIZE 128"]
      },
      "isCorrect": false,
      "telemetrySnippet": "Aşırı ısınma ve yığın taşması (84°C)"
    },
    {
      "id": "patch_3",
      "title": "Donanım Saat Frekansını Azalt",
      "explanation": "Frekansın düşürülmesi işlemcinin veri akışına yetişememesine ve kilitlenmesine yol açar.",
      "diff": {
        "removed": ["CLKPR = (1 << CLKPCE);"],
        "added": ["CLKPR = (1 << CLKPS0) | (1 << CLKPS1);"]
      },
      "isCorrect": false,
      "telemetrySnippet": "Zaman aşımı ve kilitlenme (Watchdog Reset)"
    }
  ],
  "rewardGold": ${fallback.rewardGold},
  "rewardExp": ${fallback.rewardExp},
  "rewardItemName": "${fallback.rewardItemName}"
}
`;

    const requestBody = {
      model: this.modelName,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    };

    console.log('>>> [TaskService: Groq] Görev isteği atılıyor:', moduleId);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status} (${response.statusText}): ${errBody}`);
      }

      const json = await response.json();
      const rawText = json?.choices?.[0]?.message?.content;

      if (!rawText) {
        throw new Error('Groq API yanıtında metin içeriği bulunamadı.');
      }

      let cleanText = rawText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanText);

      console.log('>>> [TaskService: Groq] BAŞARILI! Cihaz:', parsed.deviceName);

      // Canlı AI üretimi olduğunu açıkça vurgula
      let deviceName = parsed.deviceName || fallback.deviceName;
      if (!deviceName.includes('[CANLI AI]')) {
        deviceName = `[CANLI AI] ${deviceName}`;
      }

      const customer: CustomerIssue = {
        customerName: parsed.customer?.name || fallback.customer.customerName,
        customerRole: parsed.customer?.role || fallback.customer.customerRole,
        dialogText: parsed.customer?.dialogue || fallback.customer.dialogText,
        physicalSymptom: parsed.customer?.quote || fallback.customer.physicalSymptom,
        engineerDiagnosis: `Teknik Kök Neden Analizi: ${parsed.customer?.quote || fallback.customer.engineerDiagnosis}`,
        avatarKey: fallback.customer.avatarKey,
      };

      let brokenCodeLines = parsed.brokenCodeLines;
      if (!Array.isArray(brokenCodeLines) || brokenCodeLines.length === 0) {
        const lines = (parsed.brokenCode || fallback.brokenCode).split('\n');
        brokenCodeLines = lines.map((code: string, idx: number) => ({
          lineNumber: idx + 1,
          code,
          isFaulty: false,
        }));
      }

      // Arızalı C satırını tespit et (isFaulty: true olan satır, yoksa arıza içerebilecek satır)
      let faultyLineObj = brokenCodeLines.find((l: any) => l.isFaulty);
      if (!faultyLineObj && brokenCodeLines.length > 0) {
        faultyLineObj = brokenCodeLines.find((l: any) =>
          /(\+\+|--|<=|>=|==|!=|while|for|if|buf|ptr|malloc|free|<<|>>)/.test(l.code)
        ) || brokenCodeLines[Math.min(1, brokenCodeLines.length - 1)];
      }
      const faultyCode = faultyLineObj?.code ? faultyLineObj.code.trim() : 'while (rotation <= 64) {';

      // 1. Şık listesini al ve kesinlikle 3 elemana normalize et
      let rawPatchOptions: any[] = Array.isArray(parsed.patchOptions) && parsed.patchOptions.length > 0
        ? [...parsed.patchOptions]
        : [...fallback.patchOptions];

      // Eğer 3'ten fazlaysa ilk 3'ü al
      if (rawPatchOptions.length > 3) {
        rawPatchOptions = rawPatchOptions.slice(0, 3);
      }

      // Eğer 3'ten azsa somut C kodu içeren alternatif seçeneklerle 3'e tamamla
      const fakeOptionFallbacks = [
        {
          id: 'patch_extra_1',
          title: 'Zamanlayıcı Frekansını 2 Katına Çıkar',
          explanation: 'Frekans artışı donanımın aşırı ısınmasına ve saat senkronizasyonunun bozulmasına yol açar.',
          diff: {
            removed: [faultyCode],
            added: ['TCCR0B = (1 << CS01); /* Frekans çarpanı 2x artırıldı (Hatalı) */'],
          },
          isCorrect: false,
          telemetrySnippet: 'Aşırı ısınma ve saat senkronizasyonu kaybı (84°C)',
        },
        {
          id: 'patch_extra_2',
          title: 'Giriş Tampon Kapasitesini Sıfırla',
          explanation: 'Tamponun sıfırlanması veri akışını keser ve veri kaybına neden olur.',
          diff: {
            removed: [faultyCode],
            added: ['memset(buffer, 0, sizeof(buffer)); /* Tampon sıfırlandı (Hatalı) */'],
          },
          isCorrect: false,
          telemetrySnippet: 'Tampon boşaltma hatası ve veri kaybı (139)',
        },
      ];

      while (rawPatchOptions.length < 3) {
        const fake = fakeOptionFallbacks[rawPatchOptions.length % fakeOptionFallbacks.length];
        rawPatchOptions.push({
          ...fake,
          id: `patch_fake_${rawPatchOptions.length + 1}`,
        });
      }

      // Yer tutucu (placeholder) kontrol fonksiyonu
      const isPlaceholderLine = (line: any): boolean => {
        if (!line || typeof line !== 'string') return true;
        const trimmed = line.trim();
        if (trimmed.length === 0) return true;
        return (
          /^\/\/\s*(hatal[ıi]|d[üu]zeltilmi[şs]|yer\s*tutucu|placeholder|removed|added|sat[ıi]r|line|degisiklik|değişiklik)/i.test(
            trimmed
          ) ||
          /^(\/\/|\/\*)\s*(hatalı|hatali|düzeltilmiş|duzeltilmis|placeholder|removed|added)/i.test(
            trimmed
          )
        );
      };

      // 2. Başlıklardan ipuçlarını temizle, diff yer tutucularını somut C koduna çevir ve CodePatchOption nesnesine dönüştür
      const patchOptions: CodePatchOption[] = rawPatchOptions.map((opt: any, index: number) => {
        const isCorrect = Boolean(opt.isCorrect);
        const deviceCode = parsed.deviceCode || fallback.deviceCode;
        const telemetry = opt.telemetrySnippet || (isCorrect ? 'Cihaz nominal döngüde çalışıyor.' : 'Cihaz aşırı ısındı!');

        const rawTitle = typeof opt.title === 'string' ? opt.title : `Yama #${index + 1}`;
        const cleanTitle = rawTitle
          .replace(/\s*\((doğru|yanlış|hatalı|iptal|correct|incorrect|false|true)[^)]*\)/gi, '')
          .replace(/\s*\[(doğru|yanlış|hatalı|iptal|correct|incorrect|false|true)[^\]]*\]/gi, '')
          .trim() || `Yama #${index + 1}`;

        // diff.removed doğrulaması ve yer tutucu sanitizasyonu
        let removedDiff: string[] = Array.isArray(opt.diff?.removed) ? opt.diff.removed : [];
        const hasRealRemovedCode = removedDiff.some((line: string) => !isPlaceholderLine(line));

        if (!hasRealRemovedCode || removedDiff.length === 0) {
          // Model yer tutucu döndüyse veya boş bıraktıysa, arızalı satırın kodunu doğrudan diff.removed yap
          removedDiff = [faultyCode];
        } else {
          removedDiff = removedDiff.filter((line: string) => !isPlaceholderLine(line));
          if (removedDiff.length === 0) {
            removedDiff = [faultyCode];
          }
        }

        // diff.added doğrulaması ve yer tutucu sanitizasyonu
        let addedDiff: string[] = Array.isArray(opt.diff?.added) ? opt.diff.added : [];
        const hasRealAddedCode = addedDiff.some((line: string) => !isPlaceholderLine(line));

        if (!hasRealAddedCode || addedDiff.length === 0) {
          addedDiff = isCorrect
            ? [faultyCode.replace(/<=/g, '<').replace(/\+\+/g, '+= 1') || '/* Düzeltme uygulandı */']
            : ['/* Hatalı alternatif yama uygulandı */'];
        } else {
          addedDiff = addedDiff.filter((line: string) => !isPlaceholderLine(line));
          if (addedDiff.length === 0) {
            addedDiff = isCorrect
              ? [faultyCode.replace(/<=/g, '<').replace(/\+\+/g, '+= 1') || '/* Düzeltme uygulandı */']
              : ['/* Hatalı alternatif yama uygulandı */'];
          }
        }

        return {
          id: opt.id || `patch_${index + 1}`,
          title: cleanTitle,
          authorNote: opt.explanation || 'Teknik yama analizi.',
          isCorrect,
          codeDiff: {
            removed: removedDiff,
            added: addedDiff,
          },
          compilerOutcome: {
            success: isCorrect,
            exitCode: isCorrect ? 0 : 139,
            terminalOutput: isCorrect
              ? [
                `[CC] avr-gcc -Wall -Wextra -std=c11 -O2 -c firmware.c`,
                `[LD] avr-ld firmware.o -o firmware.elf`,
                `[TEST] TEST HARNESS KOŞULUYOR: ${deviceCode}...`,
                `[TEST] Telemetri Okuma: BAŞARILI [PASS]`,
                `[TELEMETRİ] ${telemetry}`,
                `[SONUÇ] TEST TAMAMLANDI: 0 Hata, Çıkış Kodu: 0`,
              ]
              : [
                `[CC] avr-gcc -Wall -Wextra -std=c11 -O2 -c firmware.c`,
                `[HATA] Mantıksal ihlal veya çalışma zamanı hatası tespit edildi!`,
                `[TEST] TEST HARNESS KOŞULUYOR: ${deviceCode}...`,
                `[TEST] FAIL: Beklenmeyen değer / Segment ihlali (SIGSEGV / Buffer Fault)`,
                `[UYARI] ${telemetry}`,
                `[SONUÇ] TEST BAŞARISIZ: Çıkış Kodu: 139`,
              ],
            hardwareTempC: isCorrect ? 36 : 84,
            hardwareStatus: isCorrect ? 'OPTIMAL' : 'OVERHEATING',
            feedbackMessage: isCorrect
              ? `Doğrulama Başarılı! ${telemetry}`
              : `Donanım Hatası! ${telemetry}`,
          },
        };
      });

      // 3. Şıkları Fisher-Yates algoritması ile rastgele karıştır (Shuffle)
      // Böylece doğru cevap her zaman en üstte (0. indekste) çıkmaz!
      for (let i = patchOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [patchOptions[i], patchOptions[j]] = [patchOptions[j], patchOptions[i]];
      }

      return {
        moduleId,
        academicUnit: parsed.academicUnit || fallback.academicUnit,
        deviceName,
        deviceCode: parsed.deviceCode || fallback.deviceCode,
        customer,
        brokenCode: parsed.brokenCode || fallback.brokenCode,
        brokenCodeLines,
        patchOptions,
        rewardGold: typeof parsed.rewardGold === 'number' ? parsed.rewardGold : fallback.rewardGold,
        rewardExp: typeof parsed.rewardExp === 'number' ? parsed.rewardExp : fallback.rewardExp,
        rewardItemName: parsed.rewardItemName || fallback.rewardItemName,
        isDynamic: true,
      };
    } catch (error) {
      console.error('>>> [TaskService: Groq] HATA DETAYI:', error);
      return fallback;
    }
  }

  /**
   * Geriye dönük uyumluluk için alias fonksiyon
   */
  public async generateTask(
    moduleId: ModuleId,
    _customTopicDirective?: string
  ): Promise<GeminiTaskPayload> {
    return this.fetchDynamicTask(moduleId);
  }
}

export const geminiTaskService = new GeminiTaskService();
