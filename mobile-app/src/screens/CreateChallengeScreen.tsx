import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

export default function CreateChallengeScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');

  const handleCreate = () => {
    if (!title || !description || !stakeAmount) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    // TODO: Implement challenge creation
    Alert.alert('Успех', 'Челлендж создан!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Название</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Например: Пробежать 5км каждый день"
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
        />

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Подробное описание челленджа"
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Ставка ($)</Text>
        <TextInput
          style={styles.input}
          value={stakeAmount}
          onChangeText={setStakeAmount}
          placeholder="100"
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Создать челлендж</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1612',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(15, 31, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.3)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#84cc16',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
