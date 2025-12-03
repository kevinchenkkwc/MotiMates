import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { responsive } from '../../utils/responsive';

export default function FriendsScreen() {
  const router = useRouter();

  const friends = [
    { name: 'Derek Bao', status: 'Online', color: '#90EE90' },
    { name: 'Kevin Chen', status: 'In Session', color: '#FFD700' },
    { name: 'Adam Sun', status: 'Offline', color: '#D3D3D3' },
  ];

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Your MotiMates</Text>
          <Text style={styles.subtitle}>Wizard-of-oz friends list for demo</Text>

          <View style={styles.friendsList}>
            {friends.map((friend, index) => (
              <View key={index} style={styles.friendRow}>
                <View style={[styles.avatar, { backgroundColor: '#DDD' }]}>
                  <Text style={styles.avatarText}>{friend.name.charAt(0)}</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: friend.color }]} />
                    <Text style={styles.friendStatus}>{friend.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
    width: '100%',
    maxWidth: responsive.maxWidth,
    paddingTop: 0,
  },
  scrollContent: {
    paddingHorizontal: responsive.contentPadding,
    paddingBottom: responsive.padding.xl,
  },
  header: {
    paddingHorizontal: responsive.contentPadding,
    paddingTop: 60,
    paddingBottom: responsive.padding.sm,
  },
  headerBackButton: {
    width: 40,
  },
  title: {
    fontSize: responsive.fontSize.xxxl,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: responsive.padding.xs,
  },
  subtitle: {
    fontSize: responsive.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: responsive.padding.lg,
  },
  friendsList: {
    gap: responsive.padding.md,
    marginBottom: responsive.padding.lg,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: responsive.isTablet ? 24 : 16,
    padding: responsive.padding.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsive.padding.md,
  },
  avatarText: {
    fontSize: responsive.fontSize.xl,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: responsive.fontSize.lg,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  friendStatus: {
    fontSize: responsive.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
});
