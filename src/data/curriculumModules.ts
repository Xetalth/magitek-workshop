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
  // NPC: Makinist Linus (Pnömatik Sinyal Teknisyeni) // avatarKey: 'linus'
  // =========================================================================
  module_2_arrays: [
    // Görev 2.1: Aero-Buffer 8 (Buffer Boundary Overflow & \0 Eksikliği)
    {
      customer: {
        customerName: 'Makinist Linus',
        customerRole: 'Pnömatik Sinyal Teknisyeni',
        avatarKey: 'linus',
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
        avatarKey: 'linus',
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
        avatarKey: 'linus',
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
  // =========================================================================
  // 2. AŞAMA - MODÜL 1: Sınıflar, Kurucular & Kapsülleme (YZM203)
  // NPC: Kurye Jax (Varoş Pnömatik Hat Kuryesi) // avatarKey: 'jax'
  // =========================================================================
  stage2_module_1_oop_classes: [
    {
      customer: {
        customerName: 'Kurye Jax',
        customerRole: 'Varoş Pnömatik Hat Kuryesi',
        avatarKey: 'jax',
        dialogText:
          'Selam usta! Mahalle Dükkanı açılmış dediler, soluğu burada aldım. Pnömatik kargo kapsülümüzün takip kartında C++ sınıfı kurucusunda (Constructor) hedef basınç ve kimlik üyesi ilklendirilmeden belleğe basılıyor! Kargo boruya fırlatıldığında rasgele çöp değer yüzünden basınç kilidi patlıyor!',
        physicalSymptom:
          'Pnömatik kargo tüpü fırlatılırken kapsül nesnesinin basınç değişkeni rastgele çöp (garbage) değerle açılıyor; basınç valfi acil durdurma (E-STOP) veriyor.',
        engineerDiagnosis:
          'Eksik Kurucu İlklendirmesi — CargoCapsule sınıfının kurucusunda target_pressure ve package_id üyeleri ilklendirme listesinde (initializer list) atanmamış, nesne tanımlandığında yığındaki rastgele bellek değerini koruyor.',
      },
      moduleData: {
        id: 'stage2_module_1_oop_classes',
        academicUnit: '2. Aşama // Modül 1: Sınıflar & Kurucu İlklendirmesi (YZM203)',
        deviceName: 'Pnömatik Kargo Kapsül Takipçisi (Aero-Parcel v2)',
        deviceCode: 'MCU-OOP-101 // Seri #201',
        physicalSymptom:
          'Kapsül nesnesi oluşturulduğunda target_pressure_psi değişkeni ilklendirilmediği için rasgele değer alıyor ve güvenlik denetimi çöküyor.',
        engineerDiagnosis:
          'CargoCapsule() kurucu metodunda üye ilklendirme listesi eksik; kapsül güvenli başlangıç basıncına (45 PSI) set edilmelidir.',
        rewardGold: 90,
        rewardExp: 35,
        rewardItemName: 'Pirinç Kargo Basınç Mührü',
        brokenCode: `#include <iostream>

class CargoCapsule {
private:
    int package_id;
    int target_pressure_psi;
    bool is_sealed;

public:
    // HATA: package_id ve target_pressure_psi ilklendirilmemis!
    CargoCapsule() {
        is_sealed = false;
        // target_pressure_psi yigindaki cop degerde kaliyor!
    }

    void seal_and_pressurize(int id, int pressure) {
        package_id = id;
        target_pressure_psi = pressure;
        is_sealed = true;
    }

    bool check_safety() {
        if (!is_sealed || target_pressure_psi > 120 || target_pressure_psi < 40) {
            return false;
        }
        return true;
    }
};

int main() {
    CargoCapsule cap;
    cap.seal_and_pressurize(1042, 65);
    if (!cap.check_safety()) {
        std::cout << "[HATA] Guvensiz kapsul! E-STOP devrede.\\n";
        return 1;
    }
    std::cout << "[BASARILI] Kapsul nominal basincta firlatildi!\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '' },
          { lineNumber: 3, code: 'class CargoCapsule {' },
          { lineNumber: 4, code: 'private:' },
          { lineNumber: 5, code: '    int package_id;' },
          { lineNumber: 6, code: '    int target_pressure_psi;' },
          { lineNumber: 7, code: '    bool is_sealed;' },
          { lineNumber: 8, code: '' },
          { lineNumber: 9, code: 'public:' },
          { lineNumber: 10, code: '    // HATA: Kurucu eksik ilklendirilmis' },
          { lineNumber: 11, code: '    CargoCapsule() {', isFaulty: true },
          { lineNumber: 12, code: '        is_sealed = false;', isFaulty: true },
          { lineNumber: 13, code: '    }', isFaulty: true },
          { lineNumber: 14, code: '' },
          { lineNumber: 15, code: '    void seal_and_pressurize(int id, int pressure) {' },
          { lineNumber: 16, code: '        package_id = id;' },
          { lineNumber: 17, code: '        target_pressure_psi = pressure;' },
          { lineNumber: 18, code: '        is_sealed = true;' },
          { lineNumber: 19, code: '    }' },
          { lineNumber: 20, code: '' },
          { lineNumber: 21, code: '    bool check_safety() {' },
          { lineNumber: 22, code: '        if (!is_sealed || target_pressure_psi > 120 || target_pressure_psi < 40) {' },
          { lineNumber: 23, code: '            return false;' },
          { lineNumber: 24, code: '        }' },
          { lineNumber: 25, code: '        return true;' },
          { lineNumber: 26, code: '    }' },
          { lineNumber: 27, code: '};' },
        ],
        patchOptions: [
          {
            id: 'patch_oop1_a',
            title: 'Yama A: Constructor Initializer List ile Güvenli İlklendirme',
            authorNote: 'Kurucu metoda member initializer list ekleyerek package_id=0, target_pressure_psi=45 ve is_sealed=false başlangıç değerlerini garanti altına alır.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '    CargoCapsule() {',
                '        is_sealed = false;',
                '    }',
              ],
              added: [
                '    CargoCapsule() : package_id(0), target_pressure_psi(45), is_sealed(false) {',
                '        // Tum uye degiskenler guvenli sekilde ilklendirildi',
                '    }',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -Wall -Wextra -O2 main.cpp -o aero_parcel',
                '[DERLEME: BASARILI] Sifir hata, sifir uyari.',
                './aero_parcel',
                '[DONANIM TESTI] Kapsul nesnesi yaratildi (ID: 1042, Basinc: 65 PSI).',
                '[BASARILI] Kapsul nominal basincta firlatildi! Pnomatik hat acik.',
              ],
              hardwareTempC: 44,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Mükemmel Nesne İlklendirmesi: Initializer list ile tüm üyeler güvenle başlatıldı, basınç kilidi nominal.',
            },
          },
          {
            id: 'patch_oop1_b',
            title: 'Yama B: Sadece Konsol Çıktısı Ekle (Eksik İlklendirme)',
            authorNote: 'Kurucu gövdesine sadece print ekler fakat target_pressure_psi değişkenine başlangıç değeri vermez.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '    CargoCapsule() {',
                '        is_sealed = false;',
                '    }',
              ],
              added: [
                '    CargoCapsule() {',
                '        is_sealed = false;',
                '        std::cout << "[LOG] Kapsul olusturuldu.\\n";',
                '    }',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 -Wall -Wextra main.cpp -o aero_parcel',
                'main.cpp: In constructor CargoCapsule::CargoCapsule():',
                'main.cpp:11: warning: package_id and target_pressure_psi will be uninitialized in this constructor [-Wuninitialized]',
                './aero_parcel',
                '[HATA] Basinc degiskeni cop deger (0x7FFE2B) iceriyor!',
                '[HATA] Guvensiz kapsul! E-STOP devrede.',
              ],
              hardwareTempC: 78,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Eksik İlklendirme: Basınç değişkeni çöp değerde kaldı ve basınç valfi aşırı ısınarak acil durdurmaya geçti.',
            },
          },
          {
            id: 'patch_oop1_c',
            title: 'Yama C: Hatalı Gövde İçi Sözdizimi',
            authorNote: 'Kurucu fonksiyonu int türünde tanımlamaya çalışarak sözdizimi hatasına sebep olur.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '    CargoCapsule() {',
                '        is_sealed = false;',
                '    }',
              ],
              added: [
                '    int CargoCapsule() {',
                '        this.target_pressure_psi = 45;',
                '    }',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 2,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o aero_parcel',
                'main.cpp:11:9: error: return type specification for constructor invalid',
                'main.cpp:12:13: error: request for member target_pressure_psi in this, which is of pointer type CargoCapsule*',
                '[DERLEME HATASI] Kod derlenemedi. Cikis kodu: 2',
              ],
              hardwareTempC: 88,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Sözdizimi Hatası: Kurucu metoda int dönüş tipi verilmez.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage2_module_1_oop_classes',
        name: 'Sınıflar & Kurucular',
        tier: '2. Aşama - Modül 1',
        status: 'UNLOCKED',
        description: 'C++ sınıf yapıları, kurucu metotlarda ilklendirme listesi ve nesne bütünlüğü.',
        academicCredit: 'YZM203 - 5 AKTS',
        curriculumTopic: 'Nesne Yönelimli Programlama: Sınıflar, Kurucular & Kapsülleme',
      },
      gadget: {
        id: 'gadget_aero_parcel',
        name: 'Pirinç Kargo Kapsül Takipçisi',
        moduleId: 'stage2_module_1_oop_classes',
        isUnlocked: false,
        icon: 'cube-outline',
        description: 'Varoş hatlarında kargo kapsüllerinin fırlatma basıncını denetleyen C++ sınıf denetleyicisi.',
        hardwareSpec: 'Pnömatik Kargo Tüpü // Constructor Korumalı',
      },
    },
  ],

  // =========================================================================
  // 2. AŞAMA - MODÜL 2: Kalıtım, Sanal Metotlar & Çok Biçimlilik (YZM201/203)
  // NPC: Makinist Nora (Varoş Tramvay Sinyal Makinistesi) // avatarKey: 'nora'
  // =========================================================================
  stage2_module_2_oop_polymorphism: [
    {
      customer: {
        customerName: 'Makinist Nora',
        customerRole: 'Varoş Tramvay Sinyal Makinistesi',
        avatarKey: 'nora',
        dialogText:
          'İyi ki buradasın mühendis! 4 numaralı Varoş buhar tramvayının makas değiştiricisinde çok biçimlilik (polymorphism) hatası var. Temel sinyal sınıfında fren metodu sanal (virtual) tanımlanmadığı için polimorfik çağrıda buhar tramvayı türetilmiş acil fren metodunu çağırmıyor, temel sınıfın boş metodunu çalıştırıp makas rayını kırıyor!',
        physicalSymptom:
          'Tramvay makas ayrımına girdiğinde acil pnömatik fren devreye girmiyor; sinyal panosu temel sınıf referansıyla çağırdığı için dinamik bağlama (vtable) çalışmıyor.',
        engineerDiagnosis:
          'Virtual Metot Ezilme (Vtable Dispatch) Eksikliği — Temel TrackSignal sınıfındaki apply_brake() metodu "virtual" olarak bildirilmediğinden, TrackSignal* üzerinden çağrıldığında TramwaySignal::apply_brake() çağrılamamakta ve erken statik bağlama gerçekleşmektedir.',
      },
      moduleData: {
        id: 'stage2_module_2_oop_polymorphism',
        academicUnit: '2. Aşama // Modül 2: Kalıtım & Çok Biçimlilik (YZM201/203)',
        deviceName: 'Varoş Buhar Tramvayı Makas Kontrolcüsü (Switch-Track 4)',
        deviceCode: 'MCU-OOP-202 // Seri #204',
        physicalSymptom:
          'TrackSignal* işaretçisi ile polimorfik çağrı yapıldığında türetilmiş TramwaySignal::apply_brake() yerine temel sınıf çağrılıyor.',
        engineerDiagnosis:
          'Temel sınıfa "virtual void apply_brake()" ve "virtual ~TrackSignal() = default;" eklenerek vtable dinamik bağlama mekanizması aktif edilmelidir.',
        rewardGold: 105,
        rewardExp: 40,
        rewardItemName: 'Pirinç Tramvay Makas Anahtarı',
        brokenCode: `#include <iostream>

class TrackSignal {
public:
    // HATA: virtual eksik! Erken statik baglama temel sinifi cagirir.
    void apply_brake() {
        std::cout << "[TEMEL] Standart sinyal: Fren uygulanmadi!\\n";
    }
};

class TramwaySignal : public TrackSignal {
public:
    void apply_brake() {
        std::cout << "[TRAMVAY] Acil buhar freni %100 kenetlendi!\\n";
    }
};

void trigger_emergency(TrackSignal* sig) {
    sig->apply_brake();
}

int main() {
    TramwaySignal tram;
    trigger_emergency(&tram);
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '' },
          { lineNumber: 3, code: 'class TrackSignal {' },
          { lineNumber: 4, code: 'public:' },
          { lineNumber: 5, code: '    // HATA: virtual bildirimi eksik' },
          { lineNumber: 6, code: '    void apply_brake() {', isFaulty: true },
          { lineNumber: 7, code: '        std::cout << "[TEMEL] Standart sinyal: Fren uygulanmadi!\\n";', isFaulty: true },
          { lineNumber: 8, code: '    }', isFaulty: true },
          { lineNumber: 9, code: '};' },
          { lineNumber: 10, code: '' },
          { lineNumber: 11, code: 'class TramwaySignal : public TrackSignal {' },
          { lineNumber: 12, code: 'public:' },
          { lineNumber: 13, code: '    void apply_brake() {' },
          { lineNumber: 14, code: '        std::cout << "[TRAMVAY] Acil buhar freni %100 kenetlendi!\\n";' },
          { lineNumber: 15, code: '    }' },
          { lineNumber: 16, code: '};' },
          { lineNumber: 17, code: '' },
          { lineNumber: 18, code: 'void trigger_emergency(TrackSignal* sig) {' },
          { lineNumber: 19, code: '    sig->apply_brake();' },
          { lineNumber: 20, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_oop2_a',
            title: 'Yama A: Virtual Metot ve Sanal Yıkıcı (Vtable Bağlama)',
            authorNote: 'Temel sınıfta apply_brake() metodunu virtual yapar ve sanal yıkıcı ekler; dinamik çok biçimliliği sağlar.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '    void apply_brake() {',
                '        std::cout << "[TEMEL] Standart sinyal: Fren uygulanmadi!\\n";',
                '    }',
              ],
              added: [
                '    virtual ~TrackSignal() = default;',
                '    virtual void apply_brake() {',
                '        std::cout << "[TEMEL] Standart sinyal tabani.\\n";',
                '    }',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -Wall main.cpp -o switch_track',
                '[DERLEME: BASARILI] Vtable olusturuldu, dinamik dispatch aktif.',
                './switch_track',
                '[TRAMVAY] Acil buhar freni %100 kenetlendi!',
                '[BASARILI] Tramvay makas noktasinda basariyla durduruldu.',
              ],
              hardwareTempC: 46,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Kusursuz Çok Biçimlilik: Virtual anahtar kelimesi ile vtable üzerinden dinamik frenleme tetiklendi.',
            },
          },
          {
            id: 'patch_oop2_b',
            title: 'Yama B: Sadece Türetilmiş Sınıfa Override Ekleme',
            authorNote: 'Temel sınıfı değiştirmeden türetilmiş sınıfa override ekler; derleyici hatası verir.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '    void apply_brake() {',
              ],
              added: [
                '    void apply_brake() override {',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o switch_track',
                'main.cpp:13:10: error: void TramwaySignal::apply_brake() marked override, but does not override',
                '[DERLEME HATASI] Cikis kodu: 1',
              ],
              hardwareTempC: 82,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Geçersiz Override: Temel sınıfta fonksiyon virtual tanımlanmadığı için override derleme hatası verdi.',
            },
          },
          {
            id: 'patch_oop2_c',
            title: 'Yama C: İşaretçiyi Ham Cast ile Dönüştürme',
            authorNote: 'Polimorfizmi çözmek yerine ham nullptr göstericisi üzerinden çağırmaya çalışır.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '    sig->apply_brake();',
              ],
              added: [
                '    ((TramwaySignal*)nullptr)->apply_brake();',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 139,
              terminalOutput: [
                './switch_track',
                '[SIGSEGV] Null pointer dereference in emergency handler!',
                '[HATA] Segmentasyon hatasi olustu.',
              ],
              hardwareTempC: 95,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Kritik Bellek İhlali: Null pointer referansı üzerinden metot çağrısı yapılamaz.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage2_module_2_oop_polymorphism',
        name: 'Kalıtım & Çok Biçimlilik',
        tier: '2. Aşama - Modül 2',
        status: 'UNLOCKED',
        description: 'Temel ve türetilmiş sınıflar, sanal metotlar ve dinamik bağlama.',
        academicCredit: 'YZM201/YZM203 - 5 AKTS',
        curriculumTopic: 'Kalıtım, Virtual Metotlar, Vtable & Çok Biçimlilik',
      },
      gadget: {
        id: 'gadget_tram_switch',
        name: 'Varoş Tramvayı Sinyal Makası',
        moduleId: 'stage2_module_2_oop_polymorphism',
        isUnlocked: false,
        icon: 'git-branch-outline',
        description: 'Çok biçimli vtable çağrılarıyla acil tramvay frenleme protokolünü işleten mekanik röle.',
        hardwareSpec: 'Polimorfik Pnömatik Sinyal // Sanal Metot Destekli',
      },
    },
  ],

  // =========================================================================
  // 2. AŞAMA - MODÜL 3: Doğrusal Veri Yapıları: Stack & Dairesel Kuyruk (YZM202)
  // NPC: Tüccar Mordecai (Varoş Rehin Dükkanı & Hurdacı Loncası) // avatarKey: 'mordecai'
  // =========================================================================
  stage2_module_3_linear_structures: [
    {
      customer: {
        customerName: 'Tüccar Mordecai',
        customerRole: 'Varoş Rehin Dükkanı & Hurdacı Loncası',
        avatarKey: 'mordecai',
        dialogText:
          'Ah mühendis bey, tam zamanında geldin! Rehin dükkanımın dişli emanet defterini dairesel kuyrukta (Circular Queue) tutuyoruz. 5 parçadan sonra kuyruğun son indisi 0\'a sarılmıyor (modulo eksik), indis diziyi aşıp altın kasasının kayıtlarını sıfırlıyor! Müşteriler rehin saatlerini geri alamıyor!',
        physicalSymptom:
          '5 elemanlık rehin defterine 6. kayıt girildiğinde kuyruk sonu başa dönmüyor; ArrayIndexOutOfBounds hatası verip mikrodenetleyici kilitleniyor.',
        engineerDiagnosis:
          'Dairesel Kuyruk İndis Sarma Hatası — rear_idx = rear_idx + 1 satırında % QUEUE_CAPACITY (modulo) işlemi yapılmadığı için kuyruk dizi sınırını aşıyor ve dairesel tampon mantığı bozuluyor.',
      },
      moduleData: {
        id: 'stage2_module_3_linear_structures',
        academicUnit: '2. Aşama // Modül 3: Stack & Circular Queue (YZM202)',
        deviceName: 'Rehin Emanet Kayıt Matrisi (Pawn-Log 5x)',
        deviceCode: 'MCU-DS-303 // Seri #310',
        physicalSymptom:
          'Dairesel kuyruk eleman ekleme metodunda indis sarımı (% 5) yapılmadığı için dizi sonu taşması gerçekleşiyor.',
        engineerDiagnosis:
          'enqueue işleminde "rear = (rear + 1) % QUEUE_CAPACITY;" formülü uygulanarak dairesel sarım sağlanmalıdır.',
        rewardGold: 120,
        rewardExp: 45,
        rewardItemName: 'Köstekli Rehin Kronometresi',
        brokenCode: `#include <iostream>
#define QUEUE_CAPACITY 5

class CircularPawnQueue {
private:
    int items[QUEUE_CAPACITY];
    int front;
    int rear;
    int count;

public:
    CircularPawnQueue() : front(0), rear(0), count(0) {}

    bool enqueue(int item_id) {
        if (count == QUEUE_CAPACITY) return false;
        items[rear] = item_id;
        // HATA: Modulo sarimi yapilmadi! rear siniri asiyor!
        rear = rear + 1;
        count++;
        return true;
    }

    int dequeue() {
        if (count == 0) return -1;
        int val = items[front];
        front = (front + 1) % QUEUE_CAPACITY;
        count--;
        return val;
    }
};

int main() {
    CircularPawnQueue q;
    for (int i = 1; i <= 5; ++i) q.enqueue(100 + i);
    q.dequeue();
    if (!q.enqueue(999)) {
        std::cout << "[HATA] Dairesel sarim yapilamadi!\\n";
        return 1;
    }
    std::cout << "[BASARILI] Dairesel kuyruk nominal sarim yapti.\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '#define QUEUE_CAPACITY 5' },
          { lineNumber: 3, code: '' },
          { lineNumber: 4, code: 'class CircularPawnQueue {' },
          { lineNumber: 5, code: 'private:' },
          { lineNumber: 6, code: '    int items[QUEUE_CAPACITY];' },
          { lineNumber: 7, code: '    int front, rear, count;' },
          { lineNumber: 8, code: '' },
          { lineNumber: 9, code: 'public:' },
          { lineNumber: 10, code: '    bool enqueue(int item_id) {' },
          { lineNumber: 11, code: '        if (count == QUEUE_CAPACITY) return false;' },
          { lineNumber: 12, code: '        items[rear] = item_id;' },
          { lineNumber: 13, code: '        // HATA: rear modulo yapilmadi' },
          { lineNumber: 14, code: '        rear = rear + 1;', isFaulty: true },
          { lineNumber: 15, code: '        count++;' },
          { lineNumber: 16, code: '        return true;' },
          { lineNumber: 17, code: '    }' },
        ],
        patchOptions: [
          {
            id: 'patch_ds1_a',
            title: 'Yama A: Modulo Operatörü ile Dairesel İndis Sarımı',
            authorNote: 'rear indisini (rear + 1) % QUEUE_CAPACITY formülü ile güncelleyerek kuyruk başa döndüğünde boşalan ilk göze güvenle yazmayı sağlar.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '        rear = rear + 1;',
              ],
              added: [
                '        rear = (rear + 1) % QUEUE_CAPACITY;',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -Wall main.cpp -o circular_pawn',
                '[DERLEME: BASARILI]',
                './circular_pawn',
                '[TEST] 5 eleman eklendi, 1 eleman dequeue edildi, yeni eleman (999) rear=0 gozune sarildi.',
                '[BASARILI] Dairesel kuyruk nominal sarim yapti.',
              ],
              hardwareTempC: 45,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Başarılı Dairesel Sarım: Modulo işlemi ile rear indisi 0. göze güvenle sarıldı, FIFO sırası korundu.',
            },
          },
          {
            id: 'patch_ds1_b',
            title: 'Yama B: Doğrudan Sıfıra Eşitleme (Hatalı Mantık)',
            authorNote: 'rear indisini koşulsuz 0 yapar; her eklemede aynı elemanı ezer.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '        rear = rear + 1;',
              ],
              added: [
                '        rear = 0;',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                './circular_pawn',
                '[HATA] Kuyruk mantigi bozuldu! Tum elemanlar 0. indise yazildi.',
                '[HATA] FIFO sirasi korunmadi.',
              ],
              hardwareTempC: 75,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Kuyruk Mantık Hatası: rear = 0 ataması kuyruğun eski verilerini ezerek veri kaybına yol açtı.',
            },
          },
          {
            id: 'patch_ds1_c',
            title: 'Yama C: Sıfıra Bölme Hatası (Modulo 0)',
            authorNote: 'Modulo işleminde QUEUE_CAPACITY yerine yanlışlıkla 0 yazarak runtime exception (SIGFPE) oluşturur.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '        rear = rear + 1;',
              ],
              added: [
                '        rear = (rear + 1) % 0;',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 136,
              terminalOutput: [
                'main.cpp: In member function bool CircularPawnQueue::enqueue(int):',
                'main.cpp:14: warning: division by zero [-Wdiv-by-zero]',
                './circular_pawn',
                '[SIGFPE] Arithmetic exception: Floating point exception / division by zero!',
              ],
              hardwareTempC: 92,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Aritmetik İstisna: Sıfıra bölme işlemi işlemciyi durdurdu.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage2_module_3_linear_structures',
        name: 'Doğrusal Veri Yapıları',
        tier: '2. Aşama - Modül 3',
        status: 'UNLOCKED',
        description: 'Rehin dükkanı envanter kütüğü, FIFO/LIFO tampon sınırları ve dairesel kuyruk indisi sarma.',
        academicCredit: 'YZM202 - 5 AKTS',
        curriculumTopic: 'Veri Yapıları: Stack, Queue & Circular Buffer Yönetimi',
      },
      gadget: {
        id: 'gadget_pawn_register',
        name: 'Dairesel Rehin Defteri Matrisi',
        moduleId: 'stage2_module_3_linear_structures',
        isUnlocked: false,
        icon: 'repeat-outline',
        description: 'Dairesel sarım mantığı ile rehin ve hurda parçaların FIFO kayıtlarını tutan gösterge.',
        hardwareSpec: 'Circular Queue // 5-Slot Ring Buffer',
      },
    },
  ],

  // =========================================================================
  // 2. AŞAMA - MODÜL 4: Ağaç Yapıları & İkili Arama Ağacı (BST) (YZM202)
  // NPC: Barikat Çavuşu Bennett (Varoş Kapı Muhafız Amiri) // avatarKey: 'bennett'
  // =========================================================================
  stage2_module_4_trees_indexing: [
    {
      customer: {
        customerName: 'Barikat Çavuşu Bennett',
        customerRole: 'Varoş Kapı Muhafız Amiri',
        avatarKey: 'bennett',
        dialogText:
          'Dikkat mühendis! Mahalle kapısındaki vatandaş kütük sistemi İkili Arama Ağacı (BST) kullanıyor. Yeni kimlik eklerken sol veya sağ dala dallanma mantığı ters yazılmış! Küçük numaralar sağa, büyükler sola gidiyor ve arama fonksiyonu yeni gelen vatandaşların kaydını bulamayıp kapıyı kilitliyor!',
        physicalSymptom:
          'Barikat kapısında kimlik tarayıcı geçerli sicil numaralarını BST içinde bulamıyor; sicil ağacında ters dallanma sebebiyle arama sol yerine sağa bakıp NULL dönüyor.',
        engineerDiagnosis:
          'İkili Arama Ağacı (BST) Ekleme ve Arama Yön Çelişkisi — insert fonksiyonunda if (id < root->citizen_id) koşulunda sol çocuk yerine sağ çocuğa (root->right) ekleme yapılmış; ağaç arama kuralı ihlal edilmiştir.',
      },
      moduleData: {
        id: 'stage2_module_4_trees_indexing',
        academicUnit: '2. Aşama // Modül 4: İkili Arama Ağacı (BST) (YZM202)',
        deviceName: 'Mahalle Barikat Kütük Sicil Ağacı (Gate-BST 50)',
        deviceCode: 'MCU-DS-404 // Seri #408',
        physicalSymptom:
          'BST düğüm ekleme algoritmasında id < root->id koşulunda sol alt dal yerine sağ alt dala yöneliniyor.',
        engineerDiagnosis:
          'insert() fonksiyonunda sol/sağ alt ağaç yerleşimi düzeltilerek sol alt ağaçta küçük, sağ alt ağaçta büyük anahtarların yer alması sağlanmalıdır.',
        rewardGold: 140,
        rewardExp: 50,
        rewardItemName: 'Varoş Muhafız Mühür Yüzüğü',
        brokenCode: `#include <iostream>

struct BSTNode {
    int citizen_id;
    BSTNode* left;
    BSTNode* right;
    BSTNode(int id) : citizen_id(id), left(nullptr), right(nullptr) {}
};

BSTNode* insert(BSTNode* root, int id) {
    if (!root) return new BSTNode(id);
    // HATA: Kucuk anahtar saga, buyuk anahtar sola eklenmis (TERS YON)!
    if (id < root->citizen_id) {
        root->right = insert(root->right, id);
    } else {
        root->left = insert(root->left, id);
    }
    return root;
}

bool search(BSTNode* root, int id) {
    if (!root) return false;
    if (root->citizen_id == id) return true;
    if (id < root->citizen_id) return search(root->left, id);
    return search(root->right, id);
}

int main() {
    BSTNode* root = nullptr;
    root = insert(root, 50);
    root = insert(root, 30);
    root = insert(root, 70);
    if (!search(root, 30)) {
        std::cout << "[HATA] BST arama basarisiz! Kimlik 30 bulunamadi.\\n";
        return 1;
    }
    std::cout << "[BASARILI] Kimlik dogrulandi, barikat kapisi acildi.\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '' },
          { lineNumber: 3, code: 'struct BSTNode {' },
          { lineNumber: 4, code: '    int citizen_id;' },
          { lineNumber: 5, code: '    BSTNode* left;' },
          { lineNumber: 6, code: '    BSTNode* right;' },
          { lineNumber: 7, code: '};' },
          { lineNumber: 8, code: '' },
          { lineNumber: 9, code: 'BSTNode* insert(BSTNode* root, int id) {' },
          { lineNumber: 10, code: '    if (!root) return new BSTNode(id);' },
          { lineNumber: 11, code: '    // HATA: Yonler karistirilmis' },
          { lineNumber: 12, code: '    if (id < root->citizen_id) {', isFaulty: true },
          { lineNumber: 13, code: '        root->right = insert(root->right, id);', isFaulty: true },
          { lineNumber: 14, code: '    } else {', isFaulty: true },
          { lineNumber: 15, code: '        root->left = insert(root->left, id);', isFaulty: true },
          { lineNumber: 16, code: '    }' },
          { lineNumber: 17, code: '    return root;' },
          { lineNumber: 18, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_ds2_a',
            title: 'Yama A: Standart BST Sol/Sağ Dallanma Kuralı',
            authorNote: 'id < root->citizen_id durumunda sol alt ağaca, aksi durumda sağ alt ağaca ekleme yaparak ikili arama ağacı özelliğini (BST property) sağlar.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '    if (id < root->citizen_id) {',
                '        root->right = insert(root->right, id);',
                '    } else {',
                '        root->left = insert(root->left, id);',
                '    }',
              ],
              added: [
                '    if (id < root->citizen_id) {',
                '        root->left = insert(root->left, id);   // Sol kucuk',
                '    } else {',
                '        root->right = insert(root->right, id); // Sag buyuk',
                '    }',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -Wall main.cpp -o gate_bst',
                '[DERLEME: BASARILI]',
                './gate_bst',
                '[TEST] BST olusturuldu (Kok: 50, Sol: 30, Sag: 70).',
                '[TEST] search(30) sol alt agacta bulundu.',
                '[BASARILI] Kimlik dogrulandi, barikat kapisi acildi.',
              ],
              hardwareTempC: 43,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Kusursuz BST Kütüğü: Sol alt ağaç küçük, sağ alt ağaç büyük anahtar kuralına bağlandı; arama O(log n) hızında tamamlandı.',
            },
          },
          {
            id: 'patch_ds2_b',
            title: 'Yama B: Search Metodunu da Tersine Çevirme',
            authorNote: 'Ekleme mantığını düzeltmek yerine search metodunu tersine çevirmeye çalışır.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '    if (id < root->citizen_id) return search(root->left, id);',
                '    return search(root->right, id);',
              ],
              added: [
                '    if (id < root->citizen_id) return search(root->right, id);',
                '    return search(root->left, id);',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                './gate_bst',
                '[HATA] BST kurali ihlal edildi! Agac dengesi bozuk.',
                '[HATA] Cikis kodu: 1',
              ],
              hardwareTempC: 80,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Tutarsız Ağaç Arama: Arama algoritması tersine çevrilmeye çalışıldı fakat ağaç hiyerarşisi bozuldu.',
            },
          },
          {
            id: 'patch_ds2_c',
            title: 'Yama C: Eksik Noktalı Virgül ve Sözdizimi Hatası',
            authorNote: 'insert çağrısında noktalı virgül eksiktir.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '        root->right = insert(root->right, id);',
              ],
              added: [
                '        root->left = insert(root->left, id)',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                "main.cpp:13:46: error: expected ';' before '}' token",
                '[DERLEME HATASI] Cikis kodu: 1',
              ],
              hardwareTempC: 89,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Sözdizimi Hatası: Noktalı virgül eksikliği nedeniyle derleme başarısız oldu.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage2_module_4_trees_indexing',
        name: 'Ağaç Yapıları & BST',
        tier: '2. Aşama - Modül 4',
        status: 'UNLOCKED',
        description: 'Mahalle barikat giriş kütüğü, kimlik sicil BST düğüm hiyerarşisi ve yaprak/dal bağlantı bütünlüğü.',
        academicCredit: 'YZM202 - 5 AKTS',
        curriculumTopic: 'Veri Yapıları: Binary Search Tree (BST), Düğüm Ekleme & Arama',
      },
      gadget: {
        id: 'gadget_bst_gate',
        name: 'Mahalle Barikat Kütük Sicil Ağacı',
        moduleId: 'stage2_module_4_trees_indexing',
        isUnlocked: false,
        icon: 'git-network-outline',
        description: 'Varoş kapısında vatandaş kayıtlarını ikili arama ağacı ile doğrulayan pirinç işlemci.',
        hardwareSpec: 'BST Gate Keeper // O(log n) Sicil Doğrulayıcı',
      },
    },
  ],


  // =========================================================================
  // 3. AŞAMA // BAŞKENT MAĞAZASI (SAMSUN ÜNİVERSİTESİ 3. SINIF MÜFREDATI)
  // =========================================================================

  // -------------------------------------------------------------------------
  // 3.1: VERİTABANI YÖNETİM SİSTEMLERİ & ACID TRANSACTIONS (YZM307)
  // Karakter: Leydi Aurelia (Başkent Bankeri & Hazine Denetçisi)
  // -------------------------------------------------------------------------
  stage3_module_1_databases: [
    {
      customer: {
        customerName: 'Leydi Aurelia',
        customerRole: 'Başkent Bankeri & Hazine Denetçisi',
        avatarKey: 'aurelia',
        dialogText:
          "Hoş geldiniz usta. Başkent Altın Kasası ve Ticaret Sicil Odası'nda büyük bir buhranla karşı karşıyayız. İki lonca tüccarı aynı anda birbirine altın aktarımı yaparken Aurum Matrix kasanın kilitleri kilitleniyor (Deadlock) ya da işlem yarıda kesildiğinde bakiye buharlaşıp rollback çalışmıyor! Hazine kayıtlarının atomikliğini (ACID) ve kilit sıralamasını acilen onarmanız gerekiyor.",
        physicalSymptom:
          'Eşzamanlı altın transferi yapıldığında kasa işlemcisi kilitleniyor (Deadlock); işlem iptal edildiğinde eksik bakiye hesaba geri dönmeyerek veri tutarsızlığına yol açıyor.',
        engineerDiagnosis:
          'ACID İşlem & Kilit Sıralaması Hatası — transferAccounts fonksiyonunda hesap kilitleri (lockA, lockB) sıralanmadan rastgele alınmış (Deadlock) ve yetersiz bakiye durumunda kilitler serbest bırakılmadan (Rollback eksikliği) fonksiyondan çıkılmış.',
      },
      moduleData: {
        id: 'stage3_module_1_databases',
        academicUnit: '3. Aşama // Modül 1: Veritabanı & ACID İşlemleri (YZM307)',
        deviceName: 'Aurum Ledger Matrix (ACID Kasa Denetleyici)',
        deviceCode: 'MCU-DB-301 // Seri #301',
        physicalSymptom:
          'Altın transferi sırasında işlem yarıda kesildiğinde kilitler serbest bırakılmıyor ve rollback yapılmadığı için hesaplar kilitli kalıyor.',
        engineerDiagnosis:
          'Hesap ID sırasına göre kilit (Hierarchical Locking) uygulanmalı ve bakiye yetersiz olduğunda kilitler çözülüp rollback işlemi tamamlanmalıdır.',
        rewardGold: 150,
        rewardExp: 50,
        rewardItemName: 'Kraliyet Altın Mühürlü ACID Kristali',
        brokenCode: `#include <iostream>
#include <string>

struct Account {
    int id;
    int balance;
    bool is_locked;
};

class LedgerTransaction {
public:
    // HATA: Kilit siralamasi tutarsiz ve yetersiz bakiyede rollback yapilmiyor!
    bool transfer(Account& from, Account& to, int amount) {
        from.is_locked = true;
        to.is_locked = true; // Siralama olmadan kilitleme deadlock uretir

        if (from.balance < amount) {
            std::cout << "[HATA] Yetersiz bakiye! Transfer durduruldu.\\n";
            // HATA: Kilitler acilmadan ve durum geri alinmadan cikiliyor!
            return false;
        }

        from.balance -= amount;
        to.balance += amount;

        from.is_locked = false;
        to.is_locked = false;
        return true;
    }
};

int main() {
    Account accA = {101, 500, false};
    Account accB = {102, 200, false};
    LedgerTransaction tx;
    if (!tx.transfer(accA, accB, 700)) {
        if (accA.is_locked || accB.is_locked) {
            std::cout << "[DEADLOCK] Hesaplar kilitli kaldi! Rollback basarisiz.\\n";
            return 1;
        }
    }
    std::cout << "[BASARILI] ACID islemi tamamlandi.\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '#include <string>' },
          { lineNumber: 3, code: '' },
          { lineNumber: 4, code: 'struct Account {' },
          { lineNumber: 5, code: '    int id;' },
          { lineNumber: 6, code: '    int balance;' },
          { lineNumber: 7, code: '    bool is_locked;' },
          { lineNumber: 8, code: '};' },
          { lineNumber: 9, code: '' },
          { lineNumber: 10, code: 'class LedgerTransaction {' },
          { lineNumber: 11, code: 'public:' },
          { lineNumber: 12, code: '    // HATA: Kilit siralamasi ve rollback eksik' },
          { lineNumber: 13, code: '    bool transfer(Account& from, Account& to, int amount) {', isFaulty: true },
          { lineNumber: 14, code: '        from.is_locked = true;', isFaulty: true },
          { lineNumber: 15, code: '        to.is_locked = true;', isFaulty: true },
          { lineNumber: 16, code: '' },
          { lineNumber: 17, code: '        if (from.balance < amount) {', isFaulty: true },
          { lineNumber: 18, code: '            std::cout << "[HATA] Yetersiz bakiye! Transfer durduruldu.\\n";', isFaulty: true },
          { lineNumber: 19, code: '            return false; // Kilitler acilmadi!', isFaulty: true },
          { lineNumber: 20, code: '        }', isFaulty: true },
          { lineNumber: 21, code: '' },
          { lineNumber: 22, code: '        from.balance -= amount;' },
          { lineNumber: 23, code: '        to.balance += amount;' },
          { lineNumber: 24, code: '' },
          { lineNumber: 25, code: '        from.is_locked = false;' },
          { lineNumber: 26, code: '        to.is_locked = false;' },
          { lineNumber: 27, code: '        return true;' },
          { lineNumber: 28, code: '    }' },
          { lineNumber: 29, code: '};' },
        ],
        patchOptions: [
          {
            id: 'patch_db1_a',
            title: 'Yama A: Deterministik ID Sıralı Kilit & Rollback Garantisi',
            authorNote: 'Hesap ID sırasına göre deterministik kilitleme yapar; transfer yetersiz bakiyede durdurulursa kilitleri anında serbest bırakarak (Rollback) deadlock riskini sıfırlar.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '        from.is_locked = true;',
                '        to.is_locked = true;',
                '',
                '        if (from.balance < amount) {',
                '            std::cout << "[HATA] Yetersiz bakiye! Transfer durduruldu.\\n";',
                '            return false;',
                '        }',
              ],
              added: [
                '        // Deterministik kilit siralamasi (Deadlock onleme)',
                '        Account& first = (from.id < to.id) ? from : to;',
                '        Account& second = (from.id < to.id) ? to : from;',
                '        first.is_locked = true;',
                '        second.is_locked = true;',
                '',
                '        if (from.balance < amount) {',
                '            std::cout << "[HATA] Yetersiz bakiye! Rollback baslatildi.\\n";',
                '            first.is_locked = false;',
                '            second.is_locked = false;',
                '            return false; // Kilitler guvenle cozuldu (Rollback)',
                '        }',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -Wall -Wextra -O2 main.cpp -o aurum_ledger',
                '[DERLEME: BASARILI] Sifir hata, sifir uyari.',
                './aurum_ledger',
                '[ISLEM TESTI] Hesap #101 -> Hesap #102: 700 Altin transfer denemesi.',
                '[HATA] Yetersiz bakiye! Rollback baslatildi.',
                '[GÜVENLİK] Kilitler basariyla cozuldu, hesap durumlari korundu.',
                '[BASARILI] ACID islemi tamamlandi.',
              ],
              hardwareTempC: 42,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Kusursuz ACID Onarımı: Deterministik ID sıralaması ile deadlock engellendi, rollback mekanizması kilitleri çözdü.',
            },
          },
          {
            id: 'patch_db1_b',
            title: 'Yama B: Kilit Mekanizmasını Tamamen Devre Dışı Bırakma',
            authorNote: 'Deadlock olmasın diye kilit bayraklarını kaldırır, ancak bu durum eşzamanlı işlemlerde veri kirliliğine (Dirty Read/Write) yol açar.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '        from.is_locked = true;',
                '        to.is_locked = true;',
              ],
              added: [
                '        // Kilitleri tamamen devre disi birak',
                '        from.is_locked = false;',
                '        to.is_locked = false;',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o aurum_ledger',
                './aurum_ledger',
                '[UYARI] Kilitleme olmadan ACID izolasyonu saglanamaz! [-Wtransaction-safety]',
                '[TEST HATASI] Eşzamanlı erişimde yarış durumu (Race Condition) tespit edildi.',
                '[HATA] Bakiye tutarsızlığı: -200 Altın negatif bakiye oluştu!',
              ],
              hardwareTempC: 84,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: "İzolasyon İhlali: Kilitleri kaldırmak deadlock'u önler gibi görünse de veri tabanı bütünlüğünü yok eder.",
            },
          },
          {
            id: 'patch_db1_c',
            title: 'Yama C: Hatalı Rollback Gövdesi ve Bakiye Sıfırlama',
            authorNote: 'Yetersiz bakiye durumunda bakiyeyi sıfırlamaya çalışarak geri dönüşümsüz veri kaybına neden olur.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '        if (from.balance < amount) {',
                '            std::cout << "[HATA] Yetersiz bakiye! Transfer durduruldu.\\n";',
                '            return false;',
                '        }',
              ],
              added: [
                '        if (from.balance < amount) {',
                '            from.balance = 0; // HATA: Bakiyeyi sifirlayarak veri kaybetme!',
                '            return true;',
                '        }',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 2,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o aurum_ledger',
                './aurum_ledger',
                "[KRİTİK HATA] Müşteri bakiyesi 500'den 0'a silindi! Veri kaybı.",
                '[ACID TEST: FAILED] Atomiklik ve Tutarlılık (Consistency) ihlal edildi.',
              ],
              hardwareTempC: 92,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Kritik Mantık Hatası: Rollback bakiyeyi sıfırlamak değil, önceki kararlı duruma döndürmektir.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage3_module_1_databases',
        name: 'ACID & İşlem Yönetimi',
        tier: '3. Aşama - Modül 1',
        status: 'UNLOCKED',
        description: 'Veritabanı transaction atomikliği, commit/rollback mimarisi ve deadlock önleme stratejileri.',
        academicCredit: 'YZM307 - 5 AKTS',
        curriculumTopic: 'Veritabanı Sistemleri: ACID İşlemleri, İzolasyon & Deadlock',
      },
      gadget: {
        id: 'gadget_aurum_ledger',
        name: 'Aurum ACID Kasa Denetleyici',
        moduleId: 'stage3_module_1_databases',
        isUnlocked: false,
        icon: 'layers-outline',
        description: 'Başkent hazine kasasında atomik para transferlerini ve kilitlenmesiz transaction döngülerini yöneten pirinç matris.',
        hardwareSpec: 'ACID Matrix // Deadlock-Free İşlem Denetleyici',
      },
    },
    {
      customer: {
        customerName: 'Leydi Aurelia',
        customerRole: 'Başkent Bankeri & Hazine Denetçisi',
        avatarKey: 'aurelia',
        dialogText:
          'Usta, hazinenin yedek günlük (Write-Ahead Log / WAL) mekanizmasında bir açık keşfettik! Sistem ani voltaj kesintisinde yeniden başlarken, henüz onaylanmamış (uncommitted) sahte altın taleplerini de doğrudan kasaya işliyor! Günlük kurtarma fonksiyonunda sadece COMMIT işaretli işlemleri kasaya uygulayan sağlam bir filtre kurun.',
        physicalSymptom:
          'Sistem çökmesi sonrası yeniden başlatmada, tamamlanmamış (aborted) işlemler de kasaya yazılarak hazinede sahte altın fazlası oluşturuyor.',
        engineerDiagnosis:
          'Eksik WAL Kurtarma Filtresi — replay_log fonksiyonu log kayıtlarının durumunu denetlemeden tüm işlemleri doğrudan bakiye tablosuna yansıtıyor; yalnızca TX_COMMITTED durumundakiler onaylanmalıdır.',
      },
      moduleData: {
        id: 'stage3_module_1_databases',
        academicUnit: '3. Aşama // Modül 1: Veritabanı Kurtarma & WAL Günlükleri (YZM307)',
        deviceName: 'Hazine Günlük Defteri (WAL Replay Engine)',
        deviceCode: 'MCU-DB-302 // Seri #302',
        physicalSymptom:
          'Çökme sonrası kurtarma motoru, onaylanmamış işlemleri geri almak yerine doğrudan veritabanına uyguluyor.',
        engineerDiagnosis:
          'Log kaydı durumu kontrol edilmeli; TX_COMMITTED dışındaki kayıtlar için UNDO/Rollback uygulanmalıdır.',
        rewardGold: 155,
        rewardExp: 50,
        rewardItemName: 'Kraliyet WAL Günlük Prizması',
        brokenCode: `#include <iostream>
#include <vector>

enum TxStatus { TX_ACTIVE, TX_COMMITTED, TX_ABORTED };

struct LogRecord {
    int tx_id;
    int amount;
    TxStatus status;
};

int replay_log(const std::vector<LogRecord>& logs, int current_balance) {
    for (const auto& log : logs) {
        // HATA: Durum kontrolu yapilmadan hepsi dogrudan bakiyeye ekleniyor!
        current_balance += log.amount;
    }
    return current_balance;
}

int main() {
    std::vector<LogRecord> logs = {
        {1, 100, TX_COMMITTED},
        {2, 300, TX_ABORTED},
        {3, 50, TX_COMMITTED}
    };
    int balance = replay_log(logs, 1000);
    if (balance != 1150) {
        std::cout << "[HATA] Sahte altinlar kasaya islendi! Bakiye: " << balance << "\\n";
        return 1;
    }
    std::cout << "[BASARILI] WAL kurtarma hatasiz: " << balance << "\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '#include <vector>' },
          { lineNumber: 3, code: '' },
          { lineNumber: 4, code: 'enum TxStatus { TX_ACTIVE, TX_COMMITTED, TX_ABORTED };' },
          { lineNumber: 5, code: '' },
          { lineNumber: 6, code: 'struct LogRecord {' },
          { lineNumber: 7, code: '    int tx_id;' },
          { lineNumber: 8, code: '    int amount;' },
          { lineNumber: 9, code: '    TxStatus status;' },
          { lineNumber: 10, code: '};' },
          { lineNumber: 11, code: '' },
          { lineNumber: 12, code: 'int replay_log(const std::vector<LogRecord>& logs, int current_balance) {' },
          { lineNumber: 13, code: '    for (const auto& log : logs) {' },
          { lineNumber: 14, code: '        // HATA: Tum loglar filtresiz ekleniyor' },
          { lineNumber: 15, code: '        current_balance += log.amount;', isFaulty: true },
          { lineNumber: 16, code: '    }' },
          { lineNumber: 17, code: '    return current_balance;' },
          { lineNumber: 18, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_db2_a',
            title: 'Yama A: Yalnızca COMMIT Kayıtlarını Uygulama ve Abort Kayıtlarını Yoksayma',
            authorNote: 'Yalnızca log.status == TX_COMMITTED durumundaki kayıtları işler, onaylanmamış işlemleri kasaya yansıtmaz.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '        // HATA: Tum loglar filtresiz ekleniyor',
                '        current_balance += log.amount;',
              ],
              added: [
                '        if (log.status == TX_COMMITTED) {',
                '            current_balance += log.amount;',
                '        } else {',
                '            std::cout << "[WAL] Tx #" << log.tx_id << " iptal edildi (Rollback).\\n";',
                '        }',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o wal_replay',
                './wal_replay',
                '[WAL] Tx #2 iptal edildi (Rollback).',
                '[BASARILI] WAL kurtarma hatasiz: 1150',
              ],
              hardwareTempC: 43,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Kusursuz Kurtarma: Sadece commit kayıtları kasaya aktarıldı, abort işlemleri yok sayıldı.',
            },
          },
          {
            id: 'patch_db2_b',
            title: 'Yama B: Hatalı Eşitlik Mantığı',
            authorNote: 'Ters mantık kullanarak yalnızca TX_ABORTED olan kayıtları kasaya ekler.',
            isCorrect: false,
            codeDiff: {
              removed: ['        current_balance += log.amount;'],
              added: [
                '        if (log.status == TX_ABORTED) {',
                '            current_balance += log.amount;',
                '        }',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o wal_replay',
                './wal_replay',
                '[HATA] Sahte altinlar kasaya islendi! Bakiye: 1300',
              ],
              hardwareTempC: 80,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Mantık Hatası: İptal edilen işlemler kasaya yansıtılamaz.',
            },
          },
          {
            id: 'patch_db2_c',
            title: 'Yama C: Döngü Kırma Hatası (break)',
            authorNote: 'İlk işlemden sonra döngüyü kırarak sonraki geçerli commit loglarının işlenmesini engeller.',
            isCorrect: false,
            codeDiff: {
              removed: ['        current_balance += log.amount;'],
              added: [
                '        current_balance += log.amount;',
                '        break; // Ilk kayittan sonra cikis!',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o wal_replay',
                './wal_replay',
                '[HATA] Eksik log işlendi! Bakiye: 1100 (Beklenen: 1150)',
              ],
              hardwareTempC: 89,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Eksik İşlem: Döngü erken sonlandırılarak geçerli kayıtlar atlandı.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage3_module_1_databases',
        name: 'ACID & İşlem Yönetimi',
        tier: '3. Aşama - Modül 1',
        status: 'UNLOCKED',
        description: 'Veritabanı transaction atomikliği, commit/rollback mimarisi ve deadlock önleme stratejileri.',
        academicCredit: 'YZM307 - 5 AKTS',
        curriculumTopic: 'Veritabanı Sistemleri: ACID İşlemleri, İzolasyon & Deadlock',
      },
      gadget: {
        id: 'gadget_aurum_ledger',
        name: 'Aurum ACID Kasa Denetleyici',
        moduleId: 'stage3_module_1_databases',
        isUnlocked: false,
        icon: 'layers-outline',
        description: 'Başkent hazine kasasında atomik para transferlerini ve kilitlenmesiz transaction döngülerini yöneten pirinç matris.',
        hardwareSpec: 'ACID Matrix // Deadlock-Free İşlem Denetleyici',
      },
    },
  ],

  // -------------------------------------------------------------------------
  // 3.2: AĞ PROTOKOLLERİ & TCP İLETİŞİMİ (YZM303)
  // Karakter: Şebeke Şefi Zephyr (Başkent Telgraf & İletişim Şebeke Şefi)
  // -------------------------------------------------------------------------
  stage3_module_2_networking: [
    {
      customer: {
        customerName: 'Şebeke Şefi Zephyr',
        customerRole: 'Başkent Telgraf & İletişim Şebeke Şefi',
        avatarKey: 'zephyr',
        dialogText:
          'Usta! Başkentin aether-telgraf kulesinde sinyaller birbirine girdi! Şebekeden gelen paketler farklı hatlardan gecikmeli ulaştığı için sıra numaraları (Sequence Number) karışıyor. Bizim yönlendirici ise sırasız gelen paketleri doğrudan atıyor ve bozuk sağlama toplamlarını (Checksum) ayırt edemeden sahte ACK dönüyor! Samsun Üniversitesi Ağ Protokolleri standardında bir TCP paket tamponu kurmamız gerek!',
        physicalSymptom:
          'Telgraf sinyalleri kesintiye uğruyor; sırası karışan teleks mesajları düşüyor ve bozuk sağlama toplamlı paketler onaylanarak veriyi bozuyor.',
        engineerDiagnosis:
          'TCP Sıralama & Checksum Doğrulama Hatası — process_packet fonksiyonunda beklenen sıra numarası (expected_seq) kontrol edilmeden doğrudan ekrana basılıyor ve checksum XOR toplamı yanlış bit maskesiyle doğrulanıyor.',
      },
      moduleData: {
        id: 'stage3_module_2_networking',
        academicUnit: '3. Aşama // Modül 2: Ağ Protokolleri & TCP İletişimi (YZM303)',
        deviceName: 'Aether-Link TCP Yönlendirici (Aether-Net v3)',
        deviceCode: 'MCU-NET-302 // Seri #302',
        physicalSymptom:
          'Paketler sıralı gelmediğinde veri akışı kopuyor ve bozuk paketler için ACK üretiliyor.',
        engineerDiagnosis:
          'Beklenen dizi numarası (expected_seq) kontrol edilmeli, paket doğruysa tampona eklenip expected_seq artırılmalı, aksi halde retransmission beklenmelidir.',
        rewardGold: 160,
        rewardExp: 55,
        rewardItemName: 'Pirinç Telgraf Rezonatör Kristali',
        brokenCode: `#include <iostream>
#include <vector>

struct TcpPacket {
    int seq_num;
    uint16_t checksum;
    char payload;
};

class PacketReceiver {
private:
    int expected_seq = 1;

public:
    // HATA: Siralama kontrolu yapilmiyor, gelen her paket dogrudan kabul ediliyor!
    bool receive(const TcpPacket& pkt) {
        // HATA: pkt.seq_num == expected_seq sarti yok!
        std::cout << "[ALINDI] Paket Seq: " << pkt.seq_num << " Veri: " << pkt.payload << "\\n";
        expected_seq++; // Gecersiz siralamada sayac sasiriyor!
        return true;
    }

    int get_expected() const { return expected_seq; }
};

int main() {
    PacketReceiver receiver;
    TcpPacket p1 = {1, 0xAA, 'M'};
    TcpPacket p3 = {3, 0xCC, 'G'}; // Sirasiz paket!
    
    receiver.receive(p1);
    if (receiver.receive(p3)) {
        // p3 kabul edilmemeliydi (once p2 gelmeli)
        std::cout << "[HATA] Sirasiz paket denetimsiz kabul edildi! TCP ihlali.\\n";
        return 1;
    }
    std::cout << "[BASARILI] TCP akis denetimi dogrulandi.\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '#include <vector>' },
          { lineNumber: 3, code: '' },
          { lineNumber: 4, code: 'struct TcpPacket {' },
          { lineNumber: 5, code: '    int seq_num;' },
          { lineNumber: 6, code: '    uint16_t checksum;' },
          { lineNumber: 7, code: '    char payload;' },
          { lineNumber: 8, code: '};' },
          { lineNumber: 9, code: '' },
          { lineNumber: 10, code: 'class PacketReceiver {' },
          { lineNumber: 11, code: 'private:' },
          { lineNumber: 12, code: '    int expected_seq = 1;' },
          { lineNumber: 13, code: 'public:' },
          { lineNumber: 14, code: '    // HATA: Siralama kontrolu yapilmiyor' },
          { lineNumber: 15, code: '    bool receive(const TcpPacket& pkt) {', isFaulty: true },
          { lineNumber: 16, code: '        std::cout << "[ALINDI] Paket Seq: " << pkt.seq_num << "\\n";', isFaulty: true },
          { lineNumber: 17, code: '        expected_seq++;', isFaulty: true },
          { lineNumber: 18, code: '        return true;', isFaulty: true },
          { lineNumber: 19, code: '    }', isFaulty: true },
          { lineNumber: 20, code: '};' },
        ],
        patchOptions: [
          {
            id: 'patch_net1_a',
            title: 'Yama A: Sıra Numarası (Sequence Number) Doğrulaması & Out-of-Order Reddi',
            authorNote: 'Gelen paketin seq_num değerinin expected_seq ile eşleştiğini doğrular; sırasız veya mükerrer paketleri reddederek doğru sıra garantisi sağlar.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '    bool receive(const TcpPacket& pkt) {',
                '        std::cout << "[ALINDI] Paket Seq: " << pkt.seq_num << "\\n";',
                '        expected_seq++;',
                '        return true;',
                '    }',
              ],
              added: [
                '    bool receive(const TcpPacket& pkt) {',
                '        if (pkt.seq_num != expected_seq) {',
                '            std::cout << "[TCP RED] Sirasiz paket! Beklenen: " << expected_seq << " Gelen: " << pkt.seq_num << "\\n";',
                '            return false; // Sirasiz paket kabul edilmez',
                '        }',
                '        std::cout << "[ALINDI] Sirali Paket #" << pkt.seq_num << " Veri: " << pkt.payload << "\\n";',
                '        expected_seq++;',
                '        return true;',
                '    }',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -Wall -Wextra -O2 main.cpp -o tcp_router',
                '[DERLEME: BASARILI] Sifir hata, sifir uyari.',
                './tcp_router',
                '[ALINDI] Sirali Paket #1 Veri: M',
                '[TCP RED] Sirasiz paket! Beklenen: 2 Gelen: 3',
                '[BASARILI] TCP akis denetimi dogrulandi.',
              ],
              hardwareTempC: 45,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Kusursuz Taşıma Katmanı: Sequence denetimi ile paket sıralaması garanti altına alındı.',
            },
          },
          {
            id: 'patch_net1_b',
            title: 'Yama B: Beklenen Sırayı Gelen Pakete Eşitleme',
            authorNote: 'Sıra numarasını doğrudan gelen paketin numarasına eşitleyerek aradaki kayıp paketleri yok sayar.',
            isCorrect: false,
            codeDiff: {
              removed: ['        expected_seq++;'],
              added: ['        expected_seq = pkt.seq_num + 1; // Kayip paketler atlandi!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o tcp_router',
                './tcp_router',
                '[HATA] Paket #2 kayboldugu halde atlandi! Veri akışı eksik.',
              ],
              hardwareTempC: 79,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Protokol İhlali: Kayıp paketleri yeniden iletim (retransmission) istemeden atlamak veri kaybına yol açar.',
            },
          },
          {
            id: 'patch_net1_c',
            title: 'Yama C: Ters Mantık ile Sıralı Paketleri Reddetme',
            authorNote: 'Eşitlik kontrolünde ters operatör kullanarak sıralı paketleri atar.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '    bool receive(const TcpPacket& pkt) {',
                '        std::cout << "[ALINDI] Paket Seq: " << pkt.seq_num << "\\n";',
                '        expected_seq++;',
                '        return true;',
                '    }',
              ],
              added: [
                '    bool receive(const TcpPacket& pkt) {',
                '        if (pkt.seq_num == expected_seq) return false; // HATA!',
                '        return true;',
                '    }',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 2,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o tcp_router',
                './tcp_router',
                '[HATA] Doğru sıradaki paket #1 reddedildi! İletişim koptu.',
              ],
              hardwareTempC: 91,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Ters Mantık Hatası: Sıralı paketler kabul edilmeli, sırasız olanlar reddedilmelidir.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage3_module_2_networking',
        name: 'TCP Protokolü & Paket Sıralama',
        tier: '3. Aşama - Modül 2',
        status: 'UNLOCKED',
        description: 'Taşıma katmanı protokolleri, TCP paket sıralama, sağlama toplamı (checksum) ve sliding window mantığı.',
        academicCredit: 'YZM303 - 3 AKTS',
        curriculumTopic: 'Bilgisayar Ağları: Taşıma Katmanı, TCP Checksum & Sıralama',
      },
      gadget: {
        id: 'gadget_aether_router',
        name: 'Aether TCP Yönlendirici',
        moduleId: 'stage3_module_2_networking',
        isUnlocked: false,
        icon: 'git-network-outline',
        description: 'Başkent haberleşme kulesinde aether-telgraf paketlerini sıralayan ve kayıpsız iletim sağlayan yönlendirici kristal.',
        hardwareSpec: 'Sliding Window & Checksum Doğrulayıcı',
      },
    },
    {
      customer: {
        customerName: 'Şebeke Şefi Zephyr',
        customerRole: 'Başkent Telgraf & İletişim Şebeke Şefi',
        avatarKey: 'zephyr',
        dialogText:
          'Zephyr yine devrede! Telgraftan gelen paketlerin 16-bit İnternet Checksum (Sağlama Toplamı) formülünde taşma biti (carry bit) fold edilmiyor! Taşma biti eklenmediği için gürültülü hatlarda bit hatası olan teleksler sağlam kabul edilip kraliyet fermanlarına karışıyor!',
        physicalSymptom:
          'Gürültülü aether hatlarında sağlama toplamı hesaplayıcı taşma bitini unuttuğu için bozuk paketler filtrelenemiyor.',
        engineerDiagnosis:
          'RFC 1071 Checksum Fold Hatası — calculate_checksum fonksiyonunda 32-bit toplamın üst 16 biti (carry bit) alt 16 bite eklenmeden doğrudan kırpılıyor.',
      },
      moduleData: {
        id: 'stage3_module_2_networking',
        academicUnit: '3. Aşama // Modül 2: Ağ Protokolleri & Checksum Doğrulama (YZM303)',
        deviceName: 'Telgraf Paket Sağlama Denetçisi (Checksum Verifier)',
        deviceCode: 'MCU-NET-303 // Seri #303',
        physicalSymptom:
          '16-bit taşma biti toplanmadığı için sağlama toplamı hatalı sonuç veriyor ve bozuk paketler geçiyor.',
        engineerDiagnosis:
          'while (sum >> 16) { sum = (sum & 0xFFFF) + (sum >> 16); } döngüsü eklenerek carry biti katlanmalı ve tersi (~sum) alınmalıdır.',
        rewardGold: 165,
        rewardExp: 55,
        rewardItemName: 'Kraliyet Checksum Ayar Diyapazonu',
        brokenCode: `#include <iostream>
#include <vector>
#include <cstdint>

uint16_t calculate_checksum(const uint16_t* data, size_t length) {
    uint32_t sum = 0;
    for (size_t i = 0; i < length; ++i) {
        sum += data[i];
    }
    // HATA: Tasima biti (carry bit) katlanmadan dogrudan kirpiliyor!
    return static_cast<uint16_t>(sum & 0xFFFF);
}

int main() {
    uint16_t packet[] = {0xF000, 0x2000}; // Toplam 0x11000 -> carry: 1, sum: 0x1000 + 1 = 0x1001
    uint16_t csum = calculate_checksum(packet, 2);
    if (csum != 0x1001) {
        std::cout << "[HATA] Checksum tasima biti kayboldu: 0x" << std::hex << csum << "\\n";
        return 1;
    }
    std::cout << "[BASARILI] Checksum RFC standardina uygun.\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '#include <vector>' },
          { lineNumber: 3, code: '#include <cstdint>' },
          { lineNumber: 4, code: '' },
          { lineNumber: 5, code: 'uint16_t calculate_checksum(const uint16_t* data, size_t length) {' },
          { lineNumber: 6, code: '    uint32_t sum = 0;' },
          { lineNumber: 7, code: '    for (size_t i = 0; i < length; ++i) {' },
          { lineNumber: 8, code: '        sum += data[i];' },
          { lineNumber: 9, code: '    }' },
          { lineNumber: 10, code: '    // HATA: Tasima biti katlanmadi' },
          { lineNumber: 11, code: '    return static_cast<uint16_t>(sum & 0xFFFF);', isFaulty: true },
          { lineNumber: 12, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_net2_a',
            title: 'Yama A: 16-Bit Carry Fold & Birlerin Tümleyeni Ekleme',
            authorNote: '32-bit toplamdaki taşma bitlerini (carry) alt 16 bite ekleyerek RFC 1071 İnternet Checksum standardını sağlar.',
            isCorrect: true,
            codeDiff: {
              removed: ['    return static_cast<uint16_t>(sum & 0xFFFF);'],
              added: [
                '    // Tasima bitini katla (Carry Fold)',
                '    while (sum >> 16) {',
                '        sum = (sum & 0xFFFF) + (sum >> 16);',
                '    }',
                '    return static_cast<uint16_t>(sum);',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o checksum_test',
                './checksum_test',
                '[BASARILI] Checksum RFC standardina uygun: 0x1001',
              ],
              hardwareTempC: 44,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Doğru Ağ Sağlaması: Taşma biti alt haneye katlandı, checksum hatasız hesaplandı.',
            },
          },
          {
            id: 'patch_net2_b',
            title: 'Yama B: Taşma Bitini Yoksayıp Sabit Sıfır Döndürme',
            authorNote: 'Checksum kontrolünü baypas ederek sıfır döndürür.',
            isCorrect: false,
            codeDiff: {
              removed: ['    return static_cast<uint16_t>(sum & 0xFFFF);'],
              added: ['    return 0x0000; // Checksum devre disi!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o checksum_test',
                './checksum_test',
                '[HATA] Checksum tasima biti kayboldu: 0x0',
              ],
              hardwareTempC: 82,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Güvenlik Zaafiyeti: Checksum sıfırlanamaz.',
            },
          },
          {
            id: 'patch_net2_c',
            title: 'Yama C: Yanlış Bit Kaydırma Yönü',
            authorNote: 'Sağa kaydırma yerine sola kaydırma yaparak taşma bitini sonsuza katlar.',
            isCorrect: false,
            codeDiff: {
              removed: ['    return static_cast<uint16_t>(sum & 0xFFFF);'],
              added: ['    return static_cast<uint16_t>((sum << 16) & 0xFFFF);'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o checksum_test',
                './checksum_test',
                '[HATA] Tum veri sola kaydirilarak sifirlandi.',
              ],
              hardwareTempC: 90,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Bit İşlemi Hatası: Sola kaydırma veriyi yok etti.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage3_module_2_networking',
        name: 'TCP Protokolü & Paket Sıralama',
        tier: '3. Aşama - Modül 2',
        status: 'UNLOCKED',
        description: 'Taşıma katmanı protokolleri, TCP paket sıralama, sağlama toplamı (checksum) ve sliding window mantığı.',
        academicCredit: 'YZM303 - 3 AKTS',
        curriculumTopic: 'Bilgisayar Ağları: Taşıma Katmanı, TCP Checksum & Sıralama',
      },
      gadget: {
        id: 'gadget_aether_router',
        name: 'Aether TCP Yönlendirici',
        moduleId: 'stage3_module_2_networking',
        isUnlocked: false,
        icon: 'git-network-outline',
        description: 'Başkent haberleşme kulesinde aether-telgraf paketlerini sıralayan ve kayıpsız iletim sağlayan yönlendirici kristal.',
        hardwareSpec: 'Sliding Window & Checksum Doğrulayıcı',
      },
    },
  ],

  // -------------------------------------------------------------------------
  // 3.3: YAZILIM DOĞRULAMA & BİRİM TEST (YZM301)
  // Karakter: Başmimar Vivienne (Kraliyet Otomat Başmimarı & Kalite Güvence Lideri)
  // -------------------------------------------------------------------------
  stage3_module_3_software_testing: [
    {
      customer: {
        customerName: 'Başmimar Vivienne',
        customerRole: 'Kraliyet Otomat Başmimarı & Kalite Güvence Lideri',
        avatarKey: 'vivienne',
        dialogText:
          'Saygıdeğer meslektaşım, Kraliyet Muhafız otomatlarının eklem tork ve açı kontrol yazılımını test ediyoruz. Ancak birim test (Unit Test) çerçevesinde sınır değer analizi (Boundary Value Analysis) yanlış kurgulanmış. 180 derecelik maksimum açı sınırında assertion off-by-one hatası veriyor ve otomat eklemi ters dönüp pirinç dişlileri parçalıyor! YZM301 standartlarında sağlam bir assertion ve regresyon testi kurgulamalıyız.',
        physicalSymptom:
          'Muhafız otomatı maksimum eklem açısına (180°) ulaştığında birim test istisna fırlatıyor veya aşırı dönüşe izin verip servo motor dişlisini sıyırıyor.',
        engineerDiagnosis:
          'Sınır Değer & Assertion Test Hatası — test_joint_angle fonksiyonundaki sınır koşulu assert(angle < MAX_ANGLE) olarak yazılmış (180 derece geçerli sınır kabul edilmeyip test başarısız oluyor) ve sınır dışı değerler yakalanamıyor.',
      },
      moduleData: {
        id: 'stage3_module_3_software_testing',
        academicUnit: '3. Aşama // Modül 3: Yazılım Doğrulama & Birim Test (YZM301)',
        deviceName: 'Kraliyet Otomat Eklem Denetleyicisi (Servocore v4)',
        deviceCode: 'MCU-TST-303 // Seri #303',
        physicalSymptom:
          'Eklem açısı tam 180 derece olduğunda test paketi sahte hata fırlatıyor; sınır değer doğrulaması off-by-one içeriyor.',
        engineerDiagnosis:
          'Açı kontrolü [0, 180] kapalı aralığını kapsamalı (angle >= 0 && angle <= MAX_ANGLE) ve sınır dışı değerler assert ile yakalanmalıdır.',
        rewardGold: 170,
        rewardExp: 60,
        rewardItemName: 'Kraliyet Başmimar Ayar Mastarı',
        brokenCode: `#include <iostream>
#include <cassert>

constexpr int MIN_ANGLE = 0;
constexpr int MAX_ANGLE = 180;

bool validate_joint_angle(int angle) {
    // HATA: 180 derece yasal limit olmasina ragmen kesin kucuk (<) kullanilmis!
    return (angle >= MIN_ANGLE && angle < MAX_ANGLE);
}

void test_boundary_values() {
    assert(validate_joint_angle(0) == true);    // Alt sinir: Gecerli
    assert(validate_joint_angle(90) == true);   // Orta deger: Gecerli
    // HATA: 180 derece yasal maksimumdur ama validate_joint_angle(180) false donduruyor!
    if (!validate_joint_angle(180)) {
        std::cout << "[TEST BASARISIZ] 180 derece sinirinda assertion patladi! Eklem kilitlendi.\\n";
        exit(1);
    }
    assert(validate_joint_angle(181) == false); // Sinir disi: Reddedilmeli
}

int main() {
    test_boundary_values();
    std::cout << "[BASARILI] Tum sinir degeri testleri gecti.\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '#include <cassert>' },
          { lineNumber: 3, code: '' },
          { lineNumber: 4, code: 'constexpr int MIN_ANGLE = 0;' },
          { lineNumber: 5, code: 'constexpr int MAX_ANGLE = 180;' },
          { lineNumber: 6, code: '' },
          { lineNumber: 7, code: 'bool validate_joint_angle(int angle) {' },
          { lineNumber: 8, code: '    // HATA: 180 derece siniri kapsanmamis' },
          { lineNumber: 9, code: '    return (angle >= MIN_ANGLE && angle < MAX_ANGLE);', isFaulty: true },
          { lineNumber: 10, code: '}' },
          { lineNumber: 11, code: '' },
          { lineNumber: 12, code: 'void test_boundary_values() {' },
          { lineNumber: 13, code: '    assert(validate_joint_angle(0) == true);' },
          { lineNumber: 14, code: '    assert(validate_joint_angle(90) == true);' },
          { lineNumber: 15, code: '    if (!validate_joint_angle(180)) {' },
          { lineNumber: 16, code: '        std::cout << "[TEST BASARISIZ] 180 derece sinirinda assertion patladi!\\n";' },
          { lineNumber: 17, code: '        exit(1);' },
          { lineNumber: 18, code: '    }' },
          { lineNumber: 19, code: '    assert(validate_joint_angle(181) == false);' },
          { lineNumber: 20, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_tst1_a',
            title: 'Yama A: Kapalı Aralık Sınır Doğrulaması (<= MAX_ANGLE)',
            authorNote: 'validate_joint_angle fonksiyonunda [MIN_ANGLE, MAX_ANGLE] kapalı aralığını kapsayacak şekilde <= operatörü kullanarak boundary testini başarıyla tamamlar.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '    // HATA: 180 derece siniri kapsanmamis',
                '    return (angle >= MIN_ANGLE && angle < MAX_ANGLE);',
              ],
              added: [
                '    // 0 ve 180 derece dahil kapali sinir kontrolu (Boundary Analysis)',
                '    return (angle >= MIN_ANGLE && angle <= MAX_ANGLE);',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -Wall -Wextra -O2 main.cpp -o servocore_test',
                '[DERLEME: BASARILI] Sifir hata, sifir uyari.',
                './servocore_test',
                '[UNIT TEST] test_boundary_values calistiriliyor...',
                '[ASSERT PASS] Alt sinir (0°) onaylandi.',
                '[ASSERT PASS] Maksimum sinir (180°) onaylandi.',
                '[ASSERT PASS] Sinir disi (181°) guvenle reddedildi.',
                '[BASARILI] Tum sinir degeri testleri gecti.',
              ],
              hardwareTempC: 43,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Kusursuz Birim Test: Sınır değer analizi başarıyla düzeltildi, 180° eklem kısıtı doğrulandı.',
            },
          },
          {
            id: 'patch_tst1_b',
            title: 'Yama B: Sınır Kontrolünü Tamamen Kaldırıp true Döndürme',
            authorNote: 'Testi geçirmek için tüm açıları geçerli sayar; bu durum aşırı torkta otomat kolunun kırılmasına sebep olur.',
            isCorrect: false,
            codeDiff: {
              removed: ['    return (angle >= MIN_ANGLE && angle < MAX_ANGLE);'],
              added: ['    return true; // Test gecsin diye tum acilari onayla!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o servocore_test',
                './servocore_test',
                'servocore_test: main.cpp:19: void test_boundary_values(): Assertion validate_joint_angle(181) == false failed.',
                '[TEST HATASI] 181 derece tehlikeli aci filtrelenemedi!',
              ],
              hardwareTempC: 86,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Güvenlik İhlali: Sınır dışı (181°) değer assert ile yakalanamadı ve donanım testte çöktü.',
            },
          },
          {
            id: 'patch_tst1_c',
            title: 'Yama C: Mantıksal VEYA (||) ile Geçersiz Aralık Tanımı',
            authorNote: 'VE (&&) yerine VEYA (||) kullanarak aralık kontrolünü bozar.',
            isCorrect: false,
            codeDiff: {
              removed: ['    return (angle >= MIN_ANGLE && angle < MAX_ANGLE);'],
              added: ['    return (angle >= MIN_ANGLE || angle <= MAX_ANGLE);'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o servocore_test',
                './servocore_test',
                'Assertion validate_joint_angle(181) == false failed.',
              ],
              hardwareTempC: 92,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Mantıksal Hata: || operatörü tüm sayıları geçerli kılarak sınır analizini etkisiz hale getirir.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage3_module_3_software_testing',
        name: 'Yazılım Testi & Sınır Analizi',
        tier: '3. Aşama - Modül 3',
        status: 'UNLOCKED',
        description: 'Birim test disiplini, sınır değer analizi (Boundary Value Analysis), assertion tasarımı ve regresyon önleme.',
        academicCredit: 'YZM301 - 3 AKTS',
        curriculumTopic: 'Yazılım Gerçekleme & Test: Assertion, Sınır Analizi & TDD',
      },
      gadget: {
        id: 'gadget_automaton_joint',
        name: 'Servocore Test Mastarı',
        moduleId: 'stage3_module_3_software_testing',
        isUnlocked: false,
        icon: 'checkmark-done-circle-outline',
        description: 'Kraliyet muhafız otomatlarının eklem açılarını birim testlerle doğrulayan hassas kalibrasyon mastarı.',
        hardwareSpec: 'Boundary Test Harness // Açı & Tork Doğrulayıcı',
      },
    },
    {
      customer: {
        customerName: 'Başmimar Vivienne',
        customerRole: 'Kraliyet Otomat Başmimarı & Kalite Güvence Lideri',
        avatarKey: 'vivienne',
        dialogText:
          'Birim test takımımızda testler arası durum kirliliği (State Leak) saptadık! Otomatın sahte sensör (Mock Sensor) nesnesi test bittikten sonra sıfırlanmıyor (TearDown eksikliği). İkinci test birinciden kalan kirli sensör verisiyle başlıyor ve sahte başarısızlık üretiyor!',
        physicalSymptom:
          'Birim testler tek tek çalıştırıldığında geçerken, toplu (Suite) çalıştırıldığında testler birbirinin verisini bozuyor.',
        engineerDiagnosis:
          'Eksik Test Temizliği (TearDown / Mock Reset) — run_test_suite her testten önce mock sensörün kalibrasyon durumunu ve hata bayraklarını sıfırlamalıdır.',
      },
      moduleData: {
        id: 'stage3_module_3_software_testing',
        academicUnit: '3. Aşama // Modül 3: Test İzolasyonu & Mock Nesneler (YZM301)',
        deviceName: 'Buhar Basınç Regresyon Test Kiti (TDD Harness)',
        deviceCode: 'MCU-TST-304 // Seri #304',
        physicalSymptom:
          'Testler arası izolasyon sağlanmadığı için önceki testin hata bayrağı sonraki teste sızıyor.',
        engineerDiagnosis:
          'Mock sensörün reset() metodu çağrılarak her test bağımsız ortamda koşturulmalıdır.',
        rewardGold: 175,
        rewardExp: 60,
        rewardItemName: 'Kraliyet TDD Mühür Plaketi',
        brokenCode: `#include <iostream>
#include <cassert>

struct MockPressureSensor {
    int last_reading = 0;
    bool has_error = false;
    void reset() { last_reading = 0; has_error = false; }
};

MockPressureSensor sensor;

void test_normal_pressure() {
    sensor.last_reading = 100;
    assert(sensor.last_reading == 100);
}

void test_overpressure() {
    // HATA: Onceki testten sonra reset() cagrilmadi, sensor durumu kirli kalabilir!
    sensor.last_reading = 250;
    sensor.has_error = true;
    assert(sensor.has_error == true);
}

void test_subsequent_normal() {
    // HATA: Onceki testin has_error bayragi sıfırlanmadi!
    if (sensor.has_error) {
        std::cout << "[TEST HATASI] Onceki testten kalan kirli durum testi bozdu!\\n";
        exit(1);
    }
}

int main() {
    test_normal_pressure();
    test_overpressure();
    // HATA: Temizlik yapilmadan sonraki teste gecildi!
    test_subsequent_normal();
    std::cout << "[BASARILI] Test suit hatasiz tamamlandi.\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '#include <cassert>' },
          { lineNumber: 3, code: '' },
          { lineNumber: 4, code: 'struct MockPressureSensor {' },
          { lineNumber: 5, code: '    int last_reading = 0;' },
          { lineNumber: 6, code: '    bool has_error = false;' },
          { lineNumber: 7, code: '    void reset() { last_reading = 0; has_error = false; }' },
          { lineNumber: 8, code: '};' },
          { lineNumber: 9, code: '' },
          { lineNumber: 10, code: 'int main() {' },
          { lineNumber: 11, code: '    test_normal_pressure();' },
          { lineNumber: 12, code: '    test_overpressure();' },
          { lineNumber: 13, code: '    // HATA: sensor.reset() eksik' },
          { lineNumber: 14, code: '    test_subsequent_normal();', isFaulty: true },
          { lineNumber: 15, code: '    return 0;' },
          { lineNumber: 16, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_tst2_a',
            title: 'Yama A: Testler Arasında Mock Sensör Sıfırlama (TearDown)',
            authorNote: 'Testler arasında sensor.reset() çağırarak test ortamının izolasyonunu ve bağımsızlığını garanti eder.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '    test_overpressure();',
                '    // HATA: sensor.reset() eksik',
                '    test_subsequent_normal();',
              ],
              added: [
                '    test_overpressure();',
                '    sensor.reset(); // TearDown: Testler arasi durum izolasyonu',
                '    test_subsequent_normal();',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o mock_test',
                './mock_test',
                '[TEARDOWN] Mock sensör sıfırlandı.',
                '[BASARILI] Test suit hatasiz tamamlandi.',
              ],
              hardwareTempC: 42,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Kusursuz Test İzolasyonu: Mock sensör sıfırlandı ve yan etkiler temizlendi.',
            },
          },
          {
            id: 'patch_tst2_b',
            title: 'Yama B: Test Fonksiyonunu Yorum Satırına Alma',
            authorNote: 'Testi düzeltmek yerine başarısız olan testi çağrı listesinden kaldırır.',
            isCorrect: false,
            codeDiff: {
              removed: ['    test_subsequent_normal();'],
              added: ['    // test_subsequent_normal(); // HATA: Testi atlamak'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o mock_test',
                '[UYARI] Regresyon test paketi eksik koşuldu!',
              ],
              hardwareTempC: 81,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Test İhmali: Hatalı testi atlamak regresyon riskine yol açar.',
            },
          },
          {
            id: 'patch_tst2_c',
            title: 'Yama C: Sonsuz Döngüde Sıfırlama',
            authorNote: 'while(true) içinde sıfırlama yaparak testi kilitler.',
            isCorrect: false,
            codeDiff: {
              removed: ['    test_subsequent_normal();'],
              added: ['    while(true) { sensor.reset(); }'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 124,
              terminalOutput: [
                'g++ -std=c++17 main.cpp -o mock_test',
                '[TIMEOUT] Test süresi aşıldı! Sonsuz döngü.',
              ],
              hardwareTempC: 95,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Kritik Hata: Sonsuz döngü oluştu.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage3_module_3_software_testing',
        name: 'Yazılım Testi & Sınır Analizi',
        tier: '3. Aşama - Modül 3',
        status: 'UNLOCKED',
        description: 'Birim test disiplini, sınır değer analizi (Boundary Value Analysis), assertion tasarımı ve regresyon önleme.',
        academicCredit: 'YZM301 - 3 AKTS',
        curriculumTopic: 'Yazılım Gerçekleme & Test: Assertion, Sınır Analizi & TDD',
      },
      gadget: {
        id: 'gadget_automaton_joint',
        name: 'Servocore Test Mastarı',
        moduleId: 'stage3_module_3_software_testing',
        isUnlocked: false,
        icon: 'checkmark-done-circle-outline',
        description: 'Kraliyet muhafız otomatlarının eklem açılarını birim testlerle doğrulayan hassas kalibrasyon mastarı.',
        hardwareSpec: 'Boundary Test Harness // Açı & Tork Doğrulayıcı',
      },
    },
  ],

  // -------------------------------------------------------------------------
  // 3.4: İŞLETİM SİSTEMLERİ & EŞZAMANLILIK (YZM306)
  // Karakter: Komutan Hektor (Kraliyet Mekanize Birlikler Komutanı)
  // -------------------------------------------------------------------------
  stage3_module_4_os_concurrency: [
    {
      customer: {
        customerName: 'Komutan Hektor',
        customerRole: 'Kraliyet Mekanize Birlikler Komutanı',
        avatarKey: 'hektor',
        dialogText:
          'Mühendis! Ağır zırhlı mekanize birliğimin çift çekirdekli güç reaktöründe kritik bir yarış durumu (Race Condition) var! Çift iş parçacığı (Dual Thread) aynı anda buhar valfi yazmacına müdahale ediyor. Mutex kilidi olmadığı için reaktör çekirdeği kritik sıcaklığa çıkıyor ve zırh sahada kilitlenip hareketsiz kalıyor! YZM306 İşletim Sistemleri bilgini konuştur, reaktör iş parçacıklarını mutex ile senkronize et!',
        physicalSymptom:
          'Ağır zırh yürüyüş modundayken reaktör sıcaklığı hızla 95°C üzerine fırlıyor, CPU çekirdekleri yarış durumu nedeniyle kilitleniyor.',
        engineerDiagnosis:
          'Race Condition (Yarış Durumu) & Senkronizasyon Eksikliği — adjust_reactor_output fonksiyonu iki eşzamanlı iş parçacığı tarafından paylaşılan power_output değişkenini korumasız artırıyor; std::mutex veya std::lock_guard kullanılmadığı için veri tutarsızlığı ve aşırı ısınma meydana geliyor.',
      },
      moduleData: {
        id: 'stage3_module_4_os_concurrency',
        academicUnit: '3. Aşama // Modül 4: İşletim Sistemleri & Eşzamanlılık (YZM306)',
        deviceName: 'Vanguard Çift Çekirdek Güç Dağıtıcı (CoreSync v1)',
        deviceCode: 'MCU-OS-304 // Seri #304',
        physicalSymptom:
          'Eşzamanlı iki iş parçacığı aynı bellek alanına senkronizasyonsuz eriştiğinde güç çıkışı beklenenden düşük kalıyor ve çekirdek aşırı ısınıyor.',
        engineerDiagnosis:
          'std::mutex kullanılarak kritik bölge (critical section) std::lock_guard ile korunmalı, paylaşılan güce güvenli erişim sağlanmalıdır.',
        rewardGold: 180,
        rewardExp: 70,
        rewardItemName: 'Komutanlık Şeref Nişanı & Mutex Kristali',
        brokenCode: `#include <iostream>
#include <thread>
#include <vector>
#include <mutex>

int shared_reactor_power = 0;
std::mutex core_mutex;

void power_injector(int iterations) {
    for (int i = 0; i < iterations; ++i) {
        // HATA: Kritik bolge (critical section) mutex ile kilitlenmemis!
        // std::lock_guard<std::mutex> lock(core_mutex); eksik!
        shared_reactor_power++; // Race Condition!
    }
}

int main() {
    constexpr int ITERS = 10000;
    std::thread t1(power_injector, ITERS);
    std::thread t2(power_injector, ITERS);
    t1.join();
    t2.join();

    if (shared_reactor_power != 2 * ITERS) {
        std::cout << "[KRİTİK HATA] Yaris Durumu (Race Condition) tespit edildi! Guc: "
                  << shared_reactor_power << " (Beklenen: " << 2 * ITERS << ")\\n";
        return 1;
    }
    std::cout << "[BASARILI] Cift cekirdek senkronize: " << shared_reactor_power << "\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '#include <thread>' },
          { lineNumber: 3, code: '#include <vector>' },
          { lineNumber: 4, code: '#include <mutex>' },
          { lineNumber: 5, code: '' },
          { lineNumber: 6, code: 'int shared_reactor_power = 0;' },
          { lineNumber: 7, code: 'std::mutex core_mutex;' },
          { lineNumber: 8, code: '' },
          { lineNumber: 9, code: 'void power_injector(int iterations) {' },
          { lineNumber: 10, code: '    for (int i = 0; i < iterations; ++i) {' },
          { lineNumber: 11, code: '        // HATA: Mutex korumasi eksik' },
          { lineNumber: 12, code: '        shared_reactor_power++; // Race condition', isFaulty: true },
          { lineNumber: 13, code: '    }' },
          { lineNumber: 14, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_os1_a',
            title: 'Yama A: std::lock_guard ile Kritik Bölge Mutex Koruması',
            authorNote: 'Döngü içerisinde std::lock_guard<std::mutex> ile core_mutex kilidini alarak paylaşılan sayacı atomik ve yarış durumundan uzak tutar.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '        // HATA: Mutex korumasi eksik',
                '        shared_reactor_power++; // Race condition',
              ],
              added: [
                '        // Mutex ile kritik bolge korumasi (Race Condition onleme)',
                '        std::lock_guard<std::mutex> lock(core_mutex);',
                '        shared_reactor_power++;',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -pthread -Wall -Wextra -O2 main.cpp -o vanguard_core',
                '[DERLEME: BASARILI] Sifir hata, sifir uyari.',
                './vanguard_core',
                '[SENKRONİZASYON] Çekirdek 1 & Çekirdek 2 eşzamanlı çalıştı.',
                '[MUTEX AKTİF] 20000 iterasyon kayıpsız işlendi.',
                '[BASARILI] Cift cekirdek senkronize: 20000',
              ],
              hardwareTempC: 44,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Kusursuz Eşzamanlılık: Mutex kilidi yarış durumunu tamamen engelledi, reaktör nominal sıcaklıkta.',
            },
          },
          {
            id: 'patch_os1_b',
            title: 'Yama B: Sadece volatile Anahtar Kelimesi Ekleme',
            authorNote: 'volatile anahtar kelimesi derleyici optimizasyonunu engeller ancak multithreading ortamında mutual exclusion sağlamaz.',
            isCorrect: false,
            codeDiff: {
              removed: ['int shared_reactor_power = 0;'],
              added: ['volatile int shared_reactor_power = 0; // HATA: volatile thread-safe degildir!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 -pthread main.cpp -o vanguard_core',
                './vanguard_core',
                '[KRİTİK HATA] Yaris Durumu (Race Condition) tespit edildi! Guc: 17420 (Beklenen: 20000)',
                '[UYARI] volatile mutual exclusion saglamaz! [-Wconcurrency-safety]',
              ],
              hardwareTempC: 88,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Yetersiz Koruma: volatile anahtar kelimesi thread senkronizasyonu sağlamaz; yarış durumu devam etti.',
            },
          },
          {
            id: 'patch_os1_c',
            title: 'Yama C: Kilidi Alıp Hiç Serbest Bırakmama (Deadlock)',
            authorNote: 'core_mutex.lock() çağırıp unlock yapmadan döngüden çıkarak diğer thread\'i sonsuza kadar kilitler.',
            isCorrect: false,
            codeDiff: {
              removed: ['        shared_reactor_power++; // Race condition'],
              added: [
                '        core_mutex.lock();',
                '        shared_reactor_power++;',
                '        // unlock() cagrilmadi! Deadlock!',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 124,
              terminalOutput: [
                'g++ -std=c++17 -pthread main.cpp -o vanguard_core',
                './vanguard_core',
                '[DEADLOCK] Thread 2 sonsuza kadar mutex bekliyor! Isletim sistemi kilitlendi.',
              ],
              hardwareTempC: 98,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Deadlock Hatası: Kilit serbest bırakılmadığı için ikinci iş parçacığı sonsuza kadar kilitlendi.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage3_module_4_os_concurrency',
        name: 'Eşzamanlılık & Mutex Senkronizasyonu',
        tier: '3. Aşama - Modül 4',
        status: 'UNLOCKED',
        description: 'İşletim sistemleri multithreading, yarış durumu (race condition), kritik bölge ve mutex senkronizasyonu.',
        academicCredit: 'YZM306 - 3 AKTS',
        curriculumTopic: 'İşletim Sistemleri: Multithreading, Kritik Bölge & Mutex',
      },
      gadget: {
        id: 'gadget_coresync',
        name: 'Vanguard Güç Dağıtıcı',
        moduleId: 'stage3_module_4_os_concurrency',
        isUnlocked: false,
        icon: 'hardware-chip-outline',
        description: 'Ağır mekanize zırh güç reaktöründe çift çekirdekli iş parçacıklarını mutex ile senkronize eden donanım birimi.',
        hardwareSpec: 'Dual Core Concurrency Guard // Mutex Synchronization',
      },
    },
    {
      customer: {
        customerName: 'Komutan Hektor',
        customerRole: 'Kraliyet Mekanize Birlikler Komutanı',
        avatarKey: 'hektor',
        dialogText:
          'Zırhın hidrolik bacak aktüatörlerinde ters kilit sıralaması yüzünden ölümcül bir kilitlenme (Deadlock) yaşıyoruz! Sol bacak iş parçacığı sol valfi kilitleyip sağ valfi beklerken, sağ bacak iş parçacığı tam tersini yapıyor! İki kilit birbirini bekleyerek kilitleniyor. std::lock ile çift mutex\'i tek hamlede güvenle kilitleyen bir çözüm üretin!',
        physicalSymptom:
          'Zırh yürüyüşe geçtiği anda iki bacak aktüatörü ters kilitlenme (Coffman döngüsü) nedeniyle donup kalıyor.',
        engineerDiagnosis:
          'Çapraz Kilitleme & Deadlock — threadA (left then right) ve threadB (right then left) zıt sırada kilit alıyor; std::lock(mtx_left, mtx_right) kullanılarak deadlock-free kilitleme yapılmalıdır.',
      },
      moduleData: {
        id: 'stage3_module_4_os_concurrency',
        academicUnit: '3. Aşama // Modül 4: Kilit Sıralaması & Deadlock Önleme (YZM306)',
        deviceName: 'Zırh Hidrolik Valf Eşzamanlayıcı (Dual-Actuator Mutex)',
        deviceCode: 'MCU-OS-305 // Seri #305',
        physicalSymptom:
          'İki iş parçacığı birbirinin kilidini bekleyerek deadlock oluşturuyor ve sistem donuyor.',
        engineerDiagnosis:
          'std::lock(mtx1, mtx2) algoritması ile aynı anda kilit alınmalı ve std::adopt_lock ile guard\'a devredilmelidir.',
        rewardGold: 185,
        rewardExp: 70,
        rewardItemName: 'Kraliyet Hidrolik Deadlock-Buster Mührü',
        brokenCode: `#include <iostream>
#include <thread>
#include <mutex>

std::mutex mtx_left;
std::mutex mtx_right;

void leg_sync_routine(bool is_left_first) {
    if (is_left_first) {
        mtx_left.lock();
        // HATA: Ters sirada kilitleme deadlock riski tasir!
        mtx_right.lock();
        std::cout << "[SOL AKTÜATÖR] Senkronize calisti.\\n";
        mtx_right.unlock();
        mtx_left.unlock();
    } else {
        mtx_right.lock();
        // HATA: Zıt sırada kilitleme!
        mtx_left.lock();
        std::cout << "[SAĞ AKTÜATÖR] Senkronize calisti.\\n";
        mtx_left.unlock();
        mtx_right.unlock();
    }
}

int main() {
    std::thread t1(leg_sync_routine, true);
    std::thread t2(leg_sync_routine, false);
    t1.join();
    t2.join();
    std::cout << "[BASARILI] Deadlock olmadan aktüatörler calisti.\\n";
    return 0;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: '#include <iostream>' },
          { lineNumber: 2, code: '#include <thread>' },
          { lineNumber: 3, code: '#include <mutex>' },
          { lineNumber: 4, code: '' },
          { lineNumber: 5, code: 'std::mutex mtx_left;' },
          { lineNumber: 6, code: 'std::mutex mtx_right;' },
          { lineNumber: 7, code: '' },
          { lineNumber: 8, code: 'void leg_sync_routine(bool is_left_first) {' },
          { lineNumber: 9, code: '    if (is_left_first) {' },
          { lineNumber: 10, code: '        mtx_left.lock();' },
          { lineNumber: 11, code: '        mtx_right.lock();', isFaulty: true },
          { lineNumber: 12, code: '        mtx_right.unlock();' },
          { lineNumber: 13, code: '        mtx_left.unlock();' },
          { lineNumber: 14, code: '    } else {' },
          { lineNumber: 15, code: '        mtx_right.lock();' },
          { lineNumber: 16, code: '        mtx_left.lock();', isFaulty: true },
          { lineNumber: 17, code: '        mtx_left.unlock();' },
          { lineNumber: 18, code: '        mtx_right.unlock();' },
          { lineNumber: 19, code: '    }' },
          { lineNumber: 20, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_os2_a',
            title: 'Yama A: std::lock ile Eşzamanlı Deadlock-Free Kilitleme',
            authorNote: 'std::lock(mtx_left, mtx_right) kullanarak her iki kilidi deadlock döngüsüne düşmeden aynı anda alır ve std::adopt_lock ile güvenle bırakır.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '    if (is_left_first) {',
                '        mtx_left.lock();',
                '        mtx_right.lock();',
                '        std::cout << "[SOL AKTÜATÖR] Senkronize calisti.\\n";',
                '        mtx_right.unlock();',
                '        mtx_left.unlock();',
                '    } else {',
                '        mtx_right.lock();',
                '        mtx_left.lock();',
                '        std::cout << "[SAĞ AKTÜATÖR] Senkronize calisti.\\n";',
                '        mtx_left.unlock();',
                '        mtx_right.unlock();',
                '    }',
              ],
              added: [
                '    // std::lock ile deterministik ve kilitlenmesiz cift kilit alimi',
                '    std::lock(mtx_left, mtx_right);',
                '    std::lock_guard<std::mutex> lk1(mtx_left, std::adopt_lock);',
                '    std::lock_guard<std::mutex> lk2(mtx_right, std::adopt_lock);',
                '    std::cout << "[AKTÜATÖR] Deadlock-free senkronize calisti.\\n";',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -pthread main.cpp -o actuator_sync',
                './actuator_sync',
                '[AKTÜATÖR] Deadlock-free senkronize calisti.',
                '[AKTÜATÖR] Deadlock-free senkronize calisti.',
                '[BASARILI] Deadlock olmadan aktüatörler calisti.',
              ],
              hardwareTempC: 45,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage: 'Kusursuz Senkronizasyon: std::lock ile ters kilitlenme (deadlock) tamamen önlendi.',
            },
          },
          {
            id: 'patch_os2_b',
            title: 'Yama B: Kilitleri Kaldırıp Threadleri Serbest Bırakma',
            authorNote: 'Kilitleri kaldırarak veri bozulmasına ve mekanik çatışmaya yol açar.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '        mtx_left.lock();',
                '        mtx_right.lock();',
              ],
              added: ['        // Kilitleri kaldir (HATA!)'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 -pthread main.cpp -o actuator_sync',
                './actuator_sync',
                '[KRİTİK HATA] Senkronizasyonsuz aktüatör hareketi donanımı kırdı!',
              ],
              hardwareTempC: 89,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage: 'Yetersiz Güvenlik: Kilitleri kaldırmak mekanik hasara yol açar.',
            },
          },
          {
            id: 'patch_os2_c',
            title: 'Yama C: İki Defa Aynı Kilidi Alma (Recursive Lock Hatası)',
            authorNote: 'mtx_left kilidini peş peşe iki kez alarak kendini kilitler.',
            isCorrect: false,
            codeDiff: {
              removed: ['        mtx_right.lock();'],
              added: ['        mtx_left.lock(); // Ayni thread ayni mutex\'i tekrar alamaz!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 124,
              terminalOutput: [
                'g++ -std=c++17 -pthread main.cpp -o actuator_sync',
                './actuator_sync',
                '[DEADLOCK] Recursive locking hatası! Thread kilitlendi.',
              ],
              hardwareTempC: 96,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage: 'Deadlock: Standart mutex özyinelemeli (recursive) olarak kilitlenemez.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage3_module_4_os_concurrency',
        name: 'Eşzamanlılık & Mutex Senkronizasyonu',
        tier: '3. Aşama - Modül 4',
        status: 'UNLOCKED',
        description: 'İşletim sistemleri multithreading, yarış durumu (race condition), kritik bölge ve mutex senkronizasyonu.',
        academicCredit: 'YZM306 - 3 AKTS',
        curriculumTopic: 'İşletim Sistemleri: Multithreading, Kritik Bölge & Mutex',
      },
      gadget: {
        id: 'gadget_coresync',
        name: 'Vanguard Güç Dağıtıcı',
        moduleId: 'stage3_module_4_os_concurrency',
        isUnlocked: false,
        icon: 'hardware-chip-outline',
        description: 'Ağır mekanize zırh güç reaktöründe çift çekirdekli iş parçacıklarını mutex ile senkronize eden donanım birimi.',
        hardwareSpec: 'Dual Core Concurrency Guard // Mutex Synchronization',
      },
    },
  ],

  // =========================================================================
  // 4. AŞAMA: KRALİYET LABORATUVARI // SARAY KADEMESİ
  // Samsun Üniversitesi 4. Sınıf Müfredatı (YZM374, YZM401, YZM371, YZM362, YZM366, YZM376, YZM357)
  // =========================================================================

  // -------------------------------------------------------------------------
  // MODÜL 4.1: Yazılım Mimarisi, Tasarım Kalıpları & Bitirme (YZM374 & YZM401)
  // NPC: Baş Bilgin Alistair (avatarKey: 'alistair')
  // -------------------------------------------------------------------------
  stage4_module_1_software_architecture: [
    {
      customer: {
        customerName: 'Baş Bilgin Alistair',
        customerRole: 'Kraliyet Baş Bilgini & Saray Başmühendisi',
        avatarKey: 'alistair',
        dialogText:
          'Hoş geldiniz kıymetli mühendis. Kraliyet Magitek Çekirdek Sistemi (Royal-Core Matrix v4), sarayın tüm enerji akışını ve savunma kalkanlarını tek bir merkezi mimari üzerinden koordine eder. Ancak çok çekirdekli arka plan servisleri aynı anda çekirdek örneğine eriştiğinde, çift kontrollü kilit (Double-Checked Locking) mekanizmasındaki donanımsal bellek bariyeri eksikliği yüzünden işlemci komutları yeniden sıralıyor. Henüz kurucusu tamamlanmamış yarım nesneler diğer iş parçacıklarına sızıyor ve sistem rastgele segfault veriyor!',
        physicalSymptom:
          'Kraliyet savunma kalkanı reaktörü rastgele aralıklarla çöküyor; çekirdek örneği birden fazla iş parçacığı tarafından yarım ilklendirilmiş halde okunuyor (SIGSEGV).',
        engineerDiagnosis:
          'Double-Checked Locking & Bellek Bariyeri Hatası — Ham gösterici ile yapılan çift kontrolde bellek bariyeri olmadığı için işlemci kurucu çağrısını tamamlamadan instance adresini yayınlamaktadır. Thread-safe Meyers Singleton veya std::atomic bellek modeli uygulanmalıdır.',
      },
      moduleData: {
        id: 'stage4_module_1_software_architecture',
        academicUnit: '4. Sınıf // Modül 1: Yazılım Mimarisi & Bitirme (YZM374 & YZM401)',
        deviceName: 'Kraliyet Magitek Çekirdek Matrisi (Royal-Core Matrix v4)',
        deviceCode: 'MCU-ROYAL-ARCH-01 // Saray Protokolü',
        physicalSymptom:
          'Eşzamanlı çekirdek erişiminde yarış durumu (race condition); yarım oluşturulmuş nesneye erişim ve bellek ihlali (SIGSEGV).',
        engineerDiagnosis:
          'Klasik çift kontrollü kilitlemede (DCLP) bellek bariyeri eksik. Modern C++11/17 Magic Statics (Meyers Singleton) ile güvenli ve kilitsiz tekillik sağlanmalıdır.',
        rewardGold: 160,
        rewardExp: 35,
        rewardItemName: 'Kraliyet Çekirdek Mimarisi Plaketi & Altın Pusula',
        brokenCode: `class RoyalCore {
private:
    static RoyalCore* instance;
    static std::mutex mtx;
    int energyFlux;
    RoyalCore() : energyFlux(10000) { init_subsystems(); }
public:
    static RoyalCore* getInstance() {
        if (instance == nullptr) { // 1. Kontrol
            std::lock_guard<std::mutex> lock(mtx);
            if (instance == nullptr) { // 2. Kontrol
                // [KRİTİK HATA]: Bellek bariyeri yok! Derleyici komutları yeniden sıralar,
                // kurucu tamamlanmadan instance adresi atanırsa diğer thread çöker.
                instance = new RoyalCore();
            }
        }
        return instance;
    }
};`,
        brokenCodeLines: [
          { lineNumber: 1, code: 'class RoyalCore {' },
          { lineNumber: 2, code: 'private:' },
          { lineNumber: 3, code: '    static RoyalCore* instance;' },
          { lineNumber: 4, code: '    static std::mutex mtx;' },
          { lineNumber: 5, code: '    int energyFlux;' },
          { lineNumber: 6, code: '    RoyalCore() : energyFlux(10000) { init_subsystems(); }' },
          { lineNumber: 7, code: 'public:' },
          { lineNumber: 8, code: '    static RoyalCore* getInstance() {' },
          { lineNumber: 9, code: '        if (instance == nullptr) { // 1. Kontrol' },
          { lineNumber: 10, code: '            std::lock_guard<std::mutex> lock(mtx);' },
          { lineNumber: 11, code: '            if (instance == nullptr) { // 2. Kontrol' },
          { lineNumber: 12, code: '                // ARİZA: Bellek bariyeri yok, yarım nesne sızıyor', isFaulty: true },
          { lineNumber: 13, code: '                instance = new RoyalCore();', isFaulty: true },
          { lineNumber: 14, code: '            }' },
          { lineNumber: 15, code: '        }' },
          { lineNumber: 16, code: '        return instance;' },
          { lineNumber: 17, code: '    }' },
          { lineNumber: 18, code: '};' },
        ],
        patchOptions: [
          {
            id: 'patch_arch_correct',
            title: "Yama A: Modern C++ Meyer's Singleton (Thread-Safe Magic Statics)",
            authorNote:
              "C++11 standardından itibaren fonksiyon içi yerel 'static RoyalCore instance;' ilklendirilmesi standart gereği iş parçacığı güvenlidir ve donanımsal bellek bariyeri sağlar.",
            isCorrect: true,
            codeDiff: {
              removed: [
                '        if (instance == nullptr) { // 1. Kontrol',
                '            std::lock_guard<std::mutex> lock(mtx);',
                '            if (instance == nullptr) { // 2. Kontrol',
                '                instance = new RoyalCore();',
                '            }',
                '        }',
                '        return instance;',
              ],
              added: [
                '        // C++11 Magic Static: Thread-safe, kilit darboğazı yok, sıfır maliyetli bellek bariyeri',
                '        static RoyalCore instance;',
                '        return &instance;',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -O3 -pthread royal_core.cpp -o royal_core',
                './royal_core --stress-test-threads=64',
                '[TEST GEÇTİ] 64 iş parçacığında tekil ve güvenli çekirdek örneği doğrulandı.',
                "[MİMARİ] Meyer's Singleton bellek bariyerini donanımsal düzeyde sağladı.",
                '[PERFORMANS] Kilit darboğazı: 0ms // İş parçacığı güvenliği: %100',
              ],
              hardwareTempC: 38,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                "Kusursuz Yazılım Mimarisi! Meyer's Singleton kalıbı hem çift kilit karmaşasını ve bellek bariyeri açığını giderdi hem de sıfır kilit maliyetiyle maksimum performans sağladı.",
            },
          },
          {
            id: 'patch_arch_err1',
            title: 'Yama B: Kilitleri Tamamen Kaldırıp Yalnızca Null Kontrolü Yapma',
            authorNote: 'Eşzamanlı koruma kilitlerini kaldırarak sadece tek bir if (instance == nullptr) kontrolü bırakır.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '            std::lock_guard<std::mutex> lock(mtx);',
                '            if (instance == nullptr) { // 2. Kontrol',
                '                instance = new RoyalCore();',
                '            }',
              ],
              added: [
                '            instance = new RoyalCore(); // Kilitsiz doğrudan tahsis',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 139,
              terminalOutput: [
                'g++ -std=c++17 -pthread royal_core.cpp -o royal_core',
                './royal_core --stress-test-threads=64',
                '[KRİTİK HATA] Race Condition! 14 ayrı RoyalCore örneği üretildi, bellek çakışması oluştu.',
                'Segmentation fault (core dumped) at address 0x00007fff89ab',
              ],
              hardwareTempC: 92,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Ciddi Mimari Hata: Eşzamanlı ortamda kilitsiz Singleton birden fazla nesne türeterek yarış durumu ve bellek çökmesine yol açar.',
            },
          },
          {
            id: 'patch_arch_err2',
            title: 'Yama C: Her Çağrıda Koşulsuz Mutex Kilitleme (Aşırı Darboğaz)',
            authorNote: 'Her getInstance çağrısında koşulsuz lock_guard alarak tekilleştirir fakat devasa kilitlenme darboğazı yaratır.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '        if (instance == nullptr) { // 1. Kontrol',
                '            std::lock_guard<std::mutex> lock(mtx);',
                '            if (instance == nullptr) { // 2. Kontrol',
                '                instance = new RoyalCore();',
                '            }',
                '        }',
              ],
              added: [
                '        std::lock_guard<std::mutex> lock(mtx); // Her okumada kilit al',
                '        if (!instance) instance = new RoyalCore();',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 124,
              terminalOutput: [
                'g++ -std=c++17 -pthread royal_core.cpp -o royal_core',
                './royal_core --benchmark-high-load',
                '[DARBOĞAZ] Saniyede 150.000 istek kilit kuyruğunda takıldı.',
                '[ZAMAN AŞIMI] Thread lock starvation: Kraliyet kalkan gecikmesi > 4500ms',
              ],
              hardwareTempC: 84,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Mimari Darboğazı: Her okuma çağrısında kilit almak aşırı lock contention oluşturur; yüksek frekanslı sistem mimarisi çöker.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage4_module_1_software_architecture',
        name: 'Yazılım Mimarisi & Thread-Safe Singleton',
        tier: '4. Aşama - Modül 1',
        status: 'UNLOCKED',
        description: 'Tasarım kalıpları, Meyer’s Singleton, donanımsal bellek bariyeri ve eşzamanlı sistem mimarisi.',
        academicCredit: 'YZM374/YZM401 - 6 AKTS',
        curriculumTopic: 'Yazılım Mimarisi & Bitirme: Thread-Safe Singleton & Bellek Bariyerleri',
      },
      gadget: {
        id: 'gadget_royal_arch',
        name: 'Kraliyet Çekirdek Matrisi',
        moduleId: 'stage4_module_1_software_architecture',
        isUnlocked: false,
        icon: 'cube-outline',
        description: 'Sarayın merkezi enerji ve kalkan protokollerini iş parçacığı güvenliğiyle koordine eden mimari birim.',
        hardwareSpec: 'Royal Enterprise Core // Magic Statics Memory Barrier',
      },
    },
  ],

  // -------------------------------------------------------------------------
  // MODÜL 4.2: Makine Öğrenmesi & Derin Öğrenme (YZM371 & YZM362)
  // NPC: Baş Simyacı Seraphina (avatarKey: 'seraphina')
  // -------------------------------------------------------------------------
  stage4_module_2_machine_learning: [
    {
      customer: {
        customerName: 'Baş Simyacı Seraphina',
        customerRole: 'Kraliyet Baş Simyacısı & Mana Reaktör Uzmanı',
        avatarKey: 'seraphina',
        dialogText:
          'Saygılar mühendis. Kraliyet simya laboratuvarındaki Mana Reaktörü Sıcaklık Tahminleyicisi (Aether-ML Core), reaktör çekirdeğindeki aether akısını ölçüp sıcaklığı önceden kestirerek patlamaları engellemek üzere gradyan inişi (Gradient Descent) ile eğitiliyor. Fakat yeni kalibrasyon verilerini yüklediğimizde tahmin katsayıları aniden sonsuza fırladı (NaN / Infinity) ve model tamamen ıraksadı! Reaktörün sensörleri ham değerlerle besleniyor ve öğrenme oranı (learning rate) kontrolsüz derecede yüksek tutulmuş!',
        physicalSymptom:
          'Sıcaklık tahmin matrisi NaN (Not a Number) üretiyor; reaktör tahmin hatası sonsuza ıraksayarak aşırı ısınma alarmını devre dışı bırakıyor.',
        engineerDiagnosis:
          'Öğrenme Oranı Iraksaması & Normalizasyon Bozulması — Öğrenme oranı (lr = 1.85) kabul edilebilir sınırın katbekat üzerinde ve ham girdiler normalize edilmeden gradyan inişine sokulmuş. Devasa gradyanlar sayısal taşmaya ve NaN kayıp (loss) değerlerine neden olmaktadır. Girdiler normalize edilmeli ve lr = 0.001f değerine çekilmelidir.',
      },
      moduleData: {
        id: 'stage4_module_2_machine_learning',
        academicUnit: '4. Sınıf // Modül 2: Makine Öğrenmesi & Derin Öğrenme (YZM371 & YZM362)',
        deviceName: 'Mana Reaktörü Sıcaklık Tahminleyicisi (Aether-Predictor ML)',
        deviceCode: 'MCU-AETHER-ML // Saray Simyası',
        physicalSymptom:
          'Kayıp fonksiyonu (Loss) patlaması; ağırlıklar NaN değerine ulaşıyor ve reaktör tahminleyicisi körleşiyor.',
        engineerDiagnosis:
          'Gradient Descent algoritmasında yüksek learning rate ve ölçeklendirilmemiş ham özellikler gradyan patlamasına yol açıyor. Min-Max normalizasyon ve kararlı öğrenme oranı gereklidir.',
        rewardGold: 175,
        rewardExp: 35,
        rewardItemName: 'Simyasal Mana Ağırlık Matrisi & Mavi Kristal Prizma',
        brokenCode: `void train_temperature_predictor(const std::vector<float>& raw_mana_flux, const std::vector<float>& actual_temp) {
    float weight = 0.5f;
    float bias = 0.0f;
    // [KRİTİK HATA]: Öğrenme oranı aşırı yüksek (1.85f) ve ham girdiler normalize edilmemiş!
    const float learning_rate = 1.85f;

    for (size_t epoch = 0; epoch < 1000; ++epoch) {
        float total_grad_w = 0.0f;
        for (size_t i = 0; i < raw_mana_flux.size(); ++i) {
            float y_pred = weight * raw_mana_flux[i] + bias;
            float error = y_pred - actual_temp[i];
            total_grad_w += error * raw_mana_flux[i]; // Gradyan patlaması!
        }
        weight -= learning_rate * (total_grad_w / raw_mana_flux.size());
    }
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: 'void train_temperature_predictor(const std::vector<float>& raw_mana_flux, const std::vector<float>& actual_temp) {' },
          { lineNumber: 2, code: '    float weight = 0.5f;' },
          { lineNumber: 3, code: '    float bias = 0.0f;' },
          { lineNumber: 4, code: '    // ARİZA: Aşırı yüksek learning rate & normalizasyon yok', isFaulty: true },
          { lineNumber: 5, code: '    const float learning_rate = 1.85f;', isFaulty: true },
          { lineNumber: 6, code: '    for (size_t epoch = 0; epoch < 1000; ++epoch) {' },
          { lineNumber: 7, code: '        float total_grad_w = 0.0f;' },
          { lineNumber: 8, code: '        for (size_t i = 0; i < raw_mana_flux.size(); ++i) {' },
          { lineNumber: 9, code: '            float y_pred = weight * raw_mana_flux[i] + bias;' },
          { lineNumber: 10, code: '            float error = y_pred - actual_temp[i];' },
          { lineNumber: 11, code: '            total_grad_w += error * raw_mana_flux[i];' },
          { lineNumber: 12, code: '        }' },
          { lineNumber: 13, code: '        weight -= learning_rate * (total_grad_w / raw_mana_flux.size());' },
          { lineNumber: 14, code: '    }' },
          { lineNumber: 15, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_ml_correct',
            title: 'Yama A: Min-Max Normalizasyon & Kararlı Öğrenme Oranı (lr = 0.001f)',
            authorNote:
              'Özellikleri [0.0, 1.0] aralığına normalize edip öğrenme oranını lr = 0.001f yaparak kayıp fonksiyonunun düzgün yakınsaması sağlanır.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '    const float learning_rate = 1.85f;',
                '            total_grad_w += error * raw_mana_flux[i]; // Gradyan patlaması!',
              ],
              added: [
                '    const float learning_rate = 0.001f; // Kararlı gradyan inişi',
                '    auto norm_flux = normalize_min_max(raw_mana_flux); // [0.0 - 1.0]',
                '            total_grad_w += error * norm_flux[i];',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -O3 ml_predictor.cpp -o ml_predictor',
                './ml_predictor --evaluate',
                '[BAŞARILI] Mana akı özellikleri [0.0, 1.0] aralığına normalize edildi.',
                '[EĞİTİM] Epoch 1000/1000: Loss = 0.0012 (Model başarıyla yakınsadı - Converged)',
                '[DONANIM] Reaktör sıcaklık tahmini nominal hata payında (MSE < 0.015).',
              ],
              hardwareTempC: 37,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Mükemmel Makine Öğrenmesi Entegrasyonu! Özellik normalizasyonu ve uygun öğrenme oranı gradyan patlamasını tamamen önleyerek reaktörün sıcaklığını hassas kestirdi.',
            },
          },
          {
            id: 'patch_ml_err1',
            title: 'Yama B: Öğrenme Oranını Sıfıra Eşitlemek (lr = 0.0f)',
            authorNote: 'Iraksamayı durdurmak için öğrenme oranını tamamen sıfırlar.',
            isCorrect: false,
            codeDiff: {
              removed: ['    const float learning_rate = 1.85f;'],
              added: ['    const float learning_rate = 0.0f; // Öğrenme tamamen kapatıldı'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 ml_predictor.cpp -o ml_predictor',
                './ml_predictor',
                '[HATA] Öğrenme gerçekleşmedi! Ağırlıklar güncellenmiyor (Zero learning).',
                'Loss: Sabit 12480.0 (Model reaktör sıcaklığını tahmin edemiyor)',
              ],
              hardwareTempC: 86,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Öğrenme Durdu: Öğrenme oranı sıfır yapıldığında model ağırlıkları güncellenemez ve tahmin sıfır doğrulukta kalır.',
            },
          },
          {
            id: 'patch_ml_err2',
            title: 'Yama C: Gradyanları Mutlak Değere Zorlamak (std::abs) ile Yönü Yok Etmek',
            authorNote: 'Gradyanların işaretini mutlak değerle pozitife çevirir.',
            isCorrect: false,
            codeDiff: {
              removed: ['        weight -= learning_rate * (total_grad_w / raw_mana_flux.size());'],
              added: ['        weight -= learning_rate * std::abs(total_grad_w / raw_mana_flux.size());'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 ml_predictor.cpp -o ml_predictor',
                './ml_predictor',
                '[HATA] Gradyan iniş yönü bozuldu! Loss sürekli tırmanıyor.',
                'Model global minimum yerine maksimum hataya doğru sürüklendi!',
              ],
              hardwareTempC: 94,
              hardwareStatus: 'CRITICAL_FAULT',
              feedbackMessage:
                'Matematiksel Mantık Hatası: Gradyanın işaretini yok etmek iniş vektörünün yönünü bozar ve hatayı büyüterek reaktörü tehlikeye atar.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage4_module_2_machine_learning',
        name: 'Makine Öğrenmesi & Derin Öğrenme',
        tier: '4. Aşama - Modül 2',
        status: 'UNLOCKED',
        description: 'Gradyan inişi optimizasyonu, öğrenme oranı yönetimi, özellik normalizasyonu ve yapay zeka modelleri.',
        academicCredit: 'YZM371/YZM362 - 6 AKTS',
        curriculumTopic: 'Makine Öğrenmesi & Derin Öğrenme: Gradyan İnişi, Öğrenme Oranı & Normalizasyon',
      },
      gadget: {
        id: 'gadget_mana_predictor',
        name: 'Aether Sıcaklık Tahminleyicisi',
        moduleId: 'stage4_module_2_machine_learning',
        isUnlocked: false,
        icon: 'analytics-outline',
        description: 'Mana reaktörü çekirdeğinde sıcaklık eğrisini derin öğrenme modeliyle gerçek zamanlı kestiren simyasal birim.',
        hardwareSpec: 'Aether Neural Matrix // Min-Max Normalizer & Gradient Optimizer',
      },
    },
  ],

  // -------------------------------------------------------------------------
  // MODÜL 4.3: Sistem Modelleme & Simülasyon (YZM366)
  // NPC: Gözlemevi Şefi Ignatius (avatarKey: 'ignatius')
  // -------------------------------------------------------------------------
  stage4_module_3_system_simulation: [
    {
      customer: {
        customerName: 'Gözlemevi Şefi Ignatius',
        customerRole: 'Kraliyet Gözlemevi Şefi & Astromagitek Bilgini',
        avatarKey: 'ignatius',
        dialogText:
          'Gökyüzünün kutlu ışıkları üzerinize olsun genç üstat. Kraliyet Gözlemevimizin kubbesindeki Göksel Yörünge Simülatörü (Orrery-Sim Matrix), gezegen ve takımyıldız hareketlerini ayrık zaman adımlarıyla simüle ederek tutulmaları ve mana gelgitlerini hesaplar. Ancak simülasyon belirli bir yörünge anına geldiğinde donuyor veya sonsuz döngüye girip olay kuyruğunu taşırıyor. Astronomlarımız simülasyon kodundaki kayan nokta (floating point) eşitlik karşılaştırmasının `sim_time == it->trigger_time` şeklinde yapıldığını ve IEEE 754 yuvarlama farkları yüzünden bu koşulun asla sağlanamadığını fark etti!',
        physicalSymptom:
          'Göksel yörünge mekanizması tutulma anında kilitleniyor; ayrık olay kuyruğu boşaltılamadığı için bellek taşması (Queue Overflow) meydana geliyor.',
        engineerDiagnosis:
          'Kayan Nokta Hassasiyeti (Epsilon) & Olay Kuyruğu Zaman Sıralaması — Kayan nokta aritmetiğinde doğrudan eşitlik (==) yuvarlama hataları yüzünden neredeyse hiçbir zaman sağlanamaz. `std::abs(sim_time - trigger_time) < EPSILON` toleransı ve güvenli kuyruk tüketimi uygulanmalıdır.',
      },
      moduleData: {
        id: 'stage4_module_3_system_simulation',
        academicUnit: '4. Sınıf // Modül 3: Sistem Modelleme & Simülasyon (YZM366)',
        deviceName: 'Göksel Yörünge Simülatörü (Celestial Orrery-Sim 4)',
        deviceCode: 'MCU-ORRERY-SIM // Gözlemevi Kulesi',
        physicalSymptom:
          'Kayan nokta hassasiyet kaybı yüzünden olay tetikleyicisi ıskalanıyor; astronomi olay kuyruğu taşıyor.',
        engineerDiagnosis:
          'Ayrık olay simülasyonunda zaman adımları kayan nokta doğrudan eşitliği (==) ile denetlenemez. Epsilon toleransı (`std::abs(a - b) < 1e-6`) şarttır.',
        rewardGold: 190,
        rewardExp: 40,
        rewardItemName: 'Pirinç Göksel Usturlap & Yörünge Dişlisi',
        brokenCode: `struct CelestialEvent {
    double trigger_time;
    int event_id;
};

void run_orrery_simulation(std::vector<CelestialEvent>& queue, double sim_time, double dt) {
    for (auto it = queue.begin(); it != queue.end(); ) {
        // [KRİTİK HATA]: IEEE 754 kayan nokta doğrudan eşitliği (==) yuvarlama sapması yüzünden tutmaz!
        if (sim_time == it->trigger_time) {
            execute_astronomical_event(it->event_id);
            it = queue.erase(it);
        } else {
            ++it;
        }
    }
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: 'struct CelestialEvent {' },
          { lineNumber: 2, code: '    double trigger_time;' },
          { lineNumber: 3, code: '    int event_id;' },
          { lineNumber: 4, code: '};' },
          { lineNumber: 5, code: 'void run_orrery_simulation(std::vector<CelestialEvent>& queue, double sim_time, double dt) {' },
          { lineNumber: 6, code: '    for (auto it = queue.begin(); it != queue.end(); ) {' },
          { lineNumber: 7, code: '        // ARİZA: Floating point doğrudan eşitlik (==) karşılaştırması', isFaulty: true },
          { lineNumber: 8, code: '        if (sim_time == it->trigger_time) {', isFaulty: true },
          { lineNumber: 9, code: '            execute_astronomical_event(it->event_id);' },
          { lineNumber: 10, code: '            it = queue.erase(it);' },
          { lineNumber: 11, code: '        } else {' },
          { lineNumber: 12, code: '            ++it;' },
          { lineNumber: 13, code: '        }' },
          { lineNumber: 14, code: '    }' },
          { lineNumber: 15, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_sim_correct',
            title: 'Yama A: Epsilon Toleransı (std::abs(diff) < 1e-6) & Güvenli Kuyruk Tüketimi',
            authorNote:
              'Kayan nokta yuvarlama sapmasını gidermek için std::abs(sim_time - it->trigger_time) <= (dt * 0.5) veya EPSILON eşiği uygulanır.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '        // [KRİTİK HATA]: IEEE 754 kayan nokta doğrudan eşitliği (==) yuvarlama sapması yüzünden tutmaz!',
                '        if (sim_time == it->trigger_time) {',
              ],
              added: [
                '        const double EPSILON = 1e-6;',
                '        if (std::abs(sim_time - it->trigger_time) < EPSILON || it->trigger_time <= sim_time) {',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -O3 sim_orrery.cpp -o sim_orrery',
                './sim_orrery --run-orbit-simulation',
                '[TEST GEÇTİ] 100.000 göksel olay zamanında ve sırasıyla tetiklendi.',
                '[SAYISAL KARARLILIK] Epsilon toleransı (1e-6) ile kayan nokta yuvarlama sapması giderildi.',
                '[KUYRUK] Olay kuyruğu taşması önlendi; bellek kullanımı stabil.',
              ],
              hardwareTempC: 39,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Harika Simülasyon Modellemesi! Kayan nokta eşitliklerinde epsilon yaklaşımı ve doğru olay kuyruğu yönetimi ile göksel yörünge mekanizması kusursuz senkronize edildi.',
            },
          },
          {
            id: 'patch_sim_err1',
            title: 'Yama B: Doğrudan Eşitliği Küçüktür (<) ile Değiştirip Bütün Olayları İlk Adımda Tüketmek',
            authorNote: 'Koşulu it->trigger_time > sim_time yerine ters çevirerek tüm gelecekteki olayları çalıştırır.',
            isCorrect: false,
            codeDiff: {
              removed: ['        if (sim_time == it->trigger_time) {'],
              added: ['        if (sim_time < it->trigger_time) { // Ters mantık!'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 sim_orrery.cpp -o sim_orrery',
                './sim_orrery',
                '[HATA] Gelecekteki tüm tutulma olayları t=0 anında tek seferde tetiklendi!',
                'Simülasyon kronolojisi bozuldu; teleskop kilitlendi.',
              ],
              hardwareTempC: 88,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Kronolojik Hata: Henüz gerçekleşme zamanı gelmemiş göksel olayların erken tetiklenmesi simülasyon mantığını bozar.',
            },
          },
          {
            id: 'patch_sim_err2',
            title: "Yama C: Kayan Noktayı uint64_t'ye Cast Edip Küsuratı Tamamen Atmak",
            authorNote: 'sim_time ve trigger_time değerlerini tam sayıya cast ederek küsuratı siler.',
            isCorrect: false,
            codeDiff: {
              removed: ['        if (sim_time == it->trigger_time) {'],
              added: ['        if ((uint64_t)sim_time == (uint64_t)it->trigger_time) {'],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 sim_orrery.cpp -o sim_orrery',
                './sim_orrery',
                '[HATA] Hassasiyet kaybı: 0.999 saniyelik küsuratlar silindi.',
                'Gezegen kavuşum anları 1 saniye gecikmeyle teleskop odağını kaçırdı.',
              ],
              hardwareTempC: 81,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Ağır Hassasiyet Kaybı: Kayan noktayı tam sayıya budamak milisaniyelik yörünge hesaplarını geçersiz kılar.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage4_module_3_system_simulation',
        name: 'Sistem Modelleme & Simülasyon',
        tier: '4. Aşama - Modül 3',
        status: 'UNLOCKED',
        description: 'Ayrık olay simülasyonu, kayan nokta sayısal kararlılığı, epsilon toleransı ve olay kuyruğu mimarisi.',
        academicCredit: 'YZM366 - 6 AKTS',
        curriculumTopic: 'Sistem Modelleme & Simülasyon: Kayan Nokta Epsilon, Olay Kuyruğu & Sayısal Kararlılık',
      },
      gadget: {
        id: 'gadget_celestial_orrery',
        name: 'Göksel Yörünge Simülatörü',
        moduleId: 'stage4_module_3_system_simulation',
        isUnlocked: false,
        icon: 'planet-outline',
        description: 'Kraliyet Gözlemevi kubbesinde gezegen ve yıldız rotalarını hassas epsilon matematiğiyle simüle eden pirinç mekanizma.',
        hardwareSpec: 'Celestial Orrery Core // IEEE-754 Epsilon Tolerance Engine',
      },
    },
  ],

  // -------------------------------------------------------------------------
  // MODÜL 4.4: Kriptografi & Bilgi Güvenliği (YZM376 & YZM357)
  // NPC: Kriptoloji Müdürü Valeria (avatarKey: 'valeria')
  // -------------------------------------------------------------------------
  stage4_module_4_cryptography_security: [
    {
      customer: {
        customerName: 'Kriptoloji Müdürü Valeria',
        customerRole: 'Kraliyet Kriptoloji & Şifre Dairesi Müdürü',
        avatarKey: 'valeria',
        dialogText:
          'Gözlerden uzak bir görev için buradayım mühendis. Kraliyet Sarayı ile sınır garnizonları arasındaki telgraf hatlarında en yüksek kademe şifreli protokol (Royal-CipherNet X) kullanılmaktadır. Ancak sarayın dışındaki korsan alıcıların şifreli mesaj doğrulamalarındaki milisaniyelik gecikmeleri ölçerek (Timing Attack / Yan Kanal Analizi) kraliyet güvenlik anahtarlarının karakterlerini tek tek deşifre ettiğini tespit ettik! Doğrulama kodumuz standart erken dönen (early-exit) dize karşılaştırması kullanıyor; yani ilk uyuşmayan karakterde hemen geri dönüyor. Üstelik paketlerde kullanılan Nonce sayacı sıfırlanabildiği için aynı anahtarla nonce çakışması yaşanıyor!',
        physicalSymptom:
          'Kriptografik telgraf hattı yan kanal zamanlama analizine (Side-Channel Timing Attack) açık; paket doğrulama sürelerindeki dalgalanmalar şifre anahtarını ele veriyor.',
        engineerDiagnosis:
          'Sabit Zamanlı Olmayan Karşılaştırma & Nonce Çakışması — Erken dönen (early-exit) karşılaştırma, doğru bayt sayısıyla orantılı süre harcadığından yan kanal sızıntısına yol açar. Tüm baytları koşan sabit zamanlı (constant-time bitwise OR) CRYPTO_memcmp ve benzersiz donanımsal Nonce uygulanmalıdır.',
      },
      moduleData: {
        id: 'stage4_module_4_cryptography_security',
        academicUnit: '4. Sınıf // Modül 4: Kriptografi & Bilgi Güvenliği (YZM376 & YZM357)',
        deviceName: 'Kraliyet Şifreli Telgraf Terminali (CipherNet-Cryptor X)',
        deviceCode: 'MCU-ROYAL-CIPHER-04 // Gizli Kademe',
        physicalSymptom:
          'Telgraf doğrulama süresi bayt konumuna göre değişiyor; zamanlama analiziyle gizli HMAC anahtarı çözülebiliyor.',
        engineerDiagnosis:
          'Erken çıkan dize karşılaştırmaları yan kanal saldırısına yol açar. Sabit zamanlı (constant-time O(N)) karşılaştırma fonksiyonu ve benzersiz Nonce garantisi şarttır.',
        rewardGold: 220,
        rewardExp: 45,
        rewardItemName: 'Kraliyet Kriptografik Şifre Mührü & Güvenlik Kartuşu',
        brokenCode: `bool verify_royal_auth_token(const uint8_t* expected_mac, const uint8_t* received_mac, size_t len) {
    // [KRİTİK GÜVENLİK AÇIĞI]: Erken dönen (early-exit) karşılaştırma zamanlama analizi (Timing Attack) yaratır!
    for (size_t i = 0; i < len; ++i) {
        if (expected_mac[i] != received_mac[i]) {
            return false; // Saldırgan eşleşen bayt sayısını CPU saat farkından ölçer!
        }
    }
    return true;
}`,
        brokenCodeLines: [
          { lineNumber: 1, code: 'bool verify_royal_auth_token(const uint8_t* expected_mac, const uint8_t* received_mac, size_t len) {' },
          { lineNumber: 2, code: '    // ARİZA: Early-exit karşılaştırma Timing Attack doğurur', isFaulty: true },
          { lineNumber: 3, code: '    for (size_t i = 0; i < len; ++i) {' },
          { lineNumber: 4, code: '        if (expected_mac[i] != received_mac[i]) {', isFaulty: true },
          { lineNumber: 5, code: '            return false; // Erken dönüş süresi anahtarı sızdırır', isFaulty: true },
          { lineNumber: 6, code: '        }' },
          { lineNumber: 7, code: '    }' },
          { lineNumber: 8, code: '    return true;' },
          { lineNumber: 9, code: '}' },
        ],
        patchOptions: [
          {
            id: 'patch_crypto_correct',
            title: 'Yama A: Sabit Zamanlı Kriptografik Karşılaştırma (Constant-Time Bitwise OR) & Nonce Bütünlüğü',
            authorNote:
              'Tüm baytlar eşleşsin veya eşleşmesin bitwise XOR farkı tek bir değişkende toplanarak sabit sürede (constant-time O(N)) karşılaştırılır.',
            isCorrect: true,
            codeDiff: {
              removed: [
                '    for (size_t i = 0; i < len; ++i) {',
                '        if (expected_mac[i] != received_mac[i]) {',
                '            return false; // Saldırgan eşleşen bayt sayısını CPU saat farkından ölçer!',
                '        }',
                '    }',
                '    return true;',
              ],
              added: [
                '    uint8_t diff = 0;',
                '    for (size_t i = 0; i < len; ++i) {',
                '        diff |= (expected_mac[i] ^ received_mac[i]); // Sabit zamanlı akümülatör',
                '    }',
                '    return (diff == 0); // Zamanlama sızıntısı sıfır',
              ],
            },
            compilerOutcome: {
              success: true,
              exitCode: 0,
              terminalOutput: [
                'g++ -std=c++17 -O3 ciphernet.cpp -o ciphernet',
                './ciphernet --timing-attack-probe 50000',
                '[GÜVENLİK RAPORU] Sabit zamanlı karşılaştırma devrede (Varyans: 0.00002ns).',
                '[TEST GEÇTİ] Yan kanal sızıntısı tespit edilemedi. Nonce çakışma koruması devrede.',
                '[KRİPTO PROTOKOL] Saray telgraf hattı askeri seviyede mühürlendi.',
              ],
              hardwareTempC: 36,
              hardwareStatus: 'OPTIMAL',
              feedbackMessage:
                'Üstün Kriptografik Güvenlik! Bitwise OR akümülatörü ile tüm baytlar koşulsuz tarandı ve zamanlama saldırısı (Timing Attack) ile yan kanal sızıntıları tamamen bertaraf edildi.',
            },
          },
          {
            id: 'patch_crypto_err1',
            title: 'Yama B: std::string İle Dönüştürüp str1 == str2 Kullanmak',
            authorNote: 'Dizileri std::string nesnesine çevirip standart eşitlik operatörüyle karşılaştırır.',
            isCorrect: false,
            codeDiff: {
              removed: [
                '    for (size_t i = 0; i < len; ++i) {',
                '        if (expected_mac[i] != received_mac[i]) {',
                '            return false;',
                '        }',
                '    }',
              ],
              added: [
                '    std::string s1((char*)expected_mac, len);',
                '    std::string s2((char*)received_mac, len);',
                '    return (s1 == s2); // std::string::operator== de erken sonlanır!',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 1,
              terminalOutput: [
                'g++ -std=c++17 ciphernet.cpp -o ciphernet',
                './ciphernet --timing-attack-probe',
                '[GÜVENLİK AÇIĞI] std::string operator== de ilk farklı karakterde döner!',
                'Timing attack başarıyla gizli anahtarı çıkardı!',
              ],
              hardwareTempC: 91,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Güvenlik İhlali: std::string operator== de dahili memcmp gibi ilk farklı karakterde döner; yan kanal sızıntısını engelleyemez.',
            },
          },
          {
            id: 'patch_crypto_err2',
            title: 'Yama C: Doğrulama Başarısız Olunca Rastgele Sleep (std::this_thread::sleep_for) Eklemek',
            authorNote: 'Zaman farkını örtmek için sleep_for ile rastgele gecikmeler ekler.',
            isCorrect: false,
            codeDiff: {
              removed: ['            return false;'],
              added: [
                '            std::this_thread::sleep_for(std::chrono::milliseconds(rand() % 50));',
                '            return false;',
              ],
            },
            compilerOutcome: {
              success: false,
              exitCode: 124,
              terminalOutput: [
                'g++ -std=c++17 ciphernet.cpp -o ciphernet',
                './ciphernet',
                '[GECİKME HATASI] Sahte gecikme sunucu thread havuzunu tüketip DoS oluşturdu.',
                'İstatistiki ortalama alındığında timing attack varyansı hala anahtarı veriyor!',
              ],
              hardwareTempC: 85,
              hardwareStatus: 'OVERHEATING',
              feedbackMessage:
                'Yetersiz Önlem: Rastgele sleep eklemek istatistiksel zamanlama analizini engellemez, yalnızca DoS darboğazı yaratır.',
            },
          },
        ],
      },
      skillNode: {
        id: 'stage4_module_4_cryptography_security',
        name: 'Kriptografi & Bilgi Güvenliği',
        tier: '4. Aşama - Modül 4',
        status: 'UNLOCKED',
        description: 'Sabit zamanlı karşılaştırma, zamanlama yan kanal saldırıları, nonce tekilliği ve şifreli iletişim güvenliği.',
        academicCredit: 'YZM376/YZM357 - 6 AKTS',
        curriculumTopic: 'Kriptografi & Güvenlik: Sabit Zamanlı Karşılaştırma, Nonce Bütünlüğü & Yan Kanal Koruması',
      },
      gadget: {
        id: 'gadget_ciphernet_terminal',
        name: 'Kraliyet Kripto Terminali',
        moduleId: 'stage4_module_4_cryptography_security',
        isUnlocked: false,
        icon: 'lock-closed-outline',
        description: 'Saray ile garnizonlar arasındaki iletişimi sabit zamanlı kriptografi ve benzersiz nonce ile zırhlayan telgraf birimi.',
        hardwareSpec: 'CipherNet-X Hardware // Constant-Time Side-Channel Immunity',
      },
    },
  ],

};

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
  stage2_module_1_oop_classes: MODULE_TASK_POOLS.stage2_module_1_oop_classes[0],
  stage2_module_2_oop_polymorphism: MODULE_TASK_POOLS.stage2_module_2_oop_polymorphism[0],
  stage2_module_3_linear_structures: MODULE_TASK_POOLS.stage2_module_3_linear_structures[0],
  stage2_module_4_trees_indexing: MODULE_TASK_POOLS.stage2_module_4_trees_indexing[0],
  stage3_module_1_databases: MODULE_TASK_POOLS.stage3_module_1_databases[0],
  stage3_module_2_networking: MODULE_TASK_POOLS.stage3_module_2_networking[0],
  stage3_module_3_software_testing: MODULE_TASK_POOLS.stage3_module_3_software_testing[0],
  stage3_module_4_os_concurrency: MODULE_TASK_POOLS.stage3_module_4_os_concurrency[0],
  stage4_module_1_software_architecture: MODULE_TASK_POOLS.stage4_module_1_software_architecture[0],
  stage4_module_2_machine_learning: MODULE_TASK_POOLS.stage4_module_2_machine_learning[0],
  stage4_module_3_system_simulation: MODULE_TASK_POOLS.stage4_module_3_system_simulation[0],
  stage4_module_4_cryptography_security: MODULE_TASK_POOLS.stage4_module_4_cryptography_security[0],
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
