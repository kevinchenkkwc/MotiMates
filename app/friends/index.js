import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function Friends() {
  const router = useRouter();

  const friends = [
    { id: 1, name: 'Derek Bao', status: 'online', emoji: '🟢' },
    { id: 2, name: 'Kevin Chen', status: 'away', emoji: '🟡' },
    { id: 3, name: 'Austin Konig', status: 'offline', emoji: '⚫' },
    { id: 4, name: 'Charlotte Z', status: 'online', emoji: '🟢' },
    { id: 5, name: 'Alan Cheng', status: 'away', emoji: '🟡' },
  ];

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
          <Text style={styles.headerTitle}>Friends</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Your Mates</Text>

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

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Mate"
              placeholderTextColor="#999"
              returnKeyType="search"
            />
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          </View>

          <View style={styles.friendsList}>
            {friends.map((friend) => (
              <TouchableOpacity key={friend.id} style={styles.friendItem}>
                <View style={styles.friendLeft}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{friend.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.statusEmoji}>{friend.emoji}</Text>
                </View>
                <View style={styles.friendActions}>
                  <TouchableOpacity style={styles.iconButton}>
                    <MaterialCommunityIcons name="message-text-outline" size={20} color="#000" />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.inviteButton}>
            <MaterialCommunityIcons name="account-plus-outline" size={20} color="#000" />
            <Text style={styles.inviteText}>Invite Mates</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  leaderboardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 18,
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
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    width: 24,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  leaderName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
    color: '#000',
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  friendsList: {
    gap: 12,
    marginBottom: 20,
  },
  friendItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    flex: 1,
  },
  statusEmoji: {
    fontSize: 12,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  inviteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    flex: 1,
  },
});
