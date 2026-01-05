import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../styles/theme';
import { BellIcon } from './Icons';

interface TopBarProps {
  balance: number;
  onBalancePress?: () => void;
  onNotificationsPress?: () => void;
  unreadCount?: number;
}

export default function TopBar({ balance, onBalancePress, onNotificationsPress, unreadCount = 0 }: TopBarProps) {
  return (
    <View style={styles.container}>
      {/* Пустое место слева для симметрии */}
      <View style={styles.leftSpacer} />

      {/* Логотип по центру */}
      <Image 
        source={require('../../logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.rightSection}>
        {/* Баланс */}
        <TouchableOpacity 
          style={styles.balanceContainer}
          onPress={onBalancePress}
          activeOpacity={0.7}
        >
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 50,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    zIndex: 100,
  },
  leftSpacer: {
    width: 80,
  },
  logo: {
    height: 32,
    width: 120,
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
