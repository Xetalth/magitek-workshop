import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SkillsState } from '../types/sdui';
import { COLORS } from '../theme/colors';
import { REQUIRED_TASKS_PER_MODULE } from '../data/curriculumData';

interface SkillsScreenProps {
  data: SkillsState;
}

export const SkillsScreen: React.FC<SkillsScreenProps> = ({ data }) => {
  const insets = useSafeAreaInsets();
  const completedCount = data.nodes.filter((n) => n.isCompleted).length;
  const totalCount = data.nodes.length;
  const allCompleted = completedCount >= totalCount;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: 85 + insets.bottom }]}
    >
      {/* Başlık ve Ağaç Bilgisi */}
      <View style={[styles.headerCard, allCompleted && styles.headerCardAllCompleted]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleGroup}>
            <Ionicons
              name={allCompleted ? 'school' : 'git-branch-outline'}
              size={18}
              color={allCompleted ? COLORS.neonGreenBright : COLORS.neonCyanBright}
            />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {data.treeTitle}
            </Text>
          </View>
          <View style={[styles.progressBadge, allCompleted && styles.progressBadgeCompleted]}>
            <Text style={[styles.progressBadgeText, allCompleted && styles.progressBadgeTextCompleted]}>
              {allCompleted ? 'MEZUNİYET TAMAMLANDI' : `${completedCount}/${totalCount} ONAYLANDI`}
            </Text>
          </View>
        </View>

        <Text style={styles.headerSubtitle}>
          {data.semesterTitle ||
            'Samsun Üniversitesi Yazılım Mühendisliği 1. Sınıf (YZM101, YZM105, YZM102, YZM104) Omurgası'}
        </Text>

        <View style={styles.headerMetaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="options-outline" size={11} color={COLORS.neonAmberBright} />
            <Text style={styles.metaPillText}>
              Modül Geçiş Barajı: {REQUIRED_TASKS_PER_MODULE} Görev / Modül
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="shield-checkmark-outline" size={11} color={COLORS.neonGreenBright} />
            <Text style={styles.metaPillText}>Pedagojik Guardrail: Katı Kısıtlamalı</Text>
          </View>
        </View>
      </View>

      {/* Yetenek Ağacı Düğümleri */}
      <View style={styles.treeList}>
        {data.nodes.map((node, index) => {
          const isUnlocked = node.status === 'UNLOCKED';
          const isCompleted = Boolean(node.isCompleted);
          const isCurrent = Boolean(node.isCurrent);
          const isLast = index === data.nodes.length - 1;

          return (
            <View key={node.id} style={styles.nodeWrapper}>
              {/* Sol Çizelge Düğümü & Bağlantı Hattı */}
              <View style={styles.timelineCol}>
                <View
                  style={[
                    styles.nodeIconBox,
                    isCompleted
                      ? styles.iconCompleted
                      : isCurrent
                      ? styles.iconCurrent
                      : styles.iconLocked,
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : isCurrent ? 'flash' : 'lock-closed'}
                    size={16}
                    color={
                      isCompleted
                        ? COLORS.neonGreenBright
                        : isCurrent
                        ? COLORS.neonAmberBright
                        : COLORS.textMuted
                    }
                  />
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.connectorLine,
                      isCompleted
                        ? styles.connectorCompleted
                        : isUnlocked
                        ? styles.connectorActive
                        : styles.connectorInactive,
                    ]}
                  />
                )}
              </View>

              {/* Sağ İçerik Kartı */}
              <View
                style={[
                  styles.nodeCard,
                  isCompleted
                    ? styles.cardCompleted
                    : isCurrent
                    ? styles.cardCurrent
                    : styles.cardLocked,
                ]}
              >
                <View style={styles.nodeCardHeader}>
                  <Text
                    style={[
                      styles.nodeName,
                      isCompleted
                        ? styles.nameCompleted
                        : isCurrent
                        ? styles.nameCurrent
                        : styles.nameLocked,
                    ]}
                  >
                    {node.name}
                  </Text>
                  <View
                    style={[
                      styles.tierBadge,
                      isCompleted
                        ? styles.tierBadgeCompleted
                        : isCurrent
                        ? styles.tierBadgeCurrent
                        : styles.tierBadgeLocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierText,
                        isCompleted
                          ? styles.tierTextCompleted
                          : isCurrent
                          ? styles.tierTextCurrent
                          : styles.tierTextLocked,
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

                {/* Pedagojik İzin Verilen Kazanımlar */}
                {node.allowedTopics && node.allowedTopics.length > 0 && (
                  <View style={styles.topicsBox}>
                    <View style={styles.topicsHeader}>
                      <Ionicons name="checkmark-done-outline" size={11} color={COLORS.neonGreenBright} />
                      <Text style={styles.topicsHeaderLabel}>Müfredat Kazanımları:</Text>
                    </View>
                    <Text style={styles.topicsListText}>{node.allowedTopics.join(' • ')}</Text>
                  </View>
                )}

                {/* Durum Satırı */}
                <View style={styles.nodeStatusRow}>
                  <View style={styles.statusLeft}>
                    <Ionicons
                      name={
                        isCompleted
                          ? 'checkmark-circle'
                          : isCurrent
                          ? 'radio-button-on'
                          : 'shield-outline'
                      }
                      size={13}
                      color={
                        isCompleted
                          ? COLORS.neonGreenBright
                          : isCurrent
                          ? COLORS.neonAmberBright
                          : COLORS.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.nodeStatusText,
                        isCompleted
                          ? styles.statusCompletedText
                          : isCurrent
                          ? styles.statusCurrentText
                          : styles.statusLockedText,
                      ]}
                    >
                      {isCompleted
                        ? '✓ Onaylandı (Kazanım Tamamlandı)'
                        : isCurrent
                        ? '⚡ Aktif Modül (Tezgâhta Çözülüyor)'
                        : '🔒 Kilitli (Önceki Modülü Tamamlayın)'}
                    </Text>
                  </View>

                  {node.taskProgress && (
                    <View
                      style={[
                        styles.taskProgressPill,
                        isCompleted
                          ? styles.taskProgressPillCompleted
                          : isCurrent
                          ? styles.taskProgressPillCurrent
                          : styles.taskProgressPillLocked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskProgressText,
                          isCompleted
                            ? styles.taskProgressTextCompleted
                            : isCurrent
                            ? styles.taskProgressTextCurrent
                            : styles.taskProgressTextLocked,
                        ]}
                      >
                        {node.taskProgress}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Mühendislik Eval & Telemetri Karnesi */}
                <View style={styles.evalContainer}>
                  <View style={styles.evalHeaderRow}>
                    <Ionicons name="hardware-chip-outline" size={11} color={COLORS.neonAmberBright} />
                    <Text style={styles.evalHeaderTitle}>MÜHENDİSLİK EVAL & TELEMETRİ KARNESİ</Text>
                  </View>

                  {isUnlocked && node.evalMetrics ? (
                    <View style={styles.evalBadgesRow}>
                      {/* İlk Deneme Başarısı (Pass Rate) */}
                      <View style={styles.evalBadgePass}>
                        <Ionicons name="checkmark-done" size={11} color={COLORS.neonGreenBright} />
                        <Text style={styles.evalBadgeTextPass}>
                          {isCompleted && node.evalMetrics.firstPassRate !== null && node.evalMetrics.firstPassRate !== undefined
                            ? `✓ %${node.evalMetrics.firstPassRate} İlk Geçiş`
                            : '✓ - İlk Geçiş'}
                        </Text>
                      </View>

                      {/* Regresyon Riski (Regression) */}
                      <View style={styles.evalBadgeRegression}>
                        <Ionicons name="shield-outline" size={11} color={COLORS.neonCyanBright} />
                        <Text style={styles.evalBadgeTextRegression}>
                          🛡 Regresyon: {node.evalMetrics.regressionRisk}
                        </Text>
                      </View>

                      {/* Doğrulama Protokolü */}
                      <View style={styles.evalBadgeProtocol}>
                        <Ionicons name="cog-outline" size={11} color={COLORS.neonAmber} />
                        <Text style={styles.evalBadgeTextProtocol}>
                          ⚙ {node.evalMetrics.verificationProtocol}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.evalLockedRow}>
                      <Ionicons name="hourglass-outline" size={11} color={COLORS.textMuted} />
                      <Text style={styles.evalLockedText}>
                        [Beklemede: Önkoşul Testi Bekleniyor]
                      </Text>
                    </View>
                  )}
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
    gap: 8,
  },
  headerCardAllCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexShrink: 1,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  progressBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.neonCyanBright,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  progressBadgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.neonGreenBright,
  },
  progressBadgeText: {
    color: COLORS.neonCyanBright,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  progressBadgeTextCompleted: {
    color: COLORS.neonGreenBright,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metaPillText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '600',
  },
  treeList: {
    gap: 4,
  },
  nodeWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
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
  iconCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: COLORS.neonGreenBright,
  },
  iconCurrent: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: COLORS.neonAmberBright,
  },
  iconLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: COLORS.borderDark,
  },
  connectorLine: {
    width: 2,
    height: 80,
    marginVertical: 4,
  },
  connectorCompleted: {
    backgroundColor: COLORS.neonGreenBright,
  },
  connectorActive: {
    backgroundColor: COLORS.neonAmber,
  },
  connectorInactive: {
    backgroundColor: COLORS.borderDark,
  },
  nodeCard: {
    flex: 1,
    flexShrink: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: COLORS.neonGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardCurrent: {
    borderColor: 'rgba(245, 158, 11, 0.45)',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
    shadowColor: COLORS.neonAmber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLocked: {
    borderColor: COLORS.borderDark,
    opacity: 0.7,
  },
  nodeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
  },
  nodeName: {
    fontSize: 12.5,
    fontWeight: '800',
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  nameCompleted: {
    color: COLORS.neonGreenBright,
  },
  nameCurrent: {
    color: COLORS.neonAmberBright,
  },
  nameLocked: {
    color: COLORS.textSecondary,
  },
  tierBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  tierBadgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: COLORS.neonGreenBright,
  },
  tierBadgeCurrent: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: COLORS.neonAmberBright,
  },
  tierBadgeLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: COLORS.borderDark,
  },
  tierText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  tierTextCompleted: {
    color: COLORS.neonGreenBright,
  },
  tierTextCurrent: {
    color: COLORS.neonAmberBright,
  },
  tierTextLocked: {
    color: COLORS.textMuted,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  creditText: {
    color: COLORS.neonCyanBright,
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  topicText: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  nodeDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  topicsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 6,
    gap: 3,
  },
  topicsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicsHeaderLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  topicsListText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
  },
  nodeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    flexWrap: 'wrap',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    flexShrink: 1,
  },
  nodeStatusText: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
  },
  statusCompletedText: {
    color: COLORS.neonGreenBright,
    fontWeight: '700',
  },
  statusCurrentText: {
    color: COLORS.neonAmberBright,
    fontWeight: '700',
  },
  statusLockedText: {
    color: COLORS.textMuted,
  },
  taskProgressPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  taskProgressPillCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: COLORS.neonGreenBright,
  },
  taskProgressPillCurrent: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: COLORS.neonAmberBright,
  },
  taskProgressPillLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: COLORS.borderDark,
  },
  taskProgressText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  taskProgressTextCompleted: {
    color: COLORS.neonGreenBright,
  },
  taskProgressTextCurrent: {
    color: COLORS.neonAmberBright,
  },
  taskProgressTextLocked: {
    color: COLORS.textMuted,
  },
  // Mühendislik Eval & Telemetri Karnesi Stilleri
  evalContainer: {
    backgroundColor: 'rgba(5, 10, 20, 0.65)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
    gap: 6,
  },
  evalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  evalHeaderTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.neonAmberBright,
  },
  evalBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  evalBadgePass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  evalBadgeTextPass: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.neonGreenBright,
  },
  evalBadgeRegression: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  evalBadgeTextRegression: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.neonCyanBright,
  },
  evalBadgeProtocol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  evalBadgeTextProtocol: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#e2e8f0',
  },
  evalLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  evalLockedText: {
    fontSize: 9.5,
    fontStyle: 'italic',
    color: COLORS.textMuted,
  },
});
