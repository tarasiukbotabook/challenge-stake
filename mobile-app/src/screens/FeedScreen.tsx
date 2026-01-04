import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function FeedScreen() {
  // Временно отключаем для тестирования UI
  const reports = null; // useQuery(api.challenges.getAllReports, {});

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Лента отчётов</Text>
      <Text style={styles.emptyText}>Пока нет отчётов</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1612',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  reportCard: {
    backgroundColor: 'rgba(15, 31, 26, 0.8)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  reportUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d4af37',
    marginBottom: 4,
  },
  reportChallenge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  reportContent: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  reportStats: {
    flexDirection: 'row',
    gap: 16,
  },
  reportStat: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    padding: 20,
  },
});
