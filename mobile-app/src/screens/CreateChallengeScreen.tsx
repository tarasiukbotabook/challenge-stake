import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { BackIcon } from '../components/Icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateChallengeScreen({ navigation, route }: any) {
  const { userId } = route?.params || {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('health');
  const [stakeAmount, setStakeAmount] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // +30 дней
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<{ currentBalance?: number; requiredAmount?: number } | null>(null);
  const [toastAnim] = useState(new Animated.Value(-100));
  const [errorToastAnim] = useState(new Animated.Value(-100));

  const createChallenge = useMutation(api.challenges.create);

  const handleCreate = async () => {
    if (!userId) {
      setErrorMessage('Не удалось определить пользователя');
      showErrorToastNotification();
      return;
    }

    if (!title || !description || !stakeAmount) {
      setErrorMessage('Заполните все обязательные поля');
      showErrorToastNotification();
      return;
    }

    // Проверка минимальной длины названия
    if (title.trim().length < 10) {
      setErrorMessage('Название цели должно содержать минимум 10 символов');
      showErrorToastNotification();
      return;
    }

    // Проверка минимальной длины описания
    if (description.trim().length < 20) {
      setErrorMessage('Описание цели должно содержать минимум 20 символов');
      showErrorToastNotification();
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Введите корректную сумму ставки');
      showErrorToastNotification();
      return;
    }

    setIsCreating(true);

    try {
      const result = await createChallenge({
        userId: userId,
        title: title.trim(),
        description: description.trim(),
        stakeAmount: amount,
        deadline: deadline.toISOString(),
        category: category,
      });

      // Проверяем результат
      if (!result.success) {
        if (result.error === "Недостаточно средств на балансе") {
          setErrorMessage(`На балансе $${result.currentBalance}. Нужно $${result.requiredAmount}`);
          setErrorDetails({ currentBalance: result.currentBalance, requiredAmount: result.requiredAmount });
        } else {
          setErrorMessage(result.error || 'Не удалось создать цель');
          setErrorDetails(null);
        }
        showErrorToastNotification();
        return;
      }

      // Показываем toast уведомление
      setShowSuccessToast(true);
      
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
        setShowSuccessToast(false);
        navigation.goBack();
      });
    } catch (error: any) {
      setErrorMessage(error.message || 'Не удалось создать цель');
      setErrorDetails(null);
      showErrorToastNotification();
    } finally {
      setIsCreating(false);
    }
  };

  const showErrorToastNotification = () => {
    setShowErrorToast(true);
    
    Animated.sequence([
      Animated.timing(errorToastAnim, {
        toValue: 60,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(errorToastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowErrorToast(false);
      setErrorDetails(null);
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const categories = [
    { value: 'health', label: '🏃 Здоровье и спорт' },
    { value: 'learning', label: '📚 Обучение' },
    { value: 'business', label: '💼 Бизнес' },
    { value: 'habits', label: '🎯 Привычки' },
    { value: 'creative', label: '🎨 Творчество' },
    { value: 'other', label: '📌 Другое' },
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={() => navigation.goBack()}>
          <BackIcon color={colors.lime} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новый цель</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Название цели</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Пробежать 50км за месяц (минимум 10 символов)"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.hint}>Минимум 10 символов</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Что именно нужно сделать? (минимум 20 символов)"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.hint}>Минимум 20 символов</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Категория</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryBtn,
                  category === cat.value && styles.categoryBtnActive,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.value && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Сумма ставки ($)</Text>
          <TextInput
            style={styles.input}
            value={stakeAmount}
            onChangeText={setStakeAmount}
            placeholder="10"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Дедлайн</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDate(deadline)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Если не выполните цель до дедлайна, деньги уйдут на благотворительность
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, isCreating && styles.buttonDisabled]} 
          onPress={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Создать и заморозить ставку</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    
    {/* Success Toast Notification */}
    {showSuccessToast && (
      <Animated.View 
        style={[
          styles.successOverlay,
          { transform: [{ translateY: toastAnim }] }
        ]}
      >
        <View style={styles.successToast}>
          <Text style={styles.successIcon}>🎯</Text>
          <Text style={styles.successText}>Цель создана!</Text>
        </View>
      </Animated.View>
    )}
    
    {/* Error Toast Notification */}
    {showErrorToast && (
      <Animated.View 
        style={[
          styles.errorOverlay,
          { transform: [{ translateY: errorToastAnim }] }
        ]}
      >
        <View style={styles.errorToast}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          {errorDetails && (
            <TouchableOpacity 
              style={styles.topUpButton}
              onPress={() => {
                setShowErrorToast(false);
                navigation.navigate('AddBalance', { userId });
              }}
            >
              <Text style={styles.topUpButtonText}>Пополнить баланс</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: 50, // Отступ сверху для безопасной зоны
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  btnBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  form: {
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryBtnActive: {
    backgroundColor: 'rgba(132, 204, 22, 0.2)',
    borderColor: colors.border,
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.lime,
    fontWeight: fontWeight.medium,
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.lime,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#000',
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  dateButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
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
    backgroundColor: colors.lime,
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
    color: '#000',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  errorToast: {
    backgroundColor: '#ff6b35',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: spacing.md,
    minWidth: 280,
  },
  errorText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  topUpButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'center',
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  topUpButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
});
