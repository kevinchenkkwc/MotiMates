import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ShareCode() {
  const router = useRouter();
  const { sessionId, sessionName, inviteCode, goals, totalMinutes, pomodoro, shortBreak, longBreak, usePomodoro, isPublic } = useLocalSearchParams();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my MotiMates session "${sessionName}"!\n\nInvite Code: ${inviteCode}\n\nEnter this code in the Join tab to get started.`,
      });
    } catch (e) {
      // Share cancelled or failed
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: '/session/lobby',
      params: {
        sessionId,
        sessionName,
        goals,
        totalMinutes,
        pomodoro,
        shortBreak,
        longBreak,
        usePomodoro,
        isPublic,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>Session Created!</Text>
            <Text style={styles.subtitle}>{sessionName}</Text>

            <Text style={styles.label}>Share this code with your mates:</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#FFF" style={styles.shareIcon} />
              <Text style={styles.shareButtonText}>Share Invite Code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue to Session</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#8B1E1E',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    color: '#8B1E1E',
    letterSpacing: 4,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
  },
  continueButton: {
    backgroundColor: '#8B1E1E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
  },
});
