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
  ScrollView,
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation, onLogin }: any) {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const registerByPhone = useMutation(api.users.registerByPhone);

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  const handleRegister = async () => {
    const cleanPhone = formatPhone(phone);
    
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Ошибка', 'Введите имя пользователя');
      return;
    }

    if (!firstName.trim()) {
      Alert.alert('Ошибка', 'Введите ваше имя');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    try {
      const user = await registerByPhone({
        phone: cleanPhone,
        username: username.trim(),
        firstName: firstName.trim(),
        password: password,
      });

      console.log('Registration response:', user);
      console.log('User ID:', user?.id);
      console.log('User ID type:', typeof user?.id);

      if (user && user.id) {
        const userId = String(user.id);
        console.log('Converted userId:', userId);
        await AsyncStorage.setItem('userId', userId);
        await AsyncStorage.setItem('username', username.trim());
        await AsyncStorage.setItem('phone', cleanPhone);
        
        onLogin(userId);
      } else {
        console.error('User object:', JSON.stringify(user));
        throw new Error('Не удалось получить данные пользователя');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Красивые сообщения об ошибках
      let errorMessage = 'Не удалось зарегистрироваться';
      
      if (error.message?.includes('уже существует')) {
        errorMessage = 'Пользователь с таким номером телефона уже существует';
      } else if (error.message?.includes('уже занято')) {
        errorMessage = 'Это имя пользователя уже занято';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Ошибка регистрации', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const cleanPhone = formatPhone(phone);
    
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }

    if (!password) {
      Alert.alert('Ошибка', 'Введите пароль');
      return;
    }

    setLoading(true);
    try {
      // Используем query через fetch
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_CONVEX_URL}/api/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'users:loginByPhone',
            args: { phone: cleanPhone, password: password },
          }),
        }
      );

      const result = await response.json();
      
      console.log('Login response:', result);
      
      // Проверяем на ошибку в ответе
      if (result.status === 'error' || result.errorMessage) {
        const errorMsg = result.errorMessage || 'Ошибка авторизации';
        
        // Извлекаем читаемое сообщение из errorMessage
        if (errorMsg.includes('Неверный пароль')) {
          throw new Error('Неверный пароль');
        } else if (errorMsg.includes('не найден')) {
          throw new Error('Пользователь не найден');
        } else {
          throw new Error(errorMsg);
        }
      }
      
      if (result.error) {
        throw new Error(result.error.message || 'Ошибка авторизации');
      }

      const user = result.value;

      if (user && user.id) {
        const userId = String(user.id);
        console.log('Converted userId:', userId);
        await AsyncStorage.setItem('userId', userId);
        await AsyncStorage.setItem('username', user.username);
        await AsyncStorage.setItem('phone', cleanPhone);
        
        onLogin(userId);
      } else {
        console.error('User object:', JSON.stringify(user));
        throw new Error('Не удалось получить данные пользователя');
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Красивые сообщения об ошибках
      let errorMessage = 'Не удалось войти';
      
      if (error.message?.includes('не найден')) {
        errorMessage = 'Пользователь с таким номером не найден';
      } else if (error.message?.includes('Неверный пароль')) {
        errorMessage = 'Неверный пароль';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Ошибка входа', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.logo}>🎯</Text>
          <Text style={styles.title}>Challenge Stake</Text>
          <Text style={styles.subtitle}>Достигай целей с денежными ставками</Text>

          {/* Toggle между входом и регистрацией */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !isRegister && styles.toggleButtonActive]}
              onPress={() => setIsRegister(false)}
            >
              <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>
                Вход
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isRegister && styles.toggleButtonActive]}
              onPress={() => setIsRegister(true)}
            >
              <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>
                Регистрация
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Номер телефона</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+7 (999) 123-45-67"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {isRegister && (
              <>
                <Text style={styles.label}>Имя пользователя</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.label}>Ваше имя</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Иван"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  autoCorrect={false}
                />
              </>
            )}

            <Text style={styles.label}>Пароль</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={isRegister ? "Минимум 6 символов" : "Введите пароль"}
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? (isRegister ? 'Регистрация...' : 'Вход...') : (isRegister ? 'Зарегистрироваться' : 'Войти')}
              </Text>
            </TouchableOpacity>

            {isRegister && (
              <Text style={styles.hint}>
                Подтверждение по SMS будет добавлено позже
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1612',
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 30,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 31, 26, 0.8)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#84cc16',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  toggleTextActive: {
    color: '#fff',
  },
  form: {
    marginTop: 10,
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
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#84cc16',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
