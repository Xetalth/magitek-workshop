import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SkillsState } from '../types/sdui';
import { COLORS } from '../theme/colors';

interface SkillsScreenProps {
  data: SkillsState;
}

export const SkillsScreen: React.FC<SkillsScreenProps> = ({ data }) => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      {/* Başlık ve Ağaç Bilgisi */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Ionicons name="git-branch-outline" size={18} color={COLORS.neonCyanBright} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {data.treeTitle}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {data.semesterTitle || '1. Sınıf: Algoritmalar, Düşük Seviye C Programlama, Donanım & Test Şartnameleri.'}
        </Text>
      </View>

      {/* Yetenek Ağacı Düğümleri */}
      <View style={styles.treeList}>
        {data.nodes.map((node, index) => {
          const isUnlocked = node.status === 'UNLOCKED';
          const isLast = index === data.nodes.length - 1;

          return (
            <View key={node.id} style={styles.nodeWrapper}>
              {/* Sol Çizelge Düğümü & Bağlantı Hattı */}
              <View style={styles.timelineCol}>
                <View
                  style={[
                    styles.nodeIconBox,
                    isUnlocked ? styles.iconUnlocked : styles.iconLocked,
                  ]}
                >
                  <Ionicons
                    name={isUnlocked ? 'checkmark-circle-outline' : 'lock-closed'}
                    size={16}
                    color={isUnlocked ? COLORS.neonGreenBright : COLORS.textMuted}
                  />
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.connectorLine,
                      isUnlocked ? styles.connectorActive : styles.connectorInactive,
                    ]}
                  />
                )}
              </View>

              {/* Sağ İçerik Kartı */}
              <View
                style={[
                  styles.nodeCard,
                  isUnlocked ? styles.cardUnlocked : styles.cardLocked,
                ]}
              >
                <View style={styles.nodeCardHeader}>
                  <Text
                    style={[
                      styles.nodeName,
                      isUnlocked ? styles.nameUnlocked : styles.nameLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {node.name}
                  </Text>
                  <View
                    style={[
                      styles.tierBadge,
                      isUnlocked ? styles.tierBadgeUnlocked : styles.tierBadgeLocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierText,
                        isUnlocked ? styles.tierTextUnlocked : styles.tierTextLocked,
                      ]}
                    >
                      {node.tier}
                    </Text>
                  </View>
                </View>

                {node.academicCredit ? (
                  <View style={styles.creditRow}>
                    <Ionicons name="school-outline" size={11} color={COLORS.neonCyanBright} />
                    <Text style={styles.creditText}>{node.academicCredit}</Text>
                    {node.curriculumTopic ? (
                      <Text style={styles.topicText}>// {node.curriculumTopic}</Text>
                    ) : null}
                  </View>
                ) : null}

                <Text style={styles.nodeDescription}>{node.description}</Text>

                <View style={styles.nodeStatusRow}>
                  <Ionicons
                    name={isUnlocked ? 'radio-button-on' : 'shield-outline'}
                    size={12}
                    color={isUnlocked ? COLORS.neonGreenBright : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.nodeStatusText,
                      isUnlocked ? styles.statusUnlockedText : styles.statusLockedText,
                    ]}
                  >
                    {isUnlocked ? 'Akademik Olarak Onaylandı & Aktif' : 'Kilitli (Sıradaki Tezgâh İşi)'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  contentContainer: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  treeList: {
    gap: 4,
  },
  nodeWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timelineCol: {
    alignItems: 'center',
    width: 30,
  },
  nodeIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  iconUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.neonGreenBright,
  },
  iconLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: COLORS.borderDark,
  },
  connectorLine: {
    width: 2,
    height: 65,
    marginVertical: 4,
  },
  connectorActive: {
    backgroundColor: COLORS.neonGreen,
  },
  connectorInactive: {
    backgroundColor: COLORS.borderDark,
  },
  nodeCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 6,
    marginBottom: 10,
  },
  cardUnlocked: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    shadowColor: COLORS.neonGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLocked: {
    borderColor: COLORS.borderDark,
    opacity: 0.75,
  },
  nodeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  nodeName: {
    fontSize: 12.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  nameUnlocked: {
    color: COLORS.textPrimary,
  },
  nameLocked: {
    color: COLORS.textSecondary,
  },
  tierBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierBadgeUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: COLORS.neonGreenBright,
  },
  tierBadgeLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: COLORS.borderDark,
  },
  tierText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  tierTextUnlocked: {
    color: COLORS.neonGreenBright,
  },
  tierTextLocked: {
    color: COLORS.textMuted,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  creditText: {
    color: COLORS.neonCyanBright,
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  topicText: {
    color: COLORS.textMuted,
    fontSize: 9.5,
  },
  nodeDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  nodeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  nodeStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusUnlockedText: {
    color: COLORS.neonGreenBright,
  },
  statusLockedText: {
    color: COLORS.textMuted,
  },
});
