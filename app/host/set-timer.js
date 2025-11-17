import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Switch, TextInput, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SetTimer() {
  const router = useRouter();
  const { sessionName, goals } = useLocalSearchParams();
  const [pomodoro, setPomodoro] = useState('25');
  const [shortBreak, setShortBreak] = useState('5');
  const [longBreak, setLongBreak] = useState('15');
  const [usePomodoro, setUsePomodoro] = useState(false);

  // Calculate total time
  const calculateTotal = () => {
    const pomodoroMin = parseInt(pomodoro) || 0;
    const shortMin = parseInt(shortBreak) || 0;
    const longMin = parseInt(longBreak) || 0;
    
    if (usePomodoro) {
      // 4 pomodoros + 3 short breaks + 1 long break
      return (pomodoroMin * 4) + (shortMin * 3) + longMin;
    } else {
      return pomodoroMin;
    }
  };

  const totalMinutes = calculateTotal();
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const handleNext = () => {
    router.push({ 
      pathname: '/host/invite-mates', 
      params: { 
        sessionName, 
        goals,
        pomodoro, 
        shortBreak, 
        longBreak, 
        usePomodoro: usePomodoro.toString(),
        totalMinutes: totalMinutes.toString()
      } 
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
          <Text style={styles.sectionTitle}>Host a session</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Ionicons name="chevron-back" size={20} color="#FFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.timerCard}>
            <View style={styles.timerRow}>
              <View style={styles.timerColumn}>
                <Text style={styles.timerLabel}>Pomodoro</Text>
                <TextInput
                  style={styles.timerInput}
                  value={pomodoro}
                  onChangeText={setPomodoro}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <Text style={styles.timerUnit}>min</Text>
              </View>

              <View style={styles.timerColumn}>
                <Text style={styles.timerLabel}>Short Break</Text>
                <TextInput
                  style={styles.timerInput}
                  value={shortBreak}
                  onChangeText={setShortBreak}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <Text style={styles.timerUnit}>min</Text>
              </View>
            </View>

            <View style={styles.timerRow}>
              <View style={styles.timerColumn}>
                <Text style={styles.timerLabel}>Long Break</Text>
                <TextInput
                  style={styles.timerInput}
                  value={longBreak}
                  onChangeText={setLongBreak}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <Text style={styles.timerUnit}>min</Text>
              </View>

              <View style={styles.timerColumn}>
                <Text style={styles.timerLabel}>Total</Text>
                <View style={styles.totalDisplay}>
                  <Text style={styles.totalText}>{hours}h {mins}min</Text>
                </View>
              </View>
            </View>

            <View style={styles.pomodoroToggle}>
              <View style={styles.toggleLeft}>
                <Switch
                  value={usePomodoro}
                  onValueChange={setUsePomodoro}
                  trackColor={{ false: '#767577', true: '#FFB84D' }}
                  thumbColor="#FFF"
                />
                <Text style={styles.toggleLabel}>Use Pomodoro sequence:</Text>
              </View>
              <Text style={styles.toggleDescription}>
                Pomodoro → short break, repeat 4x, then one long break
              </Text>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next ›</Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  timerCard: {
    backgroundColor: 'rgba(139, 69, 19, 0.4)',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  timerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  timerLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  timerInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
  },
  timerUnit: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginTop: 4,
  },
  totalDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  pomodoroToggle: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  toggleDescription: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
});
