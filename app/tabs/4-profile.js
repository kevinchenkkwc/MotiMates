import { View, Text, StyleSheet, ImageBackground, ScrollView, TouchableOpacity } from 'react-native';

export default function Profile() {
  return (
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
              <Text style={styles.profileInitial}>H</Text>
            </View>
            <Text style={styles.profileHandle}>@hhycheng</Text>
            <Text style={styles.profileSchool}>Stanford University</Text>
          </View>

          <View style={styles.blockedAppsSection}>
            <Text style={styles.sectionTitle}>Blocked Apps</Text>
            <View style={styles.blockedAppsRow}>
              <TouchableOpacity style={styles.appCard}>
                <Text style={styles.appName}>Instagram</Text>
                <Text style={styles.appStat}>x5 preventions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.appCard}>
                <Text style={styles.appName}>TikTok</Text>
                <Text style={styles.appStat}>x17 preventions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addAppCard}>
                <Text style={styles.addAppText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.reflectionsButton}>
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
              <Text style={styles.statNumber}>127</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>67h</Text>
              <Text style={styles.statLabel}>Focused</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>17</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
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
  profileSchool: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
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
