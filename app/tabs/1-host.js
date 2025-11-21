import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function Host() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showError, setShowError] = useState(false);

  const handleNext = () => {
    if (!sessionName.trim()) {
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 1500);
      return;
    }

    router.push({ pathname: '/host/focus-goals', params: { sessionName, isPublic: isPublic.toString() } });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Host a session</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Name your session</Text>
          <TextInput
            style={styles.input}
            value={sessionName}
            onChangeText={setSessionName}
            placeholder="Session name..."
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={() => {}}
            blurOnSubmit={true}
          />

          <Text style={styles.label}>Soon Accessible</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, isPublic && styles.toggleButtonActive]}
              onPress={() => setIsPublic(true)}
            >
              <Text style={[styles.toggleText, isPublic && styles.toggleTextActive]}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isPublic && styles.toggleButtonActive]}
              onPress={() => setIsPublic(false)}
            >
              <Text style={[styles.toggleText, !isPublic && styles.toggleTextActive]}>Private</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        <Modal transparent visible={showError} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Error: Please enter a session name!</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 120,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    marginBottom: 32,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 69, 19, 0.6)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 40,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  toggleText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  toggleTextActive: {
    color: '#000000',
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
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
  errorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 260,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B71C1C',
  },
});
