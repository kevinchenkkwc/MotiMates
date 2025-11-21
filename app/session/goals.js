import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function SessionGoals() {
  const router = useRouter();
  const { sessionName, totalMinutes } = useLocalSearchParams();
  const [goalItems, setGoalItems] = useState([]);
  const [newGoal, setNewGoal] = useState('');

  const addGoal = () => {
    const text = newGoal.trim();
    if (!text) return;
    setGoalItems((prev) => [
      ...prev,
      { id: Date.now().toString(), text, completed: false },
    ]);
    setNewGoal('');
  };

  const handleNext = () => {
    let items = goalItems;
    const text = newGoal.trim();
    if (text) {
      items = [
        ...goalItems,
        { id: Date.now().toString(), text, completed: false },
      ];
    }

    const goalsParam =
      items.length > 0 ? encodeURIComponent(JSON.stringify(items)) : '';

    router.push({
      pathname: '/session/wait',
      params: {
        mode: 'join',
        sessionName,
        goals: goalsParam,
        totalMinutes,
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sessionName}>{sessionName}</Text>

          <View style={styles.titleRow}>
            <Text style={styles.title}>Set focus goals</Text>
            <MaterialCommunityIcons name="pencil" size={24} color="#FFFFFF" />
          </View>

          <Text style={styles.subtitle}>
            Let your mates know what you’re working on this session.
          </Text>

          <View style={styles.goalsContent}>
            {goalItems.map((goal) => (
              <View key={goal.id} style={styles.goalRow}>
                <View style={styles.goalCheckbox}>
                  <Ionicons name="square-outline" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.goalText}>{goal.text}</Text>
              </View>
            ))}

            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newGoal}
                onChangeText={setNewGoal}
                placeholder="Add a new goal..."
                placeholderTextColor="#999"
                returnKeyType="done"
                onSubmitEditing={addGoal}
              />
              <TouchableOpacity style={styles.addButton} onPress={addGoal}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Join Session</Text>
          </TouchableOpacity>
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
  },
  backButton: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 32,
  },
  sessionName: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  goalsScroll: {
    flex: 1,
    marginBottom: 24,
  },
  goalsContent: {
    paddingBottom: 8,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalCheckbox: {
    width: 22,
    alignItems: 'center',
    marginRight: 8,
  },
  goalText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B1E1E',
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
