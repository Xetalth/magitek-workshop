import { WorkbenchModuleData, CustomerIssue, SkillNode, RoomGadget } from '../types/sdui';

export interface ModuleBundle {
  moduleData: WorkbenchModuleData;
  customer: CustomerIssue;
  skillNode: SkillNode;
  gadget: RoomGadget;
}

export const CURRICULUM_MODULES: Record<string, ModuleBundle> = {
  module_1_loops: {
    customer: {
      customerName: 'Usta Barnaby',
      customerRole: 'Hidrolik Değirmen & Çark Ustası',
      avatarKey: 'barnaby',
      dialogText:
        'Selam genç mühendis! Bizim nehir değirmeninin pirinç çark devir sayacı (Hydro-Tick 8) sabah saatlerinde kusursuz çalışıyor, fakat tam 64. devire ulaştığında aniden donup ana tahrik debriyajını kilitliyor. Çark suyun gücüyle dönüyor ama sayaç kilitlendiği için öğütücü taş durdu!',
      physicalSymptom: 'Sayaç tam 64. devirde ekranı donduruyor; pirinç debriyaj mekanizması aşırı ısınıp emniyet kilidine geçiyor.',
      engineerDiagnosis: 'Off-by-One Sınır Hatası — Devir tamponu 64 elemanlı (indis 0..63) tanımlanmışken döngü koşulu (<= BUFFER_SIZE) yapılarak 65. indise yazılmış ve komşu kesme yazmacı (INT_FLAG) ezilmiştir.',
    },
    moduleData: {
      id: 'module_1_loops',
      academicUnit: '1. Sınıf // Ünite 1: Temel Mantık, Döngüler & Dizi Sınırları',
      deviceName: 'Pirinç Çark Devir Sayacı (Hydro-Tick 8)',
      deviceCode: 'MCU-HT8 // Seri #042',
      physicalSymptom: 'Sayaç her 64 devirde bir kilitleniyor; CPU çekirdeği aşırı ısınıyor ve tampon taşma hatası veriyor.',
      engineerDiagnosis: 'for (int i = 0; i <= BUFFER_SIZE; i++) döngüsü 65. indise yazmaya çalışıyor. Gömülü C mimarisinde donanımsal dizi sınır denetimi yoktur; bu off-by-one hatası bellek bütünlüğünü bozar.',
      rewardGold: 75,
      rewardExp: 25,
      rewardItemName: 'Pirinç Mekanik Devir Göstergesi & Çalışma Lambası',
      brokenCode: `#define BUFFER_SIZE 64
static uint16_t rpm_buffer[BUFFER_SIZE];

void process_wheel_revolution(uint16_t current_rpm) {
    // [KRİTİK HATA]: <= BUFFER_SIZE indisi 0..64 (65 eleman) yapar!
    for (int i = 0; i <= BUFFER_SIZE; i++) {
        rpm_buffer[i] = read_sensor_rpm(i);
    }
    trigger_grindstone_clutch();
}`,
      brokenCodeLines: [
        { lineNumber: 1, code: '#define BUFFER_SIZE 64' },
        { lineNumber: 2, code: 'static uint16_t rpm_buffer[BUFFER_SIZE];' },
        { lineNumber: 3, code: '' },
        { lineNumber: 4, code: 'void process_wheel_revolution(uint16_t current_rpm) {' },
        { lineNumber: 5, code: '    // ARİZA: <= BUFFER_SIZE tampon dışına yazar (Off-by-one)', isFaulty: true },
        { lineNumber: 6, code: '    for (int i = 0; i <= BUFFER_SIZE; i++) {', isFaulty: true },
        { lineNumber: 7, code: '        rpm_buffer[i] = read_sensor_rpm(i);' },
        { lineNumber: 8, code: '    }' },
        { lineNumber: 9, code: '    trigger_grindstone_clutch();' },
        { lineNumber: 10, code: '}' },
      ],
      patchOptions: [
        {
          id: 'patch_1_correct',
          title: 'Yama A: Kesin Sınır Kontrolü (i < BUFFER_SIZE)',
          authorNote: 'C dilinde 64 elemanlı dizinin geçerli indisleri 0..63 aralığıdır. Döngü koşulu i < BUFFER_SIZE yapılarak bellek sınırına saygı gösterilir.',
          isCorrect: true,
          codeDiff: {
            removed: ['for (int i = 0; i <= BUFFER_SIZE; i++) {'],
            added: ['for (int i = 0; i < BUFFER_SIZE; i++) {'],
          },
          compilerOutcome: {
            success: true,
            exitCode: 0,
            terminalOutput: [
              '[CC] avr-gcc -Wall -Wextra -O2 hydro_tick.c -o firmware.elf',
              '[TEST] Simülasyon Koşuluyor: 64 Devir Tampon Doldurma...',
              '  -> Test 1: rpm_buffer[0..63] bellek doğrulandı. [PASS]',
              '  -> Test 2: rpm_buffer[64] adresine izinsiz yazma tespit edilmedi. [PASS]',
              '  -> Test 3: Kesme yazmacı (INT_FLAG) bütünlüğü korundu. [PASS]',
              '[SUCCESS] Firmware başarıyla doğrulandı. Çark devir sayacı kararlı!',
            ],
            hardwareTempC: 36,
            hardwareStatus: 'OPTIMAL',
            feedbackMessage: 'Mükemmel Mühendislik Çözümü! Dizi sınırı 0..63 aralığında tutuldu. Kesme yazmacı ezilmekten kurtarıldı.',
          },
        },
        {
          id: 'patch_1_faulty_1',
          title: 'Yama B: Başlangıcı 1 Yapma (i = 1; i <= BUFFER_SIZE)',
          authorNote: 'Döngü 1\'den başlatılarak 64 iterasyon yapılmak istenmiş. Fakat bu rpm_buffer[0]\'ı boş bırakır ve rpm_buffer[64] indisine yine taşar!',
          isCorrect: false,
          codeDiff: {
            removed: ['for (int i = 0; i <= BUFFER_SIZE; i++) {'],
            added: ['for (int i = 1; i <= BUFFER_SIZE; i++) {'],
          },
          compilerOutcome: {
            success: false,
            exitCode: 139,
            terminalOutput: [
              '[CC] avr-gcc -Wall -Wextra hydro_tick.c -o firmware.elf',
              '[TEST] Simülasyon Başlatıldı...',
              '  -> UYARI: rpm_buffer[0] ilklendirilmedi (Uninitialized Read)!',
              '  -> HATA: rpm_buffer[64] sınırı aşıldı! SIGSEGV: Out of bounds write.',
              '[ALERT] Donanım koruma sigortası attı! İşlemci aşırı ısınıyor.',
            ],
            hardwareTempC: 84,
            hardwareStatus: 'OVERHEATING',
            feedbackMessage: 'Hatalı Dizi İndeksleme! 0. eleman atlandı ve 64. indis dizinin dışına yazarak donanımı kilitledi.',
          },
        },
        {
          id: 'patch_1_faulty_2',
          title: 'Yama C: While Döngüsüne Çevirme (Artış Eksik)',
          authorNote: 'Sayaç döngüsü while ile kurulmuş fakat döngü değişkeni artırımı unutulmuş.',
          isCorrect: false,
          codeDiff: {
            removed: ['for (int i = 0; i <= BUFFER_SIZE; i++) {'],
            added: ['int i = 0; while (i < BUFFER_SIZE) {'],
          },
          compilerOutcome: {
            success: false,
            exitCode: 124,
            terminalOutput: [
              '[CC] avr-gcc hydro_tick.c -o firmware.elf',
              '[TEST] Simülasyon Başlatıldı...',
              '  -> HATA: CPU Zaman Aşımı (Watchdog Timeout)! Döngü i=0 noktasında kilitlendi.',
              '  -> Termal Uyarı: Çekirdek sıcaklığı 91°C sınırına ulaştı!',
              '[CRITICAL] Sonsuz döngü tespit edildi! Donanım acil kapatmaya alındı.',
            ],
            hardwareTempC: 91,
            hardwareStatus: 'CRITICAL_FAULT',
            feedbackMessage: 'Kritik Hata: Sonsuz Döngü! Döngü değişkeni artırılmadığı için CPU kilitlendi ve aşırı ısındı.',
          },
        },
      ],
    },
    skillNode: {
      id: 'algo_loops',
      name: 'Temel Mantık, Döngüler & Bellek Sınırları',
      tier: '1. Sınıf - Modül 1',
      status: 'UNLOCKED',
      description: 'Dizi indisleme aritmetiği, off-by-one sınır analizi ve donanımsal taşma kontrolleri.',
      academicCredit: 'CS101 - 3 AKTS',
      curriculumTopic: 'C Dili Sözdizimi, Sınır Koşulları & Buffer Güvenliği',
    },
    gadget: {
      id: 'gadget_wheel_gauge',
      name: 'Pirinç Gövdeli Mekanik Devir Sayacı',
      moduleId: 'module_1_loops',
      isUnlocked: true,
      icon: 'speedometer-outline',
      description: 'Hidrolik çarkın devir hızını milisaniyelik hassasiyetle analog kadranda gösteren kalibre edilmiş pirinç aparat.',
      hardwareSpec: '64-Pals Döner Kodlayıcı // 0..255 RPM Okuma',
    },
  },

  module_2_memory: {
    customer: {
      customerName: 'Baş Makinist Vane',
      customerRole: 'Buhar Basınç İstasyonu Şefi',
      avatarKey: 'vane',
      dialogText:
        'Tezgâhına kuvvet mühendis! Hidrolik hatlar çalışıyor fakat ana buhar basınç tahliye valfimiz (Aero-Press Valve v2) kontrolden çıktı. Cihaz açıldıktan yirmi dakika sonra SRAM tükenip kilitleniyor, valf tüm buharı istasyona boşaltıyor. Basınç kazanı patlarsa tüm çark dairesi havaya uçar!',
      physicalSymptom: 'Sistem 20 dakika çalıştıktan sonra SRAM tükenip kilitleniyor; acil durum buhar tahliye diyaframı gürültüyle açılıyor.',
      engineerDiagnosis: 'Heap Bellek Sızıntısı (Memory Leak) — Her sensör okumasında malloc() ile dinamik alan tahsis ediliyor fakat işlem bitince free() çağrılmıyor. 16 KB mikrodenetleyici SRAM sınırı hızla aşılıyor.',
    },
    moduleData: {
      id: 'module_2_memory',
      academicUnit: '1. Sınıf // Ünite 2: Göstericiler & Dinamik Bellek Yönetimi (malloc / free)',
      deviceName: 'Buhar Basınç Tahliye Valfi (Aero-Press Valve v2)',
      deviceCode: 'MCU-AP2 // Seri #108',
      physicalSymptom: '16 KB mikrodenetleyici belleği saniyeler içinde tükeniyor; heap yığını çöküyor (Heap Exhaustion).',
      engineerDiagnosis: 'Her basınç telemetrisinde dinamik tahsis edilen SensorLog yapısı free() ile iade edilmiyor. Fonksiyon yerel göstericisi stack\'ten kaybolunca tahsis edilen alan sahipsiz kalıyor.',
      rewardGold: 90,
      rewardExp: 30,
      rewardItemName: 'Katot Işınlı Hex Bellek Osiloskobu',
      brokenCode: `typedef struct {
    float pressure_bar;
    uint32_t sample_time;
} SensorLog;

void monitor_valve_pressure() {
    SensorLog *log = (SensorLog*)malloc(sizeof(SensorLog));
    log->pressure_bar = read_analog_pressure();
    log->sample_time = get_system_uptime();

    if (log->pressure_bar > 4.5f) {
        open_emergency_vent();
    }
    // [KRİTİK HATA]: free(log) ÇAĞRILMADI!
    // log pointer stack'ten düşer, heap alanı sonsuza dek rezerve kalır!
}`,
      brokenCodeLines: [
        { lineNumber: 1, code: 'typedef struct {' },
        { lineNumber: 2, code: '    float pressure_bar;' },
        { lineNumber: 3, code: '    uint32_t sample_time;' },
        { lineNumber: 4, code: '} SensorLog;' },
        { lineNumber: 5, code: '' },
        { lineNumber: 6, code: 'void monitor_valve_pressure() {' },
        { lineNumber: 7, code: '    SensorLog *log = (SensorLog*)malloc(sizeof(SensorLog));' },
        { lineNumber: 8, code: '    log->pressure_bar = read_analog_pressure();' },
        { lineNumber: 9, code: '    log->sample_time = get_system_uptime();' },
        { lineNumber: 10, code: '' },
        { lineNumber: 11, code: '    if (log->pressure_bar > 4.5f) {' },
        { lineNumber: 12, code: '        open_emergency_vent();' },
        { lineNumber: 13, code: '    }' },
        { lineNumber: 14, code: '    // ARİZA: free(log) unutuldu, her döngüde bellek sızıyor!', isFaulty: true },
        { lineNumber: 15, code: '}' , isFaulty: true},
      ],
      patchOptions: [
        {
          id: 'patch_2_correct',
          title: 'Yama A: Düzgün Temizlik (free(log) ve Güvenli Pointer Sıfırlama)',
          authorNote: 'malloc ile alınan blok işlem bitiminde mutlaka free(log) ile heap havuzuna iade edilmelidir. Sızıntı sıfırlanır, SRAM stabil kalır.',
          isCorrect: true,
          codeDiff: {
            removed: ['    // ARİZA: free(log) unutuldu'],
            added: [
              '    free(log);',
              '    log = NULL; // Asılı pointer (dangling) engellenir',
            ],
          },
          compilerOutcome: {
            success: true,
            exitCode: 0,
            terminalOutput: [
              '[CC] gcc -fsanitize=address -Wall valve_mcu.c -o valve_mcu',
              '[TEST] Valgrind / MemCheck Simülasyonu Başlatıldı...',
              '  -> 10,000 basınç okuma döngüsü koşturuldu.',
              '  -> HEAP ÖZETİ:',
              '     in use at exit: 0 bytes in 0 blocks',
              '     total heap usage: 10,000 allocs, 10,000 frees, 80,000 bytes allocated',
              '  -> TÜM BELLEK TEMİZLENDİ: Bellek sızıntısı kalmadı! [PASS]',
              '[SUCCESS] Basınç valfi SRAM tüketimi 0 byte sızıntı ile stabilize edildi.',
            ],
            hardwareTempC: 38,
            hardwareStatus: 'OPTIMAL',
            feedbackMessage: 'Kusursuz Dinamik Bellek Yönetimi! Her malloc() için bir free() işletildi ve gösterici NULL yapılarak dangling pointer riski önlendi.',
          },
        },
        {
          id: 'patch_2_faulty_1',
          title: 'Yama B: Erken free() Yapma (Use-After-Free Tehlikesi)',
          authorNote: 'free(log) çağrısı basınç kontrolünden ÖNCE yapılmış. Serbest bırakılmış bellek alanına okuma yapılmaya çalışılıyor (Use-After-Free).',
          isCorrect: false,
          codeDiff: {
            removed: ['if (log->pressure_bar > 4.5f) { open_emergency_vent(); }'],
            added: [
              'free(log);',
              'if (log->pressure_bar > 4.5f) { open_emergency_vent(); } // GEÇERSİZ ERİŞİM!',
            ],
          },
          compilerOutcome: {
            success: false,
            exitCode: 134,
            terminalOutput: [
              '[CC] gcc -fsanitize=address valve_mcu.c -o valve_mcu',
              '[TEST] ASan (AddressSanitizer) Devrede...',
              '  -> HATA: AddressSanitizer: heap-use-after-free on address 0x602000000010',
              '  -> Okuma işlemi serbest bırakılan bellek bloğuna yapıldı!',
              '[CRITICAL] Tanımsız Davranış (UB): Rastgele veri okundu, valf patlama moduna geçti!',
            ],
            hardwareTempC: 88,
            hardwareStatus: 'OVERHEATING',
            feedbackMessage: 'Tehlikeli Hata: Use-After-Free! Bellek bloğu daha okunmadan serbest bırakılmış. Bu durum gömülü sistemlerde donanımın çökmesine neden olur.',
          },
        },
        {
          id: 'patch_2_faulty_2',
          title: 'Yama C: Göstericiyi NULL Yapmak (Sızıntıyı Gizleme)',
          authorNote: 'free(log) çağırmadan sadece log = NULL yapılmış. Bu işlem heap alanını serbest bırakmaz, sadece adresi unutarak bellek sızıntısını kalıcı hale getirir.',
          isCorrect: false,
          codeDiff: {
            removed: ['// free(log) unutuldu'],
            added: ['log = NULL; // Heap hala dolu!'],
          },
          compilerOutcome: {
            success: false,
            exitCode: 1,
            terminalOutput: [
              '[CC] gcc -fsanitize=leak valve_mcu.c -o valve_mcu',
              '[TEST] LeakSanitizer Raporu:',
              '  -> Doğrudan sızıntı tespit edildi: 80,000 bytes in 10,000 allocated blocks.',
              '  -> SRAM Kapasitesi Aşıldı: Heap taşması gerçekleşti.',
              '[ALERT] Yetersiz Bellek (OOM): Cihaz yeniden başlatılıyor...',
            ],
            hardwareTempC: 82,
            hardwareStatus: 'OVERHEATING',
            feedbackMessage: 'Hatalı Çözüm: log = NULL demek belleği boşaltmaz! free() çağrılmadığı sürece heap belleği iade edilmez.',
          },
        },
      ],
    },
    skillNode: {
      id: 'dynamic_memory',
      name: 'Göstericiler & Dinamik Bellek (Heap Yönetimi)',
      tier: '1. Sınıf - Modül 2',
      status: 'LOCKED',
      description: 'Pointer aritmetiği, malloc/free yaşam döngüsü, Valgrind sızıntı analizi ve Heap optimizasyonu.',
      academicCredit: 'CS102 - 4 AKTS',
      curriculumTopic: 'Dinamik Bellek Tahsisi, Use-After-Free Koruması & Heap Mimarisi',
    },
    gadget: {
      id: 'gadget_hex_debugger',
      name: 'Katot Işınlı Hex Bellek Osiloskobu',
      moduleId: 'module_2_memory',
      isUnlocked: false,
      icon: 'pulse-outline',
      description: 'Mikrodenetleyicinin SRAM ve Heap segmentini canlı dalga formu ve yeşil fosforlu hex kodlarıyla izleyen analiz aygıtı.',
      hardwareSpec: 'Canlı SRAM Dökümü // 100 kHz Bant Genişliği',
    },
  },

  module_3_structs: {
    customer: {
      customerName: 'Arşivci Silas',
      customerRole: 'Merkez Kristal Arşiv & Lojistik Amiri',
      avatarKey: 'silas',
      dialogText:
        'İyi mesailer mühendis dostum! Lojistik ambarımızın kristal bellek kartuşu (Granary Ledger MCU) envanter sandıklarını kaydederken veri paketlerini birbirine karıştırıyor. Maden cevheri yazıyoruz, kereste çıkıyor; miktar sıfırlanıyor. Arşiv kütüğünün yazılımındaki bellek hizalamasını bir inceler misin?',
      physicalSymptom: 'EEPROM kayıtlarında son 4 byte eziliyor; kalite derecesi ve zaman damgası bilgileri bozuluyor.',
      engineerDiagnosis: 'Struct Hizalama & Padding Kaybı — 32-bit işlemciler struct üyelerini doğal sınırlarına (4 byte katlarına) hizalamak için boşluk (padding) ekler. 8-bit ve 32-bit alanların karışık dizilimi yapıyı 10 byte yerine 16 byte\'a şişirmiş, 12 byte\'lık EEPROM sektör sınırını aşırmıştır.',
    },
    moduleData: {
      id: 'module_3_structs',
      academicUnit: '1. Sınıf // Ünite 3: C Structs, Bellek Hizalama (Alignment) & Padding',
      deviceName: 'Ambar Kristal Bellek Kartuşu (Granary Ledger MCU)',
      deviceCode: 'GL-100 // Seri #304',
      physicalSymptom: 'EEPROM sektörü sadece 12 byte destekliyor; 16 byte struct yazılırken 4 byte veri taşması ve veri bozulması yaşanıyor.',
      engineerDiagnosis: 'uint8_t silo_id arkasına 3 byte derleyici dolgusu (padding), uint8_t quality_grade arkasına 3 byte dolgu giriyor. Toplamda 6 byte boşluk israf ediliyor. Değişkenleri büyükten küçüğe sıralamak yapıyı 10 byte\'a indirir.',
      rewardGold: 110,
      rewardExp: 35,
      rewardItemName: 'Kristal Ambar Kütük Kartuşu & Mimari Bellek Posteri',
      brokenCode: `// [BOZUK YAPI]: 8-bit ve 32-bit karışık dizilim (16 bytes)
struct GrainPacket {
    uint8_t silo_id;       // 1 byte + 3 bytes PADDING!
    uint32_t sack_count;   // 4 bytes
    uint8_t quality_grade; // 1 byte + 3 bytes PADDING!
    uint32_t timestamp;    // 4 bytes
}; // Toplam: 16 bytes! (EEPROM blok sınırı ise sadece 12 bytes!)

void write_grain_record(struct GrainPacket *pkt) {
    // 16 byte yazılırken EEPROM 12-byte limitinde taşma ve kesilme oluyor!
    eeprom_raw_write(SLOT_CURRENT, (uint8_t*)pkt, sizeof(struct GrainPacket));
}`,
      brokenCodeLines: [
        { lineNumber: 1, code: 'struct GrainPacket {' },
        { lineNumber: 2, code: '    uint8_t silo_id;       // 1 byte + [3 bytes Boş Dolgu!]', isFaulty: true },
        { lineNumber: 3, code: '    uint32_t sack_count;   // 4 bytes' },
        { lineNumber: 4, code: '    uint8_t quality_grade; // 1 byte + [3 bytes Boş Dolgu!]', isFaulty: true },
        { lineNumber: 5, code: '    uint32_t timestamp;    // 4 bytes' },
        { lineNumber: 6, code: '}; // Toplam boyut: 16 bytes (İsraf!)', isFaulty: true },
        { lineNumber: 7, code: '' },
        { lineNumber: 8, code: 'void write_grain_record(struct GrainPacket *pkt) {' },
        { lineNumber: 9, code: '    eeprom_raw_write(SLOT_CURRENT, (uint8_t*)pkt, sizeof(struct GrainPacket));' },
        { lineNumber: 10, code: '}' },
      ],
      patchOptions: [
        {
          id: 'patch_3_correct',
          title: 'Yama A: Hizalama Optimizasyonu (Büyükten Küçüğe Doğal Sıralama)',
          authorNote: 'Değişkenler 32-bit (uint32_t) önce, 8-bit (uint8_t) sonra gelecek şekilde yeniden dizilir. Dolgu (padding) ortadan kalkar ve yapı 10 byte\'a düşerek 12 byte EEPROM sektörüne tam oturur.',
          isCorrect: true,
          codeDiff: {
            removed: [
              'uint8_t silo_id;',
              'uint32_t sack_count;',
              'uint8_t quality_grade;',
              'uint32_t timestamp;',
            ],
            added: [
              'uint32_t sack_count;   // 4 bytes (offset 0)',
              'uint32_t timestamp;    // 4 bytes (offset 4)',
              'uint8_t silo_id;       // 1 byte  (offset 8)',
              'uint8_t quality_grade; // 1 byte  (offset 9)',
              '// Toplam boyut: 10 bytes! (EEPROM 12-byte sınırına sığdı)',
            ],
          },
          compilerOutcome: {
            success: true,
            exitCode: 0,
            terminalOutput: [
              '[CC] gcc -Wall -Wextra -std=c11 granary.c -o granary.bin',
              '[TEST] Bellek Yerleşim Denetimi (Layout Inspector):',
              '  -> sizeof(struct GrainPacket) hesaplandı: 10 bytes [PASS]',
              '  -> Doğrulama: 10 bytes <= EEPROM_PAGE_LIMIT (12 bytes)',
              '  -> 5,000 lojistik kütük kaydı EEPROM simülatörüne yazıldı.',
              '  -> Veri Bütünlüğü: Kargo miktarı ve kalite verisi %100 örtüşüyor.',
              '[SUCCESS] Padding israfı sıfırlandı; arşiv envanteri kararlı!',
            ],
            hardwareTempC: 35,
            hardwareStatus: 'OPTIMAL',
            feedbackMessage: 'Kusursuz Donanım-Yazılım Entegrasyonu! Struct üyeleri büyükten küçüğe sıralanarak 6 byte padding israfı yok edildi, EEPROM sektörü korundu.',
          },
        },
        {
          id: 'patch_3_faulty_1',
          title: 'Yama B: Veri Tipini uint16_t\'ye Kırpmak',
          authorNote: 'sack_count alanını uint32_t yerine uint16_t yaparak boyut küçültülmeye çalışılmış. Fakat ambarda 65.535 adetten fazla yük olduğunda sayaç taşacaktır!',
          isCorrect: false,
          codeDiff: {
            removed: ['uint32_t sack_count;'],
            added: ['uint16_t sack_count; // Sayı taşması tehlikesi!'],
          },
          compilerOutcome: {
            success: false,
            exitCode: 2,
            terminalOutput: [
              '[CC] gcc -Wall granary.c -o granary.bin',
              '[TEST] Stres Testi: Sezon Sonu 75,000 Adet Yük Simülasyonu...',
              '  -> HATA: uint16_t taşması (Integer Overflow)! 75,000 -> 9,464 olarak kaydedildi.',
              '  -> Arşiv ambarı envanter açığı verdi! Silas itiraz etti.',
              '[ALERT] Kritik Veri Kaybı: Tip aralığı spesifikasyonu karşılamıyor.',
            ],
            hardwareTempC: 78,
            hardwareStatus: 'OVERHEATING',
            feedbackMessage: 'Hatalı Tip Dönüşümü! Sayısal sınırları küçültmek veri taşmasına (Integer Overflow) yol açtı. Doğru yol struct düzenini optimize etmektir.',
          },
        },
        {
          id: 'patch_3_faulty_2',
          title: 'Yama C: İki Parçaya Bölüp Ayrı Yazmak',
          authorNote: 'Struct iki ayrı parçaya bölünmüş fakat atomik yazma yapılmadığı için enerji kesintisinde veriler tutarsız kalıyor.',
          isCorrect: false,
          codeDiff: {
            removed: ['eeprom_raw_write(SLOT_CURRENT, (uint8_t*)pkt, sizeof(struct GrainPacket));'],
            added: [
              'eeprom_raw_write(SLOT_1, (uint8_t*)&pkt->silo_id, 8);',
              'eeprom_raw_write(SLOT_2, (uint8_t*)&pkt->quality_grade, 8);',
            ],
          },
          compilerOutcome: {
            success: false,
            exitCode: 3,
            terminalOutput: [
              '[CC] gcc granary.c -o granary.bin',
              '[TEST] Kesinti Testi...',
              '  -> HATA: Atomik Olmayan Yazma (Non-atomic split write)!',
              '  -> Yarım kalan işlemde kartuş kütük tablosu bozuldu.',
            ],
            hardwareTempC: 80,
            hardwareStatus: 'OVERHEATING',
            feedbackMessage: 'Yetersiz Mimari: Bölünmüş yazma atomikliği bozar ve kartuş indeksini riske atar.',
          },
        },
      ],
    },
    skillNode: {
      id: 'structs_alignment',
      name: 'C Yapıları (Structs) & Bellek Hizalama',
      tier: '1. Sınıf - Modül 3',
      status: 'LOCKED',
      description: 'Veri yapıları, bellek dolgusu (padding), sizeof analizi ve gömülü EEPROM veri paketleme.',
      academicCredit: 'CS103 - 4 AKTS',
      curriculumTopic: 'Memory Layout, Data Alignment, Struct Packing & Serialization',
    },
    gadget: {
      id: 'gadget_granary_ledger',
      name: 'Kristal Ambar Kütük Kartuşu & Posteri',
      moduleId: 'module_3_structs',
      isUnlocked: false,
      icon: 'receipt-outline',
      description: 'Duvarda sergilenen C bellek yerleşimi (Stack, Heap, BSS) şeması ve pirinç korumalı ambar envanter kartuşu.',
      hardwareSpec: '10-Byte Optimize Paket // 100K EEPROM Yazma Döngüsü',
    },
  },

  module_4_testing: {
    customer: {
      customerName: 'Bent Muhafızı Dorian',
      customerRole: 'Kanal Dağıtım & Hidrolik Şebeke Sorumlusu',
      avatarKey: 'dorian',
      dialogText:
        'Selam usta mühendis! Ana kanallara su dağıtan debimetre otomasyonu (Aqueduct Flow Limiter) su çekildiğinde veya bent kapakları tıkandığında sıfıra bölme hatasıyla çöküyor, tüm baraj tahliye kapaklarını açıp istasyonu su altında bırakıyor! Kodda hiçbir denetim, assert ya da test koşucusu yokmuş. Şuna sağlam bir birim test harness ve koruma mekanizması kuramaz mısın?',
      physicalSymptom: 'Sıfır kanal veya negatif debi okunduğunda sistem sıfıra bölme (Divide-by-Zero) hatasıyla kilitlenip tüm tahliye kapaklarını açıyor.',
      engineerDiagnosis: 'Eksik Şartname & Test Senaryosu (Missing Specification & Unit Test Harness) — calculate_water_share() algoritmasında guard clause yok (active_canals == 0 durumunda tanımsız davranış). Sisteme kapsamlı bir test suite (Assert-based Eval) ve koruyucu şartname entegre edilmelidir.',
    },
    moduleData: {
      id: 'module_4_testing',
      academicUnit: '1. Sınıf // Ünite 4: Hata Ayıklama, Şartnameler & Birim Testleri (Unit Testing / Evals)',
      deviceName: 'Kanal Dağıtım Debimetresi (Aqueduct Flow Limiter)',
      deviceCode: 'AFL-4 // Seri #512',
      physicalSymptom: 'Sıfıra bölme (SIGFPE) istisnası donanımı kilitliyor; baraj acil tahliye solenoidleri enerji kesintisiyle açılıyor.',
      engineerDiagnosis: 'Giriş parametreleri (total_inflow, active_canals) doğrulanmadan doğrudan bölme işlemi yapılıyor. Sıfır veya negatif değerler için assert testleri koşulmalı ve koruyucu guard clause yazılmalıdır.',
      rewardGold: 130,
      rewardExp: 40,
      rewardItemName: 'Yazılım Doğrulama Plaketi & Altın Test Terminali',
      brokenCode: `// [TEST EDİLMEMİŞ SAVUNMASIZ KOD]
int calculate_water_share(int total_inflow_liters, int active_canals) {
    // [HATA]: active_canals == 0 olduğunda FPE (Floating Point / Zero Division Exception)!
    // total_inflow_liters < 0 durumunda negatif debi üretilir.
    return total_inflow_liters / active_canals;
}

void process_aqueduct_tick() {
    int flow = read_inflow_sensor();
    int canals = read_active_gates();
    int share = calculate_water_share(flow, canals);
    set_gate_aperture(share);
}`,
      brokenCodeLines: [
        { lineNumber: 1, code: 'int calculate_water_share(int total_inflow_liters, int active_canals) {' },
        { lineNumber: 2, code: '    // ARİZA: Hiçbir girdi denetimi ve test şartnamesi yok!', isFaulty: true },
        { lineNumber: 3, code: '    return total_inflow_liters / active_canals;', isFaulty: true },
        { lineNumber: 4, code: '}' },
        { lineNumber: 5, code: '' },
        { lineNumber: 6, code: 'void process_aqueduct_tick() {' },
        { lineNumber: 7, code: '    int flow = read_inflow_sensor();' },
        { lineNumber: 8, code: '    int canals = read_active_gates();' },
        { lineNumber: 9, code: '    int share = calculate_water_share(flow, canals);' },
        { lineNumber: 10, code: '    set_gate_aperture(share);' },
        { lineNumber: 11, code: '}' },
      ],
      patchOptions: [
        {
          id: 'patch_4_correct',
          title: 'Yama A: Koruyucu Şartname & Kapsamlı Test Senaryosu (Unit Test Suite)',
          authorNote: 'Giriş değerleri (<= 0) kontrol edilerek güvenli 0 değeri döndürülür. Tüm uç durumları (sıfır kanal, negatif akış, normal akış) test eden assert senaryoları koşulur.',
          isCorrect: true,
          codeDiff: {
            removed: ['return total_inflow_liters / active_canals;'],
            added: [
              '    // Koruyucu Şartname (Guard Clause):',
              '    if (active_canals <= 0 || total_inflow_liters <= 0) {',
              '        return 0; // Güvenli acil durum modu',
              '    }',
              '    return total_inflow_liters / active_canals;',
            ],
          },
          compilerOutcome: {
            success: true,
            exitCode: 0,
            terminalOutput: [
              '[CC] gcc -DTEST_MODE aqueduct.c -o test_runner',
              '[EVAL SUITE] Su Dağıtım Şebekesi Test Koşucusu Başlatılıyor...',
              '  -> [RUN] test_zero_canal_division: calculate(1000, 0) == 0 ... [PASS]',
              '  -> [RUN] test_negative_inflow_safety: calculate(-500, 4) == 0 ... [PASS]',
              '  -> [RUN] test_nominal_distribution: calculate(1200, 3) == 400 ... [PASS]',
              '  -> [RUN] test_boundary_extreme: calculate(INT_MAX, 1) ... [PASS]',
              '----------------------------------------------------------',
              '[ASSERT] Tüm 4 Birim Test Senaryosu Hatasız Tamamlandı! (4/4 PASSED)',
              '[SUCCESS] Sıfıra bölme açığı kapatıldı, su şebekesi güvenle devreye alındı.',
            ],
            hardwareTempC: 34,
            hardwareStatus: 'OPTIMAL',
            feedbackMessage: 'Seviye 1 Final Başarısı! Koruyucu şartname ve test senaryoları ile sistem yüksek güvenilirliğe ulaştı. 1. Sınıf Müfredatı tamamlandı!',
          },
        },
        {
          id: 'patch_4_faulty_1',
          title: 'Yama B: Sadece Assert Koymak (Üretimde Çökme Riski)',
          authorNote: 'assert(active_canals > 0) kullanılmış. Ancak üretim kodunda assert abort() çağırarak tüm bendin elektriğini keser ve donanımı kapatır.',
          isCorrect: false,
          codeDiff: {
            removed: ['// ARİZA: Girdi denetimi yok'],
            added: [
              '#include <assert.h>',
              'assert(active_canals > 0); // Üretimde SIGABRT fırlatır!',
            ],
          },
          compilerOutcome: {
            success: false,
            exitCode: 134,
            terminalOutput: [
              '[CC] gcc aqueduct.c -o test_runner',
              '[TEST] test_zero_canal_division Koşuluyor...',
              '  -> assertion failed: active_canals > 0, file aqueduct.c, line 3',
              '  -> Aborted (core dumped). Donanım acil stop konumuna girdi.',
              '[ALERT] Üretim kodunda assert çökmeye neden oldu!',
            ],
            hardwareTempC: 86,
            hardwareStatus: 'OVERHEATING',
            feedbackMessage: 'Hatalı Tasarım! Üretim kodunda assert yerine zarif hata yönetimi (graceful degradation / guard clause) kullanılmalıdır.',
          },
        },
        {
          id: 'patch_4_faulty_2',
          title: 'Yama C: Sabit Değere Zorlamak',
          authorNote: 'Hata durumunda rastgele 100 litre atanmış. Bu durum kuraklıkta dahi kanala su vermeye çalışarak vanaları yakar.',
          isCorrect: false,
          codeDiff: {
            removed: ['return total_inflow_liters / active_canals;'],
            added: ['if (active_canals == 0) return 100; // Rastgele akış!'],
          },
          compilerOutcome: {
            success: false,
            exitCode: 1,
            terminalOutput: [
              '[TEST] test_zero_canal_division...',
              '  -> HATA: Beklenen 0, gelen 100! Kapalı kanala su basıldı.',
              '[ALERT] Test suite başarısız oldu.',
            ],
            hardwareTempC: 80,
            hardwareStatus: 'OVERHEATING',
            feedbackMessage: 'Test Başarısız: Spesifikasyona uyulmadı; kapalı kanala debi verilemez.',
          },
        },
      ],
    },
    skillNode: {
      id: 'testing_evals',
      name: 'Yazılım Doğrulama, Test Senaryoları & Evals',
      tier: '1. Sınıf - Modül 4',
      status: 'LOCKED',
      description: 'Birim testleri (Unit Testing), köşe durum analizi (Edge Cases), savunmacı kodlama ve test koşucuları.',
      academicCredit: 'CS104 - 4 AKTS',
      curriculumTopic: 'TDD, Assertion-driven Testing & Automated Evaluation Harness',
    },
    gadget: {
      id: 'gadget_test_harness',
      name: 'Altın Test Plaketi & Mantık Çözümleyici Terminal',
      moduleId: 'module_4_testing',
      isUnlocked: false,
      icon: 'shield-checkmark-outline',
      description: '1. Sınıf Yazılım Mühendisliği Tamamlama Plaketi ve tezgâhta parıldayan yeşil test doğrulama LED göstergesi.',
      hardwareSpec: 'Otomatik TDD Harness // Bütünleşik Assert Koşucusu',
    },
  },
};

export const MODULE_ORDER: ('module_1_loops' | 'module_2_memory' | 'module_3_structs' | 'module_4_testing')[] = [
  'module_1_loops',
  'module_2_memory',
  'module_3_structs',
  'module_4_testing',
];
