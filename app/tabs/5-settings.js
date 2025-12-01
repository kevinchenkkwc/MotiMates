import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { signOut } from '../../utils/api';

export default function Settings() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      // If sign-out fails, still navigate back to login so the user can retry.
    } finally {
      router.replace('/auth/login');
    }
  };

  const SettingItem = ({ icon, label, value, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        {icon}
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <SettingItem icon={<Ionicons name="person-outline" size={20} color="#000" />} label="Accounts Center" />
              <SettingItem icon={<Ionicons name="lock-closed-outline" size={20} color="#000" />} label="Accounts Privacy" />
              <SettingItem icon={<Ionicons name="call-outline" size={20} color="#000" />} label="Phone" value="+XXXXXXXXXX" />
              <SettingItem icon={<Ionicons name="school-outline" size={20} color="#000" />} label="School" value="Stanford University" />
              <SettingItem
                icon={<Ionicons name="log-out-outline" size={20} color="#000" />}
                label="Log Out"
                onPress={handleLogout}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social</Text>
            <View style={styles.card}>
              <SettingItem icon={<Ionicons name="share-social-outline" size={20} color="#000" />} label="Share MotiMates" />
              <SettingItem icon={<MaterialCommunityIcons name="block-helper" size={20} color="#000" />} label="Blocked" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preference</Text>
            <View style={styles.card}>
              <SettingItem icon={<Ionicons name="notifications-outline" size={20} color="#000" />} label="Notifications" value="On" />
              <SettingItem icon={<Ionicons name="keypad-outline" size={20} color="#000" />} label="Pin Code Protection" value="On" />
            </View>
          </View>

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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginRight: 8,
  },
});
