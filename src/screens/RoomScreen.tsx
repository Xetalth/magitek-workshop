import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoomState, WorkshopState, ShopState } from '../types/sdui';
import { COLORS } from '../theme/colors';

const roomBg = require('../assets/images/room_bg.png');

interface RoomScreenProps {
  room?: RoomState;
  workshop?: WorkshopState;
  shop?: ShopState;
}

export const RoomScreen: React.FC<RoomScreenProps> = () => {
  return (
    <ImageBackground source={roomBg} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.container}>
        {/* Sahne ferahlığı için arka plan görseli tamamen açık bırakılmıştır */}
        <View style={styles.spacer} />

        {/* Ekranın altında sade, yarı saydam tek satırlık Magitek bilgi bandı */}
        <View style={styles.infoStripWrapper}>
          <View style={styles.infoStrip}>
            <Ionicons name="sparkles-outline" size={13} color={COLORS.neonAmberBright} />
            <Text style={styles.infoText}>
              Mühendisin Dinlenme Odası // 1. Sınıf Kırsal Kulübe
            </Text>
          </View>
        </View>
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
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  infoStripWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(7, 11, 20, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: COLORS.neonAmber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  infoText: {
    color: COLORS.neonAmberBright,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
