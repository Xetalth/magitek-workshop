import { WorkbenchModuleData, CustomerIssue, SkillNode, RoomGadget, CodePatchOption } from '../types/sdui';
import { CurriculumModuleId, CURRICULUM_MODULE_ORDER } from './curriculumData';

export interface ModuleBundle {
  moduleData: WorkbenchModuleData;
  customer: CustomerIssue;
  skillNode: SkillNode;
  gadget: RoomGadget;
}

/**
 * Samsun Üniversitesi Yazılım Mühendisliği 1. Sınıf Müfredatı
 * Kararlı Görev Havuzu (Pre-Generated Seed Pool)
 *
 * Her modül için en az 3'er adet (1 ana + 2 ek = 12 zengin görev),
 * C11 standardında, derleyici çıktılı, donanım telemetrili ve tam diff'li görev havuzu.
 */
export const MODULE_TASK_POOLS: Record<CurriculumModuleId, ModuleBundle[]> = {
  // =========================================================================
  // MODÜL 1: Temel Kontrol Yapıları & Döngü Sınırları (YZM101/105)
  // NPC: Usta Barnaby (Hidrolik Çark Ustası) // avatarKey: 'barnaby'
  // =========================================================================
  module_1_control: [
    // Görev 1.1: Hydro-Tick 8 (Off-by-One Sınır Hatası)
    {
      customer: {
        customerName: 'Usta Barnaby',
        customerRole: 'Hidrolik Çark Ustası',
        avatarKey: 'barnaby',
        dialogText:
          'Selam genç mühendis! Bizim nehir değirmeninin pirinç çark devir sayacı (Hydro-Tick 8) sabah saatlerinde kusursuz çalışıyor, fakat tam 64. devire ulaştığında aniden donup ana tahrik debriyajını kilitliyor. Çark suyun gücüyle dönüyor ama sayaç kilitlendiği için öğütücü taş durdu!',
        physicalSymptom:
          'Sayaç tam 64. devirde ekranı donduruyor; pirinç debriyaj mekanizması aşırı ısınıp emniyet kilidine geçiyor.',
        engineerDiagnosis:
          'Off-by-One Sınır Hatası — Devir tamponu 64 elemanlı (indis 0..63) tanımlanmışken döngü koşulu (<= BUFFER_SIZE) yapılarak 65. indise yazılmış ve komşu kesme yazmacı (INT_FLAG) ezilmiştir.',
      },
      moduleData: {
        id: 'module_1_control',
        academicUnit: '1. Sınıf // Modül 1: Temel Kontrol Yapıları & Döngü Sınırları (YZM101/105)',
        deviceName: 'Pirinç Çark Devir Sayacı (Hydro-Tick 8)',
        deviceCode: 'MCU-HT8 // Seri #042',
        physicalSymptom:
          'Sayaç her 64 devirde bir kilitleniyor; CPU çekirdeği aşırı ısınıyor ve tampon taşma hatası veriyor.',
        engineerDiagnosis:
          'for (int i = 0; i <= BUFFER_SIZE; i++) döngüsü 65. indise yazmaya çalışıyor. Gömülü C mimarisinde donanımsal dizi sınır denetimi yoktur; bu off-by-one hatası bellek bütünlüğünü bozar.',
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
            authorNote:
              'C dilinde 64 elemanlı dizinin geçerli indisleri 0..63 aralığıdır. Döngü koşulu i < BUFFER_SIZE yapılarak bellek sınırına saygı gösterilir.',
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
              feedbackMessage:
                'Mükemmel Mühendislik Çözümü! Dizi sınırı 0..63 aralığında tutuldu. Kesme yazmacı ezilmekten kurtarıldı.',
            },
          },
          {
            id: 'patch_1_faulty_1',
            title: 'Yama B: Başlangıcı 1 Yapma (i = 1; i <= BUFFER_SIZE)',
            authorNote:
              'Döngü 1\'den başlatılarak 64 iterasyon yapılmak istenmiş. Fakat bu rpm_buffer[0]\'ı boş bırakır ve rpm_buffer[64] indisine yine taşar!',
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
              feedbackMessage:
                'Hatalı Dizi İndeksleme! 0. eleman atlandı ve 64. indis dizinin dışına yazarak donanımı kilitledi.',
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
              feedbackMessage:
                'Kritik Hata: Sonsuz Döngü! Döngü değişkeni artırılmadığı için CPU kilitlendi ve aşırı ısındı.',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_1_control',
        name: 'Temel Kontrol Yapıları & Döngü Sınırları',
        tier: '1. Sınıf - Modül 1',
        status: 'UNLOCKED',
        description: 'Dizi indisleme aritmetiği, off-by-one sınır analizi ve donanımsal taşma kontrolleri.',
        academicCredit: 'YZM101/105 - 4 AKTS',
        curriculumTopic: 'C Dili Kontrol Yapıları, Sınır Koşulları & Döngüler',
      },
      gadget: {
        id: 'gadget_wheel_gauge',
        name: 'Pirinç Gövdeli Mekanik Devir Sayacı',
        moduleId: 'module_1_control',
        isUnlocked: true,
        icon: 'speedometer-outline',
        description:
          'Hidrolik çarkın devir hızını milisaniyelik hassasiyetle analog kadranda gösteren kalibre edilmiş pirinç aparat.',
        hardwareSpec: '64-Pals Döner Kodlayıcı // 0..255 RPM Okuma',
      },
    },

    // Görev 1.2: Press-Regulator Mk.I (Sonsuz Döngü & Güncelleme Eksikliği)
    {
      customer: {
        customerName: 'Usta Barnaby',
        customerRole: 'Hidrolik Çark Ustası',
        avatarKey: 'barnaby',
        dialogText:
          'Mühendis evlat, kazan dairesindeki buhar basınç valfi (Press-Regulator Mk.I) tahliye döngüsüne girince bir daha kapanmıyor! Tüm basınç havaya uçuyor. Kontrol yazılımındaki while döngüsüne bak, basınç değeri içeride hiç güncellenmiyor gibi görünüyor!',
        physicalSymptom:
          'Buhar basınç tahliye valfi sonsuz döngüye girip kilitleniyor; CPU aşırı ısınıp emniyet kapatmasına geçiyor.',
        engineerDiagnosis:
          'Sonsuz Döngü (Infinite Loop) — while (current_pressure > TARGET_PRESSURE) bloğu içinde sensörden yeni basınç okunmamış veya değişken güncellenmemiştir. Döngü sonlanamaz.',
      },
      moduleData: {
        id: 'module_1_control',
        academicUnit: '1. Sınıf // Modül 1: Temel Kontrol Yapıları & Döngü Sınırları (YZM101/105)',
        deviceName: 'Buhar Basınç Düzenleyici Valf (Press-Regulator Mk.I)',
        deviceCode: 'MCU-PR1 // Seri #055',
        physicalSymptom:
          'Valf tahliye modunda kilitleniyor; işlemci sürekli 92°C sıcaklıkta kalıp watchdog reset atıyor.',
        engineerDiagnosis:
          'while (current_pressure > TARGET_PRESSURE) gövdesinde current_pressure = read_analog_gauge() çağrısı eksik. Döngü koşulu sürekli TRUE kalıyor.',
        rewardGold: 80,
        rewardExp: 25,
        rewardItemName: 'Basınç Dengeleme Yay Mekanizması',
        brokenCode: `#define TARGET_PRESSURE 120
static int current_pressure = 160;

void regulate_steam_pressure(void) {
    // ARİZA: Döngü içinde current_pressure güncellenmiyor; sonsuz döngü!
    while (current_pressure > TARGET_PRESSURE) {
        release_steam_puff();
        // current_pressure güncellenmesi UNUTULDU!
    }
    lock_safety_valve();
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#define TARGET_PRESSURE 120' },
          { lineNumber: 2, code: 'static int current_pressure = 160;' },
          { lineNumber: 3, code: '' },
          { lineNumber: 4, code: 'void regulate_steam_pressure(void) {' },
          { lineNumber: 5, code: '    // ARİZA: Döngü değişkeni güncellenmiyor (Sonsuz Döngü)', isFaulty: true },
          { lineNumber: 6, code: '    while (current_pressure > TARGET_PRESSURE) {', isFaulty: true },
          { lineNumber: 7, code: '        release_steam_puff();' },
          { lineNumber: 8, code: '    }' },
          { lineNumber: 9, code: '    lock_safety_valve();' },
          { lineNumber: 10, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_1_2_correct',
            title: 'Yama A: Döngü İçi Sensör Güncellemesi (current_pressure = read_analog_gauge())',
            authorNote:
              'Döngü gövdesine her iterasyonda basıncı yeniden okuyan sensör çağrısı eklenir. Hedef basınca (120 bar) ulaşıldığında döngü temizce biter.',
            isCorrect: true,
            codeDiff: {
              removed: ['        release_steam_puff();'],
              added: [
                '        release_steam_puff();',
                '        current_pressure = read_analog_gauge(); // Döngü ilerleme garantisi',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                '[CC] avr-gcc -Wall -Wextra press_regulator.c -o firmware.elf',
                '[TEST] Basınç Düşüş Simülasyonu Başlatıldı...',
                '  -> Başlangıç: 160 bar, Hedef: 120 bar',
                '  -> İterasyon 1: 150 bar, İterasyon 2: 135 bar, İterasyon 3: 118 bar',
                '  -> Döngü sonlandı. Emniyet kilidi aktif. [PASS]',
                '[SUCCESS] Basınç regülatörü başarıyla stabilize edildi.',
              ],
              hardwareTempC: 36,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Harika Çözüm! Döngü değişkeni sensörden beslenerek döngünün sonlanması sağlandı, işlemci kilitlenmekten kurtarıldı.',
            },
          },
          {
            id: 'patch_1_2_faulty_1',
            title: 'Yama B: Döngü Koşulunu Ters Çevirme (current_pressure < TARGET_PRESSURE)',
            authorNote:
              'Döngü koşulu ters çevrilmiş. 160 bar basınçta döngüye hiç girilmez ve aşırı basınç kazanı patlatır!',
            isCorrect: false,
            codeDiff: {
              removed: ['    while (current_pressure > TARGET_PRESSURE) {'],
              added: ['    while (current_pressure < TARGET_PRESSURE) { // Ters mantık!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                '[CC] avr-gcc press_regulator.c -o firmware.elf',
                '[TEST] Yüksek Basınç Testi: 160 bar...',
                '  -> HATA: Tahliye döngüsü atlandı! Valf kapalı kaldı.',
                '  -> KRİTİK: Basınç 180 bar seviyesine tırmandı! Kazan manometresi çatladı.',
                '[ALERT] Acil mekanik patlama sigortası devrede.',
              ],
              hardwareTempC: 86,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Ters Mantık Hatası! Basınç yüksekken tahliye döngüsüne hiç girilmedi, kazan patlama eşiğine geldi.',
            },
          },
          {
            id: 'patch_1_2_faulty_2',
            title: 'Yama C: Koşulsuz break Eklemek',
            authorNote:
              'Döngü içine doğrudan break konulmuş; sadece 1 defa üfleyip çıkar. Basınç 150 bar seviyesinde kalır.',
            isCorrect: false,
            codeDiff: {
              removed: ['        release_steam_puff();'],
              added: ['        release_steam_puff(); break; // Erken çıkış'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 124,
              terminalOutput: [
                '[CC] avr-gcc press_regulator.c -o firmware.elf',
                '[TEST] Regülasyon Testi...',
                '  -> UYARI: Tek iterasyonda döngü kırıldı. Kalan basınç: 152 bar (Limit: 120 bar).',
                '  -> HATA: Yetersiz tahliye! Basınç emniyet sınırının üstünde kaldı.',
              ],
              hardwareTempC: 81,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Yetersiz Onarım! Döngü tek iterasyonda zorla kırıldığı için basınç hedefe düşürülemedi.',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_1_control',
        name: 'Temel Kontrol Yapıları & Döngü Sınırları',
        tier: '1. Sınıf - Modül 1',
        status: 'UNLOCKED',
        description: 'While döngüleri, bayrak denetimi ve sonsuz döngüden kaçınma stratejileri.',
        academicCredit: 'YZM101/105 - 4 AKTS',
        curriculumTopic: 'C Dili Kontrol Yapıları & Döngü Sınırları',
      },
      gadget: {
        id: 'gadget_wheel_gauge',
        name: 'Pirinç Gövdeli Mekanik Devir Sayacı',
        moduleId: 'module_1_control',
        isUnlocked: true,
        icon: 'speedometer-outline',
        description: 'Basınç ve devir kontrol düzeneklerini izleyen hassas mekanik aparat.',
        hardwareSpec: '64-Pals Döner Kodlayıcı // 0..255 RPM Okuma',
      },
    },

    // Görev 1.3: Safety-Thermo 2 (if-else Mantık & Karşılaştırma Hatası)
    {
      customer: {
        customerName: 'Usta Barnaby',
        customerRole: 'Hidrolik Çark Ustası',
        avatarKey: 'barnaby',
        dialogText:
          'Kazan emniyet termostatımız (Safety-Thermo 2) 90 derecenin üstünde kazanı soğutacağına, tam tersine ateşi körüklüyor! Karşılaştırma koşulunda ters mantık işletilmiş. Kazanın yanma odası alev topuna döndü!',
        physicalSymptom:
          'Sıcaklık 90°C üzerine çıktığında soğutma fıskiyesi yerine kömür besleme mekanizması devreye giriyor.',
        engineerDiagnosis:
          'if-else Mantıksal Koşul Hatası — if (current_temp < CRITICAL_TEMP) koşulu ters kurulmuş; aşırı ısınma durumunda else bloğundaki ısıtıcı körük tetikleniyor.',
      },
      moduleData: {
        id: 'module_1_control',
        academicUnit: '1. Sınıf // Modül 1: Temel Kontrol Yapıları & Döngü Sınırları (YZM101/105)',
        deviceName: 'Kazan Emniyet Termostatı (Safety-Thermo 2)',
        deviceCode: 'MCU-ST2 // Seri #078',
        physicalSymptom:
          'Yüksek sıcaklıkta yangın alarmı suskun kalıyor ve kömür besleyici azami hızda çalışmaya devam ediyor.',
        engineerDiagnosis:
          'Mantıksal karşılaştırma koşulu tersine çevrilmelidir (current_temp >= CRITICAL_TEMP).',
        rewardGold: 80,
        rewardExp: 25,
        rewardItemName: 'Çift Metalik Termal Algılayıcı Şerit',
        brokenCode: `#define CRITICAL_TEMP 90

void evaluate_boiler_safety(int current_temp) {
    // ARİZA: if koşulunda ters mantık (< yerine >= olmalı)
    if (current_temp < CRITICAL_TEMP) {
        trigger_emergency_cooling(); // Sıcaklık normalken fıskiye açılıyor!
    } else {
        maintain_coal_furnace();     // 90°C üstünde ateşi körüklüyor!
    }
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#define CRITICAL_TEMP 90' },
          { lineNumber: 2, code: '' },
          { lineNumber: 3, code: 'void evaluate_boiler_safety(int current_temp) {' },
          { lineNumber: 4, code: '    // ARİZA: Ters mantıksal karşılaştırma (< yerine >=)', isFaulty: true },
          { lineNumber: 5, code: '    if (current_temp < CRITICAL_TEMP) {', isFaulty: true },
          { lineNumber: 6, code: '        trigger_emergency_cooling();' },
          { lineNumber: 7, code: '    } else {' },
          { lineNumber: 8, code: '        maintain_coal_furnace();' },
          { lineNumber: 9, code: '    }' },
          { lineNumber: 10, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_1_3_correct',
            title: 'Yama A: Koşulun Düzeltilmesi (current_temp >= CRITICAL_TEMP)',
            authorNote:
              'Koşul >= olarak düzeltilir; sıcaklık 90°C veya üzerine çıktığında acil soğutma fıskiyesi tetiklenir.',
            isCorrect: true,
            codeDiff: {
              removed: ['    if (current_temp < CRITICAL_TEMP) {'],
              added: ['    if (current_temp >= CRITICAL_TEMP) {'],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                '[CC] avr-gcc -Wall safety_thermo.c -o firmware.elf',
                '[TEST] Termostat Simülasyonu:',
                '  -> Test 1 (85°C): Kömür besleme devrede [PASS]',
                '  -> Test 2 (92°C): Acil soğutma fıskiyesi aktif [PASS]',
                '  -> Test 3 (90°C Eşik Değeri): Soğutma devreye girdi [PASS]',
                '[SUCCESS] Termostat mantığı nominal çalışma durumunda.',
              ],
              hardwareTempC: 35,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Doğru Karşılaştırma! Kritik eşik denetimi doğru mantıkla yapılandırıldı.',
            },
          },
          {
            id: 'patch_1_3_faulty_1',
            title: 'Yama B: Atama Operatörü Kullanmak (current_temp = CRITICAL_TEMP)',
            authorNote:
              'Karşılaştırma yerine atama (=) yapılmış. Bu işlem current_temp değerini zorla 90 yapar ve koşul her zaman doğru döner.',
            isCorrect: false,
            codeDiff: {
              removed: ['    if (current_temp < CRITICAL_TEMP) {'],
              added: ['    if (current_temp = CRITICAL_TEMP) { // Atama hatası!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                '[CC] avr-gcc -Wall -Werror safety_thermo.c -o firmware.elf',
                '  -> UYARI: suggest parentheses around assignment used as truth value [-Wparentheses]',
                '  -> HATA: current_temp ezildi ve fıskiye sürekli açık kaldı!',
              ],
              hardwareTempC: 83,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'C Dilinde Yaygın Hata! Karşılaştırma (== veya >=) yerine atama (=) operatörü kullanıldı.',
            },
          },
          {
            id: 'patch_1_3_faulty_2',
            title: 'Yama C: Sabit Koşul if (1) Yazmak',
            authorNote: 'Koşul her zaman 1 yapılarak fıskiye kalıcı olarak açılmış; kazan hiç ısınamıyor.',
            isCorrect: false,
            codeDiff: {
              removed: ['    if (current_temp < CRITICAL_TEMP) {'],
              added: ['    if (1) { // Sabit koşul'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 2,
              terminalOutput: [
                '[CC] avr-gcc safety_thermo.c -o firmware.elf',
                '[TEST] Sıcaklık Kontrolü: 20°C...',
                '  -> HATA: Fıskiye soğuk kazanı da ıslatıyor! Buhar basıncı üretilemedi.',
              ],
              hardwareTempC: 78,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Mantıksız Çözüm! Sabit doğru koşul kazanın normal çalışmasını imkansız kıldı.',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_1_control',
        name: 'Temel Kontrol Yapıları & Döngü Sınırları',
        tier: '1. Sınıf - Modül 1',
        status: 'UNLOCKED',
        description: 'if-else mantık analizi, ilişkisel operatörler ve güvenlik denetimleri.',
        academicCredit: 'YZM101/105 - 4 AKTS',
        curriculumTopic: 'C Dili Kontrol Yapıları & Döngü Sınırları',
      },
      gadget: {
        id: 'gadget_wheel_gauge',
        name: 'Pirinç Gövdeli Mekanik Devir Sayacı',
        moduleId: 'module_1_control',
        isUnlocked: true,
        icon: 'speedometer-outline',
        description: 'Değirmenin kazan ve çark güvenliğini sağlayan pirinç gösterge.',
        hardwareSpec: '64-Pals Döner Kodlayıcı // 0..255 RPM Okuma',
      },
    },
  ],

  // =========================================================================
  // MODÜL 2: Diziler, Fonksiyonlar & Buffer Sınırları (YZM101/102)
  // NPC: Makinist Linus (Pnömatik Sinyal Teknisyeni) // avatarKey: 'barnaby'
  // =========================================================================
  module_2_arrays: [
    // Görev 2.1: Aero-Buffer 8 (Buffer Boundary Overflow & \0 Eksikliği)
    {
      customer: {
        customerName: 'Makinist Linus',
        customerRole: 'Pnömatik Sinyal Teknisyeni',
        avatarKey: 'barnaby',
        dialogText:
          'Selam mühendis! Pnömatik telemetri tamponumuz (Aero-Buffer 8) sensör dizilerini kaydederken dizinin son elemanını aşıp komşu telemetri baytına yazıyor. Ayrıca dizi fonksiyona aktarılırken string sonlandırıcı (\\0) yazılmadan paket yollandığı için alıcı tarafta bozuk gürültü verisi oluşuyor!',
        physicalSymptom:
          '8 elemanlı diziye 9. telemetri baytı yazılmaya çalışılıyor; string null-terminator (\\0) eksik olduğu için komşu bellek eziliyor.',
        engineerDiagnosis:
          'Dizi İndeks Aşımı & Null-Terminator Eksikliği — Dizi boyutu aşılmış (buffer overflow) ve fonksiyona geçirilen karakter dizisinde \\0 sonlandırıcı konulmamıştır.',
      },
      moduleData: {
        id: 'module_2_arrays',
        academicUnit: '1. Sınıf // Modül 2: Diziler, Fonksiyonlar & Buffer Sınırları (YZM101/102)',
        deviceName: 'Pnömatik Matris Tamponu (Aero-Buffer 8)',
        deviceCode: 'MCU-AB8 // Seri #112',
        physicalSymptom:
          '8 elemanlı diziye 9. telemetri baytı yazılmaya çalışılıyor; string sonlandırıcı (\\0) eksik olduğu için komşu bellek eziliyor.',
        engineerDiagnosis:
          'for (int i = 0; i <= BUFFER_CAPACITY; i++) döngüsü 8 elemanlı dizinin 9. elemanına (indis 8) yazmaya kalkışıyor ve \\0 sonlandırıcı eksik.',
        rewardGold: 85,
        rewardExp: 30,
        rewardItemName: 'Akustik Tampon Göstergesi & Sinyal Lambası',
        brokenCode: `#define BUFFER_CAPACITY 8
static char telemetry_buffer[BUFFER_CAPACITY];

void transmit_packet(char data[], int length) {
    // [HATA]: Sınır kontrolsüz döngü ve '\\0' eksikliği
    for (int i = 0; i <= BUFFER_CAPACITY; i++) {
        telemetry_buffer[i] = data[i];
    }
    send_hardware_uart(telemetry_buffer);
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#define BUFFER_CAPACITY 8' },
          { lineNumber: 2, code: 'static char telemetry_buffer[BUFFER_CAPACITY];' },
          { lineNumber: 3, code: '' },
          { lineNumber: 4, code: 'void transmit_packet(char data[], int length) {' },
          { lineNumber: 5, code: '    // ARİZA: <= BUFFER_CAPACITY tampon sınırını aşar ve \\0 unutulmuştur', isFaulty: true },
          { lineNumber: 6, code: '    for (int i = 0; i <= BUFFER_CAPACITY; i++) {', isFaulty: true },
          { lineNumber: 7, code: '        telemetry_buffer[i] = data[i];' },
          { lineNumber: 8, code: '    }' },
          { lineNumber: 9, code: '    send_hardware_uart(telemetry_buffer);' },
          { lineNumber: 10, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_2_correct',
            title: 'Yama A: Sınır Kontrolü (i < BUFFER_CAPACITY - 1) & Null-Terminator (\\0)',
            authorNote:
              'Tampon sınırı 0..BUFFER_CAPACITY-2 aralığında tutulur ve son indise kesinlikle \\0 sonlandırıcı yerleştirilerek güvenli paket oluşturulur.',
            isCorrect: true,
            codeDiff: {
              removed: ['for (int i = 0; i <= BUFFER_CAPACITY; i++) {'],
              added: [
                'for (int i = 0; i < BUFFER_CAPACITY - 1 && i < length; i++) {',
                '    telemetry_buffer[i] = data[i];',
                '}',
                'telemetry_buffer[BUFFER_CAPACITY - 1] = \'\\0\'; // Null-terminator güvencesi',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                '[CC] avr-gcc -Wall -Wextra -O2 matrix_buffer.c -o firmware.elf',
                '[TEST] Tampon Bütünlüğü ve String \\0 Doğrulaması Koşuluyor...',
                '  -> Test 1: telemetry_buffer[0..6] veri kopyalaması doğrulandı. [PASS]',
                '  -> Test 2: telemetry_buffer[7] null-terminator (\\0) varlığı teyit edildi. [PASS]',
                '  -> Test 3: Komşu bellek yazmacına taşma sıfır. [PASS]',
                '[SUCCESS] Dizi sınırları ve karakter katarı sonlandırıcısı kararlı!',
              ],
              hardwareTempC: 36,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Kusursuz Dizi Yönetimi! Buffer sınırları korundu ve string null-terminator güvenliği sağlandı.',
            },
          },
          {
            id: 'patch_2_faulty_1',
            title: 'Yama B: Sınırı Düzeltmeden En Sona \\0 Eklemek',
            authorNote:
              'Döngü sınırına dokunulmadan sadece en sona \\0 koyulmuş; ancak döngü hala indisi aşarak komşu RAM\'i ezer.',
            isCorrect: false,
            codeDiff: {
              removed: ['for (int i = 0; i <= BUFFER_CAPACITY; i++) {'],
              added: ['for (int i = 0; i <= BUFFER_CAPACITY; i++) telemetry_buffer[i] = data[i]; telemetry_buffer[BUFFER_CAPACITY] = \'\\0\';'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 139,
              terminalOutput: [
                '[CC] avr-gcc matrix_buffer.c -o firmware.elf',
                '[TEST] Simülasyon Başlatıldı...',
                '  -> HATA: telemetry_buffer[8] indisine izinsiz yazma (Buffer Overflow)!',
                '  -> SIGSEGV: Stack smashed / bellek bütünlüğü ihlali.',
              ],
              hardwareTempC: 85,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Hatalı Çözüm! Dizi sınırını aşan yazma işlemi engellenmedi; tampon taşması devam ediyor.',
            },
          },
          {
            id: 'patch_2_faulty_2',
            title: 'Yama C: İndeksi 1\'den Başlatmak',
            authorNote:
              'İndeks 1\'den başlatılarak eleman sayısı azaltılmak istenmiş, fakat 0. indis boş bırakılmış ve veri bozulmuştur.',
            isCorrect: false,
            codeDiff: {
              removed: ['for (int i = 0; i <= BUFFER_CAPACITY; i++) {'],
              added: ['for (int i = 1; i < BUFFER_CAPACITY; i++) {'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                '[CC] avr-gcc matrix_buffer.c -o firmware.elf',
                '[TEST] Veri Bütünlüğü Testi: 0. byte telemetri kaybı tespit edildi!',
                '[ALERT] Paket bozuk iletildi, UART CRC hatası oluştu.',
              ],
              hardwareTempC: 79,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Hatalı İndeksleme: C dizileri sıfır tabanlıdır; 0. indis atlanamaz!',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_2_arrays',
        name: 'Diziler, Fonksiyonlar & Buffer Sınırları',
        tier: '1. Sınıf - Modül 2',
        status: 'LOCKED',
        description: 'Dizi indisleme, karakter dizisi (string) \\0 sonlandırıcı denetimi ve fonksiyon parametreleri.',
        academicCredit: 'YZM101/102 - 4 AKTS',
        curriculumTopic: 'Diziler, Karakter Katarı & Fonksiyonlar',
      },
      gadget: {
        id: 'gadget_matrix_buffer',
        name: 'Pnömatik Matris Tampon Aparatı',
        moduleId: 'module_2_arrays',
        isUnlocked: false,
        icon: 'layers-outline',
        description: 'Dizi elemanlarını ve tampon bloklarını LED ışıklı kadranlarla gösteren pnomatik analiz modülü.',
        hardwareSpec: '8-Byte Çift Tampon // Null-Terminator Doğrulayıcı',
      },
    },

    // Görev 2.2: Tele-Parser 16 (String Null-Terminator \0 Unutulması)
    {
      customer: {
        customerName: 'Makinist Linus',
        customerRole: 'Pnömatik Sinyal Teknisyeni',
        avatarKey: 'barnaby',
        dialogText:
          'İstasyonlar arası buhar telgraf paketlerini ayrıştırırken telgraf katarının sonuna null-terminator (\'\\0\') sonlandırıcısı konulmamış! Ekrandaki mesajın arkasından anlamsız çöp karakterler ve komşu bellek dökümü akıyor!',
        physicalSymptom:
          'Telgraf mesajı ekranda gösterilirken mesajın bittiği yerde durmayıp bellekteki rastgele baytları okuyor; ekranda bozuk karakterler parıldıyor.',
        engineerDiagnosis:
          'String Null-Terminator (\\0) Eksikliği — C dilinde karakter dizileri \'\\0\' baytı ile sonlandırılmalıdır. Dizi kopyalandıktan sonra sonuna \'\\0\' konulmadığı için ekran sürücüsü belleği taramaya devam ediyor.',
      },
      moduleData: {
        id: 'module_2_arrays',
        academicUnit: '1. Sınıf // Modül 2: Diziler, Fonksiyonlar & Buffer Sınırları (YZM101/102)',
        deviceName: 'Buhar Telgraf Metin Ayrıştırıcısı (Tele-Parser 16)',
        deviceCode: 'MCU-TP16 // Seri #145',
        physicalSymptom:
          'Ekrana basılan mesajlar rastgele karakterlerle uzuyor; RAM sonlandırma bayrağı bulunamadığı için tampon taşması oluşuyor.',
        engineerDiagnosis:
          'Karakter dizisi kopyalaması sonrasında packet_str[i] = \'\\0\' sonlandırıcı ataması yapılmalıdır.',
        rewardGold: 85,
        rewardExp: 30,
        rewardItemName: 'Pirinç Telgraf Alıcı Kartuşu',
        brokenCode: `#define MAX_CHARS 16
static char packet_str[MAX_CHARS + 1];

void unpack_telegram_text(char raw_stream[], int len) {
    for (int i = 0; i < len && i < MAX_CHARS; i++) {
        packet_str[i] = raw_stream[i];
    }
    // ARİZA: packet_str sonuna '\\0' eklenmedi!
    // Gömülü ekran sürücüsü RAM'deki çöp verileri ekrana basıyor!
    render_brass_display(packet_str);
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#define MAX_CHARS 16' },
          { lineNumber: 2, code: 'static char packet_str[MAX_CHARS + 1];' },
          { lineNumber: 3, code: '' },
          { lineNumber: 4, code: 'void unpack_telegram_text(char raw_stream[], int len) {' },
          { lineNumber: 5, code: '    for (int i = 0; i < len && i < MAX_CHARS; i++) {' },
          { lineNumber: 6, code: '        packet_str[i] = raw_stream[i];' },
          { lineNumber: 7, code: '    }' },
          { lineNumber: 8, code: '    // ARİZA: packet_str sonuna null-terminator (\\0) konulmadı!', isFaulty: true },
          { lineNumber: 9, code: '    render_brass_display(packet_str);' },
          { lineNumber: 10, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_2_2_correct',
            title: 'Yama A: Null-Terminator Ekleme (packet_str[kopyalanan] = \'\\0\')',
            authorNote:
              'Kopyalanan son karakterin hemen arkasına \'\\0\' yazılarak string güvenle sonlandırılır.',
            isCorrect: true,
            codeDiff: {
              removed: ['    render_brass_display(packet_str);'],
              added: [
                '    int end_idx = (len < MAX_CHARS) ? len : MAX_CHARS;',
                '    packet_str[end_idx] = \'\\0\'; // Null-terminator güvencesi',
                '    render_brass_display(packet_str);',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                '[CC] avr-gcc -Wall tele_parser.c -o firmware.elf',
                '[TEST] Metin Gösterimi Test Ediliyor: "IMDAT_KAZAN_SICAK"...',
                '  -> Metin uzunluğu: 16 karakter',
                '  -> Sonlandırıcı bayt: packet_str[16] = 0x00 [PASS]',
                '  -> Ekran çıktısı temiz, komşu RAM okunmadı. [PASS]',
                '[SUCCESS] Telgraf paketi hatasız ayrıştırıldı.',
              ],
              hardwareTempC: 36,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Mükemmel C String Yönetimi! Null-terminator (\'\\0\') eklenerek bellekten çöp okunması engellendi.',
            },
          },
          {
            id: 'patch_2_2_faulty_1',
            title: 'Yama B: Başına \'\\0\' Koymak (packet_str[0] = \'\\0\')',
            authorNote: 'Dizinin ilk karakterine \'\\0\' konulmuş; mesaj tamamen boş string haline gelir!',
            isCorrect: false,
            codeDiff: {
              removed: ['    render_brass_display(packet_str);'],
              added: ['    packet_str[0] = \'\\0\'; render_brass_display(packet_str);'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                '[CC] avr-gcc tele_parser.c -o firmware.elf',
                '[TEST] Mesaj Okuma: Boş katar tespit edildi (strlen = 0)!',
                '[ALERT] Telgraf ekranı bomboş kaldı, sinyal alınamadı.',
              ],
              hardwareTempC: 80,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Hatalı Konum! Başa konan \'\\0\' tüm mesajı sıfırladı.',
            },
          },
          {
            id: 'patch_2_2_faulty_2',
            title: 'Yama C: Boşluk Karakteri (\' \') Eklemek',
            authorNote: '\'\\0\' yerine boşluk karakteri (\' \') eklenmiş; bu karakter stringi sonlandırmaz!',
            isCorrect: false,
            codeDiff: {
              removed: ['    render_brass_display(packet_str);'],
              added: ['    packet_str[MAX_CHARS] = \' \'; render_brass_display(packet_str);'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 139,
              terminalOutput: [
                '[CC] avr-gcc tele_parser.c -o firmware.elf',
                '[TEST] Ekran Sürücüsü: 0x20 boşluk baytı sonlandırıcı değildir!',
                '  -> Ekran çöp veri taramaya devam etti. Buffer Overflow.',
              ],
              hardwareTempC: 84,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Hatalı Karakter! Boşluk (\' \') ASCII 32\'dir; C stringlerini sadece 0x00 (\'\\0\') sonlandırır.',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_2_arrays',
        name: 'Diziler, Fonksiyonlar & Buffer Sınırları',
        tier: '1. Sınıf - Modül 2',
        status: 'LOCKED',
        description: 'String null-terminator (\'\\0\') mekanizması ve güvenli karakter katarı işleme.',
        academicCredit: 'YZM101/102 - 4 AKTS',
        curriculumTopic: 'Diziler, Karakter Katarı & Fonksiyonlar',
      },
      gadget: {
        id: 'gadget_matrix_buffer',
        name: 'Pnömatik Matris Tampon Aparatı',
        moduleId: 'module_2_arrays',
        isUnlocked: false,
        icon: 'layers-outline',
        description: 'Karakter dizisi ve tampon bloklarını izleyen pnomatik telemetri modülü.',
        hardwareSpec: '8-Byte Çift Tampon // Null-Terminator Doğrulayıcı',
      },
    },

    // Görev 2.3: Lumen-Grid 3x3 (Çok Boyutlu Dizi Satır/Sütun Sınır Aşımı)
    {
      customer: {
        customerName: 'Makinist Linus',
        customerRole: 'Pnömatik Sinyal Teknisyeni',
        avatarKey: 'barnaby',
        dialogText:
          'Linus burada! Atölyenin 3x3 pirinç sinyal lambası matrisini (Lumen-Grid 3x3) sıfırlayan fonksiyonda satır indisi sınırın dışına taşıyor! r <= GRID_ROWS yazılmış, 3. satıra yazmaya kalkınca yanındaki lamba sürücü entegresi yanıyor!',
        physicalSymptom:
          '3x3 matrisin son sırası sıfırlanırken cihaz donuyor ve donanım kesme hatası (SIGSEGV) veriyor.',
        engineerDiagnosis:
          'İki Boyutlu Dizi Satır Sınır Aşımı — 3x3 matriste geçerli satır indisleri 0..2 aralığındadır. for (int r = 0; r <= GRID_ROWS; r++) döngüsü 3. satıra erişerek komşu RAM\'i ezmiştir.',
      },
      moduleData: {
        id: 'module_2_arrays',
        academicUnit: '1. Sınıf // Modül 2: Diziler, Fonksiyonlar & Buffer Sınırları (YZM101/102)',
        deviceName: 'Magitek Işık Matrisi Kontrolcüsü (Lumen-Grid 3x3)',
        deviceCode: 'MCU-LG3 // Seri #180',
        physicalSymptom:
          'Matris sıfırlama komutu verildiğinde 10. lambaya geçersiz akım gidiyor ve sürücü kartuşu ısınıyor.',
        engineerDiagnosis:
          'r <= GRID_ROWS yerine kesinlikle r < GRID_ROWS kullanılmalıdır.',
        rewardGold: 85,
        rewardExp: 30,
        rewardItemName: 'Pirinç 3x3 Matris Gösterge Tablası',
        brokenCode: `#define GRID_ROWS 3
#define GRID_COLS 3
static uint8_t lumen_matrix[GRID_ROWS][GRID_COLS];

void clear_lumen_matrix(void) {
    // ARİZA: r <= GRID_ROWS matris sınırını aşar (indis 3 geçersiz!)
    for (int r = 0; r <= GRID_ROWS; r++) {
        for (int c = 0; c < GRID_COLS; c++) {
            lumen_matrix[r][c] = 0;
        }
    }
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#define GRID_ROWS 3' },
          { lineNumber: 2, code: '#define GRID_COLS 3' },
          { lineNumber: 3, code: 'static uint8_t lumen_matrix[GRID_ROWS][GRID_COLS];' },
          { lineNumber: 4, code: '' },
          { lineNumber: 5, code: 'void clear_lumen_matrix(void) {' },
          { lineNumber: 6, code: '    // ARİZA: r <= GRID_ROWS 3x3 sınırını aşar (Off-by-one 2D)', isFaulty: true },
          { lineNumber: 7, code: '    for (int r = 0; r <= GRID_ROWS; r++) {', isFaulty: true },
          { lineNumber: 8, code: '        for (int c = 0; c < GRID_COLS; c++) {' },
          { lineNumber: 9, code: '            lumen_matrix[r][c] = 0;' },
          { lineNumber: 10, code: '        }' },
          { lineNumber: 11, code: '    }' },
          { lineNumber: 12, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_2_3_correct',
            title: 'Yama A: Kesin Satır Sınır Kontrolü (r < GRID_ROWS)',
            authorNote:
              'Satır döngü koşulu r < GRID_ROWS yapılarak yalnızca geçerli 0, 1, 2 indisleri taranır.',
            isCorrect: true,
            codeDiff: {
              removed: ['    for (int r = 0; r <= GRID_ROWS; r++) {'],
              added: ['    for (int r = 0; r < GRID_ROWS; r++) {'],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                '[CC] avr-gcc -Wall lumen_grid.c -o firmware.elf',
                '[TEST] 3x3 Matris Bellek Doğrulaması:',
                '  -> Toplam hücre: 9 eleman [0..2][0..2]',
                '  -> Satır 0..2 sıfırlandı. lumen_matrix[3][0] erişimi engellendi. [PASS]',
                '[SUCCESS] Işık matrisi güvenli şekilde sıfırlandı.',
              ],
              hardwareTempC: 36,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Başarılı 2D Dizi Sınır Çözümü! Satır indisi 0..2 aralığına sınırlandı.',
            },
          },
          {
            id: 'patch_2_3_faulty_1',
            title: 'Yama B: Sütun Sınırını da <= Yapmak (c <= GRID_COLS)',
            authorNote: 'Hem satır hem sütun sınırını taşırarak matris dışına 7 eleman daha fazla yazar!',
            isCorrect: false,
            codeDiff: {
              removed: ['        for (int c = 0; c < GRID_COLS; c++) {'],
              added: ['        for (int c = 0; c <= GRID_COLS; c++) { // Çift taşma!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 139,
              terminalOutput: [
                '[CC] avr-gcc lumen_grid.c -o firmware.elf',
                '[TEST] İki Boyutlu Bellek Aşımı: 16 elemana yazıldı (Kapasite: 9)!',
                '[ALERT] Donanım koruma sigortası attı.',
              ],
              hardwareTempC: 86,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Kritik Hata: Taşma daha da büyütüldü!',
            },
          },
          {
            id: 'patch_2_3_faulty_2',
            title: 'Yama C: Satır ve Sütun İndislerini Ters Çevirmek [c][r]',
            authorNote: 'Döngü sınırını düzeltmeden indisleri ters çevirmiş; sınır aşımı devam eder.',
            isCorrect: false,
            codeDiff: {
              removed: ['            lumen_matrix[r][c] = 0;'],
              added: ['            lumen_matrix[c][r] = 0; // Ters indisleme'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                '[CC] avr-gcc lumen_grid.c -o firmware.elf',
                '[TEST] Ters İndis Bellek İhlali: Sütun indisi satır kapasitesini aştı.',
              ],
              hardwareTempC: 81,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Hatalı Yaklaşım: İndis yerini değiştirmek sınır aşımını çözmez.',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_2_arrays',
        name: 'Diziler, Fonksiyonlar & Buffer Sınırları',
        tier: '1. Sınıf - Modül 2',
        status: 'LOCKED',
        description: 'Çok boyutlu dizi bellek organizasyonu ve satır/sütun indis sınırları.',
        academicCredit: 'YZM101/102 - 4 AKTS',
        curriculumTopic: 'Diziler, Karakter Katarı & Fonksiyonlar',
      },
      gadget: {
        id: 'gadget_matrix_buffer',
        name: 'Pnömatik Matris Tampon Aparatı',
        moduleId: 'module_2_arrays',
        isUnlocked: false,
        icon: 'layers-outline',
        description: '3x3 lamba matrisini ve telemetri tamponlarını simüle eden aygıt.',
        hardwareSpec: '8-Byte Çift Tampon // Null-Terminator Doğrulayıcı',
      },
    },
  ],

  // =========================================================================
  // MODÜL 3: İşaretçiler (Pointers) & Bellek Adresleme (YZM102)
  // NPC: Baş Makinist Vane (Basınç İstasyonu Şefi) // avatarKey: 'vane'
  // =========================================================================
  module_3_pointers: [
    // Görev 3.1: Aero-Press Valve v2 (malloc/free Bellek Sızıntısı)
    {
      customer: {
        customerName: 'Baş Makinist Vane',
        customerRole: 'Basınç İstasyonu Şefi',
        avatarKey: 'vane',
        dialogText:
          'Tezgâhına kuvvet mühendis! Hidrolik hatlar çalışıyor fakat ana buhar basınç tahliye valfimiz (Aero-Press Valve v2) kontrolden çıktı. Cihaz açıldıktan yirmi dakika sonra SRAM tükenip kilitleniyor, valf tüm buharı istasyona boşaltıyor. Basınç kazanı patlarsa tüm çark dairesi havaya uçar!',
        physicalSymptom:
          'Sistem 20 dakika çalıştıktan sonra SRAM tükenip kilitleniyor; acil durum buhar tahliye diyaframı gürültüyle açılıyor.',
        engineerDiagnosis:
          'Heap Bellek Sızıntısı (Memory Leak) — Her sensör okumasında malloc() ile dinamik alan tahsis ediliyor fakat işlem bitince free() çağrılmıyor. 16 KB mikrodenetleyici SRAM sınırı hızla aşılıyor.',
      },
      moduleData: {
        id: 'module_3_pointers',
        academicUnit: '1. Sınıf // Modül 3: İşaretçiler (Pointers) & Bellek Adresleme (YZM102)',
        deviceName: 'Buhar Basınç Tahliye Valfi (Aero-Press Valve v2)',
        deviceCode: 'MCU-AP2 // Seri #108',
        physicalSymptom:
          '16 KB mikrodenetleyici belleği saniyeler içinde tükeniyor; heap yığını çöküyor (Heap Exhaustion).',
        engineerDiagnosis:
          'Her basınç telemetrisinde dinamik tahsis edilen SensorLog yapısı free() ile iade edilmiyor. Fonksiyon yerel göstericisi stack\'ten kaybolunca tahsis edilen alan sahipsiz kalıyor.',
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
          { lineNumber: 15, code: '}', isFaulty: true },
        ],
        patchOptions: [
          {
            id: 'patch_3_correct',
            title: 'Yama A: Düzgün Temizlik (free(log) ve Güvenli Pointer Sıfırlama)',
            authorNote:
              'malloc ile alınan blok işlem bitiminde mutlaka free(log) ile heap havuzuna iade edilmelidir. Sızıntı sıfırlanır, SRAM stabil kalır.',
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
                '  -> HEAP ÖZETİ: in use at exit: 0 bytes in 0 blocks',
                '  -> TÜM BELLEK TEMİZLENDİ: Bellek sızıntısı kalmadı! [PASS]',
                '[SUCCESS] Basınç valfi SRAM tüketimi stabilize edildi.',
              ],
              hardwareTempC: 38,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Kusursuz Dinamik Bellek Yönetimi! Her malloc() için bir free() işletildi.',
            },
          },
          {
            id: 'patch_3_faulty_1',
            title: 'Yama B: Erken free() Yapma (Use-After-Free Tehlikesi)',
            authorNote:
              'free(log) çağrısı basınç kontrolünden ÖNCE yapılmış. Serbest bırakılmış bellek alanına okuma yapılmaya çalışılıyor (Use-After-Free).',
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
                '  -> HATA: heap-use-after-free on address 0x602000000010',
                '[CRITICAL] Tanımsız Davranış (UB): Rastgele veri okundu!',
              ],
              hardwareTempC: 88,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Tehlikeli Hata: Use-After-Free! Bellek bloğu daha okunmadan serbest bırakılmış.',
            },
          },
          {
            id: 'patch_3_faulty_2',
            title: 'Yama C: Göstericiyi NULL Yapmak (Sızıntıyı Gizleme)',
            authorNote:
              'free(log) çağırmadan sadece log = NULL yapılmış. Bu işlem heap alanını serbest bırakmaz, sızıntıyı kalıcı hale getirir.',
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
                '[TEST] LeakSanitizer Raporu: 80,000 bytes bellek sızıntısı!',
              ],
              hardwareTempC: 82,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Hatalı Çözüm: log = NULL demek belleği serbest bırakmaz!',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_3_pointers',
        name: 'İşaretçiler (Pointers) & Bellek Adresleme',
        tier: '1. Sınıf - Modül 3',
        status: 'LOCKED',
        description: 'Pointer aritmetiği, malloc/free yaşam döngüsü ve Heap optimizasyonu.',
        academicCredit: 'YZM102 - 5 AKTS',
        curriculumTopic: 'Dinamik Bellek Tahsisi & Heap Mimarisi',
      },
      gadget: {
        id: 'gadget_hex_debugger',
        name: 'Katot Işınlı Hex Bellek Osiloskobu',
        moduleId: 'module_3_pointers',
        isUnlocked: false,
        icon: 'pulse-outline',
        description: 'Mikrodenetleyicinin SRAM ve Heap segmentini canlı dalga formu ile izleyen analiz aygıtı.',
        hardwareSpec: 'Canlı SRAM Dökümü // 100 kHz Bant Genişliği',
      },
    },

    // Görev 3.2: Aero-Sense MCU (NULL Pointer Dereference)
    {
      customer: {
        customerName: 'Baş Makinist Vane',
        customerRole: 'Basınç İstasyonu Şefi',
        avatarKey: 'vane',
        dialogText:
          'Vane konuşuyor! Basınç hattındaki sensör kablosu titrediğinde poll fonksiyonu NULL adres dönüyor. Bizim kontrolcü ise NULL adres olup olmadığını denetlemeden doğrudan *sensor_ptr ile okuma yapıyor ve tüm kart SIGSEGV ile çöküyor!',
        physicalSymptom:
          'Kablo temasında dalgalanma olunca işlemci kilitlenip reset atıyor; basınç göstergesi sıfıra çakılıyor.',
        engineerDiagnosis:
          'NULL Pointer Dereference — poll_pressure_transducer() fonksiyonundan dönen işaretçi kontrol edilmeden doğrudan dereference edilmiştir. sensor_ptr == NULL kontrolü şarttır.',
      },
      moduleData: {
        id: 'module_3_pointers',
        academicUnit: '1. Sınıf // Modül 3: İşaretçiler (Pointers) & Bellek Adresleme (YZM102)',
        deviceName: 'Basınç Sensör Adresleyicisi (Aero-Sense MCU)',
        deviceCode: 'MCU-AS4 // Seri #215',
        physicalSymptom:
          'Sensör hattında anlık sinyal kaybı olduğunda MCU HardFault kesmesine düşüyor ve sistemi kapatıyor.',
        engineerDiagnosis:
          'İşaretçi dereference edilmeden önce if (sensor_ptr == NULL) kontrolü eklenmelidir.',
        rewardGold: 95,
        rewardExp: 30,
        rewardItemName: 'Yüksek Basınç Altın Kontak Sensör Ucu',
        brokenCode: `int* poll_pressure_transducer(int channel_id);

void update_pressure_channel(int ch) {
    int *sensor_ptr = poll_pressure_transducer(ch);
    // ARİZA: sensor_ptr NULL kontrolü yapılmadan doğrudan dereference ediliyor!
    int current_val = *sensor_ptr; // sensor_ptr NULL ise ÇÖKME (Crash)!
    commit_pressure_reading(ch, current_val);
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: 'int* poll_pressure_transducer(int channel_id);' },
          { lineNumber: 2, code: '' },
          { lineNumber: 3, code: 'void update_pressure_channel(int ch) {' },
          { lineNumber: 4, code: '    int *sensor_ptr = poll_pressure_transducer(ch);' },
          { lineNumber: 5, code: '    // ARİZA: NULL pointer kontrolsüz dereference', isFaulty: true },
          { lineNumber: 6, code: '    int current_val = *sensor_ptr; // sensor_ptr NULL ise ÇÖKME', isFaulty: true },
          { lineNumber: 7, code: '    commit_pressure_reading(ch, current_val);' },
          { lineNumber: 8, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_3_2_correct',
            title: 'Yama A: NULL İşaretçi Kontrolü ve Güvenli Dönüş (if (sensor_ptr == NULL))',
            authorNote:
              'sensor_ptr kullanılmadan önce NULL kontrolünden geçirilir; arıza durumunda hata kaydı düşülüp fonksiyondan çıkılır.',
            isCorrect: true,
            codeDiff: {
              removed: ['    int current_val = *sensor_ptr;'],
              added: [
                '    if (sensor_ptr == NULL) {',
                '        log_sensor_disconnect(ch);',
                '        return; // Güvenli erken çıkış',
                '    }',
                '    int current_val = *sensor_ptr;',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                '[CC] avr-gcc -Wall aero_sense.c -o firmware.elf',
                '[TEST] Temassızlık Simülasyonu (NULL Transducer)...',
                '  -> sensor_ptr = 0x00000000 algılandı.',
                '  -> Güvenli blok devreye girdi: log_sensor_disconnect çağrıldı. [PASS]',
                '  -> SIGSEGV / HardFault engellendi! [PASS]',
                '[SUCCESS] NULL pointer koruması doğrulandı.',
              ],
              hardwareTempC: 36,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Örnek Gösterici Koruması! NULL kontrolü ile sistem çökmesi (Crash) engellendi.',
            },
          },
          {
            id: 'patch_3_2_faulty_1',
            title: 'Yama B: Değeri Sıfırla Kıyaslamak if (*sensor_ptr == 0)',
            authorNote: 'İşaretçiyi kontrol etmek yerine *sensor_ptr ile içeriğini kontrol etmeye çalışmış; NULL ise yine çöker!',
            isCorrect: false,
            codeDiff: {
              removed: ['    int current_val = *sensor_ptr;'],
              added: ['    if (*sensor_ptr == 0) return; int current_val = *sensor_ptr;'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 139,
              terminalOutput: [
                '[CC] avr-gcc aero_sense.c -o firmware.elf',
                '[TEST] NULL Adres Erişimi: *sensor_ptr okuma sırasında çöktü!',
                '  -> SIGSEGV: Segmentation fault (core dumped)',
              ],
              hardwareTempC: 87,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Hatalı Kontrol! NULL olan bir işaretçinin değerine (*ptr) bakılamaz.',
            },
          },
          {
            id: 'patch_3_2_faulty_2',
            title: 'Yama C: İşaretçiye 0 Atamak (sensor_ptr = 0)',
            authorNote: 'İşaretçiyi zorla sıfırlamış; çökmeyi kesinleştirir.',
            isCorrect: false,
            codeDiff: {
              removed: ['    int current_val = *sensor_ptr;'],
              added: ['    sensor_ptr = 0; int current_val = *sensor_ptr;'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 139,
              terminalOutput: [
                '[CC] avr-gcc aero_sense.c -o firmware.elf',
                '[ALERT] Sıfır adresine zorla yazma/okuma denendi!',
              ],
              hardwareTempC: 89,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Kritik Hata: İşaretçi bilerek sıfırlandı!',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_3_pointers',
        name: 'İşaretçiler (Pointers) & Bellek Adresleme',
        tier: '1. Sınıf - Modül 3',
        status: 'LOCKED',
        description: 'NULL gösterici denetimi ve geçersiz adres erişimi önleme teknikleri.',
        academicCredit: 'YZM102 - 5 AKTS',
        curriculumTopic: 'İşaretçiler & Bellek Güvenliği',
      },
      gadget: {
        id: 'gadget_hex_debugger',
        name: 'Katot Işınlı Hex Bellek Osiloskobu',
        moduleId: 'module_3_pointers',
        isUnlocked: false,
        icon: 'pulse-outline',
        description: 'Sensör adreslerini ve bellek segmentlerini izleyen katot tüplü osiloskop.',
        hardwareSpec: 'Canlı SRAM Dökümü // 100 kHz Bant Genişliği',
      },
    },

    // Görev 3.3: Galvano-Calibrator 4 (Adres & Değer Operatörleri Karışıklığı)
    {
      customer: {
        customerName: 'Baş Makinist Vane',
        customerRole: 'Basınç İstasyonu Şefi',
        avatarKey: 'vane',
        dialogText:
          'Akım kalibrasyon kartuşumuzda (Galvano-Calibrator 4) işaretçi adresi ile değeri birbirine karışmış! Fonksiyonun içine gelen adrese yazmak yerine yerel değişkenin adresi işaretçiye atanıyor (*calib_target yerine calib_target = &offset). Değer ana karta asla yansımıyor!',
        physicalSymptom:
          'Kalibrasyon potansiyometresi çevrilse de galvanik akım sabit 0 mA kalıyor; offset değeri saklanamıyor.',
        engineerDiagnosis:
          'Adres Operatörleri (& ve *) Karışıklığı — İşaretçinin işaret ettiği değere erişmek için dolaylı erişim (*) operatörü kullanılmalıdır. calib_target = &offset yerel adresi kopyalar ve çağrıcı fonksiyona hiçbir veri aktarılmaz.',
      },
      moduleData: {
        id: 'module_3_pointers',
        academicUnit: '1. Sınıf // Modül 3: İşaretçiler (Pointers) & Bellek Adresleme (YZM102)',
        deviceName: 'Galvanik Akım Kalibratörü (Galvano-Calibrator 4)',
        deviceCode: 'MCU-GC4 // Seri #250',
        physicalSymptom:
          'Kalibrasyon değeri uygulanmıyor; fonksiyon çıkışında işaret edilen bellek güncellenmemiş kalıyor.',
        engineerDiagnosis:
          'calib_target = &offset yerine *calib_target += offset yapılmalıdır.',
        rewardGold: 95,
        rewardExp: 30,
        rewardItemName: 'Galvanik Akım Şönt Direnci',
        brokenCode: `void apply_current_calibration(int *calib_target, int offset) {
    // ARİZA: Değere erişim (*) yerine işaretçiye yerel adres (&) atanmış!
    calib_target = &offset; // Fonksiyon bittiğinde offset stack'ten silinir!
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: 'void apply_current_calibration(int *calib_target, int offset) {' },
          { lineNumber: 2, code: '    // ARİZA: calib_target = &offset çağrıcıya yansımaz (* eksik)', isFaulty: true },
          { lineNumber: 3, code: '    calib_target = &offset;', isFaulty: true },
          { lineNumber: 4, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_3_3_correct',
            title: 'Yama A: Dolaylı Erişim ile Değeri Güncelleme (*calib_target += offset)',
            authorNote:
              '*calib_target kullanılarak işaret edilen gerçek bellek hücresi doğrudan güncellenir.',
            isCorrect: true,
            codeDiff: {
              removed: ['    calib_target = &offset;'],
              added: ['    *calib_target += offset; // İşaret edilen değeri güncelle'],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                '[CC] avr-gcc -Wall galvano.c -o firmware.elf',
                '[TEST] Kalibrasyon Değeri Doğrulama:',
                '  -> Başlangıç akımı: 100 mA, Offset: +15 mA',
                '  -> *calib_target sonucu: 115 mA [PASS]',
                '[SUCCESS] İşaretçi üzerinden bellek hücresi başarıyla güncellendi.',
              ],
              hardwareTempC: 36,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Harika İşaretçi Kullanımı! Dolaylı erişim (*) ile çağrıcı değişkeni güncellendi.',
            },
          },
          {
            id: 'patch_3_3_faulty_1',
            title: 'Yama B: İşaretçiye Doğrudan Tamsayı Atamak (calib_target = offset)',
            authorNote: 'İşaretçiye adres yerine ham tamsayı atanmış; derleyici tür uyuşmazlığı uyarısı verir.',
            isCorrect: false,
            codeDiff: {
              removed: ['    calib_target = &offset;'],
              added: ['    calib_target = offset; // Tür uyuşmazlığı'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                '[CC] avr-gcc galvano.c -o firmware.elf',
                '  -> HATA: assignment makes pointer from integer without a cast [-Wint-conversion]',
              ],
              hardwareTempC: 83,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Derleme Hatası: İşaretçiye tamsayı atanamaz!',
            },
          },
          {
            id: 'patch_3_3_faulty_2',
            title: 'Yama C: İşaretçinin Adresini Değiştirmek (&calib_target = offset)',
            authorNote: '&calib_target lvalue değildir; derlenemez.',
            isCorrect: false,
            codeDiff: {
              removed: ['    calib_target = &offset;'],
              added: ['    &calib_target = offset; // Geçersiz lvalue'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                '[CC] avr-gcc galvano.c -o firmware.elf',
                '  -> HATA: lvalue required as left operand of assignment',
              ],
              hardwareTempC: 85,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Sözdizimi Hatası: Adres operatörü (&) atamanın solunda kullanılamaz.',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_3_pointers',
        name: 'İşaretçiler (Pointers) & Bellek Adresleme',
        tier: '1. Sınıf - Modül 3',
        status: 'LOCKED',
        description: 'Adres operatörü (&) ve dolaylı erişim operatörü (*) mekaniği.',
        academicCredit: 'YZM102 - 5 AKTS',
        curriculumTopic: 'İşaretçiler & Adres Aritmetiği',
      },
      gadget: {
        id: 'gadget_hex_debugger',
        name: 'Katot Işınlı Hex Bellek Osiloskobu',
        moduleId: 'module_3_pointers',
        isUnlocked: false,
        icon: 'pulse-outline',
        description: 'İşaretçi adreslerini ve değişken hücresi değişimlerini gösteren hex ekran.',
        hardwareSpec: 'Canlı SRAM Dökümü // 100 kHz Bant Genişliği',
      },
    },
  ],

  // =========================================================================
  // MODÜL 4: Yapılar (Struct) & Bit Düzeyi İşlemler (YZM102/104)
  // NPC: Arşivci Silas (Kristal Bellek Amiri) // avatarKey: 'silas'
  // =========================================================================
  module_4_structs_bits: [
    // Görev 4.1: Granary Ledger MCU (Struct Padding & Bellek Hizalaması)
    {
      customer: {
        customerName: 'Arşivci Silas',
        customerRole: 'Kristal Bellek Amiri',
        avatarKey: 'silas',
        dialogText:
          'İyi mesailer mühendis dostum! Lojistik ambarımızın kristal bellek kartuşu (Granary Ledger MCU) envanter sandıklarını kaydederken veri paketlerini birbirine karıştırıyor. Maden cevheri yazıyoruz, kereste çıkıyor; miktar sıfırlanıyor. Arşiv kütüğünün yazılımındaki bellek hizalamasını ve durum bayraklarını bir inceler misin?',
        physicalSymptom:
          'EEPROM kayıtlarında son 4 byte eziliyor; kalite derecesi ve zaman damgası bilgileri bozuluyor.',
        engineerDiagnosis:
          'Struct Hizalama & Padding Kaybı — 32-bit işlemciler struct üyelerini doğal sınırlarına (4 byte katlarına) hizalamak için boşluk (padding) ekler. 8-bit ve 32-bit alanların karışık dizilimi yapıyı 10 byte yerine 16 byte\'a şişirmiş, 12 byte\'lık EEPROM sektör sınırını aşırmıştır.',
      },
      moduleData: {
        id: 'module_4_structs_bits',
        academicUnit: '1. Sınıf // Modül 4: Yapılar (Struct) & Bit Düzeyi İşlemler (YZM102/104)',
        deviceName: 'Ambar Kristal Bellek Kartuşu (Granary Ledger MCU)',
        deviceCode: 'GL-100 // Seri #304',
        physicalSymptom:
          'EEPROM sektörü sadece 12 byte destekliyor; 16 byte struct yazılırken 4 byte veri taşması ve veri bozulması yaşanıyor.',
        engineerDiagnosis:
          'uint8_t silo_id arkasına 3 byte derleyici dolgusu (padding), uint8_t quality_grade arkasına 3 byte dolgu giriyor. Toplamda 6 byte boşluk israf ediliyor. Değişkenleri büyükten küçüğe sıralamak yapıyı 10 byte\'a indirir.',
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
            id: 'patch_4_correct',
            title: 'Yama A: Hizalama Optimizasyonu (Büyükten Küçüğe Doğal Sıralama)',
            authorNote:
              'Değişkenler 32-bit (uint32_t) önce, 8-bit (uint8_t) sonra gelecek şekilde yeniden dizilir. Dolgu (padding) ortadan kalkar ve yapı 10 byte\'a düşerek 12 byte EEPROM sektörüne tam oturur.',
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
                '  -> Veri Bütünlüğü: Kargo miktarı ve kalite verisi %100 örtüşüyor.',
                '[SUCCESS] Padding israfı sıfırlandı; arşiv envanteri kararlı!',
              ],
              hardwareTempC: 35,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Kusursuz Donanım-Yazılım Entegrasyonu! Struct üyeleri büyükten küçüğe sıralanarak padding yok edildi.',
            },
          },
          {
            id: 'patch_4_faulty_1',
            title: 'Yama B: Veri Tipini uint16_t\'ye Kırpmak',
            authorNote:
              'sack_count alanını uint32_t yerine uint16_t yaparak boyut küçültülmeye çalışılmış. Fakat ambarda 65.535 adetten fazla yük olduğunda sayaç taşacaktır!',
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
                '[TEST] Stres Testi: 75,000 Adet Yük Simülasyonu...',
                '  -> HATA: uint16_t taşması (Integer Overflow)! 75,000 -> 9,464 olarak kaydedildi.',
              ],
              hardwareTempC: 78,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Hatalı Tip Dönüşümü! Sayısal sınırları küçültmek veri taşmasına yol açtı.',
            },
          },
          {
            id: 'patch_4_faulty_2',
            title: 'Yama C: İki Parçaya Bölüp Ayrı Yazmak',
            authorNote:
              'Struct iki ayrı parçaya bölünmüş fakat atomik yazma yapılmadığı için enerji kesintisinde veriler tutarsız kalıyor.',
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
                '[TEST] Kesinti Testi: Atomik olmayan bölünmüş yazma tespit edildi.',
              ],
              hardwareTempC: 80,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Yetersiz Mimari: Bölünmüş yazma atomikliği bozar.',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_4_structs_bits',
        name: 'Yapılar (Struct) & Bit Düzeyi İşlemler',
        tier: '1. Sınıf - Modül 4',
        status: 'LOCKED',
        description: 'Veri yapıları, bellek dolgusu (padding), sizeof analizi ve durum yazmaçları.',
        academicCredit: 'YZM102/104 - 5 AKTS',
        curriculumTopic: 'Memory Layout, Data Alignment, Struct Packing & Bitwise Operations',
      },
      gadget: {
        id: 'gadget_granary_ledger',
        name: 'Kristal Ambar Kütük Kartuşu & Posteri',
        moduleId: 'module_4_structs_bits',
        isUnlocked: false,
        icon: 'receipt-outline',
        description: 'Duvarda sergilenen C bellek yerleşimi şeması ve pirinç korumalı ambar envanter kartuşu.',
        hardwareSpec: '10-Byte Optimize Paket // 100K EEPROM Yazma Döngüsü',
      },
    },

    // Görev 4.2: Aero-Gyro Mk.II (Bit Maskeleme Bitwise OR vs Assignment)
    {
      customer: {
        customerName: 'Arşivci Silas',
        customerRole: 'Kristal Bellek Amiri',
        avatarKey: 'silas',
        dialogText:
          'Silas burada! Pirinç jiroskop durum yazmacında READY (Hazır) durum bayrağını aktif etmek isterken yazmaçtaki diğer tüm sensör bayrakları (CALIBRATED, STABILIZED) sıfırlanıyor! Makinist bayrağı açmak için bitwise OR (|=) yerine doğrudan atama (=) yapmış!',
        physicalSymptom:
          'Jiroskop "Hazır" moduna geçer geçmez kalibrasyon ve denge bayrakları kayboluyor; platform dengesini kaybedip sarsılıyor.',
        engineerDiagnosis:
          'Bit Maskeleme (Bitwise OR vs Assignment) Hatası — Donanım durum yazmaçlarında tek bir biti set etmek için |= (OR) kullanılmalıdır. = (atama) kullanılırsa komşu bayraklar sıfırlanır.',
      },
      moduleData: {
        id: 'module_4_structs_bits',
        academicUnit: '1. Sınıf // Modül 4: Yapılar (Struct) & Bit Düzeyi İşlemler (YZM102/104)',
        deviceName: 'Pirinç Jiroskop Bayrak Yazmacı (Aero-Gyro Mk.II)',
        deviceCode: 'MCU-AG2 // Seri #342',
        physicalSymptom:
          'Durum yazmacı 0x07 (Tümü Hazır) olması gerekirken 0x04 değerine düşüyor ve stabilizasyon motoru duruyor.',
        engineerDiagnosis:
          'gyro_status_reg = FLAG_READY yerine gyro_status_reg |= FLAG_READY kullanılmalıdır.',
        rewardGold: 115,
        rewardExp: 35,
        rewardItemName: 'Pirinç Jiroskop Denge Çarkı & Rotoru',
        brokenCode: `#define FLAG_CALIBRATED (1 << 0) // 0x01: Kalibre Edildi
#define FLAG_STABILIZED (1 << 1) // 0x02: Dengelendi
#define FLAG_READY      (1 << 2) // 0x04: Çalışmaya Hazır

static uint8_t gyro_status_reg = 0x03; // Calibrated + Stabilized aktif

void activate_gyro_ready_state(void) {
    // ARİZA: |= yerine = kullanılmış; mevcut bayraklar (0x03) silinip sadece 0x04 yazılıyor!
    gyro_status_reg = FLAG_READY;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#define FLAG_CALIBRATED (1 << 0)' },
          { lineNumber: 2, code: '#define FLAG_STABILIZED (1 << 1)' },
          { lineNumber: 3, code: '#define FLAG_READY      (1 << 2)' },
          { lineNumber: 4, code: 'static uint8_t gyro_status_reg = 0x03;' },
          { lineNumber: 5, code: 'void activate_gyro_ready_state(void) {' },
          { lineNumber: 6, code: '    // ARİZA: Bitwise OR yerine atama (=) ile diğer bitler siliniyor', isFaulty: true },
          { lineNumber: 7, code: '    gyro_status_reg = FLAG_READY;', isFaulty: true },
          { lineNumber: 8, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_4_2_correct',
            title: 'Yama A: Bitwise OR ile Bayrağı Set Etme (gyro_status_reg |= FLAG_READY)',
            authorNote:
              'Bitwise OR (|=) operatörü mevcut 0x01 ve 0x02 bayraklarını korurken 0x04 bitini de aktif ederek yazmacı 0x07 (Tam Kararlı) yapar.',
            isCorrect: true,
            codeDiff: {
              removed: ['    gyro_status_reg = FLAG_READY;'],
              added: ['    gyro_status_reg |= FLAG_READY; // Bitwise OR ile koruyarak set et'],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                '[CC] avr-gcc -Wall aero_gyro.c -o firmware.elf',
                '[TEST] Durum Yazmacı Denetimi:',
                '  -> Başlangıç: 0x03 (CALIBRATED | STABILIZED)',
                '  -> İşlem Sonrası: 0x07 (CALIBRATED | STABILIZED | READY) [PASS]',
                '[SUCCESS] Jiroskop durum bayrakları korundu ve hazır moda geçti.',
              ],
              hardwareTempC: 36,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Kusursuz Bit Düzeyi İşlem! Bitwise OR (|=) ile diğer sensör bayrakları ezilmeden korundu.',
            },
          },
          {
            id: 'patch_4_2_faulty_1',
            title: 'Yama B: Bitwise AND ile Maskelemek (gyro_status_reg &= FLAG_READY)',
            authorNote: 'Bitwise AND kullanılmış; 0x03 & 0x04 sonucu yazmaç 0x00 olur ve tüm sistem kapanır!',
            isCorrect: false,
            codeDiff: {
              removed: ['    gyro_status_reg = FLAG_READY;'],
              added: ['    gyro_status_reg &= FLAG_READY; // Yazmaç sıfırlanır!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                '[CC] avr-gcc aero_gyro.c -o firmware.elf',
                '[TEST] HATA: gyro_status_reg = 0x00 oldu. Jiroskop güç kesti!',
              ],
              hardwareTempC: 84,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Hatalı Operatör! Bitwise AND biti set etmek için değil, filtrelemek içindir.',
            },
          },
          {
            id: 'patch_4_2_faulty_2',
            title: 'Yama C: Toplama (+) Operatörü Kullanmak',
            authorNote: 'Eğer bayrak zaten 1 ise toplama işlemi komşu bite taşma (carry) yaptırır.',
            isCorrect: false,
            codeDiff: {
              removed: ['    gyro_status_reg = FLAG_READY;'],
              added: ['    gyro_status_reg += FLAG_READY; // Taşma riski!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 2,
              terminalOutput: [
                '[CC] avr-gcc aero_gyro.c -o firmware.elf',
                '[TEST] UYARI: Tekrar çağrıda bit taşması oluştu (0x07 + 0x04 = 0x0B).',
              ],
              hardwareTempC: 82,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Tehlikeli Yaklaşım: Gömülü yazmaçlarda toplama (+) yerine bitwise OR (|=) kullanılmalıdır.',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_4_structs_bits',
        name: 'Yapılar (Struct) & Bit Düzeyi İşlemler',
        tier: '1. Sınıf - Modül 4',
        status: 'LOCKED',
        description: 'Bit maskeleme (AND, OR, XOR), durum bayrağı yazmaçları ve donanım kontrolü.',
        academicCredit: 'YZM102/104 - 5 AKTS',
        curriculumTopic: 'Bitwise Operations & Hardware Registers',
      },
      gadget: {
        id: 'gadget_granary_ledger',
        name: 'Kristal Ambar Kütük Kartuşu & Posteri',
        moduleId: 'module_4_structs_bits',
        isUnlocked: false,
        icon: 'receipt-outline',
        description: 'Donanım yazmaçlarını ve bit maskeleme şemalarını gösteren kristal modül.',
        hardwareSpec: '10-Byte Optimize Paket // 100K EEPROM Yazma Döngüsü',
      },
    },

    // Görev 4.3: Opto-Decoder 8 (Bit Kaydırma <<, >> ve Taşma Hatası)
    {
      customer: {
        customerName: 'Arşivci Silas',
        customerRole: 'Kristal Bellek Amiri',
        avatarKey: 'silas',
        dialogText:
          'Optik sensör dekoderimizin (Opto-Decoder 8) 8-bitlik veri kanalında telemetri paketini ayıklarken 8-bitlik kaydırma sınırının ötesine çıkılmış! 8-bitlik yazmaçta sola 8 bit kaydırma yapıldığı için tüm telemetri verisi sıfırlanıp yok oluyor!',
        physicalSymptom:
          'Optik sinyal hattından okunan telemetri paketi her zaman 0x00 olarak çözümleniyor; optik hat körleşiyor.',
        engineerDiagnosis:
          'Bit Kaydırma (<<, >>) & Taşma Hatası — 8-bitlik veri tipinde (raw_frame << 8) işlemi taşmaya neden olur ve tüm bitler dışarı itilir. Üst nibble\'ı almak için sağa kaydırma (>> 4) ve maskeleme yapılmalıdır.',
      },
      moduleData: {
        id: 'module_4_structs_bits',
        academicUnit: '1. Sınıf // Modül 4: Yapılar (Struct) & Bit Düzeyi İşlemler (YZM102/104)',
        deviceName: 'Optik Sinyal Dekoderi (Opto-Decoder 8)',
        deviceCode: 'MCU-OD8 // Seri #390',
        physicalSymptom:
          'Kanal verisi sürekli 0x00; üst 4 bitlik kanal kodu sola kaydırılırken 8-bit taşma ile kayboluyor.',
        engineerDiagnosis:
          '(raw_frame << 8) & CHANNEL_MASK yerine (raw_frame >> 4) & CHANNEL_MASK kullanılmalıdır.',
        rewardGold: 115,
        rewardExp: 35,
        rewardItemName: 'Kristal Prizma Optik Filtre Aynası',
        brokenCode: `#define CHANNEL_MASK 0x0F // Alt 4 bit maskesi

uint8_t decode_optical_channel(uint8_t raw_frame) {
    // ARİZA: 8-bitlik değişkende sola 8 bit kaydırma yapılmış; tüm veri 0x00 olur!
    uint8_t channel_data = (raw_frame << 8) & CHANNEL_MASK;
    return channel_data;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#define CHANNEL_MASK 0x0F // Alt 4 bit maskesi' },
          { lineNumber: 2, code: '' },
          { lineNumber: 3, code: 'uint8_t decode_optical_channel(uint8_t raw_frame) {' },
          { lineNumber: 4, code: '    // ARİZA: 8-bit sınırını aşan sola kaydırma (<< 8)', isFaulty: true },
          { lineNumber: 5, code: '    uint8_t channel_data = (raw_frame << 8) & CHANNEL_MASK;', isFaulty: true },
          { lineNumber: 6, code: '    return channel_data;' },
          { lineNumber: 7, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_4_3_correct',
            title: 'Yama A: Sağa 4 Bit Kaydırma ve Maskeleme ((raw_frame >> 4) & CHANNEL_MASK)',
            authorNote:
              'Üst 4 bitlik telemetri verisi sağa 4 bit kaydırılarak alt 4 bite indirilir ve 0x0F maskesi ile güvenle ayıklanır.',
            isCorrect: true,
            codeDiff: {
              removed: ['    uint8_t channel_data = (raw_frame << 8) & CHANNEL_MASK;'],
              added: ['    uint8_t channel_data = (raw_frame >> 4) & CHANNEL_MASK; // Doğru sağa kaydırma'],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                '[CC] avr-gcc -Wall opto_decoder.c -o firmware.elf',
                '[TEST] Paket Ayrıştırma: raw_frame = 0xB4...',
                '  -> Sağa 4 bit kaydırma: 0x0B',
                '  -> 0x0F maskesi: channel_data = 0x0B (Kanal 11) [PASS]',
                '[SUCCESS] Optik kanal verisi başarıyla çözüldü.',
              ],
              hardwareTempC: 35,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Kusursuz Bit Kaydırma Çözümü! Sağa 4 bit kaydırma ile telemetri kanalı kurtarıldı.',
            },
          },
          {
            id: 'patch_4_3_faulty_1',
            title: 'Yama B: Sola 4 Bit Kaydırmak ((raw_frame << 4))',
            authorNote: 'Sola 4 bit kaydırma üst bitleri 8-bit sınırının dışına taşırarak yok eder.',
            isCorrect: false,
            codeDiff: {
              removed: ['    uint8_t channel_data = (raw_frame << 8) & CHANNEL_MASK;'],
              added: ['    uint8_t channel_data = (raw_frame << 4) & CHANNEL_MASK; // Sol taşma'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                '[CC] avr-gcc opto_decoder.c -o firmware.elf',
                '[TEST] HATA: 0xB4 sola 4 kaydırıldı -> 0x40. Alt maske ile sonuç 0x00 oldu!',
              ],
              hardwareTempC: 81,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Hatalı Yön! Sola kaydırmak üst bitleri taşırıp sıfırlar.',
            },
          },
          {
            id: 'patch_4_3_faulty_2',
            title: 'Yama C: Maskeyi 0x00 Yapmak',
            authorNote: 'Maske sıfırlanmış; çıkış her zaman 0 olur.',
            isCorrect: false,
            codeDiff: {
              removed: ['    uint8_t channel_data = (raw_frame << 8) & CHANNEL_MASK;'],
              added: ['    uint8_t channel_data = raw_frame & 0x00;'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 2,
              terminalOutput: [
                '[CC] avr-gcc opto_decoder.c -o firmware.elf',
                '[TEST] HATA: Sabit 0x00 çıktısı üretildi.',
              ],
              hardwareTempC: 79,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Etkisiz Operasyon: Sıfır ile VE işlemi tüm bilgiyi yok eder.',
            },
          },
        ],
      },
      skillNode: {
        id: 'module_4_structs_bits',
        name: 'Yapılar (Struct) & Bit Düzeyi İşlemler',
        tier: '1. Sınıf - Modül 4',
        status: 'LOCKED',
        description: 'Bit kaydırma (<<, >>), veri maskeleme ve donanım kod çözümü.',
        academicCredit: 'YZM102/104 - 5 AKTS',
        curriculumTopic: 'Bitwise Shifting, Masking & Decoding',
      },
      gadget: {
        id: 'gadget_granary_ledger',
        name: 'Kristal Ambar Kütük Kartuşu & Posteri',
        moduleId: 'module_4_structs_bits',
        isUnlocked: false,
        icon: 'receipt-outline',
        description: 'Bit kaydırma ve optik telemetri donanımını izleyen analiz kartuşu.',
        hardwareSpec: '10-Byte Optimize Paket // 100K EEPROM Yazma Döngüsü',
      },
    },
  ],
};

/**
 * Modül Görev Havuzundan Belirtilen İndisteki veya Sıradaki Görevi Döndürür
 */
export function getModuleTaskFromPool(moduleId: string, taskIndex: number = 0): ModuleBundle {
  const baseKey = CURRICULUM_MODULE_ORDER.includes(moduleId as CurriculumModuleId)
    ? (moduleId as CurriculumModuleId)
    : 'module_1_control';
  const pool = MODULE_TASK_POOLS[baseKey] || MODULE_TASK_POOLS.module_1_control;
  const idx = Math.abs(taskIndex) % pool.length;
  return pool[idx];
}

/**
 * Geriye dönük uyumluluk için varsayılan modül demetleri (Varsayılan olarak ilk görev)
 */
export const CURRICULUM_MODULES: Record<string, ModuleBundle> = {
  module_1_control: MODULE_TASK_POOLS.module_1_control[0],
  module_2_arrays: MODULE_TASK_POOLS.module_2_arrays[0],
  module_3_pointers: MODULE_TASK_POOLS.module_3_pointers[0],
  module_4_structs_bits: MODULE_TASK_POOLS.module_4_structs_bits[0],
};

// Geriye dönük uyumluluk takma adları (Legacy compatibility aliases)
CURRICULUM_MODULES.module_1_loops = CURRICULUM_MODULES.module_1_control;
CURRICULUM_MODULES.module_2_memory = CURRICULUM_MODULES.module_3_pointers;
CURRICULUM_MODULES.module_3_structs = CURRICULUM_MODULES.module_4_structs_bits;
CURRICULUM_MODULES.module_4_testing = CURRICULUM_MODULES.module_4_structs_bits;

export const MODULE_ORDER: CurriculumModuleId[] = [...CURRICULUM_MODULE_ORDER];

/**
 * Şık dizisini Fisher-Yates algoritması ile klonlayıp rastgele karıştırır (Shuffle)
 * ve şık başlıklarını dinamik olarak "Yama A:", "Yama B:", "Yama C:" olarak harflendirir.
 */
export function shufflePatchOptions(options: CodePatchOption[]): CodePatchOption[] {
  if (!Array.isArray(options) || options.length <= 1) {
    return options || [];
  }

  // Derin klonlama (Orijinal havuz verisini korumak için)
  const cloned: CodePatchOption[] = options.map((opt) => ({
    ...opt,
    codeDiff: {
      removed: [...opt.codeDiff.removed],
      added: [...opt.codeDiff.added],
    },
    compilerOutcome: {
      ...opt.compilerOutcome,
      terminalOutput: [...opt.compilerOutcome.terminalOutput],
    },
  }));

  // Fisher-Yates shuffle algoritması
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }

  // Şıkları dinamik olarak Yama A, Yama B, Yama C olarak adlandır
  const letters = ['A', 'B', 'C', 'D', 'E'];
  cloned.forEach((opt, idx) => {
    const cleanTitle = opt.title.replace(/^Yama\s+[A-Z]:\s*/i, '').trim();
    opt.title = `Yama ${letters[idx] || (idx + 1)}: ${cleanTitle}`;
  });

  return cloned;
}
