import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Animated, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import TopBar from '../components/TopBar';
import ReportCard from '../components/ReportCard';
import ChallengeCard from '../components/ChallengeCard';

const FeedScreen = forwardRef(({ userId, navigation }: any, ref) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'challenges'>('reports');
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [donatedAmount, setDonatedAmount] = useState(0);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateMessage, setDonateMessage] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [toastAnim] = useState(new Animated.Value(-100));
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  // Загрузка данных из Convex
  const reports = useQuery(api.challenges.listReports) || [];
  const challenges = useQuery(api.challenges.listChallenges) || [];
  const userStats = useQuery(api.users.getUserStats, userId ? { userId } : 'skip');
  
  // Мутация для доната
  const donate = useMutation(api.challenges.donate);
  
  // Используем реальные данные пользователя
  const balance = userStats?.balance || 0;
  const rating = userStats?.rating || 0;

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

  const handleUserPress = (targetUserId: string) => {
    navigation.navigate('UserProfile', { targetUserId, currentUserId: userId });
  };

  // Expose scrollToTop method to parent
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    },
  }));

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <TopBar 
        balance={balance} 
        rating={rating}
        onBalancePress={() => navigation.navigate('AddBalance', { userId })}
        onNotificationsPress={() => navigation.navigate('Notifications', { userId })}
        unreadCount={0}
      />
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'reports' && styles.tabBtnActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            Отчёты
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'challenges' && styles.tabBtnActive]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>
            Все цели
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feed List */}
      <ScrollView ref={scrollViewRef} style={styles.feedList}>
        {activeTab === 'reports' ? (
          reports === undefined ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.lime} />
              <Text style={styles.emptyText}>Загрузка отчётов...</Text>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>Пока нет отчётов</Text>
              <Text style={styles.emptySubtext}>
                Будьте первым, кто опубликует отчёт о прогрессе!
              </Text>
            </View>
          ) : (
            reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                currentUserId={userId}
                currentUserBalance={balance}
                onUserPress={(targetUserId) => navigation.navigate('UserProfile', { targetUserId, currentUserId: userId })}
                onDonatePress={handleDonatePress}
              />
            ))
          )
        ) : challenges === undefined ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.lime} />
            <Text style={styles.emptyText}>Загрузка целей...</Text>
          </View>
        ) : challenges.length === 0 ? (
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
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge._id, userId })}
              onUserPress={(targetUserId) => navigation.navigate('UserProfile', { targetUserId, currentUserId: userId })}
            />
          ))
        )}
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
});

export default FeedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: 50, // Отступ сверху для безопасной зоны
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
  feedList: {
    flex: 1,
    padding: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
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
    marginBottom: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
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
