import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.username}>@username</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Статистика</Text>
        <Text style={styles.text}>Здесь будет статистика пользователя</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1612',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(132, 204, 22, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
