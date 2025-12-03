import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { signOut } from '../../utils/api';
import { supabase } from '../../utils/supabase';

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert('Error', 'No user found');
                return;
              }

              const userId = user.id;

              // Delete user's data from all related tables (order matters for foreign keys)
              // 1. Delete unlock votes by this user
              await supabase.from('unlock_votes').delete().eq('voter_id', userId);
              
              // 2. Delete unlock requests by this user
              await supabase.from('unlock_requests').delete().eq('requester_id', userId);
              
              // 3. Delete focus goals by this user
              await supabase.from('focus_goals').delete().eq('user_id', userId);
              
              // 4. Delete reflections by this user
              await supabase.from('reflections').delete().eq('user_id', userId);
              
              // 5. Delete session participations
              await supabase.from('session_participants').delete().eq('user_id', userId);
              
              // 6. Delete sessions hosted by this user
              await supabase.from('sessions').delete().eq('host_id', userId);
              
              // 7. Delete user profile
              await supabase.from('profiles').delete().eq('id', userId);

              // 8. Sign out and redirect
              await signOut();
              
              router.replace('/auth/login');
            } catch (e) {
              console.error('Failed to delete account:', e);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
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
              <SettingItem
                icon={<Ionicons name="trash-outline" size={20} color="#B71C1C" />}
                label="Delete Account"
                onPress={handleDeleteAccount}
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
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
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
