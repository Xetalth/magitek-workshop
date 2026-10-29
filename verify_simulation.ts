import { sduiEngine } from './src/services/sduiEngine';
import { CURRICULUM_MODULES, MODULE_ORDER } from './src/data/curriculumModules';

console.log('===============================================================');
console.log('Magitek Workshop - 1. Sınıf Yazılım Mühendisliği Simülasyonu');
console.log('Aşama 1 Otonom Uçtan Uca Doğrulama Testi (Magitek Refinement)');
console.log('===============================================================\n');

// 1. SDUI İlk Durum Kontrolü
let state = sduiEngine.getDeclarativeState();
console.log('[TEST 1] SDUI İlk Durum ve Omurga:');
console.log(`  -> Aktif Sekme: ${state.activeTab}`);
console.log(`  -> HUD Başlık: ${state.hud.levelTitle} | Sınıf: ${state.hud.classTitle}`);
console.log(`  -> Altın: ${state.hud.gold} G | Gün: ${state.hud.day} | EXP: %${state.hud.expPercentage}`);
console.log(`  -> Aktif Modül: ${state.workbench.activeModule.deviceName} (${state.workbench.activeModule.id})`);
console.log(`  -> Müşteri: ${state.workshop.customer.customerName} (${state.workshop.customer.customerRole})`);
console.log(`  -> Müfredat Ağacı Düğüm Sayısı: ${state.skills.nodes.length}`);
console.log(`  -> Kişisel Oda Alet Sayısı: ${state.room.unlockedGadgets.length}`);

if (state.workbench.activeModule.id !== 'module_1_loops') {
  throw new Error('İlk aktif modül module_1_loops olmalı!');
}

// 2. Modül 1: Mantıksal Sınır & Off-by-one ve Aşırı Isınma Testi
console.log('\n[TEST 2] Modül 1: Mantıksal Sınır & Off-by-one / Aşırı Isınma Simülasyonu:');
sduiEngine.selectPatch('patch_1_faulty_1');
let compileRes1Fail = sduiEngine.runCompileAndTest();
state = sduiEngine.getDeclarativeState();
console.log(`  -> Hatalı Yama Derlendi: Başarı=${compileRes1Fail.success}, Sıcaklık=${compileRes1Fail.tempC}°C`);
console.log(`  -> Donanım Durumu: ${state.workbench.hardwareTelemetry.statusText}`);
if (compileRes1Fail.success !== false || compileRes1Fail.tempC < 75) {
  throw new Error('Hatalı yama aşırı ısınma ve başarısızlık üretmeliydi!');
}

// Doğru yama seçimi ve derleme
sduiEngine.selectPatch('patch_1_correct');
let compileRes1Success = sduiEngine.runCompileAndTest();
state = sduiEngine.getDeclarativeState();
console.log(`  -> Doğru Yama Derlendi: Başarı=${compileRes1Success.success}, Sıcaklık=${compileRes1Success.tempC}°C`);
console.log(`  -> Tezgâh Durumu: ${state.workbench.inspectionStatus}`);
if (compileRes1Success.success !== true || state.workbench.inspectionStatus !== 'REPAIRED') {
  throw new Error('Doğru yama REPAIRED statüsü üretmeliydi!');
}

// Teslimat döngüsü ve ödül
const goldPre1 = state.hud.gold;
sduiEngine.deliverJob();
state = sduiEngine.getDeclarativeState();
console.log(`  -> Modül 1 Teslim Edildi: Yeni Altın=${state.hud.gold} (+${state.hud.gold - goldPre1} G)`);
console.log(`  -> Sohbet Kilidi: ${state.workshop.conversation.isUnlocked}`);
console.log(`  -> Odadaki Mekanik Devir Sayacı Açıldı: ${state.room.unlockedGadgets[0].isUnlocked}`);
if (!state.room.unlockedGadgets[0].isUnlocked) {
  throw new Error('Modül 1 teslimatı sonrasında Oda Aleti 1 açılmadı!');
}

// 3. Modül 2: Dinamik Bellek & Göstericiler (malloc/free sızıntısı)
console.log('\n[TEST 3] Modül 2: Dinamik Bellek & Heap Yönetimi (malloc/free sızıntısı):');
sduiEngine.advanceToNextModule();
state = sduiEngine.getDeclarativeState();
console.log(`  -> Aktif Modül: ${state.workbench.activeModule.deviceName}`);
console.log(`  -> Müşteri: ${state.workshop.customer.customerName}`);

// Hatalı use-after-free testi
sduiEngine.selectPatch('patch_2_faulty_1');
let compileRes2Fail = sduiEngine.runCompileAndTest();
console.log(`  -> Use-After-Free Yaması: Başarı=${compileRes2Fail.success}, Sıcaklık=${compileRes2Fail.tempC}°C`);
if (compileRes2Fail.success) throw new Error('Use-after-free başarısız olmalıydı!');

// Düzgün free() ve NULL yaması
sduiEngine.selectPatch('patch_2_correct');
let compileRes2Success = sduiEngine.runCompileAndTest();
console.log(`  -> Düzgün free() Yaması: Başarı=${compileRes2Success.success}, Sıcaklık=${compileRes2Success.tempC}°C`);
sduiEngine.deliverJob();
state = sduiEngine.getDeclarativeState();
console.log(`  -> Odadaki Katot Osiloskobu Açıldı: ${state.room.unlockedGadgets[1].isUnlocked}`);
if (!state.room.unlockedGadgets[1].isUnlocked) {
  throw new Error('Modül 2 teslimatı sonrasında Osiloskop açılmadı!');
}

// 4. Modül 3: Yapılar (Structs) & Bellek Hizalama (Alignment/Padding)
console.log('\n[TEST 4] Modül 3: Yapılar (Structs) & Bellek Hizalama (Padding Optimizasyonu):');
sduiEngine.advanceToNextModule();
state = sduiEngine.getDeclarativeState();
console.log(`  -> Aktif Modül: ${state.workbench.activeModule.deviceName}`);
console.log(`  -> Müşteri: ${state.workshop.customer.customerName}`);

sduiEngine.selectPatch('patch_3_correct');
let compileRes3Success = sduiEngine.runCompileAndTest();
console.log(`  -> Struct Hizalama Yaması: Başarı=${compileRes3Success.success}, Sıcaklık=${compileRes3Success.tempC}°C`);
sduiEngine.deliverJob();
state = sduiEngine.getDeclarativeState();
console.log(`  -> Odadaki Ambar Kütük Kartuşu Açıldı: ${state.room.unlockedGadgets[2].isUnlocked}`);
if (!state.room.unlockedGadgets[2].isUnlocked) {
  throw new Error('Modül 3 teslimatı sonrasında Kütük Kartuşu açılmadı!');
}

// 5. Modül 4: Hata Ayıklama & Spesifikasyon / Test Senaryoları (Unit Testing & Evals)
console.log('\n[TEST 5] Modül 4: Hata Ayıklama & Test Senaryoları (Unit Testing & Evals):');
sduiEngine.advanceToNextModule();
state = sduiEngine.getDeclarativeState();
console.log(`  -> Aktif Modül: ${state.workbench.activeModule.deviceName}`);
console.log(`  -> Müşteri: ${state.workshop.customer.customerName}`);

sduiEngine.selectPatch('patch_4_correct');
let compileRes4Success = sduiEngine.runCompileAndTest();
console.log(`  -> Unit Test & Guard Clause Yaması: Başarı=${compileRes4Success.success}`);
sduiEngine.deliverJob();
state = sduiEngine.getDeclarativeState();
console.log(`  -> Odadaki Altın Test Plaketi Açıldı: ${state.room.unlockedGadgets[3].isUnlocked}`);
console.log(`  -> Tüm 4 Modül Tamamlandı: ${state.room.unlockedGadgets.every(g => g.isUnlocked)}`);
console.log(`  -> Güncellenen Seviye: ${state.hud.levelTitle}`);
console.log(`  -> Akademik İlerleme: ${state.hud.academicProgress}`);
if (!state.room.unlockedGadgets[3].isUnlocked || state.hud.academicProgress !== '1. Sınıf İlerlemesi: 4/4 Modül Onaylandı') {
  throw new Error('Modül 4 tamamlanması ve akademik ilerleme eksik!');
}

// 6. Mağaza & Büyüyen Kişisel Oda Testi
console.log('\n[TEST 6] Mağaza & Kişisel Oda Entegrasyonu:');
const goldPreShop = state.hud.gold;
console.log(`  -> Mevcut Altın: ${goldPreShop} G`);
const buy1 = sduiEngine.buyShopItem('music_box');
const buy2 = sduiEngine.buyShopItem('desk_lamp');
state = sduiEngine.getDeclarativeState();
console.log(`  -> Müzik Kutusu Satın Alındı: ${buy1}`);
console.log(`  -> Filament Lamba Satın Alındı: ${buy2}`);
console.log(`  -> Kalan Altın: ${state.hud.gold} G`);
const purchasedInRoom = state.shop.items.filter(i => i.status === 'UNLOCKED').length;
console.log(`  -> Odadaki Mağaza Eşyaları Sayısı: ${purchasedInRoom}`);
if (purchasedInRoom < 2) {
  throw new Error('Mağazadan alınan eşyalar odaya yansımadı!');
}

console.log('\n===============================================================');
console.log('TEBRİKLER! 1. Sınıf Yazılım Mühendisliği Simülasyonu');
console.log('TÜM TEST SENARYOLARI KUSURSUZ ŞEKİLDE ÇALIŞTI (6/6 BAŞARILI)');
console.log('===============================================================\n');
