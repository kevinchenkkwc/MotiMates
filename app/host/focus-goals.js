import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function FocusGoals() {
  const router = useRouter();
  const { sessionName, isPublic } = useLocalSearchParams();
  const [goals, setGoals] = useState('');

  const handleNext = () => {
    router.push({ 
      pathname: '/host/set-timer', 
      params: { sessionName, isPublic, goals } 
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
          
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>Add focus goals</Text>
            <MaterialCommunityIcons name="pencil" size={24} color="#FFFFFF" />
          </View>

          <TextInput
            style={styles.textArea}
            value={goals}
            onChangeText={setGoals}
            placeholder="• What do you want to accomplish?&#10;• Break down your tasks&#10;• Set specific goals"
            placeholderTextColor="#999"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
          />

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    minHeight: 200,
    marginBottom: 32,
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
});
