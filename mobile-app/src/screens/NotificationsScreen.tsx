import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { BackIcon } from '../components/Icons';

export default function NotificationsScreen({ navigation, route }: any) {
  const { userId } = route?.params || {};
  const [activeTab, setActiveTab] = useState<'notifications' | 'invites'>('notifications');
  
  // Загружаем реальные уведомления о донатах
  const donations = useQuery(api.challenges.getUserDonationNotifications, userId ? { userId } : 'skip');
  
  // Загружаем приглашения в компании
  const invites = useQuery(api.users.getCompanyInvites, userId ? { userId } : 'skip');
  
  // Мутации для принятия/отклонения приглашений
  const acceptInvite = useMutation(api.companies.acceptInvite);
  const rejectInvite = useMutation(api.companies.rejectInvite);

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

  const handleAcceptInvite = async (companyId: any) => {
    try {
      const result = await acceptInvite({ companyId, userId });
      if (result.success) {
        Alert.alert('Успешно', 'Вы присоединились к компании!');
      } else {
        Alert.alert('Ошибка', result.error);
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

  const handleRejectInvite = async (companyId: any) => {
    Alert.alert(
      'Отклонить приглашение',
      'Вы уверены, что хотите отклонить приглашение?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отклонить',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await rejectInvite({ companyId, userId });
              if (result.success) {
                Alert.alert('Успешно', 'Приглашение отклонено');
              } else {
                Alert.alert('Ошибка', result.error);
              }
            } catch (error: any) {
              Alert.alert('Ошибка', error.message);
            }
          },
        },
      ]
    );
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

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'notifications' && styles.tabBtnActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Уведомления
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'invites' && styles.tabBtnActive]}
          onPress={() => setActiveTab('invites')}
        >
          <Text style={[styles.tabText, activeTab === 'invites' && styles.tabTextActive]}>
            Приглашения {invites && invites.length > 0 && `(${invites.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'notifications' ? (
          // Уведомления о донатах
          donations === undefined ? (
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
          )
        ) : (
          // Приглашения в компании
          invites === undefined ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.lime} />
              <Text style={styles.loadingText}>Загрузка...</Text>
            </View>
          ) : invites.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyText}>Нет приглашений</Text>
              <Text style={styles.emptySubtext}>
                Когда компания пригласит вас, вы увидите это здесь
              </Text>
            </View>
          ) : (
            invites.map((invite) => (
              <View key={invite._id} style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                  <Text style={styles.inviteIcon}>🏢</Text>
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteCompany}>{invite.companyName}</Text>
                    <Text style={styles.inviteRole}>Роль: {invite.role}</Text>
                    <Text style={styles.inviteTime}>{formatTime(invite._creationTime)}</Text>
                  </View>
                </View>
                <Text style={styles.inviteMessage}>
                  {invite.inviterName} приглашает вас присоединиться к команде
                </Text>
                <View style={styles.inviteActions}>
                  <TouchableOpacity
                    style={styles.btnAccept}
                    onPress={() => handleAcceptInvite(invite.companyId)}
                  >
                    <Text style={styles.btnAcceptText}>Принять</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnReject}
                    onPress={() => handleRejectInvite(invite.companyId)}
                  >
                    <Text style={styles.btnRejectText}>Отклонить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
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
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(26, 46, 39, 0.3)',
  },
  tabBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(132, 204, 22, 0.2)',
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.lime,
  },
  inviteCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  inviteIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteCompany: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  inviteRole: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inviteTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  inviteMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnAccept: {
    flex: 1,
    backgroundColor: colors.lime,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnAcceptText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  btnReject: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnRejectText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#ef4444',
  },
});
