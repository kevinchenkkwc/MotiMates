import { View, Text, StyleSheet, ImageBackground, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getCurrentUserProfile, updateUserProfile } from '../../utils/api';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getCurrentUserProfile();
      setProfile(data);
      setBioText(data?.bio || '');
    } catch (e) {
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      setSaving(true);
      await updateUserProfile({ bio: bioText });
      setProfile({ ...profile, bio: bioText });
      setEditingBio(false);
    } catch (e) {
      alert('Failed to save bio');
    } finally {
      setSaving(false);
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

  const username = profile?.display_name || 'User';
  const initial = username.charAt(0).toUpperCase();
  const bio = profile?.bio || 'No bio yet. Tap to add one!';

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitial}>{initial}</Text>
            </View>
            <Text style={styles.profileHandle}>@{username.toLowerCase().replace(/\s+/g, '')}</Text>
            
            {!editingBio ? (
              <TouchableOpacity 
                style={styles.bioContainer}
                onPress={() => setEditingBio(true)}
              >
                <Text style={styles.bioText}>{bio}</Text>
                <Ionicons name="create-outline" size={18} color="#8B1E1E" style={styles.editIcon} />
              </TouchableOpacity>
            ) : (
              <View style={styles.bioEditContainer}>
                <TextInput
                  style={styles.bioInput}
                  value={bioText}
                  onChangeText={setBioText}
                  placeholder="Write your bio..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={150}
                  autoFocus
                />
                <View style={styles.bioActions}>
                  <TouchableOpacity 
                    style={styles.bioCancel}
                    onPress={() => {
                      setBioText(profile?.bio || '');
                      setEditingBio(false);
                    }}
                  >
                    <Text style={styles.bioCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.bioSave, saving && { opacity: 0.6 }]}
                    onPress={handleSaveBio}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.bioSaveText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.blockedAppsSection}>
            <Text style={styles.sectionTitle}>Blocked Apps</Text>
            <View style={styles.blockedAppsRow}>
              <TouchableOpacity 
                style={styles.appCard}
                onPress={() => router.push('/blocked-apps')}
              >
                <Text style={styles.appName}>Instagram</Text>
                <Text style={styles.appStat}>x5 preventions</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.appCard}
                onPress={() => router.push('/blocked-apps')}
              >
                <Text style={styles.appName}>TikTok</Text>
                <Text style={styles.appStat}>x17 preventions</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addAppCard}
                onPress={() => router.push('/blocked-apps')}
              >
                <Text style={styles.addAppText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.reflectionsButton}
            onPress={() => router.push('/profile/reflections')}
          >
            <Text style={styles.reflectionsText}>Past Reflections</Text>
            <Text style={styles.reflectionsArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.leaderboardCard}>
            <Text style={styles.leaderboardTitle}>Leaderboard</Text>
            <View style={styles.leaderboardList}>
              <View style={styles.leaderItem}>
                <Text style={styles.rank}>1</Text>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>C</Text>
                </View>
                <Text style={styles.leaderName}>Charlotte Z</Text>
              </View>
              <View style={styles.leaderItem}>
                <Text style={styles.rank}>2</Text>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>A</Text>
                </View>
                <Text style={styles.leaderName}>Alan Cheng</Text>
              </View>
              <View style={styles.leaderItem}>
                <Text style={styles.rank}>3</Text>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>J</Text>
                </View>
                <Text style={styles.leaderName}>James L</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.total_sessions || 0}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {Math.floor((profile?.total_focus_minutes || 0) / 60)}h
              </Text>
              <Text style={styles.statLabel}>Focused</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.current_streak_days || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </ImageBackground>
    </View>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: '#999',
  },
  profileHandle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 4,
  },
  bioContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  bioText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    fontStyle: 'italic',
  },
  editIcon: {
    marginLeft: 8,
  },
  bioEditContainer: {
    marginTop: 8,
    width: '100%',
  },
  bioInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bioActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  bioCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  bioCancelText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
  },
  bioSave: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#8B1E1E',
  },
  bioSaveText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedAppsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  blockedAppsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  appCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  appName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: 4,
  },
  appStat: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  addAppCard: {
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAppText: {
    fontSize: 32,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  reflectionsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  reflectionsText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  reflectionsArrow: {
    fontSize: 24,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
  leaderboardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    display: 'none',
  },
  leaderboardTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 16,
  },
  leaderboardList: {
    gap: 12,
  },
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rank: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    width: 24,
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
  leaderName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
});
