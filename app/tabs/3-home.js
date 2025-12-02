import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getCurrentUser, getProfile } from '../../utils/api';
import { responsive } from '../../utils/responsive';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState([
    { value: '0', label: 'DAY STREAK' },
    { value: '0', label: 'HOURS\nFOCUSED' },
    { value: '-', label: 'MATE\nRANK' },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const fallbackName =
          user.user_metadata?.display_name ||
          (user.email ? user.email.split('@')[0] : null);

        // Immediately use a fallback so we never stay on plain 'User'
        if (fallbackName) {
          setUsername(fallbackName);
        }

        try {
          const profile = await getProfile(user.id);
          if (profile) {
            if (profile.display_name) {
              setUsername(profile.display_name);
            }
            
            // Update stats from profile
            const hours = Math.floor((profile.total_focus_minutes || 0) / 60);
            const streak = profile.current_streak_days || 0;
            const rank = profile.mate_rank > 0 ? `#${profile.mate_rank}` : '-';
            
            setStats([
              { value: streak.toString(), label: 'DAY STREAK' },
              { value: hours.toString(), label: 'HOURS\nFOCUSED' },
              { value: rank, label: 'MATE\nRANK' },
            ]);
          }
        } catch (inner) {
          // Ignore profile errors; fallback name is already set
        }
      } catch (e) {
        // Keep defaults
      }
    })();
  }, []);

  const [blockedApps, setBlockedApps] = useState([
    { id: 1, name: 'Instagram', icon: 'instagram', color: '#E4405F' },
    { id: 2, name: 'TikTok', icon: 'music-note', color: '#000000' },
  ]);

  const handleMinimizeApp = (appId) => {
    setBlockedApps(blockedApps.filter(app => app.id !== appId));
  };

  const friends = [
    { name: 'Derek Bao', status: 'Online', color: '#90EE90' },
    { name: 'Kevin Chen', status: 'In Session', color: '#FFD700' },
    { name: 'Austin Konig', status: 'Offline', color: '#D3D3D3' },
  ];


  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            {username ? `Welcome, ${username}!` : 'Welcome!'}
          </Text>
          
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/tabs/2-join')}
            >
              <Text style={styles.cardTitle}>Quick Start</Text>
              <Text style={styles.cardSubtitle}>Join an active session</Text>
              <View style={styles.cardArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/tabs/1-host')}
            >
              <Text style={styles.cardTitle}>Host Session</Text>
              <Text style={styles.cardSubtitle}>Start a co-focus session</Text>
              <View style={styles.cardArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.blockedAppsSection}>
          <Text style={styles.sectionTitle}>Blocked Apps</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.blockedAppsScrollContainer}
          >
            {blockedApps.map((app) => (
              <View key={app.id} style={styles.blockedAppCard}>
                <TouchableOpacity 
                  style={styles.appMinimizeButton}
                  onPress={() => handleMinimizeApp(app.id)}
                >
                  <MaterialCommunityIcons name="close" size={14} color="rgba(255, 255, 255, 0.6)" />
                </TouchableOpacity>
                <View style={[styles.appIconCircle, { backgroundColor: app.color }]}>
                  <MaterialCommunityIcons name={app.icon} size={32} color="#FFF" />
                </View>
                <Text style={styles.blockedAppName} numberOfLines={1}>{app.name}</Text>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.addAppCard}
              onPress={() => router.push('/blocked-apps')}
            >
              <View style={styles.addAppCircle}>
                <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
              </View>
              <Text style={styles.addAppText}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.motiMatesSection}>
          <View style={styles.friendsContainer}>
            <Text style={styles.motiMatesTitle}>Your MotiMates</Text>
            <View style={styles.friendsRow}>
              {friends.map((friend, index) => (
                <View key={index} style={styles.friendItem}>
                  <View style={[styles.friendAvatar, { backgroundColor: '#DDD' }]}>
                    <Text style={styles.friendInitial}>{friend.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <View style={styles.statusRow}>
                    <Text style={styles.friendStatus}>{friend.status}</Text>
                    <View style={[styles.statusDot, { backgroundColor: friend.color }]} />
                  </View>
                </View>
              ))}
              <TouchableOpacity 
                style={styles.findMateButton}
                onPress={() => router.push('/friends')}
              >
                <View style={styles.findMateCircle}>
                  <Text style={styles.findMatePlus}>+</Text>
                </View>
                <Text style={styles.findMateText}>Find Mate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
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
  scrollView: {
    flex: 1,
    paddingTop: 60,
    width: '100%',
    maxWidth: responsive.maxWidth,
  },
  header: {
    paddingHorizontal: responsive.contentPadding,
    marginBottom: responsive.padding.sm,
  },
  welcomeText: {
    fontSize: responsive.fontSize.xxxl,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: responsive.padding.md,
  },
  statsContainer: {
    position: 'absolute',
    right: responsive.contentPadding * 0.00000001,
    top: 60,
    width: responsive.isTablet ? 160 : 120,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: responsive.padding.md,
  },
  statValue: {
    fontSize: responsive.fontSize.huge,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    lineHeight: responsive.fontSize.huge * 1.1,
  },
  statLabel: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: responsive.fontSize.sm * 1.2,
  },
  cardsContainer: {
    paddingHorizontal: responsive.isTablet ? responsive.contentPadding : 50,
    gap: responsive.padding.md,
    alignItems: 'flex-start',
    paddingLeft: responsive.contentPadding,
  },
  cardWrapper: {
    width: responsive.isTablet ? '90%' : '82%',
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: responsive.isTablet ? 30 : 20,
    padding: responsive.padding.lg,
    marginBottom: responsive.padding.md,
    position: 'relative',
  },
  cardTitle: {
    fontSize: responsive.fontSize.xxl * 1.2,
    fontFamily: 'Poppins_700Bold',
    color: '#000000',
    marginBottom: responsive.padding.xs,
  },
  cardSubtitle: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  cardArrow: {
    position: 'absolute',
    right: responsive.padding.lg,
    top: '50%',
    marginTop: -15,
  },
  arrowText: {
    fontSize: 40,
    color: '#666666',
  },
  blockedAppsSection: {
    paddingHorizontal: responsive.contentPadding,
    marginTop: responsive.padding.sm,
  },
  sectionTitle: {
    fontSize: responsive.fontSize.xxl,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: responsive.padding.sm,
  },
  blockedAppsScrollContainer: {
    paddingRight: responsive.contentPadding,
    gap: 12,
  },
  blockedAppCard: {
    backgroundColor: 'rgba(139, 69, 19, 0.6)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 16,
    width: 110,
    alignItems: 'center',
    position: 'relative',
  },
  appMinimizeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  appIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockedAppName: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  addAppCard: {
    backgroundColor: 'rgba(139, 69, 19, 0.4)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    padding: 16,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAppCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addAppText: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  motiMatesSection: {
    paddingHorizontal: responsive.contentPadding,
    marginTop: responsive.padding.lg,
  },
  motiMatesTitle: {
    fontSize: responsive.fontSize.xl,
    fontFamily: 'Poppins_700Bold',
    color: '#000000',
    marginBottom: responsive.padding.md,
  },
  friendsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: responsive.isTablet ? 30 : 20,
    padding: responsive.padding.md,
  },
  friendsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  friendItem: {
    alignItems: 'center',
    width: 80,
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsive.padding.sm,
  },
  friendInitial: {
    fontSize: responsive.fontSize.xxl,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  friendName: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  friendStatus: {
    fontSize: responsive.fontSize.xs,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
    textAlign: 'center',
  },
  findMateButton: {
    alignItems: 'center',
    width: 80,
  },
  findMateCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsive.padding.sm,
  },
  findMatePlus: {
    fontSize: 32,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
  },
  findMateText: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000000',
    textAlign: 'center',
  },
});
