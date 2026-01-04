import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { BackIcon } from '../components/Icons';

export default function PrivacyScreen({ navigation, route }: any) {
  const { userId } = route.params;
  const user = useQuery(api.users.getUserStats, userId ? { userId } : 'skip');
  const updatePrivacy = useMutation(api.users.updatePrivacy);
  
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (user) {
      setIsPrivate(user.isPrivate || false);
    }
  }, [user]);

  const handleTogglePrivacy = async (value: boolean) => {
    setIsPrivate(value);
    
    try {
      await updatePrivacy({
        userId,
        isPrivate: value,
      });
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось обновить настройки');
      setIsPrivate(!value); // Откатываем изменения
    }
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
        <Text style={styles.headerTitle}>Конфиденциальность</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Скрытый профиль</Text>
              <Text style={styles.settingDescription}>
                Ваш профиль, цели и отчёты будут скрыты от других пользователей
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={handleTogglePrivacy}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: colors.lime }}
              thumbColor={colors.textPrimary}
              ios_backgroundColor="rgba(255, 255, 255, 0.1)"
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Что это значит?</Text>
          <Text style={styles.infoText}>
            • Ваш профиль не будет отображаться в поиске{'\n'}
            • Ваши цели не будут видны в общей ленте{'\n'}
            • Ваши отчёты не будут видны другим пользователям{'\n'}
            • Вы по-прежнему сможете создавать цели и отчёты
          </Text>
        </View>
      </ScrollView>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSecondary,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
  infoSection: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.2)',
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
