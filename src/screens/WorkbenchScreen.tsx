import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkbenchState, ModuleId } from '../types/sdui';
import { COLORS } from '../theme/colors';
import { sduiEngine } from '../services/sduiEngine';

interface WorkbenchScreenProps {
  data: WorkbenchState;
  onSelectModule: (moduleId: ModuleId) => void;
  onSelectPatch: (patchId: string) => void;
  onCompileAndTest: () => void;
  onGoToWorkshop: () => void;
  onSelectStage?: (stage: number) => void;
}

interface ClassItem {
  id: string;
  stageNumber: number;
  level: string;
  title: string;
  subtitle: string;

}

const CURRICULUM_CLASSES: ClassItem[] = [
  {
    id: 'class_1',
    stageNumber: 1,
    level: '1. Sınıf',
    title: '1. Sınıf: Algoritmalar & C',
    subtitle: 'Temel Mantık, Döngüler, Göstericiler (Pointers), Bellek & Structs',

  },
  {
    id: 'class_2',
    stageNumber: 2,
    level: '2. Sınıf',
    title: '2. Sınıf: Veri Yapıları & Bellek',
    subtitle: 'Bağlı Listeler, Ağaçlar, Heap Optimizasyonu & Buffer Tasarımı',

  },
  {
    id: 'class_3',
    stageNumber: 3,
    level: '3. Sınıf',
    title: '3. Sınıf: İşletim Sistemleri & Çekirdek',
    subtitle: 'Donanım Kesmeleri (Interrupts), Sürücüler & Eşzamanlılık',

  },
  {
    id: 'class_4',
    stageNumber: 4,
    level: '4. Sınıf',
    title: '4. Sınıf: Dağıtık Sistemler & Mimari',
    subtitle: 'Gömülü Magitek Bus, Protokol Doğrulama & Güvenilirlik',

  },
];

export const WorkbenchScreen: React.FC<WorkbenchScreenProps> = ({
  data,
  onSelectModule,
  onSelectPatch,
  onCompileAndTest,
  onGoToWorkshop,
  onSelectStage,
}) => {
  const insets = useSafeAreaInsets();
  const [isCompiling, setIsCompiling] = useState(false);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  const activeMod = data.activeModule;
  const currentViewStage = data.currentViewStage ?? 1;
  const currentClassObj = CURRICULUM_CLASSES.find((c) => c.stageNumber === currentViewStage) || CURRICULUM_CLASSES[0];
  const isOverheating = data.hardwareTelemetry.temperatureC > 75;
  const isRepaired = data.inspectionStatus === 'REPAIRED';

  const handleCompilePress = () => {
    setIsCompiling(true);
    setTimeout(() => {
      onCompileAndTest();
      setIsCompiling(false);
    }, 600);
  };

  const selectedPatch = activeMod.patchOptions.find((p) => p.id === data.selectedPatchId);

  // Syntax highlighting helper for code lines
  const renderCodeLine = (lineText: string, isFaulty?: boolean) => {
    // If it's a comment
    if (lineText.trim().startsWith('//')) {
      return <Text style={styles.codeComment}>{lineText}</Text>;
    }

    // Split words to highlight C keywords
    const tokens = lineText.split(/(\s+|[(){}[\];,.<>=+\-*/!&#])/);
    return (
      <Text style={isFaulty ? styles.faultyCodeText : styles.normalCodeText}>
        {tokens.map((token, idx) => {
          if (
            [
              'void',
              'int',
              'uint8_t',
              'uint16_t',
              'uint32_t',
              'float',
              'static',
              'typedef',
              'struct',
              'for',
              'while',
              'if',
              'else',
              'return',
              '#define',
              '#include',
              'sizeof',
              'malloc',
              'free',
              'NULL',
              'assert',
            ].includes(token)
          ) {
            return (
              <Text key={idx} style={styles.codeKeyword}>
                {token}
              </Text>
            );
          }
          if (token.match(/^[0-9]+$/)) {
            return (
              <Text key={idx} style={styles.codeNumber}>
                {token}
              </Text>
            );
          }
          if (
            ['read_sensor_rpm', 'transmit_packet', 'monitor_valve_pressure', 'write_grain_record', 'calculate_water_share'].includes(
              token
            )
          ) {
            return (
              <Text key={idx} style={styles.codeFunction}>
                {token}
              </Text>
            );
          }
          return token;
        })}
      </Text>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: 85 + insets.bottom }]}
    >
      {/* İkili Magitek Dropdown Navigasyon Sistemi (Pill Bar Yerine) */}
      <View style={styles.dropdownContainer}>
        {/* Sol Dropdown: Aşama / Sınıf Seçici */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setClassModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownTopRow}>
            <Ionicons name="school-outline" size={12} color={COLORS.neonCyanBright} />
            <Text style={styles.dropdownCategory}>AŞAMA // SINIF</Text>
          </View>
          <View style={styles.dropdownValueRow}>
            <Text style={styles.dropdownValueText} numberOfLines={1}>
              {currentClassObj.title}
            </Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.neonAmberBright} />
          </View>
        </TouchableOpacity>

        {/* Sağ Dropdown: Görev / Arıza Seçici */}
        <TouchableOpacity
          style={[styles.dropdownButton, styles.dropdownButtonTask]}
          onPress={() => setTaskModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownTopRow}>
            <Ionicons name="hardware-chip-outline" size={12} color={COLORS.neonAmberBright} />
            <Text style={styles.dropdownCategory}>GÖREV // ARIZALI CİHAZ</Text>
          </View>
          <View style={styles.dropdownValueRow}>
            <Text style={[styles.dropdownValueText, styles.dropdownValueTextTask]} numberOfLines={1}>
              {activeMod.deviceName.split('(')[0].trim()}
            </Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.neonCyanBright} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Dinamik Görev / Gemini API Yükleme Durumu */}
      {data.isLoadingDynamicTask && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator size="small" color={COLORS.neonAmberBright} />
          <View style={styles.loadingContent}>
            <Text style={styles.loadingTitle}>⚙️ Makina Şebekesinden Telemetri Alınıyor...</Text>
            <Text style={styles.loadingSubtitle}>
              Groq AI (qwen/qwen3.8-27b) ile gömülü C arızası ve test harness senkronize ediliyor...
            </Text>
          </View>
        </View>
      )}

      {/* Donanım Telemetri & Teşhis Paneli */}
      <View style={[styles.telemetryCard, isOverheating && styles.telemetryCardOverheating]}>
        <View style={styles.telemetryTop}>
          <View style={styles.deviceMeta}>
            <View style={styles.deviceNameRow}>
              <Text style={styles.deviceNameText}>{activeMod.deviceName}</Text>
              {(activeMod.id.startsWith('dynamic_task_') ||
                activeMod.deviceName.includes('[CANLI AI]')) ? (
                <View style={styles.liveAiBadge}>
                  <Ionicons name="sparkles" size={10} color={COLORS.neonGreenBright} />
                  <Text style={styles.liveAiBadgeText}>CANLI AI</Text>
                </View>
              ) : (
                <View style={[styles.liveAiBadge, styles.seedPoolBadge]}>
                  <Ionicons name="hardware-chip-outline" size={10} color={COLORS.neonCyanBright} />
                  <Text style={[styles.liveAiBadgeText, styles.seedPoolBadgeText]}>GÖREV HAVUZU</Text>
                </View>
              )}

              {/* Havuzdaki alternatif tohum görevine geçme butonu */}
              <TouchableOpacity
                style={styles.cycleTaskButton}
                onPress={() => onSelectModule(activeMod.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="sync-outline" size={11} color={COLORS.neonAmberBright} />
                <Text style={styles.cycleTaskButtonText}>Alternatif Görev</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.deviceCodeText}>{activeMod.deviceCode}</Text>
          </View>

          {/* Donanım Sıcaklık Kadranı */}
          <View
            style={[
              styles.tempBadge,
              isOverheating
                ? styles.tempBadgeHot
                : isRepaired
                ? styles.tempBadgeCool
                : styles.tempBadgeWarm,
            ]}
          >
            <Ionicons
              name={isOverheating ? 'flame' : 'thermometer-outline'}
              size={15}
              color={isOverheating ? COLORS.neonCrimson : isRepaired ? COLORS.neonGreenBright : COLORS.neonAmberBright}
            />
            <Text
              style={[
                styles.tempText,
                isOverheating
                  ? styles.tempTextHot
                  : isRepaired
                  ? styles.tempTextCool
                  : styles.tempTextWarm,
              ]}
            >
              {data.hardwareTelemetry.temperatureC}°C
            </Text>
          </View>
        </View>

        {/* Akademik Konu & Durum */}
        <View style={styles.academicRow}>
          <Ionicons name="book-outline" size={13} color={COLORS.textAccent} />
          <Text style={styles.academicUnitText}>{activeMod.academicUnit}</Text>
        </View>

        {/* Aşırı Isınma Uyarısı (Hatalı yama derlendiğinde) */}
        {isOverheating && (
          <View style={styles.overheatAlertBox}>
            <Ionicons name="warning" size={16} color={COLORS.neonCrimson} />
            <Text style={styles.overheatAlertText}>
              DONANIM AŞIRI ISINDI! Mantık hatası/bellek sızıntısı mikrodenetleyiciyi kilitledi. Farklı bir yama seçip yeniden derleyin!
            </Text>
          </View>
        )}

        {/* Başarı Kutusu (Doğru yama derlendiğinde) */}
        {isRepaired && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-done-circle" size={18} color={COLORS.neonGreenBright} />
            <View style={styles.successTextCol}>
              <Text style={styles.successTitle}>DONANIM ONARILDI & TESTLERİ GEÇTİ!</Text>
              <Text style={styles.successDesc}>
                Cihaz nominal 36°C sıcaklığa döndü. Atölye sekmesine dönerek işi müşteriye teslim edebilirsiniz.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* C Kod Editörü / Kaynak İnceleme Bölümü */}
      <View style={styles.editorContainer}>
        {/* IDE Başlık Çubuğu */}
        <View style={styles.editorHeader}>
          <View style={styles.fileTab}>
            <Ionicons name="code-slash" size={13} color={COLORS.neonCyanBright} />
            <Text style={styles.fileTabText}>firmware.c // [AVR-GCC Standart C11]</Text>
          </View>
          <View style={styles.trafficLights}>
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
            <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
            <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
          </View>
        </View>

        {/* Kod Satırları */}
        <View style={styles.codeBody}>
          {activeMod.brokenCodeLines.map((line) => (
            <View
              key={line.lineNumber}
              style={[
                styles.codeRow,
                line.isFaulty && !isRepaired && styles.codeRowFaulty,
              ]}
            >
              <Text style={styles.lineNumber}>
                {line.lineNumber < 10 ? `0${line.lineNumber}` : line.lineNumber}
              </Text>
              <View style={styles.codeLineWrapper}>
                {renderCodeLine(line.code, line.isFaulty && !isRepaired)}
              </View>
              {line.isFaulty && !isRepaired && (
                <View style={styles.faultyFlag}>
                  <Text style={styles.faultyFlagText}>[ARIZA]</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Seçili Yamanın Diff Önizlemesi */}
        {selectedPatch && (
          <View style={styles.diffPreviewBox}>
            <View style={styles.diffHeader}>
              <Ionicons name="git-commit-outline" size={14} color={COLORS.neonAmberBright} />
              <Text style={styles.diffHeaderText}>Yama Önizlemesi (Diff): {selectedPatch.title}</Text>
            </View>

            {selectedPatch.codeDiff.removed.map((rem, i) => (
              <View key={`rem_${i}`} style={styles.diffRemovedRow}>
                <Text style={styles.diffSign}>-</Text>
                <Text style={styles.diffRemovedText}>{rem}</Text>
              </View>
            ))}

            {selectedPatch.codeDiff.added.map((add, i) => (
              <View key={`add_${i}`} style={styles.diffAddedRow}>
                <Text style={styles.diffSign}>+</Text>
                <Text style={styles.diffAddedText}>{add}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* İnteraktif Mühendislik Yama Seçici */}
      <View style={styles.patchSection}>
        <View style={styles.patchSectionHeader}>
          <Ionicons name="git-pull-request-outline" size={16} color={COLORS.neonAmberBright} />
          <Text style={styles.patchSectionTitle}>İNTERAKTİF YAMA SEÇENEKLERİ (PATCH HARNESS)</Text>
        </View>

        <Text style={styles.patchSectionSub}>
          Arızayı giderecek mantık düzeltmesini seçin ve ardından derleme simülasyonunu başlatın:
        </Text>

        <View style={styles.patchList}>
          {activeMod.patchOptions.map((patch) => {
            const isSelected = data.selectedPatchId === patch.id;
            return (
              <TouchableOpacity
                key={patch.id}
                style={[styles.patchCard, isSelected && styles.patchCardSelected]}
                onPress={() => onSelectPatch(patch.id)}
                activeOpacity={0.8}
              >
                <View style={styles.patchCardTop}>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[styles.patchTitleText, isSelected && styles.patchTitleTextSelected]}
                  >
                    {patch.title}
                  </Text>
                </View>

                <Text style={styles.patchNoteText}>{patch.authorNote}</Text>

                <View style={styles.patchCardFooter}>
                  <View style={styles.patchBadge}>
                    <Text style={styles.patchBadgeText}>
                      {isSelected ? '✓ SEÇİLDİ (DERLEMEYE HAZIR)' : 'SEÇMEK İÇİN DOKUN'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Derle & Test Et Aksiyon Butonu */}
      <View style={styles.compilerActionSection}>
        <TouchableOpacity
          style={[
            styles.compileButton,
            (!data.selectedPatchId || data.isLoadingDynamicTask) && styles.compileButtonDisabled,
            isCompiling && styles.compileButtonLoading,
          ]}
          onPress={handleCompilePress}
          disabled={!data.selectedPatchId || isCompiling || data.isLoadingDynamicTask}
          activeOpacity={0.8}
        >
          {isCompiling ? (
            <ActivityIndicator size="small" color={COLORS.bgPrimary} />
          ) : (
            <Ionicons name="play" size={18} color={COLORS.bgPrimary} />
          )}
          <Text style={styles.compileButtonText}>
            {isCompiling
              ? 'DERLENİYOR & BİRİM TESTLERİ KOŞULUYOR...'
              : data.isLoadingDynamicTask
              ? 'TELEMETRİ EŞİTLENİYOR...'
              : 'DERLE & TEST ET (gcc -Wall -O2)'}
          </Text>
        </TouchableOpacity>

        {isRepaired && (
          <TouchableOpacity
            style={styles.goToWorkshopButton}
            onPress={onGoToWorkshop}
            activeOpacity={0.8}
          >
            <Ionicons name="storefront-outline" size={16} color={COLORS.neonCyanBright} />
            <Text style={styles.goToWorkshopButtonText}>Atölyeye Dön & İşi Teslim Et</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tezgâh Terminal Konsolu (Compiler & Eval Output) */}
      <View style={styles.terminalContainer}>
        <View style={styles.terminalHeader}>
          <Ionicons name="terminal-outline" size={14} color={COLORS.neonCyanBright} />
          <Text style={styles.terminalHeaderText}>MAGITEK EMBEDDED CONSOLE // EVAL HARNESS</Text>
        </View>

        <View style={styles.terminalBody}>
          {data.terminalLogs.map((log, index) => {
            const isError =
              log.includes('HATA') ||
              log.includes('CRITICAL') ||
              log.includes('ALERT') ||
              log.includes('SIGSEGV') ||
              log.includes('SIGABRT');
            const isSuccess =
              log.includes('SUCCESS') ||
              log.includes('PASS') ||
              log.includes('OPTIMAL') ||
              log.includes('PASSED');
            return (
              <Text
                key={index}
                style={[
                  styles.terminalLogText,
                  isError && styles.terminalLogError,
                  isSuccess && styles.terminalLogSuccess,
                ]}
              >
                {log}
              </Text>
            );
          })}
        </View>
      </View>

      {/* 1. Sol Modal: Aşama / Sınıf Seçici */}
      <Modal
        visible={classModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setClassModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setClassModalVisible(false)}
        >
          <View
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="school-outline" size={16} color={COLORS.neonCyanBright} />
                <Text style={styles.modalHeaderTitle}>MÜHENDİSLİK SINIFI SEÇİN</Text>
              </View>
              <TouchableOpacity onPress={() => setClassModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {CURRICULUM_CLASSES.map((cls) => {
                const maxUnlocked = data.maxUnlockedStage ?? 1;
                const isLocked = cls.stageNumber > maxUnlocked;
                const isUnlocked = !isLocked;
                const isSelected = cls.stageNumber === currentViewStage;
                return (
                  <TouchableOpacity
                    key={cls.id}
                    style={[
                      styles.modalOptionCard,
                      isUnlocked ? styles.modalOptionUnlocked : styles.modalOptionLocked,
                      isSelected && styles.modalOptionActive,
                    ]}
                    disabled={isLocked}
                    onPress={() => {
                      if (onSelectStage) {
                        onSelectStage(cls.stageNumber);
                      } else {
                        sduiEngine.switchViewStage(cls.stageNumber);
                      }
                      setClassModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionTopRow}>
                      <View style={styles.optionTitleRow}>
                        <Ionicons
                          name={isLocked ? 'lock-closed' : isSelected ? 'radio-button-on' : 'school'}
                          size={15}
                          color={isLocked ? COLORS.textMuted : isSelected ? COLORS.neonCyanBright : COLORS.neonGreenBright}
                        />
                        <Text
                          style={[
                            styles.optionTitle,
                            isUnlocked ? (isSelected ? styles.optionTitleActive : styles.optionTitleUnlocked) : styles.optionTitleLocked,
                          ]}
                        >
                          {cls.title}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.optionBadge,
                          isSelected
                            ? styles.optionBadgeActive
                            : isUnlocked
                            ? styles.optionBadgeUnlocked
                            : styles.optionBadgeLocked,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionBadgeText,
                            isSelected
                              ? styles.optionBadgeTextActive
                              : isUnlocked
                              ? styles.optionBadgeTextUnlocked
                              : styles.optionBadgeTextLocked,
                          ]}
                        >
                          {isSelected ? 'SEÇİLİ' : isLocked ? 'KİLİTLİ' : 'AÇIK'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.optionSubtitle}>{cls.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooterHint}>
              <Ionicons name="information-circle-outline" size={12} color={COLORS.neonAmber} />
              <Text style={styles.modalFooterHintText}>
                {(data.maxUnlockedStage ?? 1) >= 4
                  ? 'Tüm mühendislik sınıfları açıldı. Dilediğiniz sınıfın modüllerini inceleyebilirsiniz.'
                  : 'Mevcut açık sınıflar arasında geçiş yapabilir, tamamladığınız görevleri inceleyebilirsiniz.'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Sağ Modal: Görev / Arıza Seçici */}
      <Modal
        visible={taskModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTaskModalVisible(false)}
        >
          <View
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="hardware-chip-outline" size={16} color={COLORS.neonAmberBright} />
                <Text style={styles.modalHeaderTitle}>GÖREV // ARIZALI CİHAZ SEÇİN</Text>
              </View>
              <TouchableOpacity onPress={() => setTaskModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {data.availableModules.map((m, index) => {
                const isSelected = m.id === activeMod.id;
                const isCompleted = m.isCompleted;

                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.modalOptionCard,
                      styles.modalOptionUnlocked,
                      isSelected && styles.modalOptionActiveTask,
                    ]}
                    onPress={() => {
                      onSelectModule(m.id);
                      setTaskModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionTopRow}>
                      <View style={styles.optionTitleRow}>
                        <View style={[styles.taskIndexBadge, isSelected && styles.taskIndexBadgeActive]}>
                          <Text style={[styles.taskIndexText, isSelected && styles.taskIndexTextActive]}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.optionTitle,
                            isSelected ? styles.optionTitleActiveTask : styles.optionTitleUnlocked,
                          ]}
                          numberOfLines={1}
                        >
                          {m.title}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.optionBadge,
                          isCompleted ? styles.taskBadgeCompleted : styles.taskBadgeActiveJob,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionBadgeText,
                            isCompleted ? styles.taskBadgeTextCompleted : styles.taskBadgeTextActiveJob,
                          ]}
                        >
                          {isCompleted ? '✓ ONARILDI' : '⚡ AKTİF GÖREV'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.optionSubtitle}>
                      {isCompleted
                        ? 'Bu cihaz başarıyla onarıldı. Tezgâhta kaynak kodunu ve yama geçmişini inceleyebilirsiniz.'
                        : 'Atölye müşterisinden teslim alınan aktif onarım görevi. Hatalı C kodunu giderin.'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooterHint}>
              <Ionicons name="information-circle-outline" size={12} color={COLORS.neonCyan} />
              <Text style={styles.modalFooterHintText}>
                Yalnızca Atölye'den kabul edilen aktif görev ve daha önce tamamlanan eski işler listelenir.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  contentContainer: {
    padding: 12,
    gap: 12,
    paddingBottom: 28,
  },
  dropdownContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 2,
  },
  loadingContent: {
    flex: 1,
  },
  loadingTitle: {
    color: COLORS.neonAmberBright,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loadingSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  dropdownButton: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.2,
    borderColor: COLORS.borderGlass,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  dropdownButtonTask: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  dropdownTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dropdownCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  dropdownValueText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  dropdownValueTextTask: {
    color: COLORS.neonAmberBright,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 18, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#0a0f1d',
    borderWidth: 1.5,
    borderColor: COLORS.borderGold,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: COLORS.neonAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    color: COLORS.neonAmberBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalList: {
    flexGrow: 0,
  },
  modalOptionCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
    marginBottom: 8,
  },
  modalOptionUnlocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: COLORS.borderDark,
  },
  modalOptionLocked: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.55,
  },
  modalOptionActive: {
    borderColor: COLORS.neonCyanBright,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  modalOptionActiveTask: {
    borderColor: COLORS.neonAmberBright,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  optionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  optionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  optionTitleActive: {
    color: COLORS.neonCyanBright,
    fontWeight: '800',
  },
  optionTitleActiveTask: {
    color: COLORS.neonAmberBright,
    fontWeight: '800',
  },
  optionTitleUnlocked: {
    color: COLORS.textPrimary,
  },
  optionTitleLocked: {
    color: COLORS.textMuted,
  },
  optionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  optionBadgeActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    borderColor: COLORS.neonCyanBright,
  },
  optionBadgeUnlocked: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: COLORS.neonCyanBright,
  },
  optionBadgeLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: COLORS.borderDark,
  },
  optionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  optionBadgeTextActive: {
    color: COLORS.neonCyanBright,
    fontWeight: '800',
  },
  optionBadgeTextUnlocked: {
    color: COLORS.neonCyanBright,
  },
  optionBadgeTextLocked: {
    color: COLORS.textMuted,
  },
  taskBadgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.neonGreenBright,
  },
  taskBadgeActiveJob: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: COLORS.neonAmberBright,
  },
  taskBadgeTextCompleted: {
    color: COLORS.neonGreenBright,
    fontWeight: '800',
  },
  taskBadgeTextActiveJob: {
    color: COLORS.neonAmberBright,
    fontWeight: '800',
  },
  taskIndexBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIndexBadgeActive: {
    backgroundColor: COLORS.neonAmberBright,
  },
  taskIndexText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },
  taskIndexTextActive: {
    color: COLORS.bgPrimary,
    fontWeight: '900',
  },
  optionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    paddingLeft: 26,
  },
  modalFooterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalFooterHintText: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    flex: 1,
    lineHeight: 13,
  },
  telemetryCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    gap: 8,
  },
  telemetryCardOverheating: {
    borderColor: COLORS.neonCrimson,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  telemetryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  deviceMeta: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  liveAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.neonGreenBright,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveAiBadgeText: {
    color: COLORS.neonGreenBright,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seedPoolBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    borderColor: COLORS.neonCyanBright,
  },
  seedPoolBadgeText: {
    color: COLORS.neonCyanBright,
  },
  cycleTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.neonAmberBright,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cycleTaskButtonText: {
    color: COLORS.neonAmberBright,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  deviceNameText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  deviceCodeText: {
    color: COLORS.neonAmberBright,
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  tempBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tempBadgeCool: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: COLORS.neonGreenBright,
  },
  tempBadgeWarm: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: COLORS.neonAmberBright,
  },
  tempBadgeHot: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: COLORS.neonCrimson,
  },
  tempText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  tempTextCool: {
    color: COLORS.neonGreenBright,
  },
  tempTextWarm: {
    color: COLORS.neonAmberBright,
  },
  tempTextHot: {
    color: COLORS.neonCrimson,
  },
  academicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  academicUnitText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
    flex: 1,
  },
  overheatAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.neonCrimson,
    padding: 8,
    borderRadius: 8,
  },
  overheatAlertText: {
    color: '#fca5a5',
    fontSize: 10.5,
    fontWeight: '700',
    flex: 1,
    lineHeight: 15,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.neonGreenBright,
    padding: 8,
    borderRadius: 8,
  },
  successTextCol: {
    flex: 1,
    gap: 2,
  },
  successTitle: {
    color: COLORS.neonGreenBright,
    fontSize: 11,
    fontWeight: '800',
  },
  successDesc: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  editorContainer: {
    backgroundColor: COLORS.bgTerminal,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    overflow: 'hidden',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0f1d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  fileTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileTabText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  trafficLights: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  codeBody: {
    paddingVertical: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 2.5,
  },
  codeRowFaulty: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  lineNumber: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    width: 24,
  },
  codeLineWrapper: {
    flex: 1,
  },
  normalCodeText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  faultyCodeText: {
    color: '#fca5a5',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  codeKeyword: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  codeNumber: {
    color: '#f59e0b',
  },
  codeFunction: {
    color: '#34d399',
  },
  codeComment: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  faultyFlag: {
    backgroundColor: COLORS.neonCrimson,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  faultyFlagText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  diffPreviewBox: {
    backgroundColor: '#030712',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    padding: 8,
    gap: 4,
  },
  diffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  diffHeaderText: {
    color: COLORS.neonAmberBright,
    fontSize: 10,
    fontWeight: '700',
  },
  diffRemovedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffAddedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffSign: {
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  diffRemovedText: {
    color: '#fca5a5',
    fontSize: 10.5,
    fontFamily: 'monospace',
    textDecorationLine: 'line-through',
  },
  diffAddedText: {
    color: '#6ee7b7',
    fontSize: 10.5,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  patchSection: {
    gap: 8,
  },
  patchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patchSectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  patchSectionSub: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
  },
  patchList: {
    gap: 8,
  },
  patchCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    gap: 6,
  },
  patchCardSelected: {
    borderColor: COLORS.neonAmberBright,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  patchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.neonAmberBright,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.neonAmberBright,
  },
  patchTitleText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  patchTitleTextSelected: {
    color: COLORS.neonAmberBright,
    fontWeight: '800',
  },
  patchNoteText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },
  patchCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  patchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  patchBadgeText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  compilerActionSection: {
    gap: 8,
  },
  compileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.neonGreenBright,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: COLORS.neonGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  compileButtonDisabled: {
    backgroundColor: COLORS.borderDark,
    opacity: 0.6,
  },
  compileButtonLoading: {
    opacity: 0.8,
  },
  compileButtonText: {
    color: COLORS.bgPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  goToWorkshopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.neonCyan,
    paddingVertical: 10,
    borderRadius: 10,
  },
  goToWorkshopButtonText: {
    color: COLORS.neonCyanBright,
    fontSize: 11.5,
    fontWeight: '700',
  },
  terminalContainer: {
    backgroundColor: '#020408',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#090e18',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  terminalHeaderText: {
    color: COLORS.neonCyanBright,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  terminalBody: {
    padding: 10,
    gap: 4,
  },
  terminalLogText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 15,
  },
  terminalLogError: {
    color: '#f87171',
    fontWeight: '700',
  },
  terminalLogSuccess: {
    color: '#4ade80',
    fontWeight: '700',
  },
});
