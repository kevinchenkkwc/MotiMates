import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getSession, getSessionParticipants, getCurrentUser, updateParticipantReady, saveFocusGoals, startSession } from '../../utils/api';
import { supabase } from '../../utils/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { responsive } from '../../utils/responsive';

export default function Lobby() {
  const router = useRouter();
  const { sessionId, sessionName, goals, totalMinutes, pomodoro, shortBreak, longBreak, usePomodoro, isPublic } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdingUsers, setHoldingUsers] = useState(new Set());
  const [startingSession, setStartingSession] = useState(false);

  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }
      setCurrentUserId(user.id);

      const sessionData = await getSession(sessionId);
      setSession(sessionData);
      setIsHost(sessionData.host_id === user.id);

      // Save host goals if this is the host and they have goals
      if (sessionData.host_id === user.id && goals) {
        try {
          const goalsList = JSON.parse(decodeURIComponent(goals));
          if (goalsList && goalsList.length > 0) {
            await saveFocusGoals(sessionId, goalsList);
          }
        } catch (e) {
          // Goals might not be set
        }
      }

      await loadParticipants();
    } catch (e) {
      alert(e.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const parts = await getSessionParticipants(sessionId);
      setParticipants(parts);
    } catch (e) {
      console.error('Failed to load participants:', e);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`lobby:${sessionId}`)
      .on('broadcast', { event: 'hold_change' }, (payload) => {
        console.log('[Broadcast] Hold status changed:', payload);
        setHoldingUsers(prev => {
          const newSet = new Set(prev);
          if (payload.payload.isHolding) {
            newSet.add(payload.payload.userId);
          } else {
            newSet.delete(payload.payload.userId);
          }
          return newSet;
        });
      })
      .on('broadcast', { event: 'session_start' }, (payload) => {
        console.log('[Broadcast] Session started!');
        if (!isHost) {
          const participantsParam = encodeURIComponent(JSON.stringify(participants));
          router.push({
            pathname: '/session/active',
            params: {
              sessionId,
              sessionName,
              totalMinutes: totalMinutes || '60',
              pomodoro,
              shortBreak,
              longBreak,
              usePomodoro,
              participants: participantsParam,
            },
          });
        }
      })
      .on('broadcast', { event: 'participant_joined' }, (payload) => {
        console.log('[Broadcast] Participant joined');
        loadParticipants();
      })
      .subscribe((status) => {
        console.log('[Broadcast] Channel status:', status);
      });

    // Poll for participant updates every 3 seconds
    const interval = setInterval(() => {
      loadParticipants();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  };

  const handlePressIn = () => {
    setIsHolding(true);
    const channel = supabase.channel(`lobby:${sessionId}`);
    channel.send({
      type: 'broadcast',
      event: 'hold_change',
      payload: { sessionId, userId: currentUserId, isHolding: true },
    });
  };

  const handlePressOut = () => {
    setIsHolding(false);
    const channel = supabase.channel(`lobby:${sessionId}`);
    channel.send({
      type: 'broadcast',
      event: 'hold_change',
      payload: { sessionId, userId: currentUserId, isHolding: false },
    });
  };

  // Check if everyone is holding
  const allHolding = participants.length > 0 && 
    (holdingUsers.size + (isHolding ? 1 : 0)) >= participants.length;

  // Auto-start when everyone holds
  useEffect(() => {
    if (allHolding && !startingSession && isHost) {
      handleStartSession();
    }
  }, [allHolding, startingSession, isHost]);

  const handleStartSession = async () => {
    if (!isHost || startingSession) return;

    try {
      setStartingSession(true);

      // Update session status in database
      console.log('[Host] Starting session in database...');
      await startSession(sessionId);
      
      // Broadcast session start to all clients
      const channel = supabase.channel(`lobby:${sessionId}`);
      await channel.send({
        type: 'broadcast',
        event: 'session_start',
        payload: { sessionId, startTime: Date.now() },
      });
      console.log('[Host] Broadcast sent, navigating...');

      // Navigate to active session
      const participantsParam = encodeURIComponent(JSON.stringify(participants));
      router.push({
        pathname: '/session/active',
        params: {
          sessionId,
          sessionName,
          totalMinutes: totalMinutes || '60',
          pomodoro,
          shortBreak,
          longBreak,
          usePomodoro,
          participants: participantsParam,
          startTime: Date.now().toString(),
        },
      });
    } catch (e) {
      console.error('[Host] Failed to start session:', e);
      alert(e.message || 'Failed to start session');
      setStartingSession(false);
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
            <Text style={styles.loadingText}>Loading lobby...</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  const allReady = participants.every(p => p.is_ready);
  const readyCount = participants.filter(p => p.is_ready).length;

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
          <Text style={styles.headerTitle}>Session Lobby</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <View style={styles.card}>
            <Text style={styles.sessionName}>{sessionName || 'Focus Session'}</Text>
            <Text style={styles.inviteCode}>Code: {session?.invite_code}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="people" size={24} color="#8B1E1E" />
                <Text style={styles.statText}>{participants.length} {participants.length === 1 ? 'mate' : 'mates'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Participants</Text>
            {participants.map((participant) => {
              const isMe = participant.user_id === currentUserId;
              const displayName = participant.profiles?.display_name || 'User';
              const isHoldingNow = holdingUsers.has(participant.user_id) || (isMe && isHolding);

              return (
                <View key={participant.id} style={styles.participantRow}>
                  <View style={styles.participantLeft}>
                    <View style={[styles.avatar, isHoldingNow && styles.avatarHolding]}>
                      <Text style={styles.avatarText}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.participantName}>
                        {displayName} {isMe ? '(You)' : ''}
                      </Text>
                      {participant.user_id === session?.host_id && (
                        <Text style={styles.hostBadge}>Host</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.participantRight}>
                    {isHoldingNow && (
                      <View style={styles.holdingBadge}>
                        <Ionicons name="hand-left" size={20} color="#4CAF50" />
                        <Text style={styles.holdingText}>Holding</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            <View style={styles.divider} />

            {/* Hold to Start Button */}
            <View style={styles.holdToStartContainer}>
              <Text style={styles.holdInstruction}>
                Everyone hold to start together
              </Text>
              <View style={styles.holdCounter}>
                <Text style={styles.holdCounterText}>
                  {holdingUsers.size + (isHolding ? 1 : 0)}/{participants.length}
                </Text>
                <Text style={styles.holdCounterLabel}>Holding</Text>
              </View>
              <TouchableOpacity
                style={[styles.holdButton, isHolding && styles.holdButtonActive, allHolding && styles.holdButtonReady]}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
              >
                <Ionicons 
                  name={allHolding ? "rocket" : isHolding ? "hand-left" : "hand-left-outline"} 
                  size={48} 
                  color={allHolding ? "#FFF" : isHolding ? "#4CAF50" : "#666"} 
                />
                <Text style={[styles.holdButtonText, isHolding && styles.holdButtonTextActive, allHolding && styles.holdButtonTextReady]}>
                  {allHolding ? "Starting..." : isHolding ? "Keep Holding!" : "Hold to Start"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsive.contentPadding,
    paddingTop: 60,
    paddingBottom: responsive.padding.md,
    width: '100%',
    maxWidth: responsive.maxWidth,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentInner: {
    paddingHorizontal: responsive.contentPadding,
    paddingBottom: responsive.padding.xl,
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#FFF',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: responsive.isTablet ? 30 : 20,
    padding: responsive.padding.lg,
    width: '100%',
    maxWidth: responsive.maxWidth,
  },
  sessionName: {
    fontSize: responsive.fontSize.xxl,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: responsive.padding.sm,
    textAlign: 'center',
  },
  inviteCode: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B1E1E',
    textAlign: 'center',
    marginBottom: responsive.padding.md,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarReady: {
    backgroundColor: '#C8E6C9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  hostBadge: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B1E1E',
    backgroundColor: '#FFE0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  participantRight: {
    marginLeft: 8,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  readyText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4CAF50',
  },
  notReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  holdingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  holdingText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4CAF50',
  },
  avatarHolding: {
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#81C784',
  },
  holdToStartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  holdInstruction: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  holdCounter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  holdCounterText: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: '#8B1E1E',
    lineHeight: 52,
  },
  holdCounterLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  holdButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#DDD',
    minWidth: 200,
  },
  holdButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  holdButtonReady: {
    backgroundColor: '#8B1E1E',
    borderColor: '#8B1E1E',
  },
  holdButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
    marginTop: 8,
  },
  holdButtonTextActive: {
    color: '#4CAF50',
  },
  holdButtonTextReady: {
    color: '#FFF',
  },
  buttonIcon: {
    marginRight: 8,
  },
});
