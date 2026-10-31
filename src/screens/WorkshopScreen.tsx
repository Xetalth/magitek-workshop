import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkshopState, ModuleId } from '../types/sdui';
import { COLORS } from '../theme/colors';

const workshopBg = require('../assets/images/workshop_bg.png');
const npcImg = require('../assets/images/npc_halil.png');

/**
 * NPC portresi altındaki rozet metnini üstteki müşteri adı ve avatar ile senkronize eder
 */
const getCustomerBadgeText = (customer: { customerName: string; avatarKey: string }): string => {
  if (customer.customerName.includes('Linus')) return 'LINUS';
  if (customer.customerName.includes('Barnaby')) return 'BARNABY';
  if (customer.customerName.includes('Vane')) return 'VANE';
  if (customer.customerName.includes('Silas')) return 'SILAS';
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
  const isDelivered = data.jobStatus === 'DELIVERED';
  const isReadyToDeliver = data.jobStatus === 'READY_TO_DELIVER';
  const reward = data.rewardReport;
  const hasNext = data.hasNextModule;

  return (
    <ImageBackground source={workshopBg} style={styles.backgroundImage} resizeMode="cover">
      {/* Üst Kısım: Piksel atölye zeminini ferah bırakan boşluk */}
      <View style={styles.upperSpacer} />

      {/* Alt Kısım: Visual Novel / RPG Diyalog ve Görev Paneli */}
      <View style={styles.dialogContainer}>
        <ScrollView
          style={styles.dialogScroll}
          contentContainerStyle={styles.dialogScrollContent}
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
                <Image source={npcImg} style={styles.portraitImage} resizeMode="cover" />
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
                  onPress={onNextModule}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextTaskButtonText} numberOfLines={1}>
                    {hasNext
                      ? '➔ Sıradaki Mühendislik Görevine İlerle'
                      : '➔ 1. Sınıf Müfredatı Tamamlandı (Tezgâha Git)'}
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
    gap: 10,
    marginTop: 2,
  },
  portraitWrapper: {
    width: 76,
    height: 76,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderGold,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  avatarPill: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  avatarPillText: {
    fontSize: 7.5,
    color: COLORS.neonAmberBright,
    fontWeight: '800',
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
});
