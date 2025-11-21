import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ActiveSession() {
  const router = useRouter();
  const {
    sessionName,
    goals,
    totalMinutes,
    exitDeclined,
    isPublic,
    participants,
    pomodoro,
    shortBreak,
    longBreak,
    usePomodoro,
  } = useLocalSearchParams();
  
  const initialSeconds = totalMinutes ? parseInt(totalMinutes) * 60 : 2670;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  let initialGoalItems = [];
  let rawGoals = goals;

  if (goals) {
    try {
      const decoded = decodeURIComponent(goals);
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed)) {
        initialGoalItems = parsed;
      } else {
        rawGoals = decoded;
      }
    } catch (e) {
      rawGoals = goals;
    }
  }

  const [goalItems, setGoalItems] = useState(initialGoalItems);
  const [started, setStarted] = useState(false);

  let participantsList = [];
  if (participants) {
    try {
      const decoded = decodeURIComponent(participants);
      participantsList = JSON.parse(decoded);
    } catch (e) {
      participantsList = [];
    }
  }

  if (!participantsList || participantsList.length === 0) {
    participantsList = [
      { name: 'Kevin', avatar: 'K' },
      { name: 'Derek', avatar: 'D' },
    ];
  }

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push({
            pathname: '/session/summary',
            params: {
              sessionName,
              totalMinutes: totalMinutes?.toString() || '0',
              goals: buildGoalsParam(),
            },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleGoal = (id) => {
    setGoalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const buildGoalsParam = () => {
    if (goalItems && goalItems.length > 0) {
      try {
        return encodeURIComponent(JSON.stringify(goalItems));
      } catch (e) {
        // fall through
      }
    }
    return rawGoals || '';
  };

  const handleSkip = () => {
    router.push({
      pathname: '/session/summary',
      params: {
        sessionName,
        totalMinutes: totalMinutes?.toString() || '0',
        goals: buildGoalsParam(),
      },
    });
  };

  const handleRequestExit = () => {
    router.push({
      pathname: '/session/request-exit',
      params: {
        sessionName,
        totalMinutes: totalMinutes?.toString() || '0',
        goals: buildGoalsParam(),
      },
    });
  };

  const pomodoroOn = String(usePomodoro) === 'true';

  let currentPhaseLabel = null;
  let nextPhaseLabel = null;

  if (pomodoroOn && pomodoro && shortBreak && longBreak) {
    const focusMin = parseInt(pomodoro) || 25;
    const shortMin = parseInt(shortBreak) || 5;
    const longMin = parseInt(longBreak) || 15;

    const segments = [
      { type: 'focus', duration: focusMin * 60 },
      { type: 'short_break', duration: shortMin * 60 },
      { type: 'focus', duration: focusMin * 60 },
      { type: 'short_break', duration: shortMin * 60 },
      { type: 'focus', duration: focusMin * 60 },
      { type: 'short_break', duration: shortMin * 60 },
      { type: 'focus', duration: focusMin * 60 },
      { type: 'long_break', duration: longMin * 60 },
    ];

    const totalScheduleSeconds = segments.reduce((sum, s) => sum + s.duration, 0);
    const elapsedRaw = (parseInt(totalMinutes) || 0) * 60 - timeLeft;
    const elapsed = Math.max(0, Math.min(totalScheduleSeconds - 1, elapsedRaw));

    let remaining = elapsed;
    let currentIndex = 0;

    for (let i = 0; i < segments.length; i++) {
      if (remaining < segments[i].duration) {
        currentIndex = i;
        break;
      }
      remaining -= segments[i].duration;
      currentIndex = i;
    }

    const current = segments[currentIndex];
    const next = segments[currentIndex + 1];

    const phaseText = (type) => {
      if (type === 'focus') return 'Study time!';
      if (type === 'short_break') return 'Short break';
      if (type === 'long_break') return 'Long break';
      return '';
    };

    currentPhaseLabel = phaseText(current.type);

    if (next) {
      let nextLabel = phaseText(next.type);
      if (next.type === 'focus') {
        nextLabel = 'Study session';
      }
      nextPhaseLabel = nextLabel;
    } else {
      nextPhaseLabel = 'Session complete';
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          {exitDeclined === 'true' && (
            <View style={styles.bannerDeclined}>
              <Text style={styles.bannerText}>Request declined by host. Lock in!</Text>
            </View>
          )}
          <View style={styles.sessionHeader}>
            <Text style={styles.title}>In Session</Text>
            {isPublic && (
              <View style={[styles.sessionTypePill, isPublic === 'true' ? styles.publicPill : styles.privatePill]}>
                <Text style={styles.sessionTypeText}>{isPublic === 'true' ? 'Public' : 'Private'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>{sessionName || "WE'RE LOCKED IN"}</Text>

          <Text style={styles.timerLabel}>Time remaining</Text>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>

          {pomodoroOn && currentPhaseLabel && (
            <View style={styles.phaseBlock}>
              <Text style={styles.phaseCurrent}>{currentPhaseLabel}</Text>
              {nextPhaseLabel ? (
                <Text style={styles.phaseNext}>Next up: {nextPhaseLabel}</Text>
              ) : null}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Focus Goals</Text>
            <View style={styles.goalCard}>
              {goalItems && goalItems.length > 0 ? (
                goalItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.goalRow}
                    onPress={() => toggleGoal(item.id)}
                  >
                    <Ionicons
                      name={item.completed ? 'checkbox-outline' : 'square-outline'}
                      size={18}
                      color="#000"
                      style={styles.goalCheckbox}
                    />
                    <Text
                      style={[
                        styles.goalText,
                        item.completed && styles.goalTextCompleted,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.goalText}>
                  {rawGoals || "• Stay focused\n• Complete your tasks"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Participants</Text>
            <View style={styles.participantsRow}>
              {participantsList.map((p, index) => (
                <View key={`${p.name}-${index}`} style={styles.participant}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{p.avatar}</Text>
                  </View>
                  <Text style={styles.participantName}>{p.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.exitButton} onPress={handleRequestExit}>
            <Text style={styles.exitButtonText}>Request Unlock</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>DEV SKIP</Text>
          </TouchableOpacity>
        </View>
        {!started && (
          <TouchableOpacity
            style={styles.readyOverlay}
            activeOpacity={1}
            onPress={() => setStarted(true)}
          >
            <View style={styles.readyBlock}>
              <Text style={styles.readyTitle}>Ready to start?</Text>
              <Text style={styles.readySubtitle}>
                Take a breath. Tap anywhere to begin.
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
  bannerDeclined: {
    backgroundColor: 'rgba(183, 28, 28, 0.9)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bannerText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  sessionTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  publicPill: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  privatePill: {
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
  },
  sessionTypeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
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
  phaseBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  phaseCurrent: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  phaseNext: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.85)',
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
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalCheckbox: {
    marginRight: 8,
  },
  goalTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
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
  readyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyBlock: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    maxWidth: 280,
  },
  readyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  readySubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 12,
  },
  startFocusButton: {
    backgroundColor: '#FFB84D',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  startFocusButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
  },
  exitButton: {
    backgroundColor: '#B71C1C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  exitButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
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
