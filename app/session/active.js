import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { getSessionParticipants, getFocusGoals, getCurrentUser, endSession, createUnlockRequest, voteOnUnlockRequest, getPendingUnlockRequests } from '../../utils/api';
import { supabase } from '../../utils/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { responsive } from '../../utils/responsive';

export default function ActiveSession() {
  const router = useRouter();
  const {
    sessionId,
    sessionName,
    totalMinutes,
    pomodoro,
    shortBreak,
    longBreak,
    usePomodoro,
    exitDeclined,
    startTime,
  } = useLocalSearchParams();
  
  const sessionStartTime = useRef(startTime ? parseInt(startTime) : Date.now());
  const totalDuration = totalMinutes ? parseInt(totalMinutes) * 60 : 3600;
  const [timeLeft, setTimeLeft] = useState(totalDuration);
  const [goalItems, setGoalItems] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const currentUserIdRef = useRef(null);
  const channelRef = useRef(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [pendingRequest, setPendingRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);

  useEffect(() => {
    loadSessionData();
    setupRealtimeSubscription();
  }, []);

  const loadSessionData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }
      setCurrentUserId(user.id);
      currentUserIdRef.current = user.id;

      // Load participants
      const parts = await getSessionParticipants(sessionId);
      setParticipants(parts);

      // Load my goals
      const goals = await getFocusGoals(sessionId, user.id);
      setGoalItems(goals);
    } catch (e) {
      console.error('Failed to load session data:', e);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('broadcast', { event: 'participant_change' }, async (payload) => {
        console.log('[Active] Participant change broadcast:', payload);
        try {
          const parts = await getSessionParticipants(sessionId);
          setParticipants(parts);
        } catch (e) {
          console.error('Failed to reload participants:', e);
        }
      })
      .on('broadcast', { event: 'unlock_request' }, (payload) => {
        console.log('[Broadcast] Unlock request:', payload);
        const myId = currentUserIdRef.current;
        // Show modal for other participants to vote (not the requester)
        if (payload.payload.requesterId && payload.payload.requesterId !== myId) {
          setIncomingRequest(payload.payload);
          setShowRequestModal(true);
        }
      })
      .on('broadcast', { event: 'unlock_resolved' }, (payload) => {
        console.log('[Broadcast] Unlock resolved:', payload);
        const myId = currentUserIdRef.current;
        const isRequester = payload.payload.requesterId === myId;

        if (!isRequester) return;

        if (payload.payload.status === 'approved') {
          // Clear pending state and let the requester leave the session
          setPendingRequest(null);
          Alert.alert(
            'Request Approved',
            'Your mates approved. You can now leave the session.',
            [
              { text: 'Stay', style: 'cancel' },
              {
                text: 'Leave',
                onPress: () => {
                  // Navigate to early exit reflection
                  router.replace({
                    pathname: '/session/early-exit',
                    params: {
                      sessionId,
                      sessionName,
                      reason: payload.payload.reason || 'Approved exit',
                    },
                  });
                },
              },
            ],
          );
        } else if (payload.payload.status === 'rejected') {
          setPendingRequest(null);
          Alert.alert('Request Denied', 'Your unlock request was denied by your study mates');
        }
      })
      .subscribe();

    channelRef.current = channel;

    // Poll for participant updates every 5 seconds
    const interval = setInterval(async () => {
      try {
        const parts = await getSessionParticipants(sessionId);
        setParticipants(parts);
      } catch (e) {
        console.error('Failed to poll participants:', e);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  };

  const participantsList = participants.map(p => ({
    name: p.profiles?.display_name || 'User',
    avatar: (p.profiles?.display_name || 'U').charAt(0).toUpperCase(),
    id: p.user_id,
  }));

  // Synced timer - calculates based on shared start time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      const remaining = totalDuration - elapsed;
      
      if (remaining <= 0) {
        clearInterval(interval);
        handleEndSession();
        router.push({
          pathname: '/session/summary',
          params: {
            sessionId,
            sessionName,
            totalMinutes: totalMinutes?.toString() || '0',
          },
        });
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleGoal = async (id) => {
    const goal = goalItems.find(g => g.id === id);
    if (!goal) return;

    const newCompleted = !goal.is_completed;
    
    // Optimistically update UI
    setGoalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_completed: newCompleted } : item
      )
    );

    // Update in database
    try {
      const { updateGoalCompletion } = require('../../utils/api');
      await updateGoalCompletion(id, newCompleted);
    } catch (e) {
      console.error('Failed to update goal:', e);
      // Revert on error
      setGoalItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_completed: !newCompleted } : item
        )
      );
    }
  };

  const handleEndSession = async () => {
    try {
      await endSession(sessionId);
    } catch (e) {
      console.error('Failed to end session:', e);
    }
  };

  const handleExitRequest = () => {
    if (pendingRequest) {
      Alert.alert('Request Pending', 'You already have a pending unlock request');
    } else {
      setShowUnlockModal(true);
    }
  };

  const handleRequestUnlock = async () => {
    if (!unlockReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for leaving');
      return;
    }

    try {
      const savedReason = unlockReason;
      setShowUnlockModal(false);
      setUnlockReason('');

      // Auto-approve if alone (no other participants)
      if (participants.length === 1) {
        Alert.alert(
          'Exit Approved',
          'You are alone in this session.',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Leave',
              onPress: () => {
                router.replace({
                  pathname: '/session/early-exit',
                  params: {
                    sessionId,
                    sessionName,
                    reason: savedReason,
                  },
                });
              },
            },
          ],
        );
        return;
      }

      const request = await createUnlockRequest(sessionId, savedReason, participants.length);
      setPendingRequest(request);

      // Broadcast to others using existing channel
      if (channelRef.current) {
        console.log('[Unlock] Broadcasting request to channel');
        await channelRef.current.send({
          type: 'broadcast',
          event: 'unlock_request',
          payload: {
            requestId: request.id,
            requesterId: currentUserId,
            requesterName: participants.find(p => p.user_id === currentUserId)?.profiles?.display_name || 'User',
            reason: savedReason,
          },
        });
      }

      Alert.alert(
        'Request Sent',
        `Waiting for ${participants.length - 1} mate(s) to approve...`,
        [{ text: 'OK' }]
      );
    } catch (e) {
      console.error('[Unlock] Failed:', e);
      Alert.alert('Error', e.message || 'Failed to send request');
    }
  };

  const handleVoteOnRequest = async (vote) => {
    try {
      const requestId = incomingRequest.requestId;
      const requesterId = incomingRequest.requesterId;
      const reason = incomingRequest.reason;

      const result = await voteOnUnlockRequest(requestId, vote);
      setShowRequestModal(false);
      setIncomingRequest(null);

      // If resolved, broadcast result using existing channel
      if (result.status !== 'pending' && channelRef.current) {
        console.log('[Unlock] Broadcasting resolution:', result.status);
        await channelRef.current.send({
          type: 'broadcast',
          event: 'unlock_resolved',
          payload: {
            requestId,
            requesterId,
            status: result.status,
            reason,
          },
        });
      }

      Alert.alert(
        vote === 'approve' ? 'Vote Recorded' : 'Request Denied',
        vote === 'approve' 
          ? result.status === 'approved'
            ? 'All votes received - Request approved!'
            : `Approved (${result.approveCount}/${participants.length - 1} needed)`
          : 'The request has been denied'
      );
    } catch (e) {
      console.error('[Unlock] Vote failed:', e);
      Alert.alert('Error', e.message || 'Failed to vote');
    }
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
            <Text style={styles.loadingText}>Loading session...</Text>
          </View>
        </ImageBackground>
      </View>
    );
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
                      name={item.is_completed ? 'checkbox-outline' : 'square-outline'}
                      size={18}
                      color="#000"
                      style={styles.goalCheckbox}
                    />
                    <Text
                      style={[
                        styles.goalText,
                        item.is_completed && styles.goalTextCompleted,
                      ]}
                    >
                      {item.goal_text || item.text}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.goalText}>
                  • Stay focused{'\n'}• Complete your tasks
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

          <TouchableOpacity 
            style={[styles.exitButton, pendingRequest && styles.exitButtonPending]} 
            onPress={handleExitRequest}
            disabled={!!pendingRequest}
          >
            <Ionicons name="lock-open-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.exitButtonText}>
              {pendingRequest ? 'Request Pending...' : 'Request Unlock'}
            </Text>
          </TouchableOpacity>

        </View>
      </ImageBackground>

      {/* Unlock Request Modal */}
      <Modal
        visible={showUnlockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUnlockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request to Leave</Text>
            <Text style={styles.modalSubtitle}>
              All {participants.length - 1} study mate(s) must approve
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Why do you need to leave? (required)"
              placeholderTextColor="#999"
              value={unlockReason}
              onChangeText={setUnlockReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowUnlockModal(false);
                  setUnlockReason('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handleRequestUnlock}
              >
                <Text style={styles.modalButtonTextSubmit}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Incoming Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={48} color="#FF9800" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Unlock Request</Text>
            <Text style={styles.requestFromText}>
              {incomingRequest?.requesterName} wants to leave
            </Text>
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Reason:</Text>
              <Text style={styles.reasonText}>{incomingRequest?.reason}</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonReject]}
                onPress={() => handleVoteOnRequest('reject')}
              >
                <Text style={styles.modalButtonTextReject}>Deny</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonApprove]}
                onPress={() => handleVoteOnRequest('approve')}
              >
                <Text style={styles.modalButtonTextApprove}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    backgroundColor: '#B71C1C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  exitButtonPending: {
    backgroundColor: '#999',
  },
  exitButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsive.padding.lg,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: responsive.isTablet ? 30 : 20,
    padding: responsive.padding.lg,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: responsive.fontSize.xxl,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: responsive.padding.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: responsive.padding.md,
    textAlign: 'center',
  },
  reasonInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: responsive.padding.md,
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    marginBottom: responsive.padding.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  requestFromText: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: responsive.padding.md,
    textAlign: 'center',
  },
  reasonBox: {
    width: '100%',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: responsive.padding.md,
    marginBottom: responsive.padding.md,
  },
  reasonLabel: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
    marginBottom: responsive.padding.xs,
  },
  reasonText: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: responsive.padding.sm,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: responsive.padding.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonTextCancel: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
  },
  modalButtonSubmit: {
    backgroundColor: '#8B1E1E',
  },
  modalButtonTextSubmit: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
  },
  modalButtonReject: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonTextReject: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B71C1C',
  },
  modalButtonApprove: {
    backgroundColor: '#4CAF50',
  },
  modalButtonTextApprove: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
  },
});
