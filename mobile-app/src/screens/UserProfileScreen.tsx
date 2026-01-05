import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Animated, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { BackIcon, StarIcon } from '../components/Icons';
import ReportCard from '../components/ReportCard';
import ChallengeCard from '../components/ChallengeCard';
import * as Clipboard from 'expo-clipboard';

export default function UserProfileScreen({ navigation, route }: any) {
  const { targetUserId, currentUserId } = route?.params || {};
  
  // Если параметры не переданы, показываем ошибку
  if (!targetUserId || !currentUserId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Ошибка загрузки профиля</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 12, backgroundColor: colors.lime, borderRadius: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const [activeTab, setActiveTab] = useState<'challenges' | 'reports'>('challenges');
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [donatedAmount, setDonatedAmount] = useState(0);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateMessage, setDonateMessage] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [toastAnim] = useState(new Animated.Value(-100));
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [copiedToastAnim] = useState(new Animated.Value(-100));
  
  // Загрузка данных пользователя
  const userStats = useQuery(api.users.getUserStats, targetUserId ? { userId: targetUserId } : 'skip');
  const userChallenges = useQuery(api.challenges.getMy, targetUserId ? { userId: targetUserId } : 'skip');
  const userReports = useQuery(api.challenges.getUserReports, targetUserId ? { userId: targetUserId } : 'skip');
  
  // Загрузка баланса текущего пользователя для донатов
  const currentUserStats = useQuery(api.users.getUserStats, currentUserId ? { userId: currentUserId } : 'skip');
  
  // Мутация для доната
  const donate = useMutation(api.challenges.donate);
  
  const renderAvatar = (user: any) => {
    if (user?.photoUrl) {
      return <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />;
    }
    const initial = (user?.firstName || user?.username || 'U').charAt(0).toUpperCase();
    return <Text style={styles.avatarText}>{initial}</Text>;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const handleCopyProfileLink = async () => {
    const profileLink = `https://cel.im/${user.username}`;
    await Clipboard.setStringAsync(profileLink);
    
    // Показываем toast уведомление
    setShowCopiedToast(true);
    
    Animated.sequence([
      Animated.timing(copiedToastAnim, {
        toValue: 60,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(copiedToastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCopiedToast(false);
    });
  };

  const handleDonatePress = (report: any) => {
    setSelectedReport(report);
    setDonateAmount('');
    setDonateMessage('');
    setDonateModalVisible(true);
  };

  const handleDonateSubmit = async () => {
    if (!currentUserId || !selectedReport) return;
    
    const amount = parseFloat(donateAmount);
    const balance = currentUserStats?.balance || 0;
    
    if (!amount || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    
    if (amount > balance) {
      Alert.alert(
        'Недостаточно средств',
        `На вашем балансе $${balance}. Пополните баланс для отправки доната.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsDonating(true);
    
    try {
      await donate({
        challengeId: selectedReport.challengeId,
        progressUpdateId: selectedReport._id,
        donorUserId: currentUserId,
        amount: amount,
        message: donateMessage || undefined,
      });
      
      setDonateModalVisible(false);
      
      // Показываем toast уведомление
      setDonatedAmount(amount);
      setSuccessModalVisible(true);
      
      // Анимация появления
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 60,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(toastAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSuccessModalVisible(false);
      });
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отправить донат');
    } finally {
      setIsDonating(false);
    }
  };

  if (userStats === undefined) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.lime} />
        <Text style={styles.emptyText}>Загрузка профиля...</Text>
      </View>
    );
  }

  const user = {
    username: userStats?.username || 'user',
    firstName: userStats?.firstName || 'Пользователь',
    lastName: userStats?.lastName || '',
    photoUrl: userStats?.photoUrl || null,
    bio: userStats?.bio || '',
    website: userStats?.website || '',
    rating: userStats?.rating || 0,
  };

  const stats = {
    total: userStats?.total || 0,
    completed: userStats?.completed || 0,
    active: userStats?.active || 0,
  };

  const challenges = userChallenges || [];
  const reports = userReports || [];
  const reportsCount = reports.length;

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
        <Text style={styles.headerTitle}>Профиль</Text>
        <View style={styles.placeholder} />
      </View>

    <ScrollView style={styles.content}>
      {/* Profile Header - Компактный */}
      <View style={styles.profileHeader}>
        <View style={styles.profileContent}>
          {/* Аватарка слева */}
          <View style={styles.avatarContainer}>
            <View style={styles.profileAvatar}>
              {renderAvatar(user)}
            </View>
            {/* Рейтинг под аватаркой */}
            <View style={styles.ratingContainer}>
              <StarIcon width={16} height={16} color={colors.gold} />
              <Text style={styles.ratingText}>{user.rating}</Text>
            </View>
          </View>
          
          {/* Информация справа */}
          <View style={styles.profileInfo}>
            <TouchableOpacity onPress={handleCopyProfileLink}>
              <Text style={styles.profileUsername}>@{user.username}</Text>
            </TouchableOpacity>
            
            {user.firstName && (
              <Text style={styles.profileName}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ')}
              </Text>
            )}
            
            {user.bio && (
              <Text style={styles.bioText}>{user.bio}</Text>
            )}
            
            {user.website && (
              <TouchableOpacity>
                <Text style={styles.websiteLink}>
                  {user.website.replace(/^https?:\/\//, '')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsCompact}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statText}>Всего</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statText}>Выполнено</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statText}>Активных</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{reportsCount}</Text>
          <Text style={styles.statText}>Отчётов</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'challenges' && styles.tabBtnActive]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>
            Цели
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'reports' && styles.tabBtnActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            Отчёты
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 'challenges' ? (
          challenges.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>Пока нет целей</Text>
            </View>
          ) : (
            challenges.map((challenge) => (
              <ChallengeCard
                key={challenge._id}
                challenge={challenge}
                variant="full"
                onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge._id, userId: currentUserId })}
              />
            ))
          )
        ) : (
          reports.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>Пока нет отчётов</Text>
            </View>
          ) : (
            reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                currentUserId={currentUserId}
                currentUserBalance={currentUserStats?.balance || 0}
                onDonatePress={handleDonatePress}
              />
            ))
          )
        )}
      </View>
    </ScrollView>
    
    {/* Donate Modal */}
    <Modal
      visible={donateModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setDonateModalVisible(false)}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.modalOverlayTouchable}
          activeOpacity={1}
          onPress={() => setDonateModalVisible(false)}
        >
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Поддержать отчёт</Text>
                <TouchableOpacity onPress={() => setDonateModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Сумма ($)</Text>
                <TextInput
                  style={styles.input}
                  value={donateAmount}
                  onChangeText={setDonateAmount}
                  placeholder="10"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                
                <Text style={styles.inputLabel}>Сообщение (опционально)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={donateMessage}
                  onChangeText={setDonateMessage}
                  placeholder="Отличная работа!"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
                
                <TouchableOpacity 
                  style={[styles.donateButton, isDonating && styles.donateButtonDisabled]}
                  onPress={handleDonateSubmit}
                  disabled={isDonating}
                >
                  {isDonating ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <Text style={styles.donateButtonText}>Отправить донат</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
    
    {/* Success Toast Notification */}
    {successModalVisible && (
      <Animated.View 
        style={[
          styles.successOverlay,
          { transform: [{ translateY: toastAnim }] }
        ]}
      >
        <View style={styles.successToast}>
          <Text style={styles.successIcon}>💚</Text>
          <Text style={styles.successText}>Донат ${donatedAmount} отправлен!</Text>
        </View>
      </Animated.View>
    )}
    
    {/* Copied Toast Notification */}
    {showCopiedToast && (
      <Animated.View 
        style={[
          styles.successOverlay,
          { transform: [{ translateY: copiedToastAnim }] }
        ]}
      >
        <View style={styles.successToast}>
          <Text style={styles.successIcon}>🔗</Text>
          <Text style={styles.successText}>Ссылка скопирована!</Text>
        </View>
      </Animated.View>
    )}
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
  profileHeader: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  profileContent: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  ratingText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gold,
    marginLeft: 4,
  },
  reportsCountContainer: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.2)',
  },
  reportsCountText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.lime,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  profileUsername: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.lime,
  },
  profileName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  bioText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  websiteLink: {
    fontSize: fontSize.sm,
    color: colors.lime,
    marginTop: spacing.xs,
  },
  statsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(26, 46, 39, 0.5)',
    borderRadius: borderRadius.md,
    margin: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  createButtonContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  createButton: {
    backgroundColor: colors.lime,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(26, 31, 38, 0.3)',
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
  contentArea: {
    padding: spacing.sm,
  },
  challengeCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  challengeTitle: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  challengeStake: {
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
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.lime,
  },
  reportContent: {
    fontSize: fontSize.md,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  linkText: {
    fontSize: fontSize.sm,
    color: colors.lime,
    textDecorationLine: 'underline',
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
  reportLink: {
    fontSize: 13,
    color: colors.lime,
    fontWeight: fontWeight.medium,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalOverlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted,
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
  },
  modalBody: {
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  donateButton: {
    backgroundColor: colors.emerald,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  donateButtonDisabled: {
    opacity: 0.6,
  },
  donateButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  successToast: {
    backgroundColor: colors.emerald,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    fontSize: 24,
  },
  successText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  reportStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  reportStat: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
});
