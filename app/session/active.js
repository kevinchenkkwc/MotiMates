import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';

export default function ActiveSession() {
  const router = useRouter();
  const { sessionName, goals, totalMinutes } = useLocalSearchParams();
  
  const initialSeconds = totalMinutes ? parseInt(totalMinutes) * 60 : 2670;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/session/summary');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkip = () => {
    router.push('/session/summary');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text style={styles.title}>In Session</Text>
          <Text style={styles.subtitle}>{sessionName || "WE'RE LOCKED IN"}</Text>

          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Focus Goals</Text>
            <View style={styles.goalCard}>
              <Text style={styles.goalText}>{goals || "• Stay focused\n• Complete your tasks"}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Participants</Text>
            <View style={styles.participantsRow}>
              <View style={styles.participant}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>K</Text>
                </View>
                <Text style={styles.participantName}>Kevin</Text>
              </View>
              <View style={styles.participant}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>D</Text>
                </View>
                <Text style={styles.participantName}>Derek</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>DEV SKIP</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B4513',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 69, 19, 0.7)',
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  goalText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    marginBottom: 4,
  },
  participantsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  participant: {
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  participantName: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  skipButton: {
    backgroundColor: '#FFB84D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
  },
});
