import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  const stats = [
    { value: '17', label: 'DAY STREAK' },
    { value: '67', label: 'HOURS\nFOCUSED' },
    { value: '#2', label: 'MATE\nRANK' },
  ];

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
          <Text style={styles.welcomeText}>Welcome, Hannah!</Text>
          
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
              <View key={index} style={styles.blockedAppCard}>
                <Text style={styles.blockedAppName}>{app.name}</Text>
                <View style={styles.preventionRow}>
                  <Text style={styles.preventionText}>{app.preventions}</Text>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton}>
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
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  statsContainer: {
    alignItems: 'flex-end',
    position: 'absolute',
    right: 20,
    top: 60,
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 14,
  },
  cardsContainer: {
    paddingHorizontal: 40,
    gap: 16,
    alignItems: 'flex-start',
    paddingLeft: 25,
  },
  cardWrapper: {
    width: '82%',
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    position: 'relative',
  },
  cardTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#000000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  cardArrow: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -15,
  },
  arrowText: {
    fontSize: 40,
    color: '#666666',
  },
  blockedAppsSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  blockedAppsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  blockedAppCard: {
    backgroundColor: 'rgba(139, 69, 19, 0.6)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 16,
    width: 150,
  },
  blockedAppName: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  preventionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preventionText: {
    fontSize: 12,
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
    paddingHorizontal: 20,
    marginTop: 24,
  },
  motiMatesTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#000000',
    marginBottom: 16,
  },
  friendsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 20,
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
    marginBottom: 8,
  },
  friendInitial: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  friendName: {
    fontSize: 12,
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
    fontSize: 10,
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
    marginBottom: 8,
  },
  findMatePlus: {
    fontSize: 32,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
  },
  findMateText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000000',
    textAlign: 'center',
  },
});
