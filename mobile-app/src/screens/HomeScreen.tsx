import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export default function HomeScreen({ navigation }: any) {
  // TODO: Implement authentication
  // Временно отключаем Convex queries для тестирования UI
  const challenges = null; // useQuery(api.challenges.getMy, { userId });
  const stats = null; // useQuery(api.users.getUserStats, { userId });

  // Моковые данные для тестирования
  const mockStats = {
    balance: 1000,
    activeChallenges: 3,
    completedChallenges: 5,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Challenge Stake</Text>
        <Text style={styles.subtitle}>Достигай целей с денежными ставками</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${mockStats.balance}</Text>
          <Text style={styles.statLabel}>Баланс</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{mockStats.activeChallenges}</Text>
          <Text style={styles.statLabel}>Активных</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{mockStats.completedChallenges}</Text>
          <Text style={styles.statLabel}>Выполнено</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('CreateChallenge')}
        >
          <Text style={styles.buttonText}>➕ Создать челлендж</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Feed')}
        >
          <Text style={styles.buttonText}>📱 Лента отчётов</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.buttonText}>👤 Мой профиль</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Challenges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Мои челленджи</Text>
        <Text style={styles.emptyText}>Пока нет челленджей</Text>
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statCard: {
    backgroundColor: 'rgba(15, 31, 26, 0.8)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#84cc16',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#84cc16',
  },
  secondaryButton: {
    backgroundColor: 'rgba(132, 204, 22, 0.2)',
    borderWidth: 1,
    borderColor: '#84cc16',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: 'rgba(15, 31, 26, 0.8)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  challengeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  challengeStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'capitalize',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    padding: 20,
  },
});
