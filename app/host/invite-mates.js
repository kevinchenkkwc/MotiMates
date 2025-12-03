import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { createActiveSession, joinSessionById } from '../../utils/api';
import { supabase } from '../../utils/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function InviteMates() {
  const router = useRouter();
  const { sessionName, goals, totalMinutes, pomodoro, shortBreak, longBreak, usePomodoro, isPublic } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([
    { id: 1, name: 'Dominick', avatar: 'D', status: 'online', invited: false, accepted: false, declined: false },
    { id: 2, name: 'Kevin Chen', avatar: 'K', status: 'online', invited: false, accepted: false, declined: false },
    { id: 3, name: 'Steven Yoon', avatar: 'S', status: 'offline', invited: false, accepted: false, declined: false },
    { id: 4, name: 'Eliot Walsh', avatar: 'E', status: 'online', invited: false, accepted: false, declined: false },
    { id: 5, name: 'Johnny Luo', avatar: 'J', status: 'offline', invited: false, accepted: false, declined: false },
    { id: 6, name: 'Jannell', avatar: 'J', status: 'online', invited: false, accepted: false, declined: false },
  ]);

  const handleInvite = (friendId) => {
    // Immediately mark as invited, keep their current online/offline status
    setFriends(prev =>
      prev.map(friend => {
        if (friend.id !== friendId) return friend;
        if (friend.invited || friend.accepted || friend.declined) return friend;

        return {
          ...friend,
          invited: true,
        };
      })
    );

    // After a short delay, randomly accept or decline the invite
    setTimeout(() => {
      setFriends(prev =>
        prev.map(friend => {
          if (friend.id !== friendId) return friend;
          // If they've already responded or invite was cleared, do nothing
          if (!friend.invited || friend.accepted || friend.declined) return friend;

          const accepted = Math.random() < 0.6;

          if (accepted) {
            return {
              ...friend,
              invited: false,
              accepted: true,
              declined: false,
              status: 'in_session',
            };
          }

          return {
            ...friend,
            invited: false,
            accepted: false,
            declined: true,
          };
        })
      );
    }, 2000);
  };

  const handleStartSession = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // Create session in Supabase
      const isPomodoroMode = String(usePomodoro) === 'true';
      const session = await createActiveSession({
        name: sessionName,
        isPublic: String(isPublic) === 'true',
        mode: isPomodoroMode ? 'pomodoro' : 'uninterrupted',
        workMinutes: parseInt(pomodoro) || null,
        shortBreakMinutes: isPomodoroMode ? (parseInt(shortBreak) || null) : null,
        longBreakMinutes: isPomodoroMode ? (parseInt(longBreak) || null) : null,
      });

      // Host auto-joins the session
      await joinSessionById(session.id);

      // Broadcast session creation so Join tab updates
      const channel = supabase.channel('public-sessions-broadcast');
      await channel.send({
        type: 'broadcast',
        event: 'session_created',
        payload: { sessionId: session.id },
      });

      // Navigate to share code screen
      router.push({
        pathname: '/host/share-code',
        params: {
          sessionId: session.id,
          sessionName: session.name,
          inviteCode: session.invite_code,
          goals,
          totalMinutes,
          pomodoro,
          shortBreak,
          longBreak,
          usePomodoro,
          isPublic,
        },
      });
    } catch (e) {
      alert(e.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.sessionName}>{sessionName}</Text>
          <Text style={styles.sectionTitle}>Invite Mates</Text>

          <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
            {friends.map((friend) => {
              const statusLabel =
                friend.status === 'online' ? 'Online' :
                friend.status === 'offline' ? 'Offline' :
                'In session';

              return (
                <TouchableOpacity
                  key={friend.id}
                  style={styles.friendItem}
                  onPress={() => handleInvite(friend.id)}
                >
                  <View style={styles.friendInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{friend.avatar}</Text>
                    </View>
                    <View>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusPill,
                            friend.status === 'online' && styles.statusOnline,
                            friend.status === 'offline' && styles.statusOffline,
                            friend.status === 'in_session' && styles.statusInSession,
                          ]}
                        >
                          <Text style={styles.statusText}>{statusLabel}</Text>
                        </View>
                        {(() => {
                          let label = null;
                          let style = styles.invitedText;

                          if (friend.invited && !friend.accepted && !friend.declined) {
                            label = 'Invited';
                          } else if (friend.accepted) {
                            label = 'Accepted invite';
                          } else if (friend.declined) {
                            label = 'Declined invite';
                            style = styles.declinedText;
                          }

                          return label ? <Text style={style}>{label}</Text> : null;
                        })()}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity 
            style={[styles.startButton, loading && styles.startButtonDisabled]} 
            onPress={handleStartSession}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startButtonText}>Start Session</Text>
            )}
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
    paddingTop: 20,
  },
  sessionName: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  friendsList: {
    flex: 1,
    marginBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEE',
  },
  statusOnline: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusOffline: {
    backgroundColor: 'rgba(158, 158, 158, 0.3)',
  },
  statusInSession: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  invitedText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B1E1E',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#8B1E1E',
    borderColor: '#8B1E1E',
  },
  startButton: {
    backgroundColor: '#8B1E1E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
