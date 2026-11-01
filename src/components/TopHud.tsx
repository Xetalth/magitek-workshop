import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HudState } from '../types/sdui';
import { COLORS } from '../theme/colors';

interface TopHudProps {
  hud: HudState;
}

export const TopHud: React.FC<TopHudProps> = ({ hud }) => {
  return (
    <View style={styles.hudContainer}>
      {/* Üst Bilgi Satırı: Seviye, Gün & Sağ Üstte EXP / Altın Grubu */}
      <View style={styles.topRow}>
        {/* Sol Rozetler */}
        <View style={styles.badgeGroup}>
          <View style={styles.levelBadge}>
            <Ionicons name="construct-outline" size={13} color={COLORS.neonAmberBright} />
            <Text style={styles.levelText} numberOfLines={1} ellipsizeMode="tail">
              {hud.levelTitle}
            </Text>
          </View>
          <View style={styles.dayBadge}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.neonCyanBright} />
            <Text style={styles.dayText}>Gün {hud.day}</Text>
          </View>
        </View>

        {/* Sağ Taraf: EXP ve Altının Yer Aldığı Kompakt Panel */}
        <View style={styles.statsGroup}>
          {/* EXP Barı */}
          <View style={styles.expGroup}>
            <View style={styles.expLabelRow}>
              <Text style={styles.expLabel}>EXP</Text>
              <Text style={styles.expValue}>%{hud.expPercentage}</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${hud.expPercentage}%` }]} />
            </View>
          </View>

          {/* Altın Miktarı */}
          <View style={styles.goldBadge}>
            <Text style={styles.goldCoinIcon}>🪙</Text>
            <Text style={styles.goldAmountText}>{hud.gold} G</Text>
          </View>
        </View>
      </View>

      {/* Sınıf & Akademik İlerleme Çubuğu */}
      <View style={styles.bottomRow}>
        <View style={styles.curriculumRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.neonCyan} />
          <Text style={styles.classTitleText} numberOfLines={1}>
            {hud.classTitle}
          </Text>
        </View>
        {hud.academicProgress ? (
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>{hud.academicProgress}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
  },
  levelText: {
    color: COLORS.neonAmberBright,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayText: {
    color: COLORS.neonCyanBright,
    fontSize: 11,
    fontWeight: '600',
  },
  statsGroup: {
    alignItems: 'flex-end',
    gap: 3,
    minWidth: 92,
  },
  expGroup: {
    width: 92,
  },
  expLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  expValue: {
    color: COLORS.neonCyanBright,
    fontSize: 9,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.neonCyan,
    borderRadius: 2,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  goldCoinIcon: {
    fontSize: 10,
  },
  goldAmountText: {
    color: COLORS.neonAmberBright,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  bottomRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  curriculumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '100%',
  },
  classTitleText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  progressPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  progressPillText: {
    color: COLORS.neonGreenBright,
    fontSize: 9.5,
    fontWeight: '700',
  },
});
