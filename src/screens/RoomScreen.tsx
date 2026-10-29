import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoomState, WorkshopState, ShopState, RoomGadget } from '../types/sdui';
import { COLORS } from '../theme/colors';

const roomBg = require('../assets/images/room_bg.png');

interface RoomScreenProps {
  room: RoomState;
  workshop?: WorkshopState;
  shop?: ShopState;
}

export const RoomScreen: React.FC<RoomScreenProps> = ({ room, shop }) => {
  const [selectedGadget, setSelectedGadget] = useState<RoomGadget | null>(null);

  const purchasedCount = shop?.items.filter((i) => i.status === 'UNLOCKED').length || 0;
  const unlockedGadgetCount = room.unlockedGadgets.filter((g) => g.isUnlocked).length;

  return (
    <ImageBackground source={roomBg} style={styles.backgroundImage} resizeMode="cover">
      <ScrollView style={styles.screenScroll} contentContainerStyle={styles.contentContainer}>
        {/* Üst Başlık & Ambiyans Kartı */}
        <View style={styles.ambianceCard}>
          <View style={styles.ambianceTopRow}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="home-outline" size={16} color={COLORS.neonAmberBright} />
              <Text style={styles.roomTitleText}>{room.roomName}</Text>
            </View>
            <View style={styles.activeCountBadge}>
              <Text style={styles.activeCountText}>
                {unlockedGadgetCount}/4 Alet Aktif
              </Text>
            </View>
          </View>
          <Text style={styles.ambianceSubText}>{room.ambianceText}</Text>
        </View>

        {/* 1. Sınıf Mühendislik Donanımları & Tezgâh Kupaları */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct-outline" size={14} color={COLORS.neonCyanBright} />
            <Text style={styles.sectionHeaderText}>1. SINIF ÇALIŞMA MASASI DONANIMLARI</Text>
          </View>

          <View style={styles.gadgetsGrid}>
            {room.unlockedGadgets.map((gadget) => {
              const isSelected = selectedGadget?.id === gadget.id;
              return (
                <TouchableOpacity
                  key={gadget.id}
                  style={[
                    styles.gadgetCard,
                    gadget.isUnlocked ? styles.gadgetCardUnlocked : styles.gadgetCardLocked,
                    isSelected && styles.gadgetCardSelected,
                  ]}
                  onPress={() => setSelectedGadget(gadget)}
                  activeOpacity={0.8}
                >
                  <View style={styles.gadgetIconCircle}>
                    <Ionicons
                      name={gadget.icon as any}
                      size={22}
                      color={gadget.isUnlocked ? COLORS.neonCyanBright : COLORS.textMuted}
                    />
                  </View>

                  <View style={styles.gadgetInfo}>
                    <Text
                      style={[
                        styles.gadgetName,
                        gadget.isUnlocked ? styles.gadgetNameUnlocked : styles.gadgetNameLocked,
                      ]}
                      numberOfLines={1}
                    >
                      {gadget.name}
                    </Text>
                    <Text style={styles.gadgetSpec} numberOfLines={1}>
                      {gadget.isUnlocked ? gadget.hardwareSpec : 'Kilitli (Modül Çözülmeli)'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.gadgetStatusPill,
                      gadget.isUnlocked ? styles.statusPillActive : styles.statusPillLocked,
                    ]}
                  >
                    <Ionicons
                      name={gadget.isUnlocked ? 'radio-button-on' : 'lock-closed'}
                      size={10}
                      color={gadget.isUnlocked ? COLORS.neonGreenBright : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.gadgetStatusText,
                        gadget.isUnlocked ? styles.statusTextActive : styles.statusTextLocked,
                      ]}
                    >
                      {gadget.isUnlocked ? 'ÇALIŞIYOR' : 'KİLİTLİ'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Seçilen Aletin Detay İnceleme Kartı */}
        {selectedGadget && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Ionicons
                name={selectedGadget.icon as any}
                size={18}
                color={selectedGadget.isUnlocked ? COLORS.neonAmberBright : COLORS.textMuted}
              />
              <Text style={styles.detailTitle}>{selectedGadget.name}</Text>
              <TouchableOpacity onPress={() => setSelectedGadget(null)}>
                <Ionicons name="close-circle-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.detailDescription}>{selectedGadget.description}</Text>

            <View style={styles.detailSpecRow}>
              <Text style={styles.specLabel}>Donanım Spesifikasyonu:</Text>
              <Text style={styles.specValue}>{selectedGadget.hardwareSpec}</Text>
            </View>

            {!selectedGadget.isUnlocked && (
              <View style={styles.lockedHint}>
                <Ionicons name="information-circle-outline" size={13} color={COLORS.neonAmber} />
                <Text style={styles.lockedHintText}>
                  Bu alet, ilgili 1. Sınıf mühendislik modülü tezgâhta başarıyla onarılıp teslim edildiğinde arka odaya kalıcı olarak eklenir.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Mağazadan Satın Alınan Ek Eşyalar */}
        {shop && purchasedCount > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles-outline" size={14} color={COLORS.neonAmberBright} />
              <Text style={styles.sectionHeaderText}>SATIN ALINAN ODA EŞYALARI ({purchasedCount})</Text>
            </View>

            <View style={styles.purchasedGrid}>
              {shop.items
                .filter((item) => item.status === 'UNLOCKED')
                .map((item) => (
                  <View key={item.id} style={styles.purchasedCard}>
                    <Ionicons name={item.iconName as any} size={18} color={COLORS.neonAmberBright} />
                    <View style={styles.purchasedInfo}>
                      <Text style={styles.purchasedName}>{item.name}</Text>
                      <Text style={styles.purchasedCategory}>{item.category}</Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Sistem Terminal & Çalışma İstasyonu Özellikleri */}
        <View style={styles.sysSpecsCard}>
          <View style={styles.sysSpecsHeader}>
            <Ionicons name="hardware-chip-outline" size={14} color={COLORS.neonCyanBright} />
            <Text style={styles.sysSpecsTitle}>GÖMÜLÜ ÇALIŞMA İSTASYONU KÜTÜĞÜ</Text>
          </View>

          <View style={styles.specLine}>
            <Text style={styles.specLineKey}>Mimari Çekirdek:</Text>
            <Text style={styles.specLineVal}>{room.systemSpecs.arch}</Text>
          </View>
          <View style={styles.specLine}>
            <Text style={styles.specLineKey}>İşletim Çekirdeği:</Text>
            <Text style={styles.specLineVal}>{room.systemSpecs.kernel}</Text>
          </View>
          <View style={styles.specLine}>
            <Text style={styles.specLineKey}>C Derleyici Araç Zinciri:</Text>
            <Text style={styles.specLineVal}>{room.systemSpecs.compiler}</Text>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  screenScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    gap: 12,
    paddingBottom: 24,
  },
  ambianceCard: {
    backgroundColor: 'rgba(7, 11, 20, 0.88)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 6,
  },
  ambianceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomTitleText: {
    color: COLORS.neonAmberBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  activeCountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.neonGreenBright,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeCountText: {
    color: COLORS.neonGreenBright,
    fontSize: 10,
    fontWeight: '800',
  },
  ambianceSubText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  gadgetsGrid: {
    gap: 8,
  },
  gadgetCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gadgetCardUnlocked: {
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  gadgetCardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.06)',
    opacity: 0.65,
  },
  gadgetCardSelected: {
    borderColor: COLORS.neonAmberBright,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  gadgetIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gadgetInfo: {
    flex: 1,
    gap: 2,
  },
  gadgetName: {
    fontSize: 12,
    fontWeight: '700',
  },
  gadgetNameUnlocked: {
    color: COLORS.textPrimary,
  },
  gadgetNameLocked: {
    color: COLORS.textMuted,
  },
  gadgetSpec: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  gadgetStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusPillLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  gadgetStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextActive: {
    color: COLORS.neonGreenBright,
  },
  statusTextLocked: {
    color: COLORS.textMuted,
  },
  detailCard: {
    backgroundColor: 'rgba(7, 11, 20, 0.94)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.neonAmberBright,
    padding: 12,
    gap: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  detailTitle: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '800',
    flex: 1,
  },
  detailDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  detailSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 6,
    borderRadius: 6,
  },
  specLabel: {
    color: COLORS.neonCyanBright,
    fontSize: 10,
    fontWeight: '700',
  },
  specValue: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  lockedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 6,
    borderRadius: 6,
  },
  lockedHintText: {
    color: COLORS.neonAmberBright,
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  purchasedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purchasedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    minWidth: 150,
  },
  purchasedInfo: {
    flex: 1,
  },
  purchasedName: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  purchasedCategory: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  sysSpecsCard: {
    backgroundColor: 'rgba(7, 11, 20, 0.85)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    gap: 6,
  },
  sysSpecsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sysSpecsTitle: {
    color: COLORS.neonCyanBright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  specLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  specLineKey: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  specLineVal: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});
