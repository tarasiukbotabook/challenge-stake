import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Animated, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { BackIcon, CheckIcon, DoubleCheckIcon, XIcon } from '../components/Icons';
import ReportCard from '../components/ReportCard';

export default function ChallengeDetailScreen({ navigation, route }: any) {
  const { challengeId, userId } = route.params;
  
  // Если параметры не переданы, показываем ошибку
  if (!challengeId || !userId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Ошибка загрузки цели</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 12, backgroundColor: colors.lime, borderRadius: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [donatedAmount, setDonatedAmount] = useState(0);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateMessage, setDonateMessage] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [toastAnim] = useState(new Animated.Value(-100));
  
  // Загрузка данных цели
  const challenge = useQuery(api.challenges.getById, challengeId ? { challengeId } : 'skip');
  const reports = useQuery(api.challenges.getChallengeReports, challengeId ? { challengeId } : 'skip');
  const userStats = useQuery(api.users.getUserStats, userId ? { userId } : 'skip');
  
  // Мутация для доната
  const donate = useMutation(api.challenges.donate);
  
  const balance = userStats?.balance || 0;

  const handleDonatePress = (report: any) => {
    setSelectedReport(report);
    setDonateAmount('');
    setDonateMessage('');
    setDonateModalVisible(true);
  };

  const handleDonateSubmit = async () => {
    if (!userId || !selectedReport) return;
    
    const amount = parseFloat(donateAmount);
    
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
        donorUserId: userId,
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

  const renderAvatar = (user: any) => {
    if (user?.photoUrl) {
      return <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />;
    }
    const initial = (user?.firstName || user?.username || 'U').charAt(0).toUpperCase();
    return <Text style={styles.avatarText}>{initial}</Text>;
  };

  const renderStatusIcon = () => {
    if (challenge?.status === 'active') {
      return <CheckIcon width={24} height={24} color="#10b981" />;
    }
    if (challenge?.status === 'completed') {
      return <DoubleCheckIcon width={24} height={24} color="#10b981" />;
    }
    return <XIcon width={24} height={24} color="#ef4444" />;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
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

  if (challenge === undefined) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.lime} />
        <Text style={styles.emptyText}>Загрузка...</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Цель не найдена</Text>
      </View>
    );
  }

  const timeRemaining = getTimeRemaining(challenge.deadline);

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
        <Text style={styles.headerTitle}>Цель</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Challenge Info */}
        <View style={styles.challengeHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {renderAvatar(challenge)}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>@{challenge.username}</Text>
              <Text style={styles.date}>Создана {formatDate(challenge._creationTime)}</Text>
            </View>
          </View>

          <View style={styles.titleContainer}>
            {renderStatusIcon()}
            <Text style={styles.title}>{challenge.title}</Text>
          </View>
          
          {challenge.description && (
            <Text style={styles.description}>{challenge.description}</Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Ставка</Text>
                <Text style={styles.statValue}>${challenge.stakeAmount}</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Донаты</Text>
                <Text style={styles.statValue}>${challenge.donationsAmount || 0}</Text>
              </View>
            </View>
            
            <View style={styles.timeRemainingBox}>
              <Text style={styles.timeRemainingLabel}>Осталось до конца:</Text>
              <Text style={[styles.timeRemainingValue, { color: timeRemaining.color }]}>
                {timeRemaining.text}
              </Text>
            </View>
          </View>


        </View>

        {/* Reports */}
        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>Отчёты ({reports?.length || 0})</Text>
          
          {reports === undefined ? (
            <ActivityIndicator size="large" color={colors.lime} />
          ) : reports.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>Пока нет отчётов</Text>
            </View>
          ) : (
            reports.map((report: any) => (
              <ReportCard
                key={report._id}
                report={report}
                currentUserId={userId}
                currentUserBalance={balance}
                onDonatePress={handleDonatePress}
              />
            ))
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
  challengeHeader: {
    padding: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 20,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.lime,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(26, 46, 39, 0.5)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.emerald,
  },
  timeRemainingBox: {
    backgroundColor: 'rgba(26, 46, 39, 0.5)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  timeRemainingLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 4,
  },
  timeRemainingValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  reportsSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reportDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  reportVotes: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  voteText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  reportContent: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 20,
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
    marginTop: spacing.sm,
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
  btnMenu: {
    padding: spacing.xs,
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
  voteCount: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  voteCountActive: {
    color: colors.lime,
    fontWeight: fontWeight.bold,
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
});
