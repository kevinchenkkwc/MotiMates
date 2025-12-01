import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, TextInput, Keyboard, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SetTimer() {
  const router = useRouter();
  const { sessionName, goals, isPublic } = useLocalSearchParams();
  const [pomodoro, setPomodoro] = useState('25');
  const [shortBreak, setShortBreak] = useState('5');
  const [longBreak, setLongBreak] = useState('15');
  const [usePomodoro, setUsePomodoro] = useState(false);
  const [mode, setMode] = useState('uninterrupted'); // 'uninterrupted' or 'pomodoro'
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateTime = (value, fieldName) => {
    const num = parseInt(value) || 0;
    if (num < 1 || num > 180) {
      setErrorMessage(`${fieldName} must be between 1 and 180 minutes`);
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      return false;
    }
    return true;
  };

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
    const primaryLabel = mode === 'uninterrupted' ? 'Session length' : 'Pomodoro time';
    if (!validateTime(pomodoro, primaryLabel)) return;

    if (mode === 'pomodoro') {
      if (!validateTime(shortBreak, 'Short break')) return;
      if (!validateTime(longBreak, 'Long break')) return;
    }

    router.push({ 
      pathname: '/host/invite-mates', 
      params: { 
        sessionName, 
        goals,
        pomodoro, 
        shortBreak, 
        longBreak, 
        usePomodoro: usePomodoro.toString(),
        totalMinutes: totalMinutes.toString(),
        isPublic: isPublic || 'true',
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
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'uninterrupted' && styles.modeTabActive]}
                onPress={() => {
                  setMode('uninterrupted');
                  setUsePomodoro(false);
                }}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    mode === 'uninterrupted' && styles.modeTabTextActive,
                  ]}
                >
                  Uninterrupted
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, mode === 'pomodoro' && styles.modeTabActive]}
                onPress={() => {
                  setMode('pomodoro');
                  setUsePomodoro(true);
                }}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    mode === 'pomodoro' && styles.modeTabTextActive,
                  ]}
                >
                  Pomodoro
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modeCaption}>
              {mode === 'uninterrupted'
                ? 'One continuous focus block with no scheduled breaks.'
                : 'Structured focus with short and long breaks built in.'}
            </Text>

            {mode === 'uninterrupted' ? (
              <View>
                <View style={styles.timerRow}>
                  <View style={styles.timerColumn}>
                    <Text style={styles.timerLabel}>Session length</Text>
                    <Text style={styles.timerHelper}>Uninterrupted minutes</Text>
                    <TextInput
                      style={styles.timerInput}
                      value={pomodoro}
                      onChangeText={setPomodoro}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>

                  <View style={styles.timerColumn}>
                    <Text style={styles.timerLabel}>Total</Text>
                    <Text style={styles.timerHelper}>Time in session</Text>
                    <View style={styles.totalDisplay}>
                      <Text style={styles.totalText}>{hours}h {mins}min</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.timerRow}>
                  <View style={styles.timerColumn}>
                    <Text style={styles.timerLabel}>Pomodoro</Text>
                    <Text style={styles.timerHelper}>Work session</Text>
                    <TextInput
                      style={styles.timerInput}
                      value={pomodoro}
                      onChangeText={setPomodoro}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>

                  <View style={styles.timerColumn}>
                    <Text style={styles.timerLabel}>Short Break</Text>
                    <Text style={styles.timerHelper}>Quick rest</Text>
                    <TextInput
                      style={styles.timerInput}
                      value={shortBreak}
                      onChangeText={setShortBreak}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                </View>

                <View style={styles.timerRow}>
                  <View style={styles.timerColumn}>
                    <Text style={styles.timerLabel}>Long Break</Text>
                    <Text style={styles.timerHelper}>Extended rest</Text>
                    <TextInput
                      style={styles.timerInput}
                      value={longBreak}
                      onChangeText={setLongBreak}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>

                  <View style={styles.timerColumn}>
                    <Text style={styles.timerLabel}>Total</Text>
                    <Text style={styles.timerHelper}>Session length</Text>
                    <View style={styles.totalDisplay}>
                      <Text style={styles.totalText}>{hours}h {mins}min</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.pomodoroToggle}>
                  <Text style={styles.toggleDescription}>
                    4 focus blocks with short breaks, then one long break to reset.
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next ›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal transparent visible={showError} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          </View>
        </Modal>
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
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
    width: '100%',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  modeTabText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modeTabTextActive: {
    color: '#8B1E1E',
  },
  modeCaption: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 16,
    textAlign: 'center',
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
    marginBottom: 2,
  },
  timerHelper: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 260,
    maxWidth: 320,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B71C1C',
    textAlign: 'center',
  },
});
