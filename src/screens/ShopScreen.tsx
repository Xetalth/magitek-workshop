import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopState, ShopItem } from '../types/sdui';
import { COLORS } from '../theme/colors';

interface ShopScreenProps {
  data: ShopState;
  gold: number;
  onBuyItem?: (itemId: string) => void;
  onUpdateState?: (updater: (prev: ShopState) => ShopState) => void;
  onSpendGold?: (amount: number) => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  data,
  gold,
  onBuyItem,
  onUpdateState,
  onSpendGold,
}) => {
  const handleBuy = (item: ShopItem) => {
    if (item.status === 'LOCKED' && gold >= item.costGold) {
      if (onBuyItem) {
        onBuyItem(item.id);
      } else {
        if (onSpendGold) onSpendGold(item.costGold);
        if (onUpdateState) {
          onUpdateState((prev) => ({
            ...prev,
            items: prev.items.map((i) =>
              i.id === item.id ? { ...i, status: 'UNLOCKED' } : i
            ),
          }));
        }
      }
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      {/* Bakiye Kartı (Altın Kesesi) */}
      <View style={styles.walletCard}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletSubtitle}>Atölye Kasası</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.goldIcon}>🪙</Text>
            <Text style={styles.balanceAmount}>{gold}</Text>
            <Text style={styles.currencyBadge}>Altın (G)</Text>
          </View>
        </View>
        <View style={styles.walletIconBox}>
          <Ionicons name="storefront-outline" size={24} color={COLORS.neonAmberBright} />
        </View>
      </View>

      {/* Mağaza Listesi */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionHeading}>Magitek Parça Tüccarı // Atölye & Oda Teçhizatı</Text>

        <View style={styles.itemList}>
          {data.items.map((item) => {
            const isUnlocked = item.status === 'UNLOCKED';
            const canAfford = gold >= item.costGold;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  isUnlocked ? styles.itemCardUnlocked : styles.itemCardLocked,
                ]}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemIconBox}>
                    <Ionicons
                      name={item.iconName as any}
                      size={20}
                      color={isUnlocked ? COLORS.neonCyanBright : COLORS.textMuted}
                    />
                  </View>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isUnlocked ? styles.pillUnlocked : styles.pillLocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isUnlocked ? styles.textUnlocked : styles.textLocked,
                      ]}
                    >
                      {isUnlocked ? 'SATIN ALINDI' : 'KİLİTLİ'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemDescription}>{item.description}</Text>

                <View style={styles.itemFooter}>
                  <View style={styles.priceRow}>
                    <Text style={styles.coinMini}>🪙</Text>
                    <Text style={styles.priceText}>{item.costGold} G</Text>
                  </View>

                  {!isUnlocked ? (
                    <TouchableOpacity
                      style={[
                        styles.unlockBtn,
                        !canAfford && styles.unlockBtnDisabled,
                      ]}
                      onPress={() => handleBuy(item)}
                      disabled={!canAfford}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.unlockBtnText}>
                        {canAfford ? 'Satın Al' : 'Yetersiz Altın'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.ownedBadge}>
                      <Ionicons name="checkmark-sharp" size={14} color={COLORS.neonGreenBright} />
                      <Text style={styles.ownedText}>Odaya Eklendi</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
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
  walletCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.neonAmber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  walletInfo: {
    flexShrink: 1,
  },
  walletSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goldIcon: {
    fontSize: 18,
  },
  balanceAmount: {
    color: COLORS.neonAmberBright,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  currencyBadge: {
    color: COLORS.neonAmber,
    fontSize: 11,
    fontWeight: '700',
  },
  walletIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsSection: {
    gap: 10,
  },
  sectionHeading: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  itemList: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  itemCardUnlocked: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  itemCardLocked: {
    borderColor: COLORS.borderDark,
    opacity: 0.85,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  itemCategory: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: COLORS.neonGreenBright,
  },
  pillLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: COLORS.borderDark,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textUnlocked: {
    color: COLORS.neonGreenBright,
  },
  textLocked: {
    color: COLORS.textMuted,
  },
  itemDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinMini: {
    fontSize: 12,
  },
  priceText: {
    color: COLORS.neonAmberBright,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  unlockBtn: {
    backgroundColor: COLORS.neonAmber,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unlockBtnDisabled: {
    backgroundColor: COLORS.borderDark,
    opacity: 0.5,
  },
  unlockBtnText: {
    color: COLORS.bgPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownedText: {
    color: COLORS.neonGreenBright,
    fontSize: 11,
    fontWeight: '700',
  },
});
