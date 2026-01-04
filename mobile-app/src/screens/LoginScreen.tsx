import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation, onLogin }: any) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  const registerUser = useMutation(api.users.registerTelegram);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Ошибка', 'Введите имя пользователя');
      return;
    }

    setLoading(true);
    try {
      // Создаём временный telegramId из username
      const telegramId = `mobile_${username.toLowerCase()}`;
      
      // Регистрируем или входим
      const user = await registerUser({
        telegramId,
        username: username.trim(),
        firstName: username.trim(),
      });

      // Сохраняем userId
      await AsyncStorage.setItem('userId', user.id);
      await AsyncStorage.setItem('username', username.trim());
      
      // Вызываем callback
      onLogin(user.id);
      
    } catch (error: any) {
      // Если пользователь уже существует, это нормально
      if (error.message?.includes('уже зарегистрирован')) {
        Alert.alert('Добро пожаловать!', 'Вход выполнен');
        const telegramId = `mobile_${username.toLowerCase()}`;
        await AsyncStorage.setItem('telegramId', telegramId);
        await AsyncStorage.setItem('username', username.trim());
        onLogin(telegramId);
      } else {
        Alert.alert('Ошибка', error.message || 'Не удалось войти');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>🎯</Text>
        <Text style={styles.title}>Challenge Stake</Text>
        <Text style={styles.subtitle}>Достигай целей с денежными ставками</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Имя пользователя</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Введите ваше имя"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Вход...' : 'Войти'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Временная авторизация для тестирования
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1612',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(15, 31, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.3)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#84cc16',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 16,
  },
});
