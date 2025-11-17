import { Stack } from 'expo-router';

export default function HostLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="focus-goals" />
      <Stack.Screen name="set-timer" />
      <Stack.Screen name="invite-mates" />
    </Stack>
  );
}
