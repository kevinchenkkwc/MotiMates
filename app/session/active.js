import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ActivityIndicator, ScrollView, Modal, TextInput, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { getSessionParticipants, getFocusGoals, getAllSessionGoals, getCurrentUser, endSession, createUnlockRequest, voteOnUnlockRequest, getPendingUnlockRequests, saveFocusGoals } from '../../utils/api';
import { supabase } from '../../utils/supabase';
import { Audio } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import { responsive } from '../../utils/responsive';

const dismissKeyboard = () => {
  Keyboard.dismiss();
};

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
  const [goalItems, setGoalItems] = useState([]); // Current user's goals (editable)
  const [allGoals, setAllGoals] = useState([]); // All participants' goals (for display)
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
  const [sound, setSound] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showEditGoalsModal, setShowEditGoalsModal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const sessionEndingNaturally = useRef(false);
  const hasRedirected = useRef(false);

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

      // Load my goals (for editing)
      const myGoals = await getFocusGoals(sessionId, user.id);
      setGoalItems(myGoals);

      // Load all participants' goals (for display)
      const allSessionGoals = await getAllSessionGoals(sessionId);
      setAllGoals(allSessionGoals);
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
        // Check session status
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('status')
          .eq('id', sessionId)
          .single();
        
        // If session ended (e.g., host left), redirect to home
        // BUT don't redirect if we're naturally ending (timer reached 0) or already redirected
        if (sessionData && sessionData.status === 'ended' && !sessionEndingNaturally.current && !hasRedirected.current) {
          hasRedirected.current = true;
          console.log('[Active] Session ended by host/external, redirecting to home');
          router.replace('/tabs/3-home');
          return;
        }
        
        const parts = await getSessionParticipants(sessionId);
        setParticipants(parts);
        
        // Delete session if no participants remain
        if (parts.length === 0 && !hasRedirected.current) {
          hasRedirected.current = true;
          console.log('[Active] No participants left, deleting session');
          await deleteEmptySession(sessionId);
          router.replace('/tabs/3-home');
        }
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
        sessionEndingNaturally.current = true; // Mark as natural end
        handleEndSession();
        setTimeout(() => {
          router.push({
            pathname: '/session/summary',
            params: {
              sessionId,
              sessionName,
              totalMinutes: totalMinutes?.toString() || '0',
            },
          });
        }, 100); // Small delay to ensure handleEndSession completes
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load and play focus music
  useEffect(() => {
    let audioObject = null;

    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound: loadedSound } = await Audio.Sound.createAsync(
          require('../../assets/audio/focus.mp3'),
          { isLooping: true, volume: isMuted ? 0 : 0.5 },
          null,
          true
        );
        
        audioObject = loadedSound;
        setSound(loadedSound);
        await loadedSound.playAsync();
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };

    loadSound();

    return () => {
      if (audioObject) {
        audioObject.unloadAsync();
      }
    };
  }, []);

  // Update volume when mute changes
  useEffect(() => {
    if (sound) {
      sound.setVolumeAsync(isMuted ? 0 : 0.5);
    }
  }, [isMuted, sound]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteEmptySession = async (sessionId) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      console.log('[Active] Empty session deleted');
    } catch (e) {
      console.error('Failed to delete empty session:', e);
    }
  };

  const addNewGoal = async () => {
    const text = newGoalText.trim();
    if (!text) return;

    try {
      // Check if this exact text already exists
      const existingTexts = goalItems
        .map((g) => g.goal_text || g.text)
        .filter(Boolean);

      if (existingTexts.includes(text)) {
        // Already exists, just clear input
        setNewGoalText('');
        return;
      }

      setNewGoalText('');

      // Insert only the new goal directly (don't delete/re-insert all)
      const { data, error } = await supabase
        .from('focus_goals')
        .insert({
          session_id: sessionId,
          user_id: currentUserId,
          goal_text: text,
          is_completed: false,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Add the new goal to state
      setGoalItems((prev) => [...prev, data]);
      
      // Also update allGoals for display
      setAllGoals((prev) => [...prev, { ...data, profiles: { display_name: 'You' } }]);
    } catch (e) {
      console.error('Failed to add goal:', e);
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      // Remove from UI immediately
      const updatedGoals = goalItems.filter(g => g.id !== goalId);
      setGoalItems(updatedGoals);
      
      // Also remove from allGoals
      setAllGoals((prev) => prev.filter(g => g.id !== goalId));
      
      // Delete from database - also filter by user_id and session_id for safety
      const { error, count } = await supabase
        .from('focus_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', currentUserId)
        .eq('session_id', sessionId);
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      console.log('[Active] Goal deleted from database:', goalId);
    } catch (e) {
      console.error('Failed to delete goal:', e);
      // Reload to revert
      const goals = await getFocusGoals(sessionId, currentUserId);
      setGoalItems(goals);
    }
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
    
    // Also update allGoals
    setAllGoals((prev) =>
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
      setAllGoals((prev) =>
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
  let segments = [];
  let currentIndex = 0;
  let segmentTimeLeftSeconds = null;

  if (pomodoroOn && pomodoro && shortBreak && longBreak) {
    const focusMin = parseInt(pomodoro) || 25;
    const shortMin = parseInt(shortBreak) || 5;
    const longMin = parseInt(longBreak) || 15;

    segments = [
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
    currentIndex = 0;

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

    // Time remaining in the current focus/break block
    const elapsedInCurrentSegment = remaining;
    segmentTimeLeftSeconds = Math.max(current.duration - elapsedInCurrentSegment, 0);

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

  // Compute a single motivational message so only one shows at a time
  let motivation = null;
  const showEndMotivation = timeLeft < 300 && timeLeft > 0;
  const showStartMotivation = timeLeft > totalDuration * 0.8;

  if (showEndMotivation) {
    motivation = {
      icon: 'flame',
      color: '#FF6B35',
      text: "Final push! You've got this! 💪",
    };
  } else if (showStartMotivation) {
    motivation = {
      icon: 'rocket',
      color: '#4ECDC4',
      text: 'Strong start! Keep the momentum! 🚀',
    };
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
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          {exitDeclined === 'true' && (
            <View style={styles.bannerDeclined}>
              <Text style={styles.bannerText}>Request declined by host. Lock in!</Text>
            </View>
          )}
          <View style={styles.sessionHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>In Session</Text>
              {pomodoroOn && segments.length > 0 && (
                <View style={styles.compactProgressRow}>
                  <Text style={styles.compactProgressLabel}>
                    Block {currentIndex + 1}/{segments.length}
                  </Text>
                  <View style={styles.compactDotsRow}>
                    {segments.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.compactDot,
                          idx === currentIndex && styles.compactDotActive,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              )}
              {pomodoroOn && nextPhaseLabel && (
                <Text style={styles.compactNextText}>
                  {nextPhaseLabel === 'Session complete'
                    ? nextPhaseLabel
                    : `Next up: ${nextPhaseLabel}`}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
              <Ionicons 
                name={isMuted ? 'volume-mute' : 'volume-high'} 
                size={28} 
                color="#FFF" 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.sessionNameHeader}>{sessionName || "WE'RE LOCKED IN"}</Text>

          <Text style={styles.timerLabel}>TIME REMAINING</Text>
          <View style={styles.timerContainer}>
            <View style={styles.progressRing} />
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>
                {formatTime(pomodoroOn && segmentTimeLeftSeconds != null ? segmentTimeLeftSeconds : timeLeft)}
              </Text>
              {pomodoroOn && (
                <Text style={styles.timerTotalLabel}>
                  Total: {formatTime(timeLeft)} left
                </Text>
              )}
              {pomodoroOn && currentPhaseLabel && (
                <Text style={styles.timerPhase}>{currentPhaseLabel}</Text>
              )}
              <View style={styles.timerStats}>
                <Ionicons name="people" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.timerStatsText}>{participants.length}</Text>
              </View>
            </View>
          </View>

          

          {motivation && (
            <View style={styles.motivationQuote}>
              <Text style={styles.quoteText}>{motivation.text}</Text>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Focus Goals</Text>
              <TouchableOpacity onPress={() => setShowEditGoalsModal(true)} style={styles.editButton}>
                <Ionicons name="pencil" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.goalCard}>
              {/* Show current user's goals first (editable) */}
              {goalItems && goalItems.length > 0 && (
                <View style={styles.userGoalsSection}>
                  <Text style={styles.userGoalsLabel}>Your Goals</Text>
                  {goalItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.goalRow}
                      onPress={() => toggleGoal(item.id)}
                    >
                      <Ionicons
                        name={item.is_completed ? 'checkbox' : 'square-outline'}
                        size={20}
                        color="#FFF"
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
                  ))}
                </View>
              )}
              
              {/* Show other participants' goals (read-only) */}
              {allGoals && allGoals.filter(g => g.user_id !== currentUserId).length > 0 && (
                <View style={styles.otherGoalsSection}>
                  {(() => {
                    // Group goals by user
                    const otherGoals = allGoals.filter(g => g.user_id !== currentUserId);
                    const groupedByUser = otherGoals.reduce((acc, goal) => {
                      const userName = goal.profiles?.display_name || 'Teammate';
                      if (!acc[goal.user_id]) {
                        acc[goal.user_id] = { name: userName, goals: [] };
                      }
                      acc[goal.user_id].goals.push(goal);
                      return acc;
                    }, {});
                    
                    return Object.entries(groupedByUser).map(([userId, userData]) => (
                      <View key={userId} style={styles.teammateGoals}>
                        <Text style={styles.teammateLabel}>{userData.name}'s Goals</Text>
                        {userData.goals.map((goal) => (
                          <View key={goal.id} style={styles.goalRow}>
                            <Ionicons
                              name={goal.is_completed ? 'checkbox' : 'square-outline'}
                              size={20}
                              color="rgba(255,255,255,0.7)"
                              style={styles.goalCheckbox}
                            />
                            <Text
                              style={[
                                styles.goalText,
                                styles.teammateGoalText,
                                goal.is_completed && styles.goalTextCompleted,
                              ]}
                            >
                              {goal.goal_text || goal.text}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ));
                  })()}
                </View>
              )}
              
              {(!goalItems || goalItems.length === 0) && (!allGoals || allGoals.length === 0) && (
                <Text style={styles.emptyGoalsText}>
                  No goals set for this session
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Study Buddies ({participants.length})</Text>
            <View style={styles.participantsRow}>
              {participantsList.map((p, index) => (
                <View key={`${p.name}-${index}`} style={styles.participant}>
                  <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, styles.avatarActive]}>
                      <Text style={styles.avatarText}>{p.avatar}</Text>
                    </View>
                    <View style={styles.statusDot} />
                  </View>
                  <Text style={styles.participantName} numberOfLines={1}>{p.name}</Text>
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
        </ScrollView>
      </ImageBackground>

      {/* Unlock Request Modal */}
      <Modal
        visible={showUnlockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUnlockModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalKeyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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

      {/* Edit Goals Modal */}
      <Modal
        visible={showEditGoalsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditGoalsModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalKeyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.modalOverlay}>
              <View style={styles.editGoalsModalContent}>
                <View style={styles.editGoalsHeader}>
                  <Text style={styles.modalTitle}>Edit Goals</Text>
                  <TouchableOpacity onPress={() => setShowEditGoalsModal(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.editGoalsList}
                  keyboardShouldPersistTaps="handled"
                >
                  {goalItems.map((goal) => (
                    <View key={goal.id} style={styles.editGoalRow}>
                      <Text style={styles.editGoalText} numberOfLines={2}>{goal.goal_text || goal.text}</Text>
                      <TouchableOpacity onPress={() => deleteGoal(goal.id)} style={styles.deleteGoalButton}>
                        <Ionicons name="trash-outline" size={20} color="#B71C1C" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {goalItems.length === 0 && (
                    <Text style={styles.noGoalsText}>No goals yet. Add one below!</Text>
                  )}
                </ScrollView>

                <View style={styles.addGoalRow}>
                  <TextInput
                    style={styles.addGoalInput}
                    value={newGoalText}
                    onChangeText={setNewGoalText}
                    placeholder="New goal..."
                    placeholderTextColor="#999"
                    returnKeyType="done"
                    onSubmitEditing={addNewGoal}
                  />
                  <TouchableOpacity style={styles.addGoalButton} onPress={addNewGoal}>
                    <Ionicons name="add" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
  scrollContent: {
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexShrink: 1,
  },
  muteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 20,
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
  sessionNameHeader: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  compactProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    gap: 8,
  },
  compactProgressLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  compactDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  compactDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
  },
  compactNextText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  timerLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1.5,
  },
  timerContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 12,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    top: -10,
    left: -10,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(139, 69, 19, 0.7)',
    borderWidth: 10,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timerText: {
    fontSize: 44,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timerTotalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  timerPhase: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  timerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  timerStatsText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
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
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 16,
  },
  goalText: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: '#FFF',
    marginBottom: 4,
    flex: 1,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  goalCheckbox: {
    marginRight: 12,
  },
  goalTextCompleted: {
    textDecorationLine: 'line-through',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  userGoalsSection: {
    marginBottom: 12,
  },
  userGoalsLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  otherGoalsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
    marginTop: 4,
  },
  teammateGoals: {
    marginBottom: 12,
  },
  teammateLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  teammateGoalText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  participant: {
    alignItems: 'center',
    maxWidth: 70,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarActive: {
    backgroundColor: 'rgba(139, 30, 30, 0.8)',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  participantName: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
    textAlign: 'center',
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
    backgroundColor: '#7b2424ff',
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
  modalKeyboardView: {
    flex: 1,
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
  pomodoroTimeline: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  timelineSegment: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineBlock: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CCC',
  },
  timelineBlockFocus: {
    backgroundColor: '#8B1E1E',
    borderColor: '#6B1515',
  },
  timelineBlockShortBreak: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  timelineBlockLongBreak: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  timelineBlockActive: {
    transform: [{ scale: 1.15 }],
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  timelineBlockPast: {
    opacity: 0.7,
  },
  timelineConnector: {
    width: 8,
    height: 2,
    backgroundColor: '#CCC',
    marginHorizontal: 2,
  },
  timelineConnectorPast: {
    backgroundColor: '#888',
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  motivationQuote: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editButton: {
    padding: 4,
  },
  emptyGoalsText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingVertical: 8,
  },
  editGoalsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '70%',
    padding: 20,
  },
  editGoalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editGoalsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  editGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  editGoalText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    marginRight: 8,
  },
  deleteGoalButton: {
    padding: 4,
  },
  noGoalsText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  addGoalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addGoalInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
  addGoalButton: {
    backgroundColor: '#8B1E1E',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
