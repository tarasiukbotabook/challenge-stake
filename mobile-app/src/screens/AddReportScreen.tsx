import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Dropdown } from 'react-native-element-dropdown';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';

export default function AddReportScreen({ navigation, userId }: any) {
  const [challengeId, setChallengeId] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastAnim] = useState(new Animated.Value(-100));

  // Загрузка активных челленджей пользователя
  const userChallenges = useQuery(api.challenges.getUserActiveChallenges, { userId }) || [];
  const createReport = useMutation(api.challenges.createReport);

  const dropdownData = userChallenges.map((c: any) => ({
    label: c.title,
    value: c._id,
  }));

  const pickImage = async () => {
    // Запрашиваем разрешение на доступ к галерее
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
      return;
    }

    // Открываем галерею
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!challengeId || !content) {
      Alert.alert('Ошибка', 'Выберите цель и напишите текст отчёта');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReport({
        userId,
        challengeId: challengeId as any,
        content,
        imageUrl: imageUri || undefined,
      });

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
        setChallengeId('');
        setContent('');
        setImageUri(null);
        navigation.navigate('Feed');
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось опубликовать отчёт');
      console.error('Error creating report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Добавить отчёт</Text>
        </View>

        <View style={styles.form}>
          {userChallenges === undefined ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.lime} />
              <Text style={styles.loadingText}>Загрузка...</Text>
            </View>
          ) : userChallenges.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateTitle}>У вас пока нет активных целей</Text>
              <Text style={styles.emptyStateDescription}>
                Создайте цель, чтобы начать публиковать отчёты о своём прогрессе
              </Text>
              <TouchableOpacity 
                style={styles.createChallengeButton}
                onPress={() => navigation.navigate('CreateChallenge', { userId })}
              >
                <Text style={styles.createChallengeButtonText}>Создать цель</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Выберите цель</Text>
                <Dropdown
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelectedText}
                  itemTextStyle={styles.dropdownItemText}
                  iconStyle={styles.dropdownIcon}
                  data={dropdownData}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Выберите цель..."
                  value={challengeId}
                  onChange={item => setChallengeId(item.value)}
                  activeColor="rgba(190, 242, 100, 0.1)"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Текст отчёта</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Сегодня пробежал 5км! Чувствую себя отлично 💪"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  keyboardAppearance="dark"
                  returnKeyType="default"
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Фото (опционально)</Text>
                {imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={removeImage}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                    <Text style={styles.photoButtonText}>📷 Добавить фото</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Отчёт будет виден всем пользователям в ленте
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.button, isSubmitting && styles.buttonDisabled]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Опубликовать отчёт</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
          <Text style={styles.successIcon}>📝</Text>
          <Text style={styles.successText}>Отчёт опубликован!</Text>
        </View>
      </Animated.View>
    )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    padding: spacing.lg,
    paddingTop: 60, // Отступ для безопасной зоны
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
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
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    height: 50,
  },
  dropdownContainer: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  dropdownPlaceholder: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  dropdownSelectedText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  dropdownItemText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    padding: spacing.sm,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
    tintColor: colors.lime,
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
    height: 120,
    textAlignVertical: 'top',
    paddingTop: spacing.md, // Отступ сверху для текста
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 3,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyStateDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  createChallengeButton: {
    backgroundColor: colors.lime,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  createChallengeButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  photoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: fontWeight.bold,
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
    opacity: 0.5,
  },
  buttonText: {
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
});
