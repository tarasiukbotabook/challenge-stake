import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';
import { BackIcon } from '../components/Icons';

export default function EditProfileScreen({ navigation, route }: any) {
  const { userId } = route.params;
  const user = useQuery(api.users.getUserStats, userId ? { userId } : 'skip');
  const updateProfile = useMutation(api.users.updateProfile);
  
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setWebsite(user.website || '');
      setPhotoUrl(user.photoUrl || '');
      // Объединяем firstName и lastName в одно поле
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
      setFirstName(fullName);
      setUsername(user.username || '');
    }
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    // Сбрасываем ошибку
    setUsernameError('');
    
    // Проверка на пустые обязательные поля
    if (!username.trim()) {
      setUsernameError('Имя пользователя не может быть пустым');
      return;
    }

    // Проверка формата username (только буквы, цифры и подчеркивание)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Только буквы, цифры и подчеркивание');
      return;
    }
    
    setIsSaving(true);
    try {
      // Разделяем имя и фамилию
      const nameParts = firstName.trim().split(/\s+/);
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || undefined;

      const result = await updateProfile({
        userId,
        bio: bio || undefined,
        website: website || undefined,
        photoUrl: photoUrl || undefined,
        firstName: first || undefined,
        lastName: last,
        username: username,
      });
      
      if (result.success) {
        navigation.goBack();
      } else if (result.error) {
        setUsernameError(result.error);
      }
    } catch (error: any) {
      // Обрабатываем только критические ошибки
      setUsernameError('Произошла ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAvatar = () => {
    if (photoUrl) {
      return <Image source={{ uri: photoUrl }} style={styles.avatarImage} />;
    }
    const initial = (user?.firstName || user?.username || 'U').charAt(0).toUpperCase();
    return <Text style={styles.avatarText}>{initial}</Text>;
  };

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.lime} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon color={colors.lime} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Редактировать профиль</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.lime} />
          ) : (
            <Text style={styles.saveButtonText}>Готово</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {renderAvatar()}
          </View>
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={pickImage}
          >
            <Text style={styles.changePhotoText}>Изменить фото</Text>
          </TouchableOpacity>
        </View>

        {/* Username Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Имя пользователя</Text>
          <TextInput
            style={[styles.input, usernameError && styles.inputError]}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setUsernameError(''); // Сбрасываем ошибку при вводе
            }}
            placeholder="username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : (
            <Text style={styles.hint}>Только буквы, цифры и подчеркивание</Text>
          )}
        </View>

        {/* First Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Иван Иванов"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.hint}>Имя и фамилия</Text>
        </View>

        {/* Bio Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Расскажите о себе..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.hint}>{bio.length}/200 символов</Text>
        </View>

        {/* Link Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Ссылка</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.hint}>Добавьте ссылку на ваш сайт или соцсети</Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.lime,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  changePhotoButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  changePhotoText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.lime,
  },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.bgSecondary,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  label: {
    fontSize: fontSize.sm,
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
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1.5,
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
  errorText: {
    fontSize: fontSize.xs,
    color: '#ef4444',
    marginTop: spacing.xs,
  },
  bottomSpace: {
    height: 100,
  },
});
