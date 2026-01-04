import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { TimerIcon, MenuIcon } from '../components/Icons';

export default function HomeScreen({ navigation }: any) {
  // TODO: Implement authentication
  // Временно отключаем Convex queries для тестирования UI
  const challenges = null; // useQuery(api.challenges.getMy, { userId });
  const stats = null; // useQuery(api.users.getUserStats, { userId });

  // Моковые данные для тестирования
  const mockUser = {
    username: 'user123',
    firstName: 'Иван',
    photoUrl: null,
    balance: 1000,
  };

  const mockStats = {
    total: 8,
    completed: 5,
    active: 3,
    balance: 1000,
  };

  const mockChallenges = [
    {
      _id: '1',
      title: 'Пробежать 50км за месяц',
      description: 'Каждый день минимум 2км',
      stakeAmount: 100,
      donationsAmount: 25,
      status: 'active',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'health',
      userId: 'user1',
      username: 'user123',
      firstName: 'Иван',
      photoUrl: null,
    },
    {
      _id: '2',
      title: 'Выучить 100 английских слов',
      description: 'По 10 слов каждый день',
      stakeAmount: 50,
      donationsAmount: 0,
      status: 'active',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'learning',
      userId: 'user1',
      username: 'user123',
      firstName: 'Иван',
      photoUrl: null,
    },
  ];

  const renderAvatar = (user: any) => {
    if (user.photoUrl) {
      return <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />;
    }
    const initial = (user.firstName || user.username || 'U').charAt(0).toUpperCase();
    return <Text style={styles.avatarText}>{initial}</Text>;
  };

  const formatTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Завершён';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return `${months} мес${remainingDays > 0 ? ` ${remainingDays} дн` : ''}`;
    } else if (days > 0) {
      return `${days} дн${hours > 0 ? ` ${hours} ч` : ''}`;
    } else if (hours > 0) {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} ч${minutes > 0 ? ` ${minutes} мин` : ''}`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} мин`;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userAvatar}>
          {renderAvatar(mockUser)}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Challenge Stake</Text>
          <Text style={styles.headerSubtitle}>Достигай целей публично</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.headerBalance}>
            <Text style={styles.balanceAmount}>{mockStats.balance}</Text>
            <TouchableOpacity style={styles.btnIcon}>
              <Text style={styles.iconText}>💳</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnIcon}>
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Stats (Instagram style) */}
      <View style={styles.statsCompact}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mockStats.total}</Text>
          <Text style={styles.statText}>Всего</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mockStats.completed}</Text>
          <Text style={styles.statText}>Выполнено</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mockStats.active}</Text>
          <Text style={styles.statText}>Активных</Text>
        </View>
      </View>

      {/* Challenges List */}
      <View style={styles.challengesList}>
        {mockChallenges.map((challenge) => {
          const totalAmount = challenge.stakeAmount + challenge.donationsAmount;
          const timeRemaining = formatTimeRemaining(challenge.deadline);
          
          return (
            <TouchableOpacity key={challenge._id} style={styles.challengeCard}>
              <View style={styles.challengeOwner}>
                <View style={styles.challengeOwnerAvatar}>
                  {renderAvatar(challenge)}
                </View>
                <View style={styles.challengeOwnerInfo}>
                  <Text style={styles.challengeOwnerUsername}>@{challenge.username}</Text>
                  <View style={styles.challengeMeta}>
                    <Text style={styles.challengeMetaText}>
                      {new Date(challenge.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </Text>
                    <Text style={styles.challengeMetaText}> • </Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeText}>Активен</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.btnMenu}>
                  <MenuIcon color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              
              {challenge.status === 'active' && (
                <View style={styles.challengeTimerBig}>
                  <TimerIcon color={colors.lime} />
                  <Text style={styles.timerText}>{timeRemaining}</Text>
                </View>
              )}
              
              <View style={styles.challengeStake}>
                <View style={styles.challengeStakeAmount}>
                  <Text style={styles.currency}>$</Text>
                  <Text style={styles.amount}>{totalAmount}</Text>
                  {challenge.donationsAmount > 0 && (
                    <Text style={styles.challengeStakeDetails}>
                      ({challenge.stakeAmount} + {challenge.donationsAmount})
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: 50, // Отступ сверху для безопасной зоны
    paddingBottom: 70, // Отступ для нижнего меню
  },
  header: {
    backgroundColor: colors.bgSecondary,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  balanceAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.emerald,
  },
  btnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: fontSize.md,
  },
  statsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: spacing.lg,
    backgroundColor: 'rgba(26, 46, 39, 0.5)',
    borderRadius: borderRadius.md,
    margin: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  challengesList: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  challengeCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  challengeOwner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  challengeOwnerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  challengeOwnerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  challengeOwnerUsername: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  challengeMetaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  badgeActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.lime,
  },
  btnMenu: {
    padding: spacing.xs,
  },
  challengeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  challengeTimerBig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  timerText: {
    color: colors.lime,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  challengeStake: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  challengeStakeAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currency: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.emerald,
  },
  amount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.emerald,
  },
  challengeStakeDetails: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
