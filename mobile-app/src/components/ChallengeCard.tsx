import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { MenuIcon, CheckIcon, DoubleCheckIcon, XIcon } from './Icons';

interface ChallengeCardProps {
  challenge: any;
  variant?: 'full' | 'compact'; // full - для ленты, compact - для профилей
  onPress?: () => void;
  onUserPress?: (userId: string) => void;
}

export default function ChallengeCard({ 
  challenge, 
  variant = 'compact',
  onPress,
  onUserPress 
}: ChallengeCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [storyVisible, setStoryVisible] = useState(false);
  const storyRef = useRef(null);
  
  const renderAvatar = () => {
    if (challenge.photoUrl) {
      return <Image source={{ uri: challenge.photoUrl }} style={styles.avatarImage} />;
    }
    const initial = (challenge.firstName || challenge.username || 'U').charAt(0).toUpperCase();
    return <Text style={styles.avatarText}>{initial}</Text>;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date().getTime();
    const end = new Date(deadline).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return { text: 'Завершена', color: colors.textMuted };
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);

    if (months > 0) {
      return { 
        text: `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`, 
        color: colors.lime 
      };
    } else if (days > 0) {
      return { 
        text: `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`, 
        color: days < 3 ? '#ef4444' : colors.lime 
      };
    } else if (hours > 0) {
      return { 
        text: `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`, 
        color: '#ef4444' 
      };
    } else {
      return { 
        text: `${minutes} ${minutes === 1 ? 'минута' : minutes < 5 ? 'минуты' : 'минут'}`, 
        color: '#ef4444' 
      };
    }
  };

  const getStatusBadgeStyle = () => {
    if (challenge.status === 'active') return styles.badgeActive;
    if (challenge.status === 'completed') return styles.badgeCompleted;
    return styles.badgeFailed;
  };

  const getStatusText = () => {
    if (challenge.status === 'active') return 'Активен';
    if (challenge.status === 'completed') return 'Выполнен';
    return 'Провален';
  };

  const renderStatusIcon = () => {
    if (challenge.status === 'active') {
      return <CheckIcon width={16} height={16} color="#10b981" />;
    }
    if (challenge.status === 'completed') {
      return <DoubleCheckIcon width={16} height={16} color="#10b981" />;
    }
    return <XIcon width={16} height={16} color="#ef4444" />;
  };

  const timeRemaining = getTimeRemaining(challenge.deadline);

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleCopyLink = async () => {
    setMenuVisible(false);
    const challengeLink = `https://greedy-badger-196.convex.site/challenge/${challenge._id}`;
    await Clipboard.setStringAsync(challengeLink);
    Alert.alert('Скопировано', 'Ссылка на цель скопирована в буфер обмена');
  };

  const handleGenerateStory = async () => {
    setMenuVisible(false);
    setStoryVisible(true);
    
    // Даём время на рендер
    setTimeout(async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Ошибка', 'Необходимо разрешение на сохранение в галерею');
          setStoryVisible(false);
          return;
        }

        const uri = await captureRef(storyRef, {
          format: 'png',
          quality: 1,
        });

        await MediaLibrary.saveToLibraryAsync(uri);
        setStoryVisible(false);
        Alert.alert('Готово!', 'Сторис сохранена в галерею');
      } catch (error) {
        console.error('Error generating story:', error);
        setStoryVisible(false);
        Alert.alert('Ошибка', 'Не удалось сгенерировать сторис');
      }
    }, 100);
  };

  if (variant === 'full') {
    // Полный вариант для ленты и профилей
    return (
      <>
        <TouchableOpacity 
          style={styles.challengeCard}
          onPress={onPress}
          disabled={!onPress}
        >
          <View style={styles.challengeHeader}>
            <View style={styles.challengeUser}>
              <View style={styles.challengeAvatar}>
                {renderAvatar()}
              </View>
              <View style={styles.challengeUserInfo}>
                <TouchableOpacity onPress={() => onUserPress?.(challenge.userId)}>
                  <Text style={styles.challengeUsername}>@{challenge.username}</Text>
                </TouchableOpacity>
                <View style={styles.titleRow}>
                  <View style={styles.statusIconContainer}>
                    {renderStatusIcon()}
                  </View>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                </View>
                <Text style={styles.challengeDate}>
                  {formatDate(challenge._creationTime)}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.btnMenu} onPress={handleMenuPress}>
                <MenuIcon color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {challenge.description && (
            <Text style={styles.challengeDescription}>{challenge.description}</Text>
          )}

          <View style={styles.challengeFooter}>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeStake}>Ставка: ${challenge.stakeAmount}</Text>
              {(challenge.donationsAmount || 0) > 0 && (
                <Text style={styles.challengeDonations}>
                  Донаты: ${challenge.donationsAmount || 0}
                </Text>
              )}
            </View>
            <View style={styles.timeRemaining}>
              <Text style={styles.timeLabel}>Осталось:</Text>
              <Text style={[styles.timeValue, { color: timeRemaining.color }]}>
                {timeRemaining.text}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.menuModalOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.menuContainer}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleCopyLink}
                >
                  <Text style={styles.menuItemText}>Скопировать ссылку</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.menuItem, styles.menuItemLast]}
                  onPress={() => setMenuVisible(false)}
                >
                  <Text style={[styles.menuItemText, styles.menuItemCancel]}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // Компактный вариант для профилей
  return (
    <>
      <TouchableOpacity 
        style={styles.challengeCardCompact}
        onPress={onPress}
      >
        <Text style={styles.challengeTitleCompact}>{challenge.title}</Text>
        <View style={styles.challengeStakeRow}>
          <Text style={styles.amount}>
            ${challenge.stakeAmount + (challenge.donationsAmount || 0)}
          </Text>
          <View style={getStatusBadgeStyle()}>
            <Text style={styles.badgeText}>
              {getStatusText()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuModalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleGenerateStory}
              >
                <Text style={styles.menuItemText}>📸 Сгенерировать сторис</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleCopyLink}
              >
                <Text style={styles.menuItemText}>Скопировать ссылку</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.menuItem, styles.menuItemLast]}
                onPress={() => setMenuVisible(false)}
              >
                <Text style={[styles.menuItemText, styles.menuItemCancel]}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {/* Story Generation Modal */}
      <Modal
        visible={storyVisible}
        transparent={true}
        animationType="none"
      >
        <View style={styles.storyModalContainer}>
          <View ref={storyRef} style={styles.storyCanvas} collapsable={false}>
            {/* Градиентный фон */}
            <View style={styles.storyBackground}>
              {/* Контент сторис */}
              <View style={styles.storyContent}>
                <Text style={styles.storyLogo}>POFACTU</Text>
                
                <View style={styles.storyMain}>
                  <Text style={styles.storyEmoji}>🎯</Text>
                  <Text style={styles.storyTitle}>{challenge.title}</Text>
                  
                  <View style={styles.storyDetails}>
                    <View style={styles.storyDetailItem}>
                      <Text style={styles.storyDetailLabel}>Ставка</Text>
                      <Text style={styles.storyDetailValue}>${challenge.stakeAmount}</Text>
                    </View>
                    
                    <View style={styles.storyDetailItem}>
                      <Text style={styles.storyDetailLabel}>Дедлайн</Text>
                      <Text style={styles.storyDetailValue}>
                        {new Date(challenge.deadline).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.storyUsername}>@{challenge.username}</Text>
                </View>
                
                <Text style={styles.storyFooter}>Следи за моим прогрессом!</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Полный вариант (для ленты)
  challengeCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  challengeUser: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusIconContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  challengeUserInfo: {
    flex: 1,
  },
  challengeUsername: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  challengeTitle: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  challengeDate: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  btnMenu: {
    padding: spacing.xs,
  },
  challengeDescription: {
    fontSize: fontSize.md,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeStake: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.emerald,
    marginBottom: spacing.xs,
  },
  challengeDonations: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  timeRemaining: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  
  // Компактный вариант (для профилей)
  challengeCardCompact: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  challengeTitleCompact: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  challengeStakeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.emerald,
  },
  badgeActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.lime,
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
  menuItemCancel: {
    color: colors.textMuted,
  },
  // Story styles
  storyModalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: -10000, // Скрываем за экраном
  },
  storyCanvas: {
    width: 1080,
    height: 1920,
  },
  storyBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0a1612',
  },
  storyContent: {
    flex: 1,
    padding: 60,
    justifyContent: 'space-between',
  },
  storyLogo: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.lime,
    letterSpacing: 2,
    textAlign: 'center',
  },
  storyMain: {
    alignItems: 'center',
    gap: 40,
  },
  storyEmoji: {
    fontSize: 120,
  },
  storyTitle: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 68,
    paddingHorizontal: 40,
  },
  storyDetails: {
    flexDirection: 'row',
    gap: 60,
    marginTop: 40,
  },
  storyDetailItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    paddingVertical: 30,
    paddingHorizontal: 50,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(132, 204, 22, 0.3)',
  },
  storyDetailLabel: {
    fontSize: 28,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  storyDetailValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.lime,
  },
  storyUsername: {
    fontSize: 40,
    color: colors.lime,
    fontWeight: '600',
    marginTop: 40,
  },
  storyFooter: {
    fontSize: 32,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
