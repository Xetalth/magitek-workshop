import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabType } from '../types/sdui';
import { COLORS } from '../theme/colors';

interface BottomTabBarProps {
  activeTab: TabType;
  hasWorkbenchAlert?: boolean;
  onTabChange: (tab: TabType) => void;
}

interface TabItemConfig {
  id: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItemConfig[] = [
  {
    id: 'skills',
    label: 'Yetenekler',
    icon: 'git-network-outline',
    activeIcon: 'git-network',
  },
  {
    id: 'workshop',
    label: 'Atölye',
    icon: 'cube-outline',
    activeIcon: 'cube',
  },
  {
    id: 'workbench',
    label: 'İş Masası',
    icon: 'hammer-outline',
    activeIcon: 'hammer',
  },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  hasWorkbenchAlert = false,
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);
  const containerHeight = 60 + bottomPadding;

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding, height: containerHeight }]}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const showWorkbenchBadge = tab.id === 'workbench' && hasWorkbenchAlert && !isActive;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              activeOpacity={0.7}
              onPress={() => onTabChange(tab.id)}
            >
              {/* İş Masası Bildirim Rozeti (Glow & Badge) */}
              {showWorkbenchBadge && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>!</Text>
                </View>
              )}

              <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={20}
                  color={isActive ? COLORS.neonCyanBright : COLORS.textMuted}
                />
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>

              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: COLORS.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGlass,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: 6,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    position: 'relative',
    borderRadius: 8,
    minHeight: 48,
  },
  activeTabButton: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  iconContainer: {
    padding: 2,
  },
  activeIconContainer: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  activeTabLabel: {
    color: COLORS.neonCyanBright,
    fontWeight: '700',
  },
  inactiveTabLabel: {
    color: COLORS.textMuted,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 2,
    backgroundColor: COLORS.neonCyanBright,
    borderRadius: 1,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  alertBadge: {
    position: 'absolute',
    top: 2,
    right: 12,
    backgroundColor: COLORS.neonAmber,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: COLORS.neonAmberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
  alertBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.bgPrimary,
    lineHeight: 11,
  },
});
