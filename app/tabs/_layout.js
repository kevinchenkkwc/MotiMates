import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F5F5F5',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 88,
          paddingBottom: 24,
          paddingTop: 12,
          borderTopWidth: 0,
          position: 'absolute',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="1-host"
        options={{
          title: 'Host',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name="timer-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="2-join"
        options={{
          title: 'Join',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name="account-group-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="3-home"
        options={{
          title: '',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name="home" size={36} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="4-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name="person-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="5-settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name="settings-outline" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
