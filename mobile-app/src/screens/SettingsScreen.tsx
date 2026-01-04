import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { BackIcon } from '../components/Icons';

export default function SettingsScreen({ navigation, onLogout, route }: any) {
  const { userId } = route.params || {};
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Русский');
  
  const handleLogout = async () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('username');
            await AsyncStorage.removeItem('phone');
            // Вызываем callback для выхода
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setLanguageModalVisible(false);
    // Здесь можно добавить логику сохранения языка
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon color={colors.lime} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Settings List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Профиль</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('EditProfile', { userId })}
          >
            <Text style={styles.settingText}>Редактировать профиль</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('Privacy', { userId })}
          >
            <Text style={styles.settingText}>Конфиденциальность</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          
          <View style={styles.settingDivider} />
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Text style={styles.settingText}>Язык</Text>
            <Text style={styles.settingValue}>{selectedLanguage}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Помощь и поддержка</Text>
          </TouchableOpacity>
          
          <View style={styles.settingDivider} />
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Условия использования</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
      
      {/* Language Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuModalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleLanguageSelect('Русский')}
              >
                <Text style={[
                  styles.menuItemText,
                  selectedLanguage === 'Русский' && styles.menuItemTextActive
                ]}>
                  Русский
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleLanguageSelect('English')}
              >
                <Text style={[
                  styles.menuItemText,
                  selectedLanguage === 'English' && styles.menuItemTextActive
                ]}>
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleLanguageSelect('O\'zbekcha')}
              >
                <Text style={[
                  styles.menuItemText,
                  selectedLanguage === 'O\'zbekcha' && styles.menuItemTextActive
                ]}>
                  O'zbekcha
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.menuItem, styles.menuItemLast]}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Text style={[styles.menuItemText, styles.menuItemCancel]}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSecondary,
  },
  settingText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  settingArrow: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },
  settingValue: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.lg,
  },
  logoutButton: {
    margin: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#ef4444',
  },
  bottomSpace: {
    height: 100,
  },
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    paddingBottom: 40,
    paddingTop: spacing.xs,
  },
  menuItem: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  menuItemTextActive: {
    color: colors.lime,
    fontWeight: fontWeight.bold,
  },
  menuItemCancel: {
    color: colors.textMuted,
  },
});
