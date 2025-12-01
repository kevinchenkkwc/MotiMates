import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ActivityIndicator, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getSessionWithParticipants, joinSessionById, getFocusGoals, saveFocusGoals, getCurrentUser } from '../../utils/api';
import { supabase } from '../../utils/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { responsive } from '../../utils/responsive';

export default function RoomDetails() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [goals, setGoals] = useState(['', '']);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadSessionDetails();
  }, []);

  const loadSessionDetails = async () => {
    try {
      const data = await getSessionWithParticipants(sessionId);
      setSession(data);
    } catch (e) {
      console.error('Failed to load session:', e);
      Alert.alert('Error', 'Failed to load session details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    try {
      setJoining(true);
      
      // Join the session
      await joinSessionById(sessionId);

      // Broadcast participant joined for lobby updates
      const lobbyChannel = supabase.channel(`lobby:${sessionId}`);
      await lobbyChannel.send({
        type: 'broadcast',
        event: 'participant_joined',
        payload: { sessionId },
      });

      // Broadcast participant change for active session updates
      const activeChannel = supabase.channel(`session:${sessionId}`);
      await activeChannel.send({
        type: 'broadcast',
        event: 'participant_change',
        payload: { sessionId },
      });

      // Save goals
      const user = await getCurrentUser();
      if (user && goals.some(g => g.trim())) {
        const validGoals = goals.filter(g => g.trim());
        await saveFocusGoals(sessionId, validGoals);
      }

      // Calculate total minutes
      const totalMinutes = session.mode === 'pomodoro'
        ? (session.work_minutes || 25) * 4 + (session.short_break_minutes || 5) * 3 + (session.long_break_minutes || 15)
        : session.work_minutes || 60;

      // If session is in progress, go directly to active session
      if (session.status === 'in_progress') {
        router.replace({
          pathname: '/session/active',
          params: {
            sessionId: session.id,
            sessionName: session.name,
            totalMinutes: totalMinutes.toString(),
            pomodoro: (session.work_minutes || 25).toString(),
            shortBreak: (session.short_break_minutes || 5).toString(),
            longBreak: (session.long_break_minutes || 15).toString(),
            usePomodoro: (session.mode === 'pomodoro').toString(),
            startTime: session.started_at ? new Date(session.started_at).getTime().toString() : Date.now().toString(),
          },
        });
      } else {
        // Go to lobby for active sessions
        router.replace({
          pathname: '/session/lobby',
          params: {
            sessionId: session.id,
            sessionName: session.name,
            totalMinutes: totalMinutes.toString(),
          },
        });
      }
    } catch (e) {
      console.error('Failed to join:', e);
      Alert.alert('Error', e.message || 'Failed to join session');
    } finally {
      setJoining(false);
    }
  };

  const addGoal = () => {
    if (goals.length < 5) {
      setGoals([...goals, '']);
    }
  };

  const updateGoal = (index, text) => {
    const newGoals = [...goals];
    newGoals[index] = text;
    setGoals(newGoals);
  };

  const removeGoal = (index) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/background.png')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        </ImageBackground>
      </View>
    );
  }

  const participants = session?.session_participants || [];
  const host = session?.profiles;
  const timeLeft = session?.status === 'in_progress' && session?.started_at
    ? Math.max(0, Math.floor(((session.work_minutes || 60) * 60 * 1000 - (Date.now() - new Date(session.started_at).getTime())) / 1000 / 60))
    : (session?.work_minutes || 60);

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Room #{session?.invite_code}</Text>
          <Text style={styles.roomName}>{session?.name || 'Untitled Session'}</Text>

          <View style={styles.card}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Time Left:</Text>
              <Text style={styles.timeValue}>{formatTime(timeLeft)}</Text>
            </View>
            <Text style={styles.roomType}>{session?.is_public ? 'Public room' : 'Private room'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hosted by</Text>
            <View style={styles.hostRow}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostAvatarText}>
                  {(host?.display_name || 'H').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>{host?.display_name || 'Host'}</Text>
                <View style={styles.statusDot} />
              </View>
            </View>

            {participants.length > 1 && (
              <>
                <Text style={[styles.cardTitle, { marginTop: 20 }]}>Also in session:</Text>
                <View style={styles.participantsList}>
                  {participants
                    .filter(p => p.user_id !== session.host_id)
                    .map((participant, index) => (
                      <View key={index} style={styles.participantRow}>
                        <View style={styles.participantAvatar}>
                          <Text style={styles.participantAvatarText}>
                            {(participant.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.participantInfo}>
                          <Text style={styles.participantName}>
                            {participant.profiles?.display_name || 'User'}
                          </Text>
                          <View style={styles.statusDot} />
                        </View>
                      </View>
                    ))}
                </View>
              </>
            )}
          </View>

          <View style={styles.goalsCard}>
            <View style={styles.goalsHeader}>
              <Text style={styles.goalsTitle}>Add focus goals</Text>
              <Ionicons name="create-outline" size={20} color="#000" />
            </View>

            {goals.map((goal, index) => (
              <View key={index} style={styles.goalInputRow}>
                <Ionicons name="square-outline" size={20} color="#666" style={styles.goalIcon} />
                <TextInput
                  style={styles.goalInput}
                  value={goal}
                  onChangeText={(text) => updateGoal(index, text)}
                  placeholder={index === 0 ? 'finish math 51 pset' : index === 1 ? 'prepare for quant interviews' : 'add goal'}
                  placeholderTextColor="#999"
                  returnKeyType="next"
                />
                {goals.length > 1 && (
                  <TouchableOpacity onPress={() => removeGoal(index)}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {goals.length < 5 && (
              <TouchableOpacity style={styles.addGoalButton} onPress={addGoal}>
                <Ionicons name="add" size={16} color="#666" />
                <Text style={styles.addGoalText}>add goal</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.joinButton, joining && styles.joinButtonDisabled]}
            onPress={handleJoinSession}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.joinButtonText}>Join Session</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
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
    paddingHorizontal: responsive.contentPadding,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsive.contentPadding,
    paddingBottom: 40,
  },
  title: {
    fontSize: responsive.fontSize.xxl,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roomName: {
    fontSize: responsive.fontSize.xl,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: responsive.padding.lg,
    marginBottom: 16,
  },
  timeRow: {
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: responsive.fontSize.xxxl,
    fontFamily: 'Poppins_700Bold',
    color: '#8B1E1E',
  },
  roomType: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  cardTitle: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: 12,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFB84D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hostAvatarText: {
    fontSize: responsive.fontSize.xl,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
  },
  hostInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostName: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  participantsList: {
    gap: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginRight: 8,
  },
  goalsCard: {
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
    borderRadius: 20,
    padding: responsive.padding.lg,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIcon: {
    marginRight: 8,
    color: '#FFF',
  },
  goalInput: {
    flex: 1,
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: '#FFF',
    paddingVertical: 8,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addGoalText: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: '#8B1E1E',
    borderRadius: 16,
    paddingVertical: responsive.padding.md,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
});
