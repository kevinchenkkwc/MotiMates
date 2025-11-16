import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabBarIcon({ name, focused }) {
  const icons = {
    host: '⏱',
    friends: '👥',
    home: '🏠',
    profile: '👤',
    settings: '⚙️',
  };
  
  return (
    <Text style={{ fontSize: 24, color: focused ? '#000' : '#999' }}>
      {icons[name]}
    </Text>
  );
}

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
        name="host"
        options={{
          title: 'Host',
          tabBarIcon: ({ focused }) => <TabBarIcon name="host" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ focused }) => <TabBarIcon name="friends" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabBarIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
