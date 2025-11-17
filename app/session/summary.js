import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, TextInput, Modal, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function SessionSummary() {
  const router = useRouter();
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

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text style={styles.title}>End Summary</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Congratulations!</Text>
            <Text style={styles.cardSubtitle}>You've just completed a 2h 45min co-focus session!</Text>

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
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: 12,
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
