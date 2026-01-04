import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Modal, Dimensions, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Autolink from 'react-native-autolink';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { VerifyIcon, FakeIcon, MenuIcon } from './Icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReportCardProps {
  report: any;
  currentUserId: string;
  currentUserBalance: number;
  onUserPress?: (userId: string) => void;
  onDonatePress?: (report: any) => void;
  onReportDeleted?: () => void;
}

export default function ReportCard({ 
  report, 
  currentUserId, 
  currentUserBalance,
  onUserPress,
  onDonatePress,
  onReportDeleted
}: ReportCardProps) {
  const [votingState, setVotingState] = useState<string | null>(null);
  const [optimisticCounts, setOptimisticCounts] = useState<{ verify: number; fake: number } | null>(null);
  const [verifyScaleAnim] = useState(new Animated.Value(1));
  const [fakeScaleAnim] = useState(new Animated.Value(1));
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const voteReport = useMutation(api.challenges.voteReport);
  const deleteReport = useMutation(api.challenges.deleteProgressUpdate);
  
  const MAX_LENGTH = 200; // Максимальное количество символов до сворачивания
  const shouldTruncate = report.content.length > MAX_LENGTH;
  
  // Загружаем голос пользователя при монтировании
  React.useEffect(() => {
    if (!currentUserId || !report._id) return;
    
    const loadUserVote = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_CONVEX_URL}/api/query`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'challenges:checkReportVote',
              args: { progressUpdateId: report._id as any, userId: currentUserId },
            }),
          }
        );
        const result = await response.json();
        if (result.value?.voteType) {
          setVotingState(result.value.voteType);
        }
      } catch (error) {
        console.error('Error loading vote:', error);
      }
    };
    
    loadUserVote();
  }, [currentUserId, report._id]);

  const handleVote = async (voteType: 'verify' | 'fake') => {
    if (!currentUserId) return;
    
    // Анимация нажатия
    const anim = voteType === 'verify' ? verifyScaleAnim : fakeScaleAnim;
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Текущее состояние голоса
    const currentVote = votingState;
    const newVote = currentVote === voteType ? null : voteType;
    
    // Вычисляем новые счётчики
    let newVerifyCount = report.verifyVotes || 0;
    let newFakeCount = report.fakeVotes || 0;
    
    if (currentVote === 'verify') {
      newVerifyCount = Math.max(0, newVerifyCount - 1);
    } else if (currentVote === 'fake') {
      newFakeCount = Math.max(0, newFakeCount - 1);
    }
    
    if (newVote === 'verify') {
      newVerifyCount++;
    } else if (newVote === 'fake') {
      newFakeCount++;
    }
    
    // Оптимистичное обновление UI
    setVotingState(newVote);
    setOptimisticCounts({ verify: newVerifyCount, fake: newFakeCount });
    
    try {
      await voteReport({
        progressUpdateId: report._id as any,
        userId: currentUserId as any,
        voteType: voteType,
      });
    } catch (error) {
      console.error('Vote error:', error);
      // Откатываем изменения при ошибке
      setVotingState(currentVote);
      setOptimisticCounts(null);
    }
  };

  const getVoteCount = (type: 'verify' | 'fake') => {
    if (optimisticCounts) {
      return Math.max(0, type === 'verify' ? optimisticCounts.verify : optimisticCounts.fake);
    }
    return Math.max(0, type === 'verify' ? (report.verifyVotes || 0) : (report.fakeVotes || 0));
  };

  const renderAvatar = () => {
    if (report.photoUrl) {
      return <Image source={{ uri: report.photoUrl }} style={styles.avatarImage} />;
    }
    const initial = (report.firstName || report.username || 'U').charAt(0).toUpperCase();
    return <Text style={styles.avatarText}>{initial}</Text>;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleDeleteReport = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Удалить отчёт',
      'Вы уверены, что хотите удалить этот отчёт?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReport({ progressUpdateId: report._id as any });
              Alert.alert('Успешно', 'Отчёт удалён');
              onReportDeleted?.();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось удалить отчёт');
            }
          },
        },
      ]
    );
  };

  const handleReportContent = () => {
    setMenuVisible(false);
    Alert.alert(
      'Пожаловаться',
      'Выберите причину жалобы',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Спам', onPress: () => Alert.alert('Жалоба отправлена', 'Спасибо за вашу бдительность') },
        { text: 'Неприемлемый контент', onPress: () => Alert.alert('Жалоба отправлена', 'Спасибо за вашу бдительность') },
        { text: 'Мошенничество', onPress: () => Alert.alert('Жалоба отправлена', 'Спасибо за вашу бдительность') },
      ]
    );
  };

  const handleCopyLink = async () => {
    setMenuVisible(false);
    // Формируем ссылку на отчёт (можно использовать deep link или web URL)
    const reportLink = `https://greedy-badger-196.convex.site/report/${report._id}`;
    await Clipboard.setStringAsync(reportLink);
    Alert.alert('Скопировано', 'Ссылка на отчёт скопирована в буфер обмена');
  };

  const isOwner = report.userId === currentUserId;

  return (
    <>
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportUser}>
          <View style={styles.reportAvatar}>
            {renderAvatar()}
          </View>
          <View style={styles.reportUserInfo}>
            <TouchableOpacity onPress={() => onUserPress?.(report.userId)}>
              <Text style={styles.reportUsername}>@{report.username}</Text>
            </TouchableOpacity>
            <Text style={styles.reportChallenge}>{report.challengeTitle}</Text>
            <Text style={styles.reportDate}>{formatDate(report._creationTime)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.btnMenu} onPress={handleMenuPress}>
          <MenuIcon color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Autolink 
        text={shouldTruncate && !isExpanded ? report.content.substring(0, MAX_LENGTH) + '...' : report.content}
        style={styles.reportContent}
        linkStyle={styles.linkText}
      />
      
      {shouldTruncate && (
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={styles.showMoreText}>
            {isExpanded ? 'Свернуть' : 'Показать ещё'}
          </Text>
        </TouchableOpacity>
      )}

      {report.imageUrl && (
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          <Image source={{ uri: report.imageUrl }} style={styles.reportImage} />
        </TouchableOpacity>
      )}

      <View style={styles.reportActions}>
        <View style={styles.reportVotes}>
          <Animated.View style={{ transform: [{ scale: verifyScaleAnim }] }}>
            <TouchableOpacity 
              style={[
                styles.btnVoteVerify,
                votingState === 'verify' && styles.btnVoteVerifyActive
              ]}
              onPress={() => handleVote('verify')}
            >
              <VerifyIcon 
                color={votingState === 'verify' ? colors.lime : colors.textSecondary} 
              />
              <Text style={[
                styles.voteCount,
                votingState === 'verify' && styles.voteCountActive
              ]}>
                {getVoteCount('verify')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: fakeScaleAnim }] }}>
            <TouchableOpacity 
              style={[
                styles.btnVoteFake,
                votingState === 'fake' && styles.btnVoteFakeActive
              ]}
              onPress={() => handleVote('fake')}
            >
              <FakeIcon 
                color={votingState === 'fake' ? '#ef4444' : colors.textSecondary} 
              />
              <Text style={[
                styles.voteCount,
                votingState === 'fake' && styles.voteCountFakeActive
              ]}>
                {getVoteCount('fake')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <View style={styles.reportDonations}>
          {(report.donationsAmount || 0) > 0 && (
            <Text style={styles.donationsAmount}>${report.donationsAmount || 0}</Text>
          )}
          <TouchableOpacity 
            style={styles.btnDonate}
            onPress={() => onDonatePress?.(report)}
          >
            <Text style={styles.btnDonateText}>Поддержать</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    
    {/* Image Modal */}
    <Modal
      visible={imageModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setImageModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.imageModalOverlay}
        activeOpacity={1}
        onPress={() => setImageModalVisible(false)}
      >
        <Image 
          source={{ uri: report.imageUrl }} 
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setImageModalVisible(false)}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
    
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
            {isOwner && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleDeleteReport}
              >
                <Text style={[styles.menuItemText, styles.menuItemDanger]}>Удалить отчёт</Text>
              </TouchableOpacity>
            )}
            {!isOwner && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleReportContent}
              >
                <Text style={styles.menuItemText}>Пожаловаться</Text>
              </TouchableOpacity>
            )}
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

const styles = StyleSheet.create({
  reportCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  reportUser: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
  },
  reportAvatar: {
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
  reportUserInfo: {
    flex: 1,
  },
  reportUsername: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  reportChallenge: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  reportDate: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  btnMenu: {
    padding: spacing.xs,
  },
  reportContent: {
    fontSize: fontSize.md,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  linkText: {
    fontSize: fontSize.md,
    color: colors.lime,
    textDecorationLine: 'underline',
  },
  showMoreText: {
    fontSize: fontSize.sm,
    color: colors.lime,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  reportImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  reportVotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    flexWrap: 'wrap',
  },
  btnVoteVerify: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnVoteVerifyActive: {
    backgroundColor: 'rgba(132, 204, 22, 0.2)',
    borderColor: colors.lime,
  },
  btnVoteFake: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnVoteFakeActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  voteCount: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  voteCountActive: {
    color: colors.lime,
    fontWeight: fontWeight.bold,
  },
  voteCountFakeActive: {
    color: '#ef4444',
    fontWeight: fontWeight.bold,
  },
  reportDonations: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  donationsAmount: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    color: colors.emerald,
  },
  btnDonate: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  btnDonateText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.emerald,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: fontWeight.bold,
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
  menuItemDanger: {
    color: '#ef4444',
  },
  menuItemCancel: {
    color: colors.textMuted,
  },
});
