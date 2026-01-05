import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/theme';

interface StoryTemplateProps {
  challenge: any;
  storyRef: any;
}

export default function StoryTemplate({ challenge, storyRef }: StoryTemplateProps) {
  return (
    <View ref={storyRef} style={styles.storyCanvas} collapsable={false}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.storyBackground}
      >
        {/* Декоративные линии на фоне */}
        <View style={styles.decorativeLines}>
          <View style={[styles.line, styles.line1]} />
          <View style={[styles.line, styles.line2]} />
          <View style={[styles.line, styles.line3]} />
          <View style={[styles.line, styles.line4]} />
        </View>
        
        {/* Контент сторис */}
        <View style={styles.storyContent}>
          <Text style={styles.storyLogo}>POFACTU</Text>
          
          <View style={styles.storyMain}>
            <Text style={styles.storyEmoji}>🎯</Text>
            
            {/* Имя и фамилия */}
            <Text style={styles.storyName}>
              {challenge.firstName || ''} {challenge.lastName || ''}
            </Text>
            
            {/* Текст "поставил себе цель" */}
            <Text style={styles.storyAction}>поставил себе цель</Text>
            
            {/* Название цели */}
            <Text style={styles.storyTitle}>{challenge.title}</Text>
            
            {/* Детали */}
            <View style={styles.storyDetails}>
              <View style={styles.storyDetailItem}>
                <Text style={styles.storyDetailLabel}>ДЕДЛАЙН</Text>
                <Text style={styles.storyDetailValue}>
                  {new Date(challenge.deadline).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              
              <View style={styles.storyDetailItem}>
                <Text style={styles.storyDetailLabel}>СТАВКА</Text>
                <Text style={styles.storyDetailValue}>${challenge.stakeAmount}</Text>
              </View>
            </View>
            
            <Text style={styles.storyUsername}>@{challenge.username}</Text>
          </View>
          
          <Text style={styles.storyFooter}>Следи за моим прогрессом на POFACTU!</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  storyCanvas: {
    width: 1080,
    height: 1920,
    transform: [{ scale: 0.2 }],
  },
  storyBackground: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  decorativeLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  line: {
    position: 'absolute',
    backgroundColor: colors.lime,
    borderRadius: 10,
  },
  line1: {
    width: 400,
    height: 8,
    top: 200,
    left: -100,
    transform: [{ rotate: '45deg' }],
  },
  line2: {
    width: 300,
    height: 6,
    top: 500,
    right: -50,
    transform: [{ rotate: '-30deg' }],
  },
  line3: {
    width: 500,
    height: 8,
    bottom: 400,
    left: -150,
    transform: [{ rotate: '-45deg' }],
  },
  line4: {
    width: 350,
    height: 6,
    bottom: 200,
    right: -100,
    transform: [{ rotate: '30deg' }],
  },
  storyContent: {
    flex: 1,
    padding: 80,
    paddingTop: 120,
    paddingBottom: 200,
    justifyContent: 'space-between',
  },
  storyLogo: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.lime,
    letterSpacing: 3,
    textAlign: 'center',
  },
  storyMain: {
    alignItems: 'center',
    gap: 50,
  },
  storyEmoji: {
    fontSize: 140,
  },
  storyName: {
    fontSize: 80,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  storyAction: {
    fontSize: 48,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  storyTitle: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.lime,
    textAlign: 'center',
    lineHeight: 88,
    marginTop: 30,
    paddingHorizontal: 60,
  },
  storyDetails: {
    flexDirection: 'row',
    gap: 80,
    marginTop: 60,
  },
  storyDetailItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(132, 204, 22, 0.08)',
    paddingVertical: 40,
    paddingHorizontal: 60,
    borderRadius: 25,
    minWidth: 300,
  },
  storyDetailLabel: {
    fontSize: 32,
    color: colors.textSecondary,
    marginBottom: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
  storyDetailValue: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.lime,
  },
  storyUsername: {
    fontSize: 52,
    color: colors.lime,
    fontWeight: '700',
    marginTop: 50,
  },
  storyFooter: {
    fontSize: 38,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 48,
  },
});
