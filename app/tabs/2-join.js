import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ActivityIndicator, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { listPublicActiveSessions, getSessionByInviteCode, joinSessionById } from '../../utils/api';
import { supabase } from '../../utils/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { responsive } from '../../utils/responsive';

export default function Join() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);

  useEffect(() => {
    loadActiveSessions();

    // Set up broadcast channel for session updates
    const channel = supabase
      .channel('public-sessions-broadcast')
      .on('broadcast', { event: 'session_created' }, (payload) => {
        console.log('[Join] Session created:', payload);
        loadActiveSessions();
      })
      .on('broadcast', { event: 'session_updated' }, (payload) => {
        console.log('[Join] Session updated:', payload);
        loadActiveSessions();
      })
      .subscribe();

    // Poll every 10 seconds as fallback
    const interval = setInterval(() => {
      loadActiveSessions();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadActiveSessions = async () => {
    try {
      const data = await listPublicActiveSessions();

      // Filter out sessions that have no time left (e.g. show 0 min left)
      const now = Date.now();
      const filtered = (data || []).filter((session) => {
        if (session.status === 'in_progress' && session.started_at) {
          const elapsedMs = now - new Date(session.started_at).getTime();
          const totalMs = (session.work_minutes || 60) * 60 * 1000;
          const remainingMinutes = Math.floor((totalMs - elapsedMs) / 1000 / 60);
          return remainingMinutes > 0;
        }
        // For 'active' (not yet started) sessions, always show
        return true;
      });

      setSessions(filtered);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionTap = (session) => {
    router.push({
      pathname: '/session/room-details',
      params: { sessionId: session.id },
    });
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      setCodeError('Please enter an invite code');
      return;
    }

    try {
      setJoiningCode(true);
      setCodeError('');

      const session = await getSessionByInviteCode(inviteCode.trim().toUpperCase());
      if (!session) {
        setCodeError('Session not found. Check the code and try again.');
        return;
      }

      if (session.status === 'ended') {
        setCodeError('This session has ended.');
        return;
      }

      setShowCodeModal(false);
      setInviteCode('');
      
      // Navigate to room details
      router.push({
        pathname: '/session/room-details',
        params: { sessionId: session.id },
      });
    } catch (e) {
      setCodeError(e.message || 'Unable to join session');
    } finally {
      setJoiningCode(false);
    }
  };

  const formatTimeLeft = (session) => {
    // Compute total scheduled minutes based on mode
    let totalMinutes;
    if (session.mode === 'pomodoro') {
      const work = session.work_minutes || 25;
      const shortBreak = session.short_break_minutes || 5;
      const longBreak = session.long_break_minutes || 15;
      totalMinutes = work * 4 + shortBreak * 3 + longBreak;
    } else {
      totalMinutes = session.work_minutes || 60;
    }

    if (session.status === 'in_progress' && session.started_at) {
      const elapsedMs = Date.now() - new Date(session.started_at).getTime();
      const totalMs = totalMinutes * 60 * 1000;
      const remaining = Math.max(0, Math.floor((totalMs - elapsedMs) / 1000 / 60));
      const h = Math.floor(remaining / 60);
      const m = remaining % 60;
      return h > 0 ? `${h}h ${m}min left` : `${m}min left`;
    }

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
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
          <Text style={styles.headerTitle}>Active Sessions</Text>
          <TouchableOpacity style={styles.codeButtonHeader} onPress={() => setShowCodeModal(true)}>
            <Text style={styles.codeButtonText}>Enter Invite Code</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Join an Active Session!</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFF" />
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>no active sessions ☹️</Text>
            </View>
          ) : (
            sessions.map((session) => {
              const host = session.profiles;
              const participants = session.session_participants || [];
              
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => handleSessionTap(session)}
                >
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionName} numberOfLines={1}>
                      Room #{session.invite_code}: {session.name || 'Untitled'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#000" />
                  </View>

                  <View style={styles.sessionMeta}>
                    <View style={styles.hostSection}>
                      <Text style={styles.hostLabel}>Host</Text>
                      <View style={styles.hostRow}>
                        <View style={styles.smallAvatar}>
                          <Text style={styles.smallAvatarText}>
                            {(host?.display_name || 'H').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        {participants.slice(0, 2).filter(p => p.user_id !== session.host_id).map((p, idx) => (
                          <View key={idx} style={[styles.smallAvatar, { marginLeft: -8 }]}>
                            <Text style={styles.smallAvatarText}>
                              {(p.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <Text style={styles.timeLeft}>{formatTimeLeft(session)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <Modal
          transparent
          visible={showCodeModal}
          animationType="slide"
          onRequestClose={() => setShowCodeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowCodeModal(false);
                  setInviteCode('');
                  setCodeError('');
                }}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>

              <Ionicons name="enter-outline" size={48} color="#8B1E1E" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Enter Invite Code</Text>
              <Text style={styles.modalSubtitle}>Ask your mate for their session code</Text>

              <TextInput
                style={styles.codeInput}
                value={inviteCode}
                onChangeText={(text) => {
                  setInviteCode(text.toUpperCase());
                  setCodeError('');
                }}
                placeholder="ABC123"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                returnKeyType="join"
                onSubmitEditing={handleJoinByCode}
              />

              {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}

              <TouchableOpacity
                style={[styles.joinButton, joiningCode && styles.joinButtonDisabled]}
                onPress={handleJoinByCode}
                disabled={joiningCode}
              >
                {joiningCode ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.joinButtonText}>Join Session</Text>
                )}
              </TouchableOpacity>
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
    paddingHorizontal: responsive.contentPadding,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsive.fontSize.xxl,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  codeButtonHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  codeButtonText: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsive.contentPadding,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: responsive.fontSize.xl,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: responsive.fontSize.xl,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: responsive.padding.md,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionName: {
    flex: 1,
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginRight: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostSection: {
    flex: 1,
  },
  hostLabel: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
    marginBottom: 4,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  smallAvatarText: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  timeLeft: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: responsive.fontSize.xxl,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#8B1E1E',
    textAlign: 'center',
    letterSpacing: 4,
    width: '100%',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  errorText: {
    color: '#B71C1C',
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 12,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#8B1E1E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
