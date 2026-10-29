import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkshopState, ModuleId } from '../types/sdui';
import { COLORS } from '../theme/colors';

const workshopBg = require('../assets/images/workshop_bg.png');
const npcImg = require('../assets/images/npc_halil.png');

interface WorkshopScreenProps {
  data: WorkshopState;
  onDeliverJob: () => void;
  onGoToWorkbench: () => void;
  onSelectModule: (moduleId: ModuleId) => void;
  onNextModule: () => void;
  onSelectOption: (option: string) => void;
  onSaveCustomOption: (text: string) => void;
}

export const WorkshopScreen: React.FC<WorkshopScreenProps> = ({
  data,
  onDeliverJob,
  onGoToWorkbench,
  onSelectModule,
  onNextModule,
  onSelectOption,
  onSaveCustomOption,
}) => {
  const [customText, setCustomText] = useState(data.conversation.customInput);

  const isDelivered = data.jobStatus === 'DELIVERED';
  const isReadyToDeliver = data.jobStatus === 'READY_TO_DELIVER';

  const handleOptionPress = (option: string) => {
    onSelectOption(option);
  };

  const handleSaveCustom = () => {
    if (customText.trim()) {
      onSaveCustomOption(customText.trim());
    }
  };

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
                  <Text style={styles.avatarPillText}>{data.customer.avatarKey.toUpperCase()}</Text>
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
                  <Ionicons name="alert-circle-outline" size={13} color={COLORS.neonCyanBright} />
                  <Text style={styles.symptomText} numberOfLines={2}>
                    <Text style={styles.symptomLabel}>Belirti: </Text>
                    {data.customer.physicalSymptom}
                  </Text>
                </View>
              </View>
            </View>

            {/* Aksiyon Butonları */}
            <View style={styles.actionRow}>
              {/* Tezgâha Git Butonu */}
              {!isDelivered && (
                <TouchableOpacity
                  style={styles.workbenchButton}
                  onPress={onGoToWorkbench}
                  activeOpacity={0.8}
                >
                  <Ionicons name="hammer-outline" size={16} color={COLORS.bgPrimary} />
                  <Text style={styles.workbenchButtonText}>Tezgâha Git & Kodu İncele</Text>
                </TouchableOpacity>
              )}

              {/* Teslim Et Butonu */}
              {isReadyToDeliver && !isDelivered && (
                <TouchableOpacity
                  style={styles.deliverButton}
                  onPress={onDeliverJob}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-done-circle" size={18} color={COLORS.bgPrimary} />
                  <Text style={styles.deliverButtonText}>Onarılan Cihazı Teslim Et</Text>
                </TouchableOpacity>
              )}

              {/* Sıradaki Modüle Geç Butonu */}
              {isDelivered && (
                <TouchableOpacity
                  style={styles.nextModuleButton}
                  onPress={onNextModule}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-forward-circle" size={18} color={COLORS.bgPrimary} />
                  <Text style={styles.nextModuleButtonText}>Sıradaki 1. Sınıf Modülüne İlerle</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Teslimat Sonrası Organik Çay / Kahve Sohbeti */}
            {data.conversation.isUnlocked && (
              <View style={styles.musicSection}>
                <View style={styles.musicHeader}>
                  <Ionicons name="cafe-outline" size={14} color={COLORS.neonAmberBright} />
                  <Text style={styles.musicTitle}>Mekanik Atölye Sohbeti & Buhar Molası</Text>
                </View>

                <Text style={styles.musicPrompt}>"{data.conversation.prompt}"</Text>

                <View style={styles.chipsContainer}>
                  {data.conversation.options.map((option) => {
                    const isSelected = data.conversation.selectedOption === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => handleOptionPress(option)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {data.conversation.showCustomInput && (
                  <View style={styles.customInputContainer}>
                    <TextInput
                      style={styles.customTextInput}
                      placeholder="Örn: Kavrulmuş kahve, dağ infüzyonu..."
                      placeholderTextColor={COLORS.textMuted}
                      value={customText}
                      onChangeText={setCustomText}
                      onSubmitEditing={handleSaveCustom}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={styles.saveInputButton}
                      onPress={handleSaveCustom}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.saveInputButtonText}>Kaydet</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
    maxHeight: '75%',
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
  nextModuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.neonAmberBright,
    paddingVertical: 9,
    borderRadius: 10,
  },
  nextModuleButtonText: {
    color: COLORS.bgPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  musicSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 9,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    gap: 6,
    marginTop: 2,
  },
  musicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  musicTitle: {
    color: COLORS.neonAmberBright,
    fontSize: 10.5,
    fontWeight: '700',
  },
  musicPrompt: {
    color: COLORS.textPrimary,
    fontSize: 10.5,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: COLORS.neonAmberBright,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
  },
  chipTextSelected: {
    color: COLORS.neonAmberBright,
    fontWeight: '700',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgTerminal,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neonCyan,
    overflow: 'hidden',
    marginTop: 2,
  },
  customTextInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 10.5,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  saveInputButton: {
    backgroundColor: COLORS.neonCyan,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  saveInputButtonText: {
    color: COLORS.bgPrimary,
    fontSize: 9.5,
    fontWeight: '800',
  },
});
