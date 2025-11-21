import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, TextInput, Modal, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

export default function SessionSummary() {
  const router = useRouter();
  const { sessionName, totalMinutes, endedEarly, goals } = useLocalSearchParams();
  const [productivity, setProductivity] = useState(0);
  const [reflection, setReflection] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDone = () => {
    setShowConfirm(true);
    setTimeout(() => {
      setShowConfirm(false);
      router.replace('/tabs/3-home');
    }, 1500);
  };

  const minutes = totalMinutes ? parseInt(totalMinutes) || 0 : 0;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const durationText = minutes
    ? `${hours > 0 ? `${hours}h ` : ''}${mins}min`
    : 'your co-focus session';

  const early = endedEarly === 'true';

  let goalsList = [];
  let rawGoals = goals;

  if (goals) {
    try {
      const decoded = decodeURIComponent(goals);
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed)) {
        goalsList = parsed;
      } else {
        rawGoals = decoded;
      }
    } catch (e) {
      rawGoals = goals;
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text style={styles.title}>{early ? 'Request Approved' : 'End Summary'}</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {early ? `Session ended early${sessionName ? '' : ''}` : 'Congratulations!'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {early
                ? `You've logged ${durationText} of co-focus time.`
                : "You've just completed a co-focus session!"}
            </Text>

            {goalsList.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Focus Goals</Text>
                {goalsList.map((goal) => (
                  <Text
                    key={goal.id}
                    style={[
                      styles.goalsText,
                      goal.completed && styles.goalsTextCompleted,
                    ]}
                  >
                    {goal.completed ? '✓ ' : '• '}
                    {goal.text}
                  </Text>
                ))}
              </View>
            ) : rawGoals ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Focus Goals</Text>
                <Text style={styles.goalsText}>{rawGoals}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Focus Partners</Text>
              <View style={styles.partnersRow}>
                <View style={styles.partnerAvatar}>
                  <Text style={styles.partnerAvatarText}>K</Text>
                </View>
                <View style={styles.partnerAvatar}>
                  <Text style={styles.partnerAvatarText}>D</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Duration: {durationText}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Rate Productivity</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={[styles.star, productivity >= star && styles.starActive]}
                    onPress={() => setProductivity(star)}
                  >
                    <Text style={styles.starText}>{star}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reflection ✏️</Text>
              <TextInput
                style={styles.reflectionInput}
                value={reflection}
                onChangeText={setReflection}
                placeholder="Add your notes..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        <Modal
          transparent
          visible={showConfirm}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>✓ Reflection Submitted!</Text>
            </View>
          </View>
        </Modal>
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
    paddingTop: 64,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 18,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: 12,
  },
  goalsText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    lineHeight: 18,
  },
  goalsTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  goalsGroup: {
    marginBottom: 8,
  },
  goalsGroupLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#555',
    marginBottom: 4,
  },
  partnersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  partnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerAvatarText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starActive: {
    backgroundColor: '#FFB84D',
  },
  starText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
  },
  reflectionInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    minHeight: 100,
  },
  doneButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B1E1E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 250,
  },
  confirmText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2E7D32',
  },
});
