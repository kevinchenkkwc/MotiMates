import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getCurrentUser, getProfile } from '../../utils/api';
import { responsive } from '../../utils/responsive';

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

  const blockedApps = [
    { name: 'Instagram', preventions: 'x5 preventions' },
    { name: 'TikTok', preventions: 'x17 preventions' },
  ];

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
          <View style={styles.blockedAppsContainer}>
            {blockedApps.map((app, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.blockedAppCard}
              >
                <Text style={styles.blockedAppName}>{app.name}</Text>
                <View style={styles.preventionRow}>
                  <Text style={styles.preventionText}>{app.preventions}</Text>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/blocked-apps')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
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
                  <View style={[styles.statusDot, { backgroundColor: friend.color }]} />
                  <Text style={styles.friendStatus}>{friend.status}</Text>
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
  blockedAppsContainer: {
    flexDirection: 'row',
    gap: responsive.padding.sm,
    flexWrap: 'wrap',
  },
  blockedAppCard: {
    backgroundColor: 'rgba(139, 69, 19, 0.6)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: responsive.padding.md,
    width: responsive.isTablet ? 160 : 140,
  },
  blockedAppName: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: responsive.padding.lg,
  },
  preventionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preventionText: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: 'rgba(139, 69, 19, 0.6)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: 60,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
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
