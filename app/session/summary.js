import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, TextInput, Modal, Keyboard, ScrollView, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getSession, getSessionParticipants, getFocusGoals, saveReflection, getCurrentUser, leaveSession } from '../../utils/api';
import { supabase } from '../../utils/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { responsive } from '../../utils/responsive';

const dismissKeyboard = () => {
  Keyboard.dismiss();
};

export default function SessionSummary() {
  const router = useRouter();
  const { sessionId, sessionName, totalMinutes, endedEarly } = useLocalSearchParams();
  const [productivity, setProductivity] = useState(0);
  const [reflection, setReflection] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [participantsWithGoals, setParticipantsWithGoals] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadSummaryData();
  }, []);

  const loadSummaryData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }
      setCurrentUserId(user.id);

      const sessionData = await getSession(sessionId);
      setSession(sessionData);

      const participants = await getSessionParticipants(sessionId);
      
      // Load goals for each participant
      const participantsWithGoalsData = await Promise.all(
        participants.map(async (p) => {
          const goals = await getFocusGoals(sessionId, p.user_id);
          return {
            ...p,
            goals,
            completed: goals.filter(g => g.is_completed).length,
            total: goals.length,
          };
        })
      );

      setParticipantsWithGoals(participantsWithGoalsData);
    } catch (e) {
      console.error('Failed to load summary:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async () => {
    // Save reflection if provided
    if (reflection.trim() && sessionId) {
      try {
        await saveReflection(sessionId, reflection.trim());
      } catch (e) {
        console.error('Failed to save reflection:', e);
      }
    }

    // Leave the session
    if (sessionId) {
      try {
        await leaveSession(sessionId);
        
        // Check if user is host - if so, mark session as ended
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('host_id')
          .eq('id', sessionId)
          .single();
        
        if (sessionData && sessionData.host_id === currentUserId) {
          // Host is leaving - end the session
          await supabase
            .from('sessions')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', sessionId);
        }
        
        // Broadcast participant change
        const channel = supabase.channel(`session:${sessionId}`);
        await channel.send({
          type: 'broadcast',
          event: 'participant_change',
          payload: { userId: currentUserId, action: 'left' },
        });
        await supabase.removeChannel(channel);
      } catch (e) {
        console.error('Failed to leave session:', e);
      }
    }

    setShowConfirm(true);
    setTimeout(() => {
      setShowConfirm(false);
      router.replace('/tabs/3-home');
    }, 1500);
  };

  const minutes = totalMinutes ? parseInt(totalMinutes) || 0 : 0;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const durationText = minutes
    ? `${hours > 0 ? `${hours}h ` : ''}${mins}min`
    : 'your co-focus session';

  const early = endedEarly === 'true';

  const totalGoalsCompleted = participantsWithGoals.reduce((sum, p) => sum + p.completed, 0);
  const totalGoals = participantsWithGoals.reduce((sum, p) => sum + p.total, 0);
  const successRate = totalGoals > 0 ? Math.round((totalGoalsCompleted / totalGoals) * 100) : 0;

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
            <Text style={styles.loadingText}>Loading summary...</Text>
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
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={responsive.keyboardVerticalOffset}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <ScrollView 
              style={styles.content} 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
          <Text style={styles.title}>{early ? 'Session Ended' : '🎉 Session Complete!'}</Text>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{durationText}</Text>
              <Text style={styles.statLabel}>Focused</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalGoalsCompleted}/{totalGoals}</Text>
              <Text style={styles.statLabel}>Goals Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{successRate}%</Text>
              <Text style={styles.statLabel}>Success</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Team Progress</Text>
            
            {participantsWithGoals.map((participant) => (
              <View key={participant.user_id} style={styles.participantSection}>
                <View style={styles.participantHeader}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantAvatarText}>
                      {(participant.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>
                      {participant.profiles?.display_name || 'User'}
                      {participant.user_id === currentUserId && ' (You)'}
                    </Text>
                    <Text style={styles.participantStats}>
                      {participant.completed}/{participant.total} goals completed
                    </Text>
                  </View>
                </View>
                {participant.goals.length > 0 && (
                  <View style={styles.goalsContainer}>
                    {participant.goals.map((goal) => (
                      <View key={goal.id} style={styles.goalRow}>
                        <Ionicons
                          name={goal.is_completed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={goal.is_completed ? '#4CAF50' : '#999'}
                        />
                        <Text style={[
                          styles.goalText,
                          goal.is_completed && styles.goalTextCompleted
                        ]}>
                          {goal.goal_text}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Duration: {durationText}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Rate Productivity</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={[styles.star, productivity >= star && styles.starActive]}
                    onPress={() => setProductivity(star)}
                  >
                    <Text style={styles.starText}>{star}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Quick Reflection</Text>
              <Text style={styles.sectionSubtext}>How did this session go? What could you improve next time?</Text>
              <TextInput
                style={styles.reflectionInput}
                value={reflection}
                onChangeText={setReflection}
                placeholder="I felt productive because..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleDone}>
                <Text style={styles.submitButtonText}>Submit Reflection</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/tabs/3-home')}>
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        <Modal
          transparent
          visible={showConfirm}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>✓ Reflection Submitted!</Text>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 18,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 12,
  },
  goalsText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    lineHeight: 18,
  },
  goalsTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  goalsGroup: {
    marginBottom: 8,
  },
  goalsGroupLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#555',
    marginBottom: 4,
  },
  partnersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  partnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerAvatarText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starActive: {
    backgroundColor: '#FFB84D',
  },
  starText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
  },
  reflectionInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#8B1E1E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
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
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 64,
    paddingBottom: 32,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#8B1E1E',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#DDD',
  },
  participantSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  participantStats: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 2,
  },
  goalsContainer: {
    marginLeft: 52,
    gap: 8,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    flex: 1,
  },
  goalTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 250,
  },
  confirmText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2E7D32',
  },
});
