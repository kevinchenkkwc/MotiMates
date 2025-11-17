import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function Join() {
  const router = useRouter();

  const activeSessions = [
    {
      id: 1,
      name: 'Room #1: WE\'RE LOCKED IN',
      timeLeft: '1h 32min',
      host: 'Kevin Chen',
      participants: ['K', 'D', 'A', '+2']
    },
    {
      id: 2,
      name: 'Room #2: At the Trenches',
      timeLeft: '45min',
      host: 'Charlotte Zhu',
      participants: ['C', 'A']
    },
    {
      id: 3,
      name: 'Study #5 in the Trenches',
      timeLeft: '2h 15min',
      host: 'Derek Bao',
      participants: ['D', 'J', 'S', '+1']
    }
  ];

  const handleJoinSession = (sessionId) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (session) {
      // Convert time string to minutes (e.g., "1h 32min" -> 92)
      const timeMatch = session.timeLeft.match(/(\d+)h\s*(\d+)min/);
      let totalMinutes = 0;
      if (timeMatch) {
        totalMinutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
      } else {
        const minMatch = session.timeLeft.match(/(\d+)min/);
        if (minMatch) {
          totalMinutes = parseInt(minMatch[1]);
        }
      }
      
      router.push({ 
        pathname: '/session/goals', 
        params: { 
          sessionName: session.name,
          totalMinutes: totalMinutes.toString(),
        } 
      });
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
          <Text style={styles.headerTitle}>Active Sessions</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Join an active session!</Text>

          {activeSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <Text style={styles.sessionName}>{session.name}</Text>
              
              <View style={styles.sessionInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Time Left: </Text>
                  <Text style={styles.value}>{session.timeLeft}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Hosted by</Text>
                </View>
                <View style={styles.hostRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{session.host.charAt(0)}</Text>
                  </View>
                  <Text style={styles.hostName}>{session.host}</Text>
                </View>

                <View style={styles.participantsRow}>
                  <Text style={styles.label}>JOIN IN NOW!*</Text>
                  <View style={styles.participantAvatars}>
                    {session.participants.map((p, idx) => (
                      <View key={idx} style={styles.smallAvatar}>
                        <Text style={styles.smallAvatarText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.joinButton}
                onPress={() => handleJoinSession(session.id)}
              >
                <Text style={styles.joinButtonText}>Join Session</Text>
              </TouchableOpacity>
            </View>
          ))}

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
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sessionName: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 12,
  },
  sessionInfo: {
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  hostName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantAvatars: {
    flexDirection: 'row',
    gap: 4,
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#8B1E1E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
