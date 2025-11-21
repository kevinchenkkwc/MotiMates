import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function PendingExit() {
  const router = useRouter();
  const { sessionName, totalMinutes, goals, reason } = useLocalSearchParams();

  const handleApprove = () => {
    router.push({
      pathname: '/session/summary',
      params: {
        sessionName,
        totalMinutes,
        endedEarly: 'true',
        goals,
      },
    });
  };

  const handleDecline = () => {
    router.push({
      pathname: '/session/active',
      params: {
        sessionName,
        totalMinutes,
        goals,
        exitDeclined: 'true',
      },
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Pending approval...</Text>
          <Text style={styles.subtitle}>Waiting for your mates to review this request.</Text>

          {reason ? (
            <View style={styles.reasonCard}>
              <Text style={styles.reasonLabel}>Reason</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}

          <View style={styles.devRow}>
            <TouchableOpacity style={styles.devButtonApprove} onPress={handleApprove}>
              <Text style={styles.devButtonText}>DEV Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devButtonDecline} onPress={handleDecline}>
              <Text style={styles.devButtonText}>DEV Decline</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  reasonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  reasonLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
  devRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  devButtonApprove: {
    flex: 1,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  devButtonDecline: {
    flex: 1,
    backgroundColor: '#B71C1C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  devButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
