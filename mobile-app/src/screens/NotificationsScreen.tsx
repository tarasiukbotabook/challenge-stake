import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { BackIcon } from '../components/Icons';

export default function NotificationsScreen({ navigation, route }: any) {
  const { userId } = route?.params || {};
  
  // Загружаем реальные уведомления о донатах
  const donations = useQuery(api.challenges.getUserDonationNotifications, userId ? { userId } : 'skip');

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'} назад`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`;
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
  };

  const handleUserPress = (donorUserId: string) => {
    navigation.navigate('UserProfile', { targetUserId: donorUserId, currentUserId: userId });
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
        <Text style={styles.headerTitle}>Уведомления</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {donations === undefined ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.lime} />
            <Text style={styles.loadingText}>Загрузка...</Text>
          </View>
        ) : donations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Пока нет уведомлений</Text>
            <Text style={styles.emptySubtext}>
              Когда кто-то поддержит ваш отчёт, вы увидите это здесь
            </Text>
          </View>
        ) : (
          donations.map((donation) => (
            <View key={donation._id} style={styles.notificationCard}>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationMessage}>
                  Пользователь{' '}
                  <Text 
                    style={styles.username}
                    onPress={() => handleUserPress(donation.donorUserId)}
                  >
                    @{donation.donorUsername}
                  </Text>
                  {' '}задонатил вам{' '}
                  <Text style={styles.amount}>${donation.amount}</Text>
                </Text>
                {donation.message && (
                  <Text style={styles.donationMessage}>💬 "{donation.message}"</Text>
                )}
                <Text style={styles.notificationTime}>{formatTime(donation._creationTime)}</Text>
              </View>
            </View>
          ))
        )}
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
    padding: spacing.md,
  },
  notificationCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  username: {
    color: colors.lime,
    fontWeight: fontWeight.semibold,
  },
  amount: {
    color: colors.emerald,
    fontWeight: fontWeight.bold,
  },
  donationMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.borderLight,
  },
  notificationTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  loadingState: {
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
