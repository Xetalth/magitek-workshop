import {
  ModuleId,
  CodePatchOption,
  CustomerIssue,
} from '../types/sdui';
import { CURRICULUM_MODULES, getModuleTaskFromPool, shufflePatchOptions } from '../data/curriculumModules';
import {
  PEDAGOGICAL_MODULES,
  CurriculumModuleId,
} from '../data/curriculumData';
import { PedagogicalModule } from '../types/curriculum';

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
 * Samsun Üniversitesi Yazılım Mühendisliği 1. Sınıf Müfredatı (YZM101, YZM105, YZM102, YZM104)
 * Modül bazlı pedagojik konu havuzu (Pedagogical Guardrails)
 */
const MODULE_PEDAGOGICAL_TOPICS: Record<
  CurriculumModuleId,
  { topic: string; faultHint: string; sampleDevice: string }[]
> = {
  module_1_control: [
    {
      topic: 'Döngü Sınır Hatası & Off-by-One (for/while)',
      faultHint: 'for döngüsünde <= yerine < kullanılmalı; sınır 1 fazla çalışıp taşmaya yol açıyor.',
      sampleDevice: 'Pirinç Çark Devir Sayacı (Hydro-Tick 8)',
    },
    {
      topic: 'Sonsuz Döngü & Bayrak Güncelleme Hatası',
      faultHint: 'while döngü koşulu içindeki sayaç artırımı unutulmuş; işlemci kilitlenip aşırı ısınıyor.',
      sampleDevice: 'Buhar Basınç Düzenleyici Valf (Press-Regulator Mk.I)',
    },
    {
      topic: 'if-else Mantık ve Karşılaştırma Hatası',
      faultHint: 'Mantıksal karşılaştırmada atama (= yerine ==) yapılmış veya koşul ters çevrilmiş.',
      sampleDevice: 'Kazan Emniyet Termostatı (Safety-Thermo 2)',
    },
    {
      topic: 'Döngü Adım ve Sınır Kapsamı Hatası',
      faultHint: 'Döngü adımı yanlış hesaplandığı için sınır değeri atlanıyor ve döngü durmuyor.',
      sampleDevice: 'Pnömatik Zaman Rölesi (Chrono-Relay 4)',
    },
  ],
  module_2_arrays: [
    {
      topic: 'Dizi İndeks Sınırı Aşımı (Buffer Boundary Overflow)',
      faultHint: 'Tanımlı dizi sınırının ötesindeki indise yazma yapılmış; komşu tampon alanı ezilmiş.',
      sampleDevice: 'Pnömatik Matris Tamponu (Aero-Buffer 8)',
    },
    {
      topic: 'Karakter Dizisi (String) Null-Terminator (\\0) Eksikliği',
      faultHint: 'Karakter dizisi sonuna \\0 sonlandırıcı eklenmediği için bellekten rastgele çöp okunuyor.',
      sampleDevice: 'Buhar Telgraf Metin Ayrıştırıcısı (Tele-Parser 16)',
    },
    {
      topic: 'Fonksiyona Dizi Parametresi Aktarımı & Boyut Kaybı',
      faultHint: 'Dizi fonksiyona aktarılırken boyut parametresi aktarılmamış veya yanlış indis ile taranmış.',
      sampleDevice: 'Akustik Frekans Filtresi (Acoustic-Filter 4)',
    },
    {
      topic: 'Çok Boyutlu Dizi Satır/Sütun İndeks Karışıklığı',
      faultHint: 'İki boyutlu dizide satır ve sütun indisleri karıştırılarak sınır dışına çıkılmış.',
      sampleDevice: 'Magitek Işık Matrisi Kontrolcüsü (Lumen-Grid 3x3)',
    },
  ],
  module_3_pointers: [
    {
      topic: 'NULL Pointer Dereference (Geçersiz Adres Erişimi)',
      faultHint: 'Adres atanmamış veya NULL olan işaretçi kontrol edilmeden doğrudan dereference edilmiş (*ptr).',
      sampleDevice: 'Basınç Sensör Adresleyicisi (Aero-Sense MCU)',
    },
    {
      topic: 'Dinamik Bellek Sızıntısı (malloc / free Dengesizliği)',
      faultHint: 'malloc ile heap tahsis edilmiş fakat serbest bırakılmamış (free unutulmuş).',
      sampleDevice: 'Buhar Basınç Tahliye Valfi (Aero-Press Valve v2)',
    },
    {
      topic: 'Adres Operatörleri (& ve *) Karışıklığı',
      faultHint: 'Değişkenin adresi (&) yerine değeri veya değer yerine adresi işleme sokulmuş.',
      sampleDevice: 'Galvanik Akım Kalibratörü (Galvano-Calibrator 4)',
    },
    {
      topic: 'Temel Pointer Aritmetiği & Adres Aşımı',
      faultHint: 'İşaretçi artırımı veri tipi boyutundan fazla kaydırılarak bellek hizalaması bozulmuş.',
      sampleDevice: 'Kristal Bellek Okuma Kafası (Crystal-Head ROM)',
    },
  ],
  module_4_structs_bits: [
    {
      topic: 'Struct Alan Erişimi (-> ve .) ve Bellek Hizalama (Padding)',
      faultHint: 'Struct üyeleri hizalama boşluğu nedeniyle şişmiş; EEPROM blok sınırını aşıyor.',
      sampleDevice: 'Ambar Kristal Bellek Kartuşu (Granary Ledger MCU)',
    },
    {
      topic: 'Bit Maskeleme (Bitwise AND/OR/XOR) ile Bayrak Kontrolü',
      faultHint: 'Bayrak set edilirken |= yerine = kullanılmış ve diğer kontrol bitleri sıfırlanmış.',
      sampleDevice: 'Pirinç Jiroskop Bayrak Yazmacı (Aero-Gyro Mk.II)',
    },
    {
      topic: 'Bit Kaydırma (<<, >>) & Taşma Hatası',
      faultHint: 'Bit kaydırma 8-bit sınırının ötesine yapılmış ve üst bitler kaybolmuş.',
      sampleDevice: 'Optik Sinyal Dekoderi (Opto-Decoder 8)',
    },
    {
      topic: 'Donanım Durum Yazmacında Bayrak Maskeleme',
      faultHint: 'Hazır (READY) bayrağı denetlenirken yanlış bit maskesi (& ~FLAG) kullanılmış.',
      sampleDevice: 'Magitek Güç Dağıtım Panosu (Power-Grid MCU)',
    },
  ],
};

/**
 * Aynı anda çift istek engelleyici kilit (In-flight Request Lock)
 */
let isRequestInProgress = false;

/**
 * Groq API (qwen/qwen3.8-27b) Gömülü C Arıza & Görev Üretici Servisi
 *
 * Uç Nokta: https://api.groq.com/openai/v1/chat/completions
 * Ortam Değişkeni: EXPO_PUBLIC_GROQ_API_KEY
 * Model: qwen/qwen3.8-27b
 */
class GeminiTaskService {
  private readonly modelName: string = 'qwen/qwen3.8-27b';
  private readonly baseUrl: string = 'https://api.groq.com/openai/v1/chat/completions';
  private activePromises: Map<ModuleId, Promise<GeminiTaskPayload>> = new Map();

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
   * Modül ID'sini veya takma adını geçerli bir pedagojik modüle dönüştürür
   */
  public resolvePedagogicalModule(moduleIdOrObj?: PedagogicalModule | ModuleId): PedagogicalModule {
    if (typeof moduleIdOrObj === 'object' && moduleIdOrObj !== null && 'title' in moduleIdOrObj) {
      return moduleIdOrObj as PedagogicalModule;
    }
    const modulesMap: Record<string, PedagogicalModule> = PEDAGOGICAL_MODULES;
    if (typeof moduleIdOrObj === 'string') {
      if (modulesMap[moduleIdOrObj]) {
        return modulesMap[moduleIdOrObj];
      }
      if (moduleIdOrObj === 'module_1_loops') return PEDAGOGICAL_MODULES.module_1_control;
      if (moduleIdOrObj === 'module_2_memory') return PEDAGOGICAL_MODULES.module_3_pointers;
      if (moduleIdOrObj === 'module_3_structs' || moduleIdOrObj === 'module_4_testing') {
        return PEDAGOGICAL_MODULES.module_4_structs_bits;
      }
      const match = moduleIdOrObj.match(/\d+/);
      if (match) {
        const order: CurriculumModuleId[] = [
          'module_1_control',
          'module_2_arrays',
          'module_3_pointers',
          'module_4_structs_bits',
        ];
        const idx = (parseInt(match[0], 10) - 1) % order.length;
        const targetId = order[idx];
        return PEDAGOGICAL_MODULES[targetId];
      }
    }
    return PEDAGOGICAL_MODULES.module_1_control;
  }

  /**
   * Statik müfredat modülünü veya tohum havuzundaki görevi GeminiTaskPayload formatında döndürür (Zarif Fallback)
   */
  public getStaticFallbackTask(moduleId: ModuleId, taskIndex: number = 0): GeminiTaskPayload {
    const bundle = getModuleTaskFromPool(moduleId, taskIndex);
    const isDynamic = moduleId.startsWith('dynamic_task_') || moduleId.includes('_task_');
    const deviceName = isDynamic
      ? `[GÖREV HAVUZU] ${bundle.moduleData.deviceName}`
      : bundle.moduleData.deviceName;

    return {
      moduleId,
      academicUnit: bundle.moduleData.academicUnit,
      deviceName,
      deviceCode: bundle.moduleData.deviceCode,
      customer: bundle.customer,
      brokenCode: bundle.moduleData.brokenCode,
      brokenCodeLines: bundle.moduleData.brokenCodeLines,
      patchOptions: shufflePatchOptions(bundle.moduleData.patchOptions),
      rewardGold: bundle.moduleData.rewardGold,
      rewardExp: bundle.moduleData.rewardExp,
      rewardItemName: bundle.moduleData.rewardItemName,
      isDynamic: false,
    };
  }

  /**
   * Groq API üzerinden pedagojik guardrail kurallarıyla dinamik görev üretir
   * @param moduleId Hedef modül veya görev kimliği
   * @param currentModuleInput Aktif pedagojik modül nesnesi veya modül kimliği
   * @param classLevel Sınıf düzeyi (varsayılan 1)
   * @param stageProgress Modüldeki çözülen görev aşaması
   */
  public async fetchDynamicTask(
    moduleId: ModuleId,
    currentModuleInput?: PedagogicalModule | ModuleId | number,
    classLevelOrProgress?: number,
    stageProgress?: number
  ): Promise<GeminiTaskPayload> {
    // 1. Pedagojik Modül Guardrail Parametrelerini Belirle
    let resolvedModule: PedagogicalModule;
    let actualStageProgress = 0;

    if (typeof currentModuleInput === 'object' && currentModuleInput !== null && 'title' in currentModuleInput) {
      resolvedModule = currentModuleInput as PedagogicalModule;
      if (typeof classLevelOrProgress === 'number') actualStageProgress = classLevelOrProgress;
      if (typeof stageProgress === 'number') actualStageProgress = stageProgress;
    } else if (typeof currentModuleInput === 'string') {
      resolvedModule = this.resolvePedagogicalModule(currentModuleInput);
      if (typeof classLevelOrProgress === 'number') actualStageProgress = classLevelOrProgress;
      if (typeof stageProgress === 'number') actualStageProgress = stageProgress;
    } else {
      resolvedModule = this.resolvePedagogicalModule(moduleId);
      if (typeof currentModuleInput === 'number') actualStageProgress = currentModuleInput;
      if (typeof classLevelOrProgress === 'number') actualStageProgress = classLevelOrProgress;
    }

    const fallback = this.getStaticFallbackTask(moduleId, actualStageProgress);

    // 2. AYNI ANDA ÇİFT İSTEK ENGELİ (In-flight Request Lock)
    if (isRequestInProgress) {
      console.warn(
        `[TaskService: Groq] Halihazırda bir istek sürerken yeni çağrı geldi (${moduleId}). Çift istek engellendi.`
      );
      // Eğer bu modül için halihazırda yürüyen bir istek varsa onun tamamlanmasını bekle
      if (this.activePromises.has(moduleId)) {
        try {
          return await this.activePromises.get(moduleId)!;
        } catch {
          return fallback;
        }
      }
      // Farklı bir modül için istek sürüyorsa yerel yedeği dön
      return fallback;
    }

    const apiKey = this.getApiKey();
    if (!apiKey || apiKey.trim().length === 0) {
      console.warn(
        `[TaskService: Groq] EXPO_PUBLIC_GROQ_API_KEY bulunamadı. Yerel statik modüle dönülüyor (${moduleId}).`
      );
      return fallback;
    }

    // Pedagojik Kural Metni (Katı Sart)
    const pedagogicalRule = `PEDAGOJİK KURAL (1. SINIF C MÜFREDATI): Öğrenci şu anda '${resolvedModule.title}' aşamasındadır. YALNIZCA şu konular dahilinde bir C arızası ve yaması üret: ${resolvedModule.allowedTopics.join(', ')}. Şu ileri düzey konuları üretmek KESİNLİKLE YASAKTIR: ${resolvedModule.forbiddenTopics.join(', ')}.`;

    // Modüle özel konu havuzundan pedagojik konu seç
    const moduleTopics = MODULE_PEDAGOGICAL_TOPICS[resolvedModule.id] || MODULE_PEDAGOGICAL_TOPICS.module_1_control;
    const selectedTopic = moduleTopics[Math.floor(Math.random() * moduleTopics.length)];

    // Groq JSON Object Mode Güvence İfadesi
    const jsonStrictRequirement = 'You must output only a valid, parsable JSON object conforming strictly to the requested schema. Do not output markdown codeblocks, prose, or preamble.';

    const systemPrompt = `${jsonStrictRequirement}

Beklenen JSON Şablonu:
{"academicUnit": "...", "deviceName": "...", "deviceCode": "...", "customer": {"name":"...","role":"...","quote":"...","dialogue":"..."}, "brokenCode": "...", "brokenCodeLines": [{"lineNumber": 1, "code": "...", "isFaulty": false}], "patchOptions": [{"id": "patch_1", "title": "...", "explanation": "...", "diff": {"removed": ["while (rotation <= 64) {"], "added": ["while (rotation < 64) {"]}, "isCorrect": true, "telemetrySnippet": "..."}], "rewardGold": 75, "rewardExp": 25, "rewardItemName": "..."}

Sen Magitek Atölyesi'nin Kıdemli Baş Mühendisi ve Samsun Üniversitesi Yazılım Mühendisliği 1. Sınıf C Dersi Eğitim Koordinatörüsün.
Görevin: Samsun Üniversitesi Yazılım Mühendisliği 1. sınıf müfredatına (${resolvedModule.courseCode}) uygun, Steampunk ve Cozy Magitek estetiğine sahip arızalı gömülü C kodları ve 3 adet Git Diff yaması üreten bir sistem gibi çalışmaktır.

${pedagogicalRule}

Daima ve SADECE yukarıdaki şablona uyan geçerli bir JSON nesnesi dönmelisin. Yanıtında JSON dışında hiçbir metin, markdown veya açıklama bulunmamalıdır.

DİL ZORUNLULUĞU: C kodunun değişken isimleri ve C standart kütüphane çağrıları hariç, ÜRETİLEN TÜM METİNLER (customer diyalogları, hata açıklamaları, C kodu içindeki yorum satırları //, 'patchOptions' altındaki 'title', 'explanation' ve 'telemetrySnippet' alanları) KESİNLİKLE VE İSTİSNASIZ TÜRKÇE OLMALIDIR. İngilizce açıklama yazmak KESİNLİKLE YASAKTIR.

DİKKAT: 'patchOptions' içindeki 'diff.removed' dizisi, 'brokenCode' içinde yer alan ve arızaya sebep olan gerçek C satırını/satırlarını birebir içermelidir. 'diff.added' dizisi ise bu hatayı gideren geçerli C kodunu içermelidir. '// Hatali satir', '// Duzeltilmis satir' gibi soyut yorumlar veya yer tutucu metinler yazmak KESİNLİKLE YASAKTIR.

DİKKAT: C kodunu JSON içine yerleştirirken string kaçışlarına (escaping) azami dikkat et. Çift tırnak yerine gerektiğinde tek tırnak kullan veya tırnakları standart JSON uyumlu kaçır. Asla fazladan çift ters eğik çizgi (\\\\) üretme. Yalnızca RFC 8259 uyumlu saf JSON üret.
DİKKAT: 'patchOptions' dizisi KESİNLİKLE tam olarak 3 elemandan oluşmalıdır. Şık başlıklarına (title) ASLA '(Doğru)', '(Yanlış)' gibi cevabı ele veren ibareler yazma; şıklar nötr teknik ifadeler olmalıdır.

${jsonStrictRequirement}`;

    const userPrompt = `
${pedagogicalRule}

Lütfen Samsun Üniversitesi Yazılım Mühendisliği 1. Sınıf Müfredatına (${resolvedModule.courseCode}) ve yukarıdaki PEDAGOJİK KURALA BİREBİR UYGUN arızalı bir Magitek gömülü cihazı ve C11 kodu üret:
- Aktif Müfredat Modülü: "${resolvedModule.title}"
- Modül Kodu: ${resolvedModule.courseCode}
- İzin Verilen Konular: ${resolvedModule.allowedTopics.join(', ')}
- KESİNLİKLE YASAK KONULAR: ${resolvedModule.forbiddenTopics.join(', ')}
- Hedeflenen Mühendislik Hatası: "${selectedTopic.topic}"
- Kök Neden / İpucu: "${selectedTopic.faultHint}"
- Cihaz İlhamı: "${selectedTopic.sampleDevice}" (veya benzeri özgün bir Magitek donanım adı)
- Mevcut İlerleme Aşaması: Görev #${actualStageProgress + 1}

DİKKAT: Yasaklı ileri düzey konulardan (örneğin ${resolvedModule.forbiddenTopics.join(', ')}) kod veya kavram üretmek KESİNLİKLE YASAKTIR! SADECE izin verilen temel C konuları (${resolvedModule.allowedTopics.join(', ')}) kullanılmalıdır.

DİL ZORUNLULUĞU: C kodunun değişken isimleri ve C standart kütüphane çağrıları hariç, ÜRETİLEN TÜM METİNLER (customer diyalogları, hata açıklamaları, C kodu içindeki yorum satırları //, 'patchOptions' altındaki 'title', 'explanation' ve 'telemetrySnippet' alanları) KESİNLİKLE VE İSTİSNASIZ TÜRKÇE OLMALIDIR. İngilizce açıklama yazmak KESİNLİKLE YASAKTIR.
- 'brokenCode': Kod içerisindeki yorum satırları (//) mutlaka TÜRKÇE olmalıdır.
- 'patchOptions': KESİNLİKLE tam olarak 3 elemandan oluşmalıdır. Şık başlıklarına (title) ASLA '(Doğru)', '(Yanlış)' gibi cevabı ele veren ibareler yazma; şıklar nötr teknik ifadeler olmalıdır.
  * 'explanation': Yamanın ne yaptığını anlatan 1-2 cümlelik TEKNİK TÜRKÇE açıklama (Örn: 'Döngü sınır koşulu düzeltilerek bellek taşması önlenir'). ASLA İngilizce yazma.
  * 'telemetrySnippet': Donanımın çalışma durumunu anlatan TÜRKÇE telemetri notu (Örn: 'Nominal çalışma: Cihaz kararlı 36°C' veya 'Aşırı ısınma ve donma: 84°C').
  * 'diff.removed': 'brokenCode' içindeki arızalı C kod satırını/satırlarını birebir içermelidir.
  * 'diff.added': Uygulanan gerçek C kodunu içermelidir.

DİKKAT: 'patchOptions' içindeki 'diff.removed' dizisi, 'brokenCode' içinde yer alan ve arızaya sebep olan gerçek C satırını/satırlarını birebir içermelidir. 'diff.added' dizisi ise bu hatayı gideren geçerli C kodunu içermelidir. '// Hatali satir', '// Duzeltilmis satir' gibi soyut yorumlar veya yer tutucu metinler yazmak KESİNLİKLE YASAKTIR.

DİKKAT: C kodunu JSON içine yerleştirirken string kaçışlarına (escaping) azami dikkat et. Çift tırnak yerine gerektiğinde tek tırnak kullan veya tırnakları standart JSON uyumlu kaçır. Asla fazladan çift ters eğik çizgi (\\\\) üretme. Yalnızca RFC 8259 uyumlu saf JSON üret.

Lütfen SADECE aşağıdaki JSON şemasına BİREBİR uyan geçerli bir JSON nesnesi döndür:
{
  "academicUnit": "${resolvedModule.title}",
  "deviceName": "Magitek/Steampunk temalı özgün cihaz adı (Türkçe)",
  "deviceCode": "Seri Kodu (Örn: MCU-CTRL1, MCU-ARR2, MCU-PTR3)",
  "customer": {
    "name": "Makinist veya Usta Adı (Türkçe)",
    "role": "Görevi (Türkçe)",
    "quote": "Fiziksel arıza belirtisi (Türkçe)",
    "dialogue": "Ayrıntılı teknik arıza diyalogu (Türkçe)"
  },
  "brokenCode": "10-15 satırlık, C11 standardında, pedagojik kurallara tam uyan arızalı C fonksiyonu",
  "brokenCodeLines": [
    { "lineNumber": 1, "code": "...", "isFaulty": false },
    { "lineNumber": 2, "code": "...", "isFaulty": true }
  ],
  "patchOptions": [
    {
      "id": "patch_1",
      "title": "Döngü Sınır Koşulunu Düzelt",
      "explanation": "Sınır kontrolü eklenerek bellek bütünlüğü sağlanır.",
      "diff": {
        "removed": ["for (int i = 0; i <= SIZE; i++) {"],
        "added": ["for (int i = 0; i < SIZE; i++) {"]
      },
      "isCorrect": true,
      "telemetrySnippet": "Nominal çalışma parametresi: Kararlı (36°C)"
    },
    {
      "id": "patch_2",
      "title": "İndeks Başlangıcını Değiştir",
      "explanation": "İlk eleman boş bırakılarak veri kaybına yol açılır.",
      "diff": {
        "removed": ["for (int i = 0; i <= SIZE; i++) {"],
        "added": ["for (int i = 1; i <= SIZE; i++) {"]
      },
      "isCorrect": false,
      "telemetrySnippet": "Veri kaybı ve aşırı ısınma (84°C)"
    },
    {
      "id": "patch_3",
      "title": "Döngü Adımını Değiştir",
      "explanation": "Döngü adımı atlandığından kilitlenme gerçekleşir.",
      "diff": {
        "removed": ["for (int i = 0; i <= SIZE; i++) {"],
        "added": ["for (int i = 0; i <= SIZE; i += 2) {"]
      },
      "isCorrect": false,
      "telemetrySnippet": "Donanım kilitlenmesi (SIGSEGV)"
    }
  ],
  "rewardGold": ${80 + (actualStageProgress % 4) * 15},
  "rewardExp": ${25 + (actualStageProgress % 4) * 5},
  "rewardItemName": "Pirinç Telemetri Kartı"
}

Yanıtını doğrudan ham JSON objesi olarak ver.
`;

    const requestBody = {
      model: this.modelName,
      temperature: 0.2,
      max_completion_tokens: 2048,
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

    console.log('>>> [TaskService: Groq] Pedagojik görev isteği atılıyor:', resolvedModule.id);

    // İstek kilidini etkinleştir
    isRequestInProgress = true;

    const requestPromise = (async (): Promise<GeminiTaskPayload> => {
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        // 3. HATA YÖNETİMİ & FALLBACK: Akışı kırmadan uyarı basıp fallback dön
        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          console.warn(
            `[TaskService: Groq] API Hatası (HTTP ${response.status} ${response.statusText}): ${errBody}. Akış kesilmeden yerel fallback modüle (${moduleId}) dönülüyor.`
          );
          return fallback;
        }

        const data = await response.json().catch(() => null);
        const rawContent = data?.choices?.[0]?.message?.content || '';

        // Güvenli Regex JSON Parser
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.warn(
            `[TaskService: Groq] Yanıt içinde geçerli JSON bloğu bulunamadı (${moduleId}). Ham yanıt: "${rawContent}". Yerel fallback modüle dönülüyor.`
          );
          return fallback;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn(
            `[TaskService: Groq] JSON ayrıştırma hatası: ${parseError}. Çıkarılan blok: "${jsonMatch[0]}". Yerel fallback modüle (${moduleId}) dönülüyor.`
          );
          return fallback;
        }

        console.log(`>>> [TaskService: Groq] BAŞARILI! Üretilen Cihaz: ${parsed.deviceName}`);

        // Canlı AI üretimi olduğunu açıkça vurgula
        let deviceName = parsed.deviceName || fallback.deviceName;
        if (!deviceName.includes('[CANLI AI]')) {
          deviceName = `[CANLI AI] ${deviceName}`;
        }

        // Karakter kimliği ve NPC adı her zaman modül tanımından sabit kalır (NPC Tutarlılığı)
        const customer: CustomerIssue = {
          customerName: fallback.customer.customerName,
          customerRole: fallback.customer.customerRole,
          avatarKey: fallback.customer.avatarKey,
          dialogText: parsed.customer?.dialogue || fallback.customer.dialogText,
          physicalSymptom: parsed.customer?.quote || fallback.customer.physicalSymptom,
          engineerDiagnosis: `Teknik Kök Neden Analizi: ${parsed.customer?.quote || fallback.customer.engineerDiagnosis}`,
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

        // Arızalı C satırını tespit et
        let faultyLineObj = brokenCodeLines.find((l: any) => l.isFaulty);
        if (!faultyLineObj && brokenCodeLines.length > 0) {
          faultyLineObj = brokenCodeLines.find((l: any) =>
            /(\+\+|--|<=|>=|==|!=|while|for|if|buf|ptr|malloc|free|<<|>>)/.test(l.code)
          ) || brokenCodeLines[Math.min(1, brokenCodeLines.length - 1)];
        }
        const faultyCode = faultyLineObj?.code ? faultyLineObj.code.trim() : 'while (rotation <= 64) {';

        // Şık listesini al ve kesinlikle 3 elemana normalize et
        let rawPatchOptions: any[] = Array.isArray(parsed.patchOptions) && parsed.patchOptions.length > 0
          ? [...parsed.patchOptions]
          : [...fallback.patchOptions];

        if (rawPatchOptions.length > 3) {
          rawPatchOptions = rawPatchOptions.slice(0, 3);
        }

        const fakeOptionFallbacks = [
          {
            id: 'patch_extra_1',
            title: 'Döngü Sayacını Çift Artır',
            explanation: 'Döngü sayacının çift artırılması sınırın atlanmasına ve aşırı ısınmaya yol açar.',
            diff: {
              removed: [faultyCode],
              added: ['i += 2; /* Hatalı sayaç adımı */'],
            },
            isCorrect: false,
            telemetrySnippet: 'Aşırı ısınma ve donma (84°C)',
          },
          {
            id: 'patch_extra_2',
            title: 'Tampon Sınırını Sıfırla',
            explanation: 'Tamponun sıfırlanması veri akışını keser ve veri kaybına neden olur.',
            diff: {
              removed: [faultyCode],
              added: ['memset(buffer, 0, sizeof(buffer)); /* Sıfırlama */'],
            },
            isCorrect: false,
            telemetrySnippet: 'Tampon boşaltma hatası (139)',
          },
        ];

        while (rawPatchOptions.length < 3) {
          const fake = fakeOptionFallbacks[rawPatchOptions.length % fakeOptionFallbacks.length];
          rawPatchOptions.push({
            ...fake,
            id: `patch_fake_${rawPatchOptions.length + 1}`,
          });
        }

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

        const patchOptions: CodePatchOption[] = rawPatchOptions.map((opt: any, index: number) => {
          const isCorrect = Boolean(opt.isCorrect);
          const deviceCode = parsed.deviceCode || fallback.deviceCode;
          const telemetry = opt.telemetrySnippet || (isCorrect ? 'Cihaz nominal döngüde çalışıyor.' : 'Cihaz aşırı ısındı!');

          const rawTitle = typeof opt.title === 'string' ? opt.title : `Yama #${index + 1}`;
          const cleanTitle = rawTitle
            .replace(/\s*\((doğru|yanlış|hatalı|iptal|correct|incorrect|false|true)[^)]*\)/gi, '')
            .replace(/\s*\[(doğru|yanlış|hatalı|iptal|correct|incorrect|false|true)[^\]]*\]/gi, '')
            .trim() || `Yama #${index + 1}`;

          let removedDiff: string[] = Array.isArray(opt.diff?.removed) ? opt.diff.removed : [];
          const hasRealRemovedCode = removedDiff.some((line: string) => !isPlaceholderLine(line));

          if (!hasRealRemovedCode || removedDiff.length === 0) {
            removedDiff = [faultyCode];
          } else {
            removedDiff = removedDiff.filter((line: string) => !isPlaceholderLine(line));
            if (removedDiff.length === 0) {
              removedDiff = [faultyCode];
            }
          }

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
                  `[TEST] FAIL: Beklenmeyen değer / Sınır ihlali (SIGSEGV / Buffer Fault)`,
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

        // Şıkları Fisher-Yates algoritması ile rastgele karıştır (Shuffle)
        for (let i = patchOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [patchOptions[i], patchOptions[j]] = [patchOptions[j], patchOptions[i]];
        }

        return {
          moduleId,
          academicUnit: resolvedModule.title,
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
        console.warn(
          `[TaskService: Groq] Beklenmeyen hata oluştu, güvenli yerel yedeğe dönülüyor (${moduleId}):`,
          error
        );
        return fallback;
      } finally {
        isRequestInProgress = false;
        this.activePromises.delete(moduleId);
      }
    })();

    this.activePromises.set(moduleId, requestPromise);
    return await requestPromise;
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
