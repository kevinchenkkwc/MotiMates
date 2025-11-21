import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function SessionWait() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    sessionName,
    goals,
    totalMinutes,
    pomodoro,
    shortBreak,
    longBreak,
    usePomodoro,
    mode,
    isPublic,
    participants,
  } = params;

  let goalsList = [];
  let rawGoals = goals;

  if (goals) {
    try {
      const decoded = decodeURIComponent(goals);
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed)) {
        goalsList = parsed;
      } else {
        rawGoals = decoded;
      }
    } catch (e) {
      rawGoals = goals;
    }
  }

  const minutes = totalMinutes ? parseInt(totalMinutes) || 0 : 0;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const durationText = minutes
    ? `${hours > 0 ? `${hours}h ` : ''}${mins}min`
    : 'Custom length';

  const pomodoroOn = String(usePomodoro) === 'true';

  const handleStart = () => {
    router.push({
      pathname: '/session/active',
      params: {
        sessionName,
        goals,
        totalMinutes: totalMinutes || '0',
        isPublic: isPublic || 'true',
        participants: participants || '',
        pomodoro: pomodoro || '',
        shortBreak: shortBreak || '',
        longBreak: longBreak || '',
        usePomodoro: usePomodoro || 'false',
      },
    });
  };

  const isHost = mode === 'host';

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
          <Text style={styles.caption}>{isHost ? 'Host a session' : 'Joining session'}</Text>
          <Text style={styles.title}>{sessionName || 'Co-focus session'}</Text>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Session type</Text>
              <Text style={styles.value}>{isPublic === 'true' ? 'Public' : 'Private'}</Text>
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.label}>Session length</Text>
              <Text style={styles.value}>{durationText}</Text>
            </View>

            {pomodoroOn && (
              <View style={styles.pomodoroBlock}>
                <View style={styles.pomodoroHeader}>
                  <MaterialCommunityIcons name="timer-sand" size={20} color="#000" />
                  <Text style={styles.pomodoroTitle}>Pomodoro schedule</Text>
                </View>
                <Text style={styles.pomodoroText}>
                  4 × {pomodoro || '25'} min focus{"\n"}
                  3 × {shortBreak || '5'} min short break{"\n"}
                  1 × {longBreak || '15'} min long break
                </Text>
              </View>
            )}

            {goalsList.length > 0 ? (
              <View style={styles.goalsBlock}>
                <Text style={styles.label}>Your focus goals</Text>
                {goalsList.map((goal) => (
                  <Text key={goal.id} style={styles.goalsText}>
                    • {goal.text}
                  </Text>
                ))}
              </View>
            ) : rawGoals ? (
              <View style={styles.goalsBlock}>
                <Text style={styles.label}>Your focus goals</Text>
                <Text style={styles.goalsText}>{rawGoals}</Text>
              </View>
            ) : null}

            <View style={styles.blockedAppsBlock}>
              <Text style={styles.label}>Blocked apps this session</Text>
              <View style={styles.appChipsRow}>
                <View style={styles.appChip}>
                  <Text style={styles.appChipText}>Instagram</Text>
                </View>
                <View style={styles.appChip}>
                  <Text style={styles.appChipText}>TikTok</Text>
                </View>
                <TouchableOpacity 
                  style={styles.appChipMuted}
                  onPress={() => router.push('/blocked-apps')}
                >
                  <Text style={styles.appChipTextMuted}>+ Manage</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.readyText}>Are you ready?</Text>

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>
              {isHost ? "I'm ready – Start session" : 'Join session'}
            </Text>
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
    paddingTop: 10,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  value: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
  },
  pomodoroBlock: {
    marginBottom: 16,
  },
  pomodoroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pomodoroTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  pomodoroText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  goalsBlock: {
    marginTop: 8,
    marginBottom: 16,
  },
  goalsText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  blockedAppsBlock: {
    marginTop: 4,
  },
  appChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  appChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#000',
  },
  appChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#FFF',
  },
  appChipMuted: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEE',
  },
  appChipTextMuted: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  readyText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B1E1E',
  },
});
