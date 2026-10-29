import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { SDUIState, TabType, ModuleId } from './src/types/sdui';
import { sduiEngine } from './src/services/sduiEngine';
import { TopHud } from './src/components/TopHud';
import { BottomTabBar } from './src/components/BottomTabBar';
import { WorkshopScreen } from './src/screens/WorkshopScreen';
import { WorkbenchScreen } from './src/screens/WorkbenchScreen';
import { SkillsScreen } from './src/screens/SkillsScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { RoomScreen } from './src/screens/RoomScreen';
import { COLORS } from './src/theme/colors';

export default function App() {
  const [sduiState, setSduiState] = useState<SDUIState>(() => sduiEngine.getDeclarativeState());

  useEffect(() => {
    // Declarative Server-Driven UI Aboneliği
    const unsubscribe = sduiEngine.subscribe((nextState) => {
      setSduiState(nextState);
    });
    return unsubscribe;
  }, []);

  const handleTabChange = (newTab: TabType) => {
    sduiEngine.setActiveTab(newTab);
  };

  const handleGoToWorkbench = () => {
    sduiEngine.setActiveTab('workbench');
  };

  const handleGoToWorkshop = () => {
    sduiEngine.setActiveTab('workshop');
  };

  const handleSelectModule = (moduleId: ModuleId) => {
    sduiEngine.selectModule(moduleId);
  };

  const handleSelectPatch = (patchId: string) => {
    sduiEngine.selectPatch(patchId);
  };

  const handleCompileAndTest = () => {
    sduiEngine.runCompileAndTest();
  };

  const handleDeliverJob = () => {
    sduiEngine.deliverJob();
  };

  const handleNextModule = () => {
    sduiEngine.advanceToNextModule();
  };

  const handleBuyShopItem = (itemId: string) => {
    sduiEngine.buyShopItem(itemId);
  };

  const renderCurrentScreen = () => {
    switch (sduiState.activeTab) {
      case 'workshop':
        return (
          <WorkshopScreen
            data={sduiState.workshop}
            onDeliverJob={handleDeliverJob}
            onGoToWorkbench={handleGoToWorkbench}
            onSelectModule={handleSelectModule}
            onNextModule={handleNextModule}
          />
        );
      case 'workbench':
        return (
          <WorkbenchScreen
            data={sduiState.workbench}
            onSelectModule={handleSelectModule}
            onSelectPatch={handleSelectPatch}
            onCompileAndTest={handleCompileAndTest}
            onGoToWorkshop={handleGoToWorkshop}
          />
        );
      case 'skills':
        return <SkillsScreen data={sduiState.skills} />;
      case 'shop':
        return (
          <ShopScreen
            data={sduiState.shop}
            gold={sduiState.hud.gold}
            onBuyItem={handleBuyShopItem}
          />
        );
      case 'room':
        return (
          <RoomScreen
            room={sduiState.room}
            workshop={sduiState.workshop}
            shop={sduiState.shop}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        {/* Üst HUD: Seviye, Gün, EXP, Altın & 1. Sınıf Müfredat İlerlemesi */}
        <TopHud hud={sduiState.hud} />

        {/* Aktif Declarative SDUI Ekranı */}
        <View style={styles.body}>{renderCurrentScreen()}</View>

        {/* 5 Sekmeli Alt Navigasyon Barı (İş Masası Uyarı Rozetli) */}
        <BottomTabBar
          activeTab={sduiState.activeTab}
          hasWorkbenchAlert={sduiState.workbench.hasPendingWork}
          onTabChange={handleTabChange}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
});
