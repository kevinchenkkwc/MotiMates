import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function BlockedApps() {
  const router = useRouter();
  const [apps, setApps] = useState([
    { id: 1, name: 'Instagram', icon: 'instagram', preventions: 5, color: '#E4405F' },
    { id: 2, name: 'TikTok', icon: 'music-note', preventions: 17, color: '#000000' },
    { id: 3, name: 'YouTube', icon: 'youtube', preventions: 3, color: '#FF0000' },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');

  const handleRemoveApp = (appId) => {
    setApps(apps.filter(app => app.id !== appId));
  };

  const handleAddApp = () => {
    if (newAppName.trim()) {
      const newApp = {
        id: Date.now(),
        name: newAppName.trim(),
        icon: 'block-helper',
        preventions: 0,
        color: '#666666',
      };
      setApps([...apps, newApp]);
      setNewAppName('');
      setShowAddModal(false);
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blocked Apps</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            These apps will be blocked during your focus sessions
          </Text>

          <View style={styles.appsList}>
            {apps.map((app) => (
              <View key={app.id} style={styles.appCard}>
                <View style={styles.appLeft}>
                  <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                    <MaterialCommunityIcons name={app.icon} size={24} color="#FFF" />
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appStat}>×{app.preventions} preventions</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveApp(app.id)}
                >
                  <Ionicons name="close-circle" size={24} color="#B71C1C" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#FFF" />
            <Text style={styles.addButtonText}>Add App to Block List</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#FFF" />
            <Text style={styles.infoText}>
              Blocked apps cannot be accessed during focus sessions. Your mates will be notified if you request access.
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <Modal transparent visible={showAddModal} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Add Blocked App</Text>
              <TextInput
                style={styles.modalInput}
                value={newAppName}
                onChangeText={setNewAppName}
                placeholder="App name (e.g., Twitter, Facebook)"
                placeholderTextColor="#999"
                returnKeyType="done"
                onSubmitEditing={handleAddApp}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewAppName('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalAddButton} onPress={handleAddApp}>
                  <Text style={styles.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    lineHeight: 20,
  },
  appsList: {
    gap: 12,
    marginBottom: 20,
  },
  appCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: 2,
  },
  appStat: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: '#8B1E1E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
