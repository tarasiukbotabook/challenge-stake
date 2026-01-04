import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../styles/theme';
import { StarIcon, BellIcon } from './Icons';

interface TopBarProps {
  balance: number;
  rating: number;
  onBalancePress?: () => void;
  onNotificationsPress?: () => void;
  unreadCount?: number;
}

export default function TopBar({ balance, rating, onBalancePress, onNotificationsPress, unreadCount = 0 }: TopBarProps) {
  return (
    <View style={styles.container}>
      {/* Рейтинг */}
      <View style={styles.ratingContainer}>
        <StarIcon width={16} height={16} color={colors.gold} />
        <Text style={styles.ratingText}>{rating}</Text>
      </View>

      <View style={styles.rightSection}>
        {/* Баланс */}
        <TouchableOpacity 
          style={styles.balanceContainer}
          onPress={onBalancePress}
          activeOpacity={0.7}
        >
          <Text style={styles.balanceLabel}>Баланс:</Text>
          <Text style={styles.balanceValue}>${balance}</Text>
        </TouchableOpacity>

        {/* Уведомления */}
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={onNotificationsPress}
          activeOpacity={0.7}
        >
          <BellIcon width={20} height={20} color={colors.lime} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  ratingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gold,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  balanceLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.emerald,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
