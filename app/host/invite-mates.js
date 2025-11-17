import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function InviteMates() {
  const router = useRouter();
  const { sessionName, goals, totalMinutes } = useLocalSearchParams();
  
  const [friends] = useState([
    { id: 1, name: 'Dominick', avatar: 'D' },
    { id: 2, name: 'Kevin Chen', avatar: 'K' },
    { id: 3, name: 'Steven Yoon', avatar: 'S' },
    { id: 4, name: 'Eliot Walsh', avatar: 'E' },
    { id: 5, name: 'Johnny Luo', avatar: 'J' },
    { id: 6, name: 'Jannell', avatar: 'J' },
  ]);
  
  const [selectedFriends, setSelectedFriends] = useState([]);

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleStartSession = () => {
    router.push({ 
      pathname: '/session/active', 
      params: { sessionName, goals, totalMinutes } 
    });
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
            {friends.map((friend) => (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendItem}
                onPress={() => toggleFriend(friend.id)}
              >
                <View style={styles.friendInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{friend.avatar}</Text>
                  </View>
                  <Text style={styles.friendName}>{friend.name}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedFriends.includes(friend.id) && styles.checkboxActive
                ]}>
                  {selectedFriends.includes(friend.id) && (
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.startButton} onPress={handleStartSession}>
            <Text style={styles.startButtonText}>Start Session</Text>
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
    fontSize: 14,
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
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
