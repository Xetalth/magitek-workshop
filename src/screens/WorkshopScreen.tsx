import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkshopState, ModuleId } from '../types/sdui';
import { COLORS } from '../theme/colors';

const workshopBg = require('../assets/images/workshop_bg.png');
const suburbBgImg = require('../assets/images/suburb_workshop_bg.png');
const capitalBgImg = require('../assets/images/capital_shop_bg.png');
const royalBgImg = require('../assets/images/royal_lab_bg.png');
const NPC_PORTRAITS: Record<string, any> = {
  barnaby: require('../assets/images/npc_barnaby.png'),
  linus: require('../assets/images/npc_linus.png'),
  vane: require('../assets/images/npc_vane.png'),
  silas: require('../assets/images/npc_silas.png'),
  jax: require('../assets/images/npc_jax.png'),
  nora: require('../assets/images/npc_nora.png'),
  mordecai: require('../assets/images/npc_mordecai.png'),
  bennett: require('../assets/images/npc_bennett.png'),
  aurelia: require('../assets/images/npc_aurelia.png'),
  zephyr: require('../assets/images/npc_zephyr.png'),
  vivienne: require('../assets/images/npc_vivienne.png'),
  hektor: require('../assets/images/npc_hektor.png'),
  alistair: require('../assets/images/npc_alistair.png'),
  seraphina: require('../assets/images/npc_seraphina.png'),
  ignatius: require('../assets/images/npc_ignatius.png'),
  valeria: require('../assets/images/npc_valeria.png'),
};

/**
 * NPC portresi altındaki rozet metnini üstteki müşteri adı ve avatar ile senkronize eder
 */
const getCustomerBadgeText = (customer: { customerName: string; avatarKey: string }): string => {
  if (customer.customerName.includes('Alistair')) return 'ALISTAIR';
  if (customer.customerName.includes('Seraphina')) return 'SERAPHINA';
  if (customer.customerName.includes('Ignatius')) return 'IGNATIUS';
  if (customer.customerName.includes('Valeria')) return 'VALERIA';
  if (customer.customerName.includes('Aurelia')) return 'AURELIA';
  if (customer.customerName.includes('Zephyr')) return 'ZEPHYR';
  if (customer.customerName.includes('Vivienne')) return 'VIVIENNE';
  if (customer.customerName.includes('Hektor')) return 'HEKTOR';
  if (customer.customerName.includes('Linus')) return 'LINUS';
  if (customer.customerName.includes('Barnaby')) return 'BARNABY';
  if (customer.customerName.includes('Vane')) return 'VANE';
  if (customer.customerName.includes('Silas')) return 'SILAS';
  if (customer.customerName.includes('Jax')) return 'JAX';
  if (customer.customerName.includes('Nora')) return 'NORA';
  if (customer.customerName.includes('Mordecai')) return 'MORDECAI';
  if (customer.customerName.includes('Bennett')) return 'BENNETT';
  return customer.avatarKey.toUpperCase();
};

interface WorkshopScreenProps {
  data: WorkshopState;
  onDeliverJob: () => void;
  onGoToWorkbench: () => void;
  onSelectModule?: (moduleId: ModuleId) => void;
  onNextModule: () => void;
}

export const WorkshopScreen: React.FC<WorkshopScreenProps> = ({
  data,
  onDeliverJob,
  onGoToWorkbench,
  onNextModule,
}) => {
  const insets = useSafeAreaInsets();
  const isDelivered = data.jobStatus === 'DELIVERED';
  const isReadyToDeliver = data.jobStatus === 'READY_TO_DELIVER';
  const reward = data.rewardReport;
  const hasNext = data.hasNextModule;
  const isStage4 = data.stage === 4 || data.bgKey === 'royal';
  const isStage3 = data.stage === 3 || data.bgKey === 'capital';
  const isStage2 = data.stage === 2 || data.bgKey === 'suburb';
  const currentBg = isStage4 ? royalBgImg : isStage3 ? capitalBgImg : isStage2 ? suburbBgImg : workshopBg;
  const isStageTransitionReady = !hasNext || !!data.isStageCompleted;

  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNextButtonPress = () => {
    if (isStageTransitionReady && !isStage4) {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
        onNextModule();
      }, 1800);
    } else {
      onNextModule();
    }
  };

  return (
    <ImageBackground source={currentBg} style={styles.backgroundImage} resizeMode="cover">
      {/* Üst Kısım: Piksel atölye zeminini ferah bırakan boşluk */}
      <View style={styles.upperSpacer} />

      {/* Alt Kısım: Visual Novel / RPG Diyalog ve Görev Paneli */}
      <View style={styles.dialogContainer}>
        <ScrollView
          style={styles.dialogScroll}
          contentContainerStyle={[styles.dialogScrollContent, { paddingBottom: 85 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* RPG Diyalog Kutusu */}
          <View style={styles.rpgDialogBox}>
            {/* Üst Başlık Satırı: Karakter İsim Plaketi & Durum Rozeti */}
            <View style={styles.headerRow}>
              <View style={styles.nameTag}>
                <Ionicons name="person-circle-outline" size={14} color={COLORS.neonAmberBright} />
                <Text style={styles.nameTagText}>{data.customer.customerName}</Text>
                <Text style={styles.roleTagText}>// {data.customer.customerRole}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isDelivered
                    ? styles.statusDelivered
                    : isReadyToDeliver
                    ? styles.statusReady
                    : styles.statusAnalyzing,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {isDelivered
                    ? 'TESLİM EDİLDİ'
                    : isReadyToDeliver
                    ? 'ONARILDI - TESLİM BEKLİYOR'
                    : 'İŞ TEZGÂHTA'}
                </Text>
              </View>
            </View>

            {/* Portre ve Metin Gövdesi */}
            <View style={styles.dialogBody}>
              {/* NPC Portresi */}
              <View style={styles.portraitWrapper}>
                <Image
                  source={NPC_PORTRAITS[data.customer.avatarKey] || NPC_PORTRAITS.barnaby}
                  style={styles.portraitImage}
                  resizeMode="cover"
                />
                <View style={styles.avatarPill}>
                  <Text style={styles.avatarPillText}>{getCustomerBadgeText(data.customer)}</Text>
                </View>
              </View>

              {/* Diyalog Metni & Teşhis */}
              <View style={styles.dialogTextCol}>
                <Text style={styles.dialogMessageText}>
                  {isDelivered
                    ? 'Çok teşekkürler mühendis! Onardığın cihaz saat gibi çalışıyor, istasyon aksamadan işlemeye devam ediyor. Eline, zihnine sağlık!'
                    : `"${data.customer.dialogText}"`}
                </Text>

                {/* Donanım Belirtisi Kutucuğu */}
                <View style={styles.symptomBox}>
                  <Ionicons
                    name={isDelivered ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                    size={13}
                    color={isDelivered ? COLORS.neonGreenBright : COLORS.neonCyanBright}
                  />
                  <Text style={styles.symptomText} numberOfLines={2}>
                    <Text style={isDelivered ? styles.symptomLabelSuccess : styles.symptomLabel}>
                      {isDelivered ? 'Durum: ' : 'Belirti: '}
                    </Text>
                    {isDelivered
                      ? `${reward.deviceName} başarıyla teslim edildi. Donanım nominal çalışma modunda.`
                      : data.customer.physicalSymptom}
                  </Text>
                </View>
              </View>
            </View>

            {/* Aksiyon Butonları (Teslim edilmemişken) */}
            {!isDelivered && (
              <View style={styles.actionRow}>
                {/* Tezgâha Git Butonu */}
                <TouchableOpacity
                  style={styles.workbenchButton}
                  onPress={onGoToWorkbench}
                  activeOpacity={0.8}
                >
                  <Ionicons name="hammer-outline" size={16} color={COLORS.bgPrimary} />
                  <Text style={styles.workbenchButtonText}>Tezgâha Git & Kodu İncele</Text>
                </TouchableOpacity>

                {/* Teslim Et Butonu */}
                {isReadyToDeliver && (
                  <TouchableOpacity
                    style={styles.deliverButton}
                    onPress={onDeliverJob}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-done-circle" size={18} color={COLORS.bgPrimary} />
                    <Text style={styles.deliverButtonText}>Onarılan Cihazı Teslim Et</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Teslimat Sonrası: Mühendislik Ödül ve Kazanç Paneli */}
            {isDelivered && (
              <View style={styles.rewardPanel}>
                {/* Panel Başlığı */}
                <View style={styles.rewardHeader}>
                  <View style={styles.rewardHeaderLeft}>
                    <Ionicons name="clipboard-outline" size={15} color={COLORS.neonAmberBright} />
                    <Text style={styles.rewardHeaderTitle} numberOfLines={1}>
                      MÜHENDİSLİK TELEMETRİSİ
                    </Text>
                  </View>
                  <View style={styles.rewardApprovedBadge}>
                    <Ionicons name="checkmark-sharp" size={11} color={COLORS.neonGreenBright} />
                    <Text style={styles.rewardApprovedText}>ONAYLANDI</Text>
                  </View>
                </View>

                {/* Kazanç İstatistikleri */}
                <View style={styles.rewardMetricsGrid}>
                  {/* Altın Kartı */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricIconCircleGold}>
                      <Text style={styles.coinIcon}>🪙</Text>
                    </View>
                    <View style={styles.metricInfo}>
                      <Text style={styles.metricLabel}>Kazanılan Altın</Text>
                      <Text style={styles.metricValueGold}>+{reward.gold} G</Text>
                    </View>
                  </View>

                  {/* Tecrübe Puanı Kartı */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricIconCircleExp}>
                      <Ionicons name="flash" size={15} color={COLORS.neonCyanBright} />
                    </View>
                    <View style={styles.metricInfo}>
                      <Text style={styles.metricLabel}>Tecrübe Puanı</Text>
                      <Text style={styles.metricValueExp}>+{reward.exp} EXP</Text>
                    </View>
                  </View>
                </View>

                {/* Onarılan Donanım Telemetrisi */}
                <View style={styles.telemetryStatusBox}>
                  <Ionicons name="hardware-chip-outline" size={16} color={COLORS.neonAmberBright} />
                  <View style={styles.telemetryStatusContent}>
                    <Text style={styles.telemetryDeviceTitle} numberOfLines={1}>
                      {reward.deviceName}
                    </Text>
                    <Text style={styles.telemetryStatusDesc}>
                      Durum:{' '}
                      <Text style={styles.telemetryStatusHighlight}>{reward.statusText}</Text>
                    </Text>
                  </View>
                </View>

                {/* Tek Ana Eylem Butonu */}
                <TouchableOpacity
                  style={styles.nextTaskButton}
                  onPress={handleNextButtonPress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextTaskButtonText} numberOfLines={1}>
                    {hasNext
                      ? '➔ Sıradaki Mühendislik Görevine İlerle'
                      : data.stage === 1
                      ? '→ 2. Aşamaya Geç (Mahalle Dükkanı) ⚡'
                      : data.stage === 2
                      ? '→ 3. Aşamaya Geç (Başkent Mağazası) ⚡'
                      : data.stage === 3
                      ? '→ 4. Aşamaya Geç (Kraliyet Laboratuvarı) ⚡'
                      : '➔ 4. Aşama Mühendislik Tezgâhı'}
                  </Text>
                  <Ionicons
                    name={hasNext ? 'arrow-forward-circle' : 'flash'}
                    size={16}
                    color={COLORS.bgPrimary}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* 2. Aşamaya Geçiş Sinematik Yükleme Katmanı (Transition Overlay) */}
      {isTransitioning && (
        <View style={styles.transitionOverlay}>
          <View style={styles.transitionCard}>
            <View style={styles.spinnerWrapper}>
              <ActivityIndicator size="large" color={COLORS.neonAmberBright} />
            </View>
            <Ionicons
              name="cog-outline"
              size={34}
              color={COLORS.neonAmberBright}
              style={{ marginTop: 12 }}
            />
            <Text style={styles.transitionText}>
              {isStage3
                ? 'Kraliyet Hizmetine Kabul Edildiniz...\nKraliyet Magitek Laboratuvarı Kapılarını Açıyor... // Saray Kademesi'
                : isStage2
                ? 'Başkente Terfi Ediliyor...\nBüyük Mağaza Kapılarını Açıyor... // Merkez Kademe'
                : 'Yeni Aşamaya Geçiliyor...\nMahalle Dükkanı Kapılarını Açıyor...'}
            </Text>
            <Text style={styles.transitionSubText}>
              {isStage3
                ? '// SARAY MAGİTEK PROTOKOLÜ DEVREDE //'
                : isStage2
                ? '// KRALİYET ŞEBEKE SENKRONİZASYONU DEVREDE //'
                : '// SİSTEM KALİBRASYONU TAMAMLANIYOR //'}
            </Text>
          </View>
        </View>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  upperSpacer: {
    flex: 1,
    minHeight: 50,
  },
  dialogContainer: {
    maxHeight: '80%',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  dialogScroll: {
    flexGrow: 0,
  },
  dialogScrollContent: {
    paddingBottom: 4,
  },
  rpgDialogBox: {
    backgroundColor: 'rgba(7, 11, 20, 0.94)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    padding: 12,
    gap: 8,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  nameTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nameTagText: {
    color: COLORS.neonAmberBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  roleTagText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusDelivered: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.neonGreenBright,
  },
  statusReady: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: COLORS.neonAmberBright,
  },
  statusAnalyzing: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: COLORS.neonCyan,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dialogBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 2,
  },
  portraitWrapper: {
    width: 115,
    height: 115,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.borderGold,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
    shadowColor: COLORS.neonAmber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  avatarPill: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  avatarPillText: {
    fontSize: 8.5,
    color: COLORS.neonAmberBright,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dialogTextCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  dialogMessageText: {
    color: '#f8fafc',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  symptomBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  symptomLabel: {
    color: COLORS.neonCyanBright,
    fontWeight: '700',
    fontSize: 10,
  },
  symptomLabelSuccess: {
    color: COLORS.neonGreenBright,
    fontWeight: '700',
    fontSize: 10,
  },
  symptomText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  actionRow: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 4,
  },
  workbenchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.neonCyanBright,
    paddingVertical: 9,
    borderRadius: 10,
  },
  workbenchButtonText: {
    color: COLORS.bgPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  deliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.neonGreenBright,
    paddingVertical: 9,
    borderRadius: 10,
  },
  deliverButtonText: {
    color: COLORS.bgPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  rewardPanel: {
    backgroundColor: 'rgba(10, 15, 29, 0.95)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderGold,
    padding: 10,
    gap: 8,
    marginTop: 4,
    shadowColor: COLORS.neonAmber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 6,
  },
  rewardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  rewardHeaderTitle: {
    color: COLORS.neonAmberBright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
    flexShrink: 1,
  },
  rewardApprovedBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.neonGreenBright,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rewardApprovedText: {
    color: COLORS.neonGreenBright,
    fontSize: 8.5,
    fontWeight: '800',
  },
  rewardMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 8,
    padding: 6,
  },
  metricIconCircleGold: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconCircleExp: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIcon: {
    fontSize: 13,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  metricValueGold: {
    color: COLORS.neonAmberBright,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  metricValueExp: {
    color: COLORS.neonCyanBright,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  telemetryStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 8,
    padding: 7,
  },
  telemetryStatusContent: {
    flex: 1,
  },
  telemetryDeviceTitle: {
    color: COLORS.textPrimary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  telemetryStatusDesc: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    marginTop: 1,
  },
  telemetryStatusHighlight: {
    color: COLORS.neonGreenBright,
    fontWeight: '700',
  },
  nextTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.neonAmberBright,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    shadowColor: COLORS.neonAmber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 4,
    width: '100%',
  },
  nextTaskButtonText: {
    color: COLORS.bgPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.1,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 15, 25, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 24,
  },
  transitionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1.5,
    borderColor: COLORS.borderGold,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 28,
    shadowColor: COLORS.neonAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    width: '90%',
    maxWidth: 340,
  },
  spinnerWrapper: {
    marginBottom: 4,
  },
  transitionText: {
    marginTop: 14,
    color: COLORS.neonAmberBright,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 23,
    letterSpacing: 0.5,
  },
  transitionSubText: {
    marginTop: 10,
    color: COLORS.neonCyanBright,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
